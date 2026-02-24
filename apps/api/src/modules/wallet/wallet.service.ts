import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NowPaymentsService, NowPaymentsWebhookPayload } from './services/nowpayments.service';
import { TransactionType, TransactionStatus } from '@prediction-market/shared';

export interface DepositCryptoResult {
  checkoutUrl: string;
  orderId: string;
  transactionId: string;
}

export interface DepositFiatResult {
  invoiceUrl: string;
  invoiceId: string;
  transactionId: string;
  widgetConfig?: Record<string, string>;
}

export interface WithdrawResult {
  transactionId: string;
  recordId: string;
  status: string;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly minDepositAmount: number;
  private readonly minWithdrawalAmount: number;

  constructor(
    @InjectConnection() private connection: Connection,
    private usersService: UsersService,
    private transactionsService: TransactionsService,
    private nowPaymentsService: NowPaymentsService,
    private configService: ConfigService,
  ) {
    this.minDepositAmount = this.configService.get<number>('platform.minDepositAmount') || 5;
    this.minWithdrawalAmount = this.configService.get<number>('platform.minWithdrawalAmount') || 10;
  }

  async getBalance(userId: string) {
    const user = await this.usersService.findById(userId);
    return {
      balance: user.balance,
      totalDeposited: user.totalDeposited,
      totalWithdrawn: user.totalWithdrawn,
    };
  }

  async depositCrypto(userId: string, amount: number): Promise<DepositCryptoResult> {
    if (amount < this.minDepositAmount) {
      throw new BadRequestException(`Minimum deposit amount is $${this.minDepositAmount}`);
    }

    const user = await this.usersService.findById(userId);

    const transaction = await this.transactionsService.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      balanceBefore: user.balance,
      balanceAfter: user.balance,
      status: TransactionStatus.PENDING,
      metadata: { provider: 'nowpayments', method: 'crypto' },
    });

    try {
      const { invoiceUrl, invoiceId } = await this.nowPaymentsService.createInvoice(
        amount,
        transaction._id.toString(),
        `Deposit $${amount}`,
      );

      await this.transactionsService.updateMetadata(
        transaction._id.toString(),
        { invoiceId },
      );

      return {
        checkoutUrl: invoiceUrl,
        orderId: invoiceId,
        transactionId: transaction._id.toString(),
      };
    } catch (error) {
      await this.transactionsService.updateStatus(
        transaction._id.toString(),
        TransactionStatus.FAILED,
      );
      throw error;
    }
  }

  async depositFiat(userId: string, amount: number): Promise<DepositFiatResult> {
    if (amount < this.minDepositAmount) {
      throw new BadRequestException(`Minimum deposit amount is $${this.minDepositAmount}`);
    }

    if (amount > 3500) {
      throw new BadRequestException('Maximum fiat deposit is $3500 (KYC limit). Use crypto for larger amounts.');
    }

    const user = await this.usersService.findById(userId);

    const transaction = await this.transactionsService.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      balanceBefore: user.balance,
      balanceAfter: user.balance,
      status: TransactionStatus.PENDING,
      metadata: { provider: 'nowpayments', method: 'fiat' },
    });

    try {
      const { invoiceUrl, invoiceId } = await this.nowPaymentsService.createInvoice(
        amount,
        transaction._id.toString(),
        `Deposit $${amount}`,
      );

      await this.transactionsService.updateMetadata(
        transaction._id.toString(),
        { invoiceId },
      );

      const widgetConfig = this.nowPaymentsService.getWidgetConfig(
        amount,
        transaction._id.toString(),
      );

      return {
        invoiceUrl,
        invoiceId,
        transactionId: transaction._id.toString(),
        widgetConfig,
      };
    } catch (error) {
      await this.transactionsService.updateStatus(
        transaction._id.toString(),
        TransactionStatus.FAILED,
      );
      throw error;
    }
  }

  async withdraw(
    userId: string,
    amount: number,
    address: string,
    network: string,
  ): Promise<WithdrawResult> {
    if (amount < this.minWithdrawalAmount) {
      throw new BadRequestException(`Minimum withdrawal amount is $${this.minWithdrawalAmount}`);
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const user = await this.usersService.findById(userId);

      if (user.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const updatedUser = await this.usersService.updateBalance(userId, amount, 'subtract');

      if (!updatedUser) {
        throw new BadRequestException('Insufficient balance');
      }

      const transaction = await this.transactionsService.create({
        userId,
        type: TransactionType.WITHDRAWAL,
        amount,
        balanceBefore: user.balance,
        balanceAfter: user.balance - amount,
        status: TransactionStatus.PENDING,
        metadata: {
          provider: 'nowpayments',
          address,
          network,
        },
      });

      const payoutResponse = await this.nowPaymentsService.createPayout(
        amount,
        address,
        network,
        transaction._id.toString(),
      );

      await this.usersService.incrementStats(userId, 'totalWithdrawn', amount);

      await session.commitTransaction();

      return {
        transactionId: transaction._id.toString(),
        recordId: payoutResponse.id,
        status: 'pending',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async handleNowPaymentsWebhook(
    body: Record<string, unknown>,
    signature: string,
  ): Promise<void> {
    if (!this.nowPaymentsService.verifyWebhookSignature(body, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = body as unknown as NowPaymentsWebhookPayload;

    if (!this.nowPaymentsService.isPaymentFinished(payload.payment_status as never)) {
      this.logger.log(`Ignoring intermediate status: ${payload.payment_status}`);
      return;
    }

    const isAlreadyProcessed = await this.transactionsService.checkIdempotency(
      payload.order_id,
    );

    if (isAlreadyProcessed) {
      this.logger.log(`Webhook already processed for order ${payload.order_id}`);
      return;
    }

    const transaction = await this.transactionsService.findById(payload.order_id);

    if (!transaction) {
      this.logger.warn(`Transaction not found: ${payload.order_id}`);
      return;
    }

    const creditAmount = payload.outcome_amount || payload.price_amount;

    await this.processSuccessfulDeposit(
      transaction.userId.toString(),
      transaction._id.toString(),
      creditAmount,
    );
  }

  private async processSuccessfulDeposit(
    userId: string,
    transactionId: string,
    amount: number,
  ): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.usersService.updateBalance(userId, amount, 'add');

      await this.usersService.incrementStats(userId, 'totalDeposited', amount);

      const user = await this.usersService.findById(userId);

      const transaction = await this.transactionsService.findById(transactionId);
      if (transaction) {
        transaction.balanceAfter = user.balance;
        transaction.status = TransactionStatus.COMPLETED;
        await transaction.save();
      }

      await session.commitTransaction();

      this.logger.log(`Deposit completed: user=${userId}, amount=${amount}`);
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to process deposit: ${error}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    return this.transactionsService.findByUser({
      userId,
      page,
      limit,
    });
  }
}

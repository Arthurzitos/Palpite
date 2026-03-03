import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NowPaymentsService, NowPaymentsWebhookPayload } from './services/nowpayments.service';
import { EmailService } from '../email/email.service';
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
  status: string;
  message: string;
}

export interface AvailableBalanceResult {
  balance: number;
  availableBalance: number;
  pendingWithdrawals: number;
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
    private emailService: EmailService,
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

      await this.transactionsService.updateMetadata(transaction._id.toString(), { invoiceId });

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
      throw new BadRequestException(
        'Maximum fiat deposit is $3500 (KYC limit). Use crypto for larger amounts.',
      );
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

      await this.transactionsService.updateMetadata(transaction._id.toString(), { invoiceId });

      const widgetConfig = {
        ...this.nowPaymentsService.getWidgetConfig(amount, transaction._id.toString()),
        invoice_id: invoiceId,
        price_amount: amount.toString(),
        price_currency: 'usd',
      };

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

    const user = await this.usersService.findById(userId);

    const pendingAmount = await this.transactionsService.getSumPendingWithdrawals(userId);
    const availableBalance = user.balance - pendingAmount;

    if (availableBalance < amount) {
      throw new BadRequestException(
        `Insufficient available balance. Available: $${availableBalance.toFixed(2)}`,
      );
    }

    const isDuplicate = await this.transactionsService.checkDuplicateWithdrawal(
      userId,
      amount,
      address,
      network,
    );

    if (isDuplicate) {
      throw new BadRequestException(
        'A pending withdrawal request with the same amount, address, and network already exists',
      );
    }

    const transaction = await this.transactionsService.create({
      userId,
      type: TransactionType.WITHDRAWAL,
      amount,
      balanceBefore: user.balance,
      balanceAfter: user.balance,
      status: TransactionStatus.PENDING_APPROVAL,
      metadata: {
        provider: 'nowpayments',
        address,
        network,
      },
    });

    this.logger.log(
      `Withdrawal request created: user=${userId}, amount=${amount}, txId=${transaction._id}`,
    );

    // Send email notifications (non-blocking)
    this.emailService
      .sendWithdrawalRequested(user.email, amount)
      .catch((err) => this.logger.error(`Failed to send withdrawal request email: ${err}`));

    this.emailService
      .sendAdminNewWithdrawal(amount, user.username)
      .catch((err) => this.logger.error(`Failed to send admin notification email: ${err}`));

    return {
      transactionId: transaction._id.toString(),
      status: 'pending_approval',
      message:
        'Your withdrawal request has been submitted and is awaiting approval. You will be notified once it is processed. Average processing time: 24 hours.',
    };
  }

  async getAvailableBalance(userId: string): Promise<AvailableBalanceResult> {
    const user = await this.usersService.findById(userId);
    const pendingWithdrawals = await this.transactionsService.getSumPendingWithdrawals(userId);

    return {
      balance: user.balance,
      availableBalance: user.balance - pendingWithdrawals,
      pendingWithdrawals,
    };
  }

  async getWithdrawals(userId: string, status?: TransactionStatus, page = 1, limit = 20) {
    return this.transactionsService.findWithdrawalsByUser({
      userId,
      status,
      page,
      limit,
    });
  }

  async cancelWithdrawal(userId: string, transactionId: string): Promise<void> {
    const transaction = await this.transactionsService.findById(transactionId);

    if (!transaction) {
      throw new BadRequestException('Withdrawal not found');
    }

    if (transaction.userId.toString() !== userId) {
      throw new BadRequestException('Withdrawal not found');
    }

    if (transaction.type !== TransactionType.WITHDRAWAL) {
      throw new BadRequestException('Invalid transaction type');
    }

    if (transaction.status !== TransactionStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only pending withdrawals can be cancelled. Current status: ' + transaction.status,
      );
    }

    const user = await this.usersService.findById(userId);

    await this.transactionsService.updateWithdrawalReview(transactionId, {
      status: TransactionStatus.CANCELLED,
      reviewedBy: userId,
      reviewNotes: 'Cancelled by user',
    });

    this.logger.log(`Withdrawal cancelled by user: txId=${transactionId}, user=${userId}`);

    // Send email notification (non-blocking)
    this.emailService
      .sendWithdrawalCancelled(user.email, transaction.amount)
      .catch((err) => this.logger.error(`Failed to send cancellation email: ${err}`));
  }

  async handleNowPaymentsWebhook(body: Record<string, unknown>, signature: string): Promise<void> {
    if (!this.nowPaymentsService.verifyWebhookSignature(body, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = body as unknown as NowPaymentsWebhookPayload;

    if (!this.nowPaymentsService.isPaymentFinished(payload.payment_status as never)) {
      this.logger.log(`Ignoring intermediate status: ${payload.payment_status}`);
      return;
    }

    const isAlreadyProcessed = await this.transactionsService.checkIdempotency(payload.order_id);

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

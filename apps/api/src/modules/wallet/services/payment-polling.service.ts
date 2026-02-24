import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { TransactionsService } from '../../transactions/transactions.service';
import { UsersService } from '../../users/users.service';
import { NowPaymentsService, NowPaymentsStatus } from './nowpayments.service';
import { TransactionStatus } from '@prediction-market/shared';

@Injectable()
export class PaymentPollingService {
  private readonly logger = new Logger(PaymentPollingService.name);
  private isRunning = false;

  constructor(
    @InjectConnection() private connection: Connection,
    private transactionsService: TransactionsService,
    private usersService: UsersService,
    private nowPaymentsService: NowPaymentsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async pollPendingPayments() {
    if (this.isRunning) {
      this.logger.debug('Polling already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting payment polling job...');

    try {
      await this.pollNowPaymentsDeposits();
      this.logger.log('Payment polling job completed');
    } catch (error) {
      this.logger.error(`Payment polling job failed: ${error}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async pollNowPaymentsDeposits() {
    const pendingTransactions = await this.transactionsService.findPendingByProvider(
      'nowpayments',
      60,
    );

    this.logger.log(`Found ${pendingTransactions.length} pending NOWPayments deposits`);

    for (const transaction of pendingTransactions) {
      try {
        const invoiceId = transaction.metadata?.invoiceId as string;
        if (!invoiceId) {
          this.logger.warn(`Transaction ${transaction._id} missing invoiceId`);
          continue;
        }

        const paymentStatus = await this.nowPaymentsService.getPaymentStatus(invoiceId);

        if (this.nowPaymentsService.isPaymentFinished(paymentStatus.payment_status as NowPaymentsStatus)) {
          await this.processSuccessfulDeposit(
            transaction.userId.toString(),
            transaction._id.toString(),
            paymentStatus.price_amount,
          );
          this.logger.log(`Processed pending NOWPayments deposit: ${transaction._id}`);
        } else if (this.nowPaymentsService.isPaymentFailed(paymentStatus.payment_status as NowPaymentsStatus)) {
          await this.transactionsService.markAsFailed(
            transaction._id.toString(),
            `Payment ${paymentStatus.payment_status}`,
          );
          this.logger.log(`Marked NOWPayments deposit as failed: ${transaction._id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to poll NOWPayments transaction ${transaction._id}: ${error}`);
      }
    }
  }

  private async processSuccessfulDeposit(
    userId: string,
    transactionId: string,
    amount: number,
  ): Promise<void> {
    const isAlreadyProcessed = await this.transactionsService.checkIdempotency(transactionId);
    if (isAlreadyProcessed) {
      return;
    }

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
      this.logger.log(`Deposit completed via polling: user=${userId}, amount=${amount}`);
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to process deposit via polling: ${error}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireOldPendingTransactions() {
    this.logger.log('Checking for expired pending transactions...');

    const expiredTransactions = await this.transactionsService.findPendingByProvider(
      'nowpayments',
      1440,
    );

    const oldTransactions = expiredTransactions.filter(
      (t) => Date.now() - t.createdAt.getTime() > 60 * 60 * 1000,
    );

    for (const transaction of oldTransactions) {
      await this.transactionsService.markAsFailed(
        transaction._id.toString(),
        'Transaction expired',
      );
      this.logger.log(`Expired transaction: ${transaction._id}`);
    }

    if (oldTransactions.length > 0) {
      this.logger.log(`Expired ${oldTransactions.length} old pending transactions`);
    }
  }
}

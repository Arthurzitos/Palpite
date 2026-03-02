import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { NowPaymentsService } from './services/nowpayments.service';
import { PaymentPollingService } from './services/payment-polling.service';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [UsersModule, TransactionsModule],
  controllers: [WalletController],
  providers: [WalletService, NowPaymentsService, PaymentPollingService],
  exports: [WalletService, NowPaymentsService],
})
export class WalletModule {}

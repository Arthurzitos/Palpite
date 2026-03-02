import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminWithdrawalsController } from './admin-withdrawals.controller';
import { AdminWithdrawalsService } from './admin-withdrawals.service';
import { EventsModule } from '../events/events.module';
import { BetsModule } from '../bets/bets.module';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { WalletModule } from '../wallet/wallet.module';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    EventsModule,
    BetsModule,
    UsersModule,
    TransactionsModule,
    WalletModule,
  ],
  controllers: [AdminController, AdminWithdrawalsController],
  providers: [AdminWithdrawalsService],
})
export class AdminModule {}

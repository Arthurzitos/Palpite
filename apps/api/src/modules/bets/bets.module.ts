import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { SettlementService } from './services/settlement.service';
import { Bet, BetSchema } from './schemas/bet.schema';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { RakeModule } from '../rake/rake.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bet.name, schema: BetSchema }]),
    forwardRef(() => EventsModule),
    UsersModule,
    TransactionsModule,
    RakeModule,
  ],
  controllers: [BetsController],
  providers: [BetsService, SettlementService],
  exports: [BetsService, SettlementService],
})
export class BetsModule {}

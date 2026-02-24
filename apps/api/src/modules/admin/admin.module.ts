import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { EventsModule } from '../events/events.module';
import { BetsModule } from '../bets/bets.module';

@Module({
  imports: [EventsModule, BetsModule],
  controllers: [AdminController],
})
export class AdminModule {}

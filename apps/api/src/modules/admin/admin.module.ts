import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { EventsModule } from '../events/events.module';
import { BetsModule } from '../bets/bets.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [EventsModule, BetsModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}

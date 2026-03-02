import { Module, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { EventsModule } from './modules/events/events.module';
import { BetsModule } from './modules/bets/bets.module';
import { AdminModule } from './modules/admin/admin.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { HealthModule } from './modules/health/health.module';
import { RakeModule } from './modules/rake/rake.module';
import { LoggerModule } from './common/logger/logger.module';
import { EmailModule } from './modules/email/email.module';

@Injectable()
class ConditionalThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      return true;
    }
    return super.canActivate(context);
  }
}

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    // Rate limiting global: 100 requests per minute
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule,
    TerminusModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TransactionsModule,
    EventsModule,
    BetsModule,
    AdminModule,
    WalletModule,
    HealthModule,
    RakeModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ConditionalThrottlerGuard,
    },
  ],
})
export class AppModule {}

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { Logger } from 'pino';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: Logger;

  constructor(private configService: ConfigService) {
    const isDev = this.configService.get('NODE_ENV') === 'development';

    this.logger = pino({
      level: isDev ? 'debug' : 'info',
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
      base: {
        pid: process.pid,
        env: this.configService.get('NODE_ENV'),
      },
      redact: {
        paths: [
          'password',
          'passwordHash',
          'token',
          'refreshToken',
          'authorization',
          '*.password',
          '*.passwordHash',
          '*.token',
        ],
        censor: '[REDACTED]',
      },
    });
  }

  log(message: string, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string) {
    this.logger.trace({ context }, message);
  }

  // Extended methods for structured logging
  logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    this.logger.info(
      {
        type: 'request',
        method,
        url,
        statusCode,
        duration,
        userId,
      },
      `${method} ${url} ${statusCode} ${duration}ms`,
    );
  }

  logTransaction(
    type: string,
    amount: number,
    userId: string,
    reference?: string,
    metadata?: Record<string, unknown>,
  ) {
    this.logger.info(
      {
        type: 'transaction',
        transactionType: type,
        amount,
        userId,
        reference,
        ...metadata,
      },
      `Transaction: ${type} $${amount} for user ${userId}`,
    );
  }

  logWebhook(
    provider: string,
    status: 'received' | 'processed' | 'failed',
    reference?: string,
    error?: string,
  ) {
    const level = status === 'failed' ? 'error' : 'info';
    this.logger[level](
      {
        type: 'webhook',
        provider,
        status,
        reference,
        error,
      },
      `Webhook ${provider}: ${status}${reference ? ` (ref: ${reference})` : ''}`,
    );
  }

  logBet(
    action: string,
    betId: string,
    userId: string,
    eventId: string,
    amount: number,
    metadata?: Record<string, unknown>,
  ) {
    this.logger.info(
      {
        type: 'bet',
        action,
        betId,
        userId,
        eventId,
        amount,
        ...metadata,
      },
      `Bet ${action}: $${amount} on event ${eventId} by user ${userId}`,
    );
  }

  logSettlement(eventId: string, outcomeId: string, totalPayout: number, winnersCount: number) {
    this.logger.info(
      {
        type: 'settlement',
        eventId,
        outcomeId,
        totalPayout,
        winnersCount,
      },
      `Settlement: Event ${eventId} resolved, $${totalPayout} paid to ${winnersCount} winners`,
    );
  }

  logAuth(action: string, userId: string, success: boolean, metadata?: Record<string, unknown>) {
    const level = success ? 'info' : 'warn';
    this.logger[level](
      {
        type: 'auth',
        action,
        userId,
        success,
        ...metadata,
      },
      `Auth ${action}: ${success ? 'success' : 'failed'} for ${userId}`,
    );
  }

  // Get raw pino instance for advanced usage
  getPinoInstance(): Logger {
    return this.logger;
  }
}

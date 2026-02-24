import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

    const { method, url, body } = request;
    const user = (request as Request & { user?: { sub?: string } }).user;
    const userId = user?.sub;

    // Log request body for non-GET requests (excluding sensitive endpoints)
    const sensitiveEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    const isSensitive = sensitiveEndpoints.some(ep => url.includes(ep));

    if (method !== 'GET' && !isSensitive) {
      this.logger.debug(`Request body: ${JSON.stringify(body)}`, 'LoggingInterceptor');
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.logRequest(method, url, response.statusCode, duration, userId);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} ${error.status || 500} ${duration}ms - ${error.message}`,
            error.stack,
            'LoggingInterceptor',
          );
        },
      }),
    );
  }
}

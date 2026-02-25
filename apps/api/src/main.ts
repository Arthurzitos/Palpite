// Sentry must be imported first
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const port = configService.get<number>('port', 3001);
  const frontendUrl = process.env.FRONTEND_URL || configService.get<string>('frontendUrl') || 'http://localhost:3000';

  // Use custom logger
  app.useLogger(logger);

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS - support multiple origins for flexibility
  const allowedOrigins = [
    frontendUrl,
    'http://localhost:3000',
    'https://palpite.me',
    'https://www.palpite.me',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`, 'CORS');
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'timestamp', 'sign', 'x-nowpayments-sig'],
  });

  logger.log(`CORS configured for origins: ${allowedOrigins.join(', ')}`, 'Bootstrap');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`Environment: ${configService.get('NODE_ENV')}`, 'Bootstrap');
  logger.log(`Health check: http://localhost:${port}/api/health`, 'Bootstrap');
}

bootstrap();

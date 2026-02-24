import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators';
import { MongoHealthIndicator } from './indicators/mongo.health';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private mongo: MongoHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // MongoDB connection
      () => this.mongo.isHealthy('mongodb'),
      // Memory heap usage (max 500MB)
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      // Memory RSS (max 1GB)
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
    ]);
  }

  @Public()
  @Get('live')
  @HealthCheck()
  liveness() {
    // Simple liveness check - just returns OK if the app is running
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      // Only check MongoDB for readiness
      () => this.mongo.isHealthy('mongodb'),
    ]);
  }
}

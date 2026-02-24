import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoHealthIndicator extends HealthIndicator {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isConnected = this.connection.readyState === 1;

    const result = this.getStatus(key, isConnected, {
      connectionState: this.getConnectionStateName(this.connection.readyState),
    });

    if (isConnected) {
      return result;
    }

    throw new HealthCheckError('MongoDB check failed', result);
  }

  private getConnectionStateName(state: number): string {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }
}

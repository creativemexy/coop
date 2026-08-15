import { Controller, Get, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Liveness + readiness probes for load balancers / orchestrators.
 * - /health/live: process is up (no dependencies checked)
 * - /health/ready: dependencies (DB) reachable
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', db: 'up' };
    } catch (err) {
      this.logger.error(`Readiness check failed: ${(err as Error).message}`);
      return { status: 'error', db: 'down' };
    }
  }
}
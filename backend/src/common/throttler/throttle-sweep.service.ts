import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Nightly sweep that deletes expired throttle counters so the table stays
 * bounded as request volume scales.
 */
@Injectable()
export class ThrottleSweepService {
  private readonly logger = new Logger(ThrottleSweepService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async sweepStaleCounters(): Promise<void> {
    const result = await this.dataSource.query(
      `DELETE FROM throttle_counters WHERE expires_at < now() - interval '1 day'`,
    );
    const deleted = result?.[1] ?? result?.rowCount ?? 0;
    if (deleted > 0) {
      this.logger.log(`Swept ${deleted} expired throttle counters`);
    }
  }
}
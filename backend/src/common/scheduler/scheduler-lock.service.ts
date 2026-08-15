import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

/**
 * Distributed lock backed by a database row using an atomic
 * INSERT ... ON CONFLICT. Any instance that wins the insert owns
 * the job until it completes or the lease expires.
 *
 * Usage in multi-instance deployments: wrap scheduled jobs so they
 * run on exactly one pod instead of every replica.
 */
@Injectable()
export class SchedulerLockService {
  private readonly logger = new Logger(SchedulerLockService.name);
  private readonly holderId = `${process.env.HOSTNAME || 'instance'}-${randomUUID()}`;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Attempt to acquire the lock for `jobKey` for up to `ttlSeconds`.
   * Returns true only if this instance won the lease.
   */
  async acquire(jobKey: string, ttlSeconds = 3600): Promise<boolean> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const result = await this.dataSource.query(
      `INSERT INTO job_locks (job_key, holder, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (job_key) DO UPDATE
         SET holder = EXCLUDED.holder, expires_at = EXCLUDED.expires_at
       WHERE job_locks.expires_at < now()
       RETURNING job_key`,
      [jobKey, this.holderId, expiresAt],
    );
    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Release the lock only if still owned by this instance.
   */
  async release(jobKey: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM job_locks WHERE job_key = $1 AND holder = $2`,
      [jobKey, this.holderId],
    );
  }

  /**
   * Run `fn` only if this instance owns the lock. If another instance
   * holds it, the callback is skipped and null is returned.
   */
  async runExclusive<T>(
    jobKey: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
  ): Promise<T | null> {
    const acquired = await this.acquire(jobKey, ttlSeconds);
    if (!acquired) {
      this.logger.debug(`Job "${jobKey}" skipped — owned by another instance`);
      return null;
    }
    try {
      return await fn();
    } finally {
      await this.release(jobKey);
    }
  }
}

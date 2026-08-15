import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

/**
 * Distributed rate-limit storage backed by Postgres.
 *
 * Replaces the default in-memory ThrottlerStorageService so limits are
 * shared across all instances instead of being enforced per pod.
 *
 * Implementation notes:
 * - A single atomic INSERT ... ON CONFLICT statement computes the new
 *   counter state (window reset, hit increment, block set/expire).
 * - Windows are fixed-length (TTL from first hit), matching the common
 *   fixed-window budgeting model.
 * - Stale rows are swept by a nightly cron so the table stays bounded.
 */
@Injectable()
export class DbThrottleStorage implements ThrottlerStorage {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const ttlSeconds = ttl / 1000;
    const blockSeconds = blockDuration / 1000;

    const rows: Array<{
      count: number;
      expires_at: Date;
      blocked_until: Date | null;
    }> = await this.dataSource.query(
      `WITH merged AS (
         SELECT
           v.key,
           CASE
             WHEN gc.expires_at < now() OR gc.blocked_until < now() THEN 1
             WHEN gc.blocked_until > now() THEN gc.count
             ELSE gc.count + 1
           END AS new_count,
CASE
              WHEN gc.expires_at < now() OR gc.blocked_until < now()
                THEN now() + make_interval(secs => $2)
              ELSE gc.expires_at
            END AS new_expires,
            CASE
              WHEN gc.blocked_until > now() THEN gc.blocked_until
              WHEN (
                CASE
                  WHEN gc.expires_at < now() OR gc.blocked_until < now() THEN 1
                  WHEN gc.blocked_until > now() THEN gc.count
                  ELSE gc.count + 1
                END
              ) > $3 THEN now() + make_interval(secs => $4)
              ELSE NULL
            END AS new_blocked
          FROM (VALUES ($1::varchar)) AS v(key)
          LEFT JOIN throttle_counters gc ON gc.key = v.key
        )
        INSERT INTO throttle_counters (key, count, expires_at, blocked_until)
        SELECT
          m.key,
          COALESCE(m.new_count, 1),
          COALESCE(m.new_expires, now() + make_interval(secs => $2)),
          m.new_blocked
        FROM merged m
        ON CONFLICT (key) DO UPDATE SET
          count = EXCLUDED.count,
          expires_at = EXCLUDED.expires_at,
          blocked_until = EXCLUDED.blocked_until
        RETURNING count, expires_at, blocked_until`,
      [key, ttlSeconds, limit, blockSeconds],
    );

    const r = rows[0];
    const nowMs = Date.now();
    const releasesMs = r.expires_at.getTime();
    const blockedMs = r.blocked_until ? r.blocked_until.getTime() : 0;
    const isBlocked = blockedMs > nowMs;

    return {
      totalHits: r.count,
      timeToExpire: Math.max(0, Math.ceil((releasesMs - nowMs) / 1000)),
      isBlocked,
      timeToBlockExpire: isBlocked
        ? Math.max(0, Math.ceil((blockedMs - nowMs) / 1000))
        : 0,
    };
  }
}
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('throttle_counters')
export class ThrottleCounter {
  @PrimaryColumn({ name: 'key', type: 'varchar', length: 300 })
  key: string;

  @Column({ type: 'int' })
  count: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'blocked_until', type: 'timestamptz', nullable: true })
  blockedUntil: Date | null;
}
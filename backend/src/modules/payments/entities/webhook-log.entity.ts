import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('webhook_logs')
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'provider' })
  provider: string;

  @Column({ type: 'varchar', length: 100, name: 'event_type' })
  eventType: string;

  @Column({ type: 'varchar', length: 255, name: 'event_id', unique: true })
  eventId: string;

  @Column({ type: 'text', nullable: true, name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

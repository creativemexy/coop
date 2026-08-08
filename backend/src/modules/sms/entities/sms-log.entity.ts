import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { SmsProvider, SmsStatus } from '../../../common/enums/status.enum';

@Entity('sms_logs')
export class SmsLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  recipient: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', name: 'event_type', length: 50 })
  eventType: string;

  @Column({ type: 'enum', enum: SmsProvider, default: SmsProvider.TERMII })
  provider: SmsProvider;

  @Column({ type: 'enum', enum: SmsStatus, default: SmsStatus.SENT })
  status: SmsStatus;

  @Column({ type: 'jsonb', name: 'provider_response', nullable: true })
  providerResponse: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

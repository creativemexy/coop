import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QueueStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  IN_NEGOTIATION = 'in_negotiation',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum QueuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('bnpl_collection_queues')
export class CollectionQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'subscription_id' })
  subscriptionId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: QueueStatus, default: QueueStatus.PENDING })
  status: QueueStatus;

  @Column({ type: 'enum', enum: QueuePriority, default: QueuePriority.MEDIUM })
  priority: QueuePriority;

  @Column({ type: 'int', default: 0, name: 'days_overdue' })
  daysOverdue: number;

  @Column({ type: 'decimal', name: 'total_overdue_amount', precision: 15, scale: 2, default: 0 })
  totalOverdueAmount: number;

  @Column({ type: 'decimal', name: 'outstanding_principal', precision: 15, scale: 2, default: 0 })
  outstandingPrincipal: number;

  @Column({ type: 'timestamp', name: 'last_contacted_at', nullable: true })
  lastContactedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'agent_note' })
  agentNote: string;

  @Column({ type: 'uuid', name: 'assigned_to', nullable: true })
  assignedTo: string;

  @Column({ type: 'uuid', name: 'assigned_by' })
  assignedBy: string;

  @Column({ type: 'timestamp', name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

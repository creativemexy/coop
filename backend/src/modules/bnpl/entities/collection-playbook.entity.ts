import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlaybookTrigger {
  FIRST_DELINQUENCY = 'first_delinquency',
  REPEATED_DELINQUENCY = 'repeated_delinquency',
  HIGH_RISK = 'high_risk',
  PAYMENT_FAILURE = 'payment_failure',
  EXCEPTION_CASE = 'exception_case',
}

@Entity('bnpl_collection_playbooks')
export class CollectionPlaybook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: PlaybookTrigger, name: 'trigger_event' })
  triggerEvent: PlaybookTrigger;

  @Column({ type: 'jsonb', name: 'recommended_actions' })
  recommendedActions: { step: number; action: string; note?: string }[];

  @Column({ type: 'boolean', name: 'requires_approval', default: false })
  requiresApproval: boolean;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

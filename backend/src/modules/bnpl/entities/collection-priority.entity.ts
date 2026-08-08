import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PriorityEntityType {
  SUBSCRIPTION = 'subscription',
  USER = 'user',
}

@Entity('bnpl_collection_priorities')
export class CollectionPriority {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PriorityEntityType, name: 'entity_type' })
  entityType: PriorityEntityType;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'enum', enum: PriorityLevel })
  priority: PriorityLevel;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'uuid', name: 'assigned_by' })
  assignedBy: string;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

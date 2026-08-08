import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('bnpl_idempotency_keys')
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'idempotency_key', unique: true })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 100 })
  operation: string;

  @Column({ type: 'uuid', name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ type: 'varchar', length: 50, default: 'completed' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

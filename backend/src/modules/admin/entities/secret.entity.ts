import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SecretCategory {
  API_KEY = 'api_key',
  WEBHOOK_SECRET = 'webhook_secret',
  ENCRYPTION_KEY = 'encryption_key',
  DATABASE = 'database',
  SMTP = 'smtp',
  PAYMENT_GATEWAY = 'payment_gateway',
  OTHER = 'other',
}

@Entity('secrets')
export class Secret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  key: string;

  @Column({ type: 'text', name: 'encrypted_value' })
  encryptedValue: string;

  @Column({
    type: 'enum',
    enum: SecretCategory,
    default: SecretCategory.OTHER,
  })
  category: SecretCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ type: 'boolean', name: 'is_rotation_enabled', default: false })
  isRotationEnabled: boolean;

  @Column({ type: 'timestamp', name: 'last_rotated_at', nullable: true })
  lastRotatedAt: Date;

  @Column({ type: 'int', name: 'rotation_interval_days', nullable: true })
  rotationIntervalDays: number;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  updatedBy: string;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('device_sessions')
export class DeviceSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', name: 'device_fingerprint', length: 255 })
  deviceFingerprint: string;

  @Column({ type: 'varchar', name: 'device_name', nullable: true, length: 255 })
  deviceName: string;

  @Column({ type: 'varchar', name: 'device_type', nullable: true, length: 50 })
  deviceType: string;

  @Column({ type: 'varchar', name: 'os', nullable: true, length: 100 })
  os: string;

  @Column({ type: 'varchar', name: 'browser', nullable: true, length: 100 })
  browser: string;

  @Column({ type: 'varchar', name: 'ip_address', nullable: true, length: 45 })
  ipAddress: string;

  @Column({ type: 'boolean', name: 'is_trusted', default: false })
  isTrusted: boolean;

  @Column({
    type: 'timestamp',
    name: 'last_used_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastUsedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

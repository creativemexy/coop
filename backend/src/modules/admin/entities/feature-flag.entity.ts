import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FeatureFlagEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export enum FeatureFlagStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ROLLING_OUT = 'rolling_out',
  DEPRECATED = 'deprecated',
}

@Entity('feature_flags')
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: FeatureFlagStatus,
    default: FeatureFlagStatus.DISABLED,
  })
  status: FeatureFlagStatus;

  @Column({ type: 'jsonb', name: 'environments', default: {} })
  environments: Record<string, boolean>;

  @Column({ type: 'jsonb', name: 'cohort_rules', nullable: true })
  cohortRules: Record<string, any>;

  @Column({ type: 'int', name: 'rollout_percentage', default: 0 })
  rolloutPercentage: number;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  updatedBy: string;

  @Column({ type: 'timestamp', name: 'enabled_at', nullable: true })
  enabledAt: Date;

  @Column({ type: 'boolean', name: 'is_kill_switch', default: false })
  isKillSwitch: boolean;

  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

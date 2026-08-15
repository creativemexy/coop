import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('user_activities')
@Index(['userId', 'createdAt'])
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 100 })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

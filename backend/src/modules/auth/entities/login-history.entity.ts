import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('login_history')
export class LoginHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ length: 100, nullable: true })
  device: string;

  @Column({ length: 100, nullable: true })
  location: string;

  @Column({ default: true })
  success: boolean;

  @Column({ nullable: true, length: 255 })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

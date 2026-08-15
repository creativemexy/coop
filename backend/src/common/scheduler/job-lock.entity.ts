import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('job_locks')
export class JobLock {
  @PrimaryColumn({ name: 'job_key', length: 100 })
  jobKey: string;

  @Column({ length: 100 })
  holder: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

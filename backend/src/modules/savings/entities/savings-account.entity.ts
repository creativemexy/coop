import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { SavingsTransaction } from './savings-transaction.entity';

@Entity('savings_accounts')
@Index(['userId'])
export class SavingsAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'goal_balance', default: 0 })
  goalBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'target_amount', nullable: true })
  targetAmount: number;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SavingsTransaction, (t) => t.account)
  transactions: SavingsTransaction[];
}

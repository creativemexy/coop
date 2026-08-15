import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketCategory {
  ORDER_INQUIRY = 'order_inquiry',
  REPAYMENT_ISSUE = 'repayment_issue',
  TECHNICAL_GLITCH = 'technical_glitch',
  RECONCILIATION = 'reconciliation',
  INVESTMENT_ISSUE = 'investment_issue',
  OTHER = 'other',
}

@Entity('support_tickets')
@Index(['createdBy', 'createdAt'])
@Index(['status', 'createdAt'])
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketCategory,
    default: TicketCategory.OTHER,
  })
  category: TicketCategory;

  @Column({ type: 'uuid', name: 'related_order_id', nullable: true })
  relatedOrderId: string;

  @Column({ type: 'uuid', name: 'related_payment_id', nullable: true })
  relatedPaymentId: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'uuid', name: 'assigned_to', nullable: true })
  assignedTo: string;

  @Column({ type: 'text', nullable: true, name: 'resolution_note' })
  resolutionNote: string;

  @Column({ type: 'timestamp', name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

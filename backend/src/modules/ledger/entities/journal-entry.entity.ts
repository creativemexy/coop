import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { JournalStatus } from '../../../common/enums/status.enum';
import { JournalLine } from './journal-line.entity';

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => JournalLine, (line) => line.journalEntry)
  lines: JournalLine[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', name: 'entry_date' })
  entryDate: Date;

  @Column({ type: 'enum', enum: JournalStatus, default: JournalStatus.DRAFT })
  status: JournalStatus;

  @Column({ type: 'varchar', name: 'posted_by', nullable: true })
  postedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'posted_at', nullable: true })
  postedAt: Date;
}

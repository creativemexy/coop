import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { OrgStatus } from '../../../common/enums/status.enum';
import { ApexOrganization } from '../../apex-organizations/entities/apex-organization.entity';
import { User } from '../../users/entities/user.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'uuid', name: 'apex_org_id' })
  apexOrgId: string;

  @ManyToOne(() => ApexOrganization, (apex) => apex.organizations)
  @JoinColumn({ name: 'apex_org_id' })
  apexOrg: ApexOrganization;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 255, name: 'contact_email', nullable: true })
  contactEmail: string;

  @Column({ type: 'varchar', length: 20, name: 'contact_phone', nullable: true })
  contactPhone: string;

  @Column({ type: 'varchar', length: 255, name: 'contact_person_name', nullable: true })
  contactPersonName: string;

  @Column({ type: 'varchar', length: 20, name: 'contact_person_phone', nullable: true })
  contactPersonPhone: string;

  @Column({ type: 'varchar', length: 255, name: 'contact_person_email', nullable: true })
  contactPersonEmail: string;

  @Column({ type: 'varchar', length: 255, name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ type: 'varchar', length: 255, name: 'account_name', nullable: true })
  accountName: string;

  @Column({ type: 'varchar', length: 20, name: 'account_number', nullable: true })
  accountNumber: string;

  @Column({ type: 'varchar', length: 20, name: 'sort_code', nullable: true })
  sortCode: string;

  @Column({ type: 'varchar', length: 20, name: 'bank_code', nullable: true })
  bankCode: string;

  @Column({ type: 'enum', enum: OrgStatus, default: OrgStatus.ACTIVE })
  status: OrgStatus;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];
}

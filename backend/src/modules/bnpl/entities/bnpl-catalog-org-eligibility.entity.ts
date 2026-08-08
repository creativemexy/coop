import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('bnpl_catalog_org_eligibility')
export class BnplCatalogOrgEligibility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'catalog_item_id' })
  catalogItemId: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

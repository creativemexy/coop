import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BnplPlan } from './bnpl-plan.entity';
import { BnplCatalogImage } from './bnpl-catalog-image.entity';

@Entity('bnpl_catalog_items')
export class BnplCatalogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'varchar', name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'boolean', name: 'is_global', default: true })
  isGlobal: boolean;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => BnplPlan, (plan) => plan.catalogItem)
  plans: BnplPlan[];

  @OneToMany(() => BnplCatalogImage, (img) => img.catalogItem, { cascade: true })
  images: BnplCatalogImage[];
}

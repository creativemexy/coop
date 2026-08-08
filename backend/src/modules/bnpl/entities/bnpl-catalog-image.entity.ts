import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BnplCatalogItem } from './bnpl-catalog-item.entity';

@Entity('bnpl_catalog_images')
export class BnplCatalogImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'catalog_item_id' })
  catalogItemId: string;

  @ManyToOne(() => BnplCatalogItem, (item) => item.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'catalog_item_id' })
  catalogItem: BnplCatalogItem;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

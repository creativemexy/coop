import { BnplCatalogItem } from './bnpl-catalog-item.entity';
export declare class BnplCatalogImage {
    id: string;
    catalogItemId: string;
    catalogItem: BnplCatalogItem;
    url: string;
    sortOrder: number;
    createdAt: Date;
}

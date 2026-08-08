import { BnplPlan } from './bnpl-plan.entity';
import { BnplCatalogImage } from './bnpl-catalog-image.entity';
export declare class BnplCatalogItem {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    createdBy: string;
    isGlobal: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    plans: BnplPlan[];
    images: BnplCatalogImage[];
}

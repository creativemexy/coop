import { Repository } from 'typeorm';
import { BnplCatalogItem } from '../entities/bnpl-catalog-item.entity';
import { BnplCatalogImage } from '../entities/bnpl-catalog-image.entity';
import { BnplCatalogOrgEligibility } from '../entities/bnpl-catalog-org-eligibility.entity';
export declare class CatalogService {
    private readonly catalogRepo;
    private readonly imageRepo;
    private readonly eligibilityRepo;
    constructor(catalogRepo: Repository<BnplCatalogItem>, imageRepo: Repository<BnplCatalogImage>, eligibilityRepo: Repository<BnplCatalogOrgEligibility>);
    create(dto: {
        name: string;
        description?: string;
        price: number;
        imageUrls?: string[];
        createdBy: string;
    }): Promise<BnplCatalogItem>;
    findAll(organizationId?: string): Promise<BnplCatalogItem[]>;
    findById(id: string): Promise<BnplCatalogItem>;
    update(id: string, dto: {
        name?: string;
        description?: string;
        price?: number;
        status?: string;
        imageUrls?: string[];
    }): Promise<BnplCatalogItem>;
    addImages(id: string, urls: string[]): Promise<BnplCatalogItem>;
    setOrgEligibility(catalogItemId: string, organizationIds: string[]): Promise<void>;
}

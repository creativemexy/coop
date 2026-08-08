import { CatalogService } from '../services/catalog.service';
export declare class CatalogController {
    private readonly service;
    constructor(service: CatalogService);
    create(dto: {
        name: string;
        description?: string;
        price: number;
        imageUrls?: string[];
    }, userId: string): Promise<import("../entities/bnpl-catalog-item.entity").BnplCatalogItem>;
    findAll(organizationId?: string): Promise<import("../entities/bnpl-catalog-item.entity").BnplCatalogItem[]>;
    findById(id: string): Promise<import("../entities/bnpl-catalog-item.entity").BnplCatalogItem>;
    update(id: string, dto: {
        name?: string;
        description?: string;
        price?: number;
        status?: string;
        imageUrls?: string[];
    }): Promise<import("../entities/bnpl-catalog-item.entity").BnplCatalogItem>;
    uploadImages(id: string, files: any[]): Promise<import("../entities/bnpl-catalog-item.entity").BnplCatalogItem>;
    restrict(id: string, dto: {
        organizationIds: string[];
    }): Promise<{
        message: string;
    }>;
}

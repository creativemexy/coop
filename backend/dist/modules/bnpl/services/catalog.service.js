"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sanitize_util_1 = require("../../../common/sanitize.util");
const bnpl_catalog_item_entity_1 = require("../entities/bnpl-catalog-item.entity");
const bnpl_catalog_image_entity_1 = require("../entities/bnpl-catalog-image.entity");
const bnpl_catalog_org_eligibility_entity_1 = require("../entities/bnpl-catalog-org-eligibility.entity");
let CatalogService = class CatalogService {
    catalogRepo;
    imageRepo;
    eligibilityRepo;
    constructor(catalogRepo, imageRepo, eligibilityRepo) {
        this.catalogRepo = catalogRepo;
        this.imageRepo = imageRepo;
        this.eligibilityRepo = eligibilityRepo;
    }
    async create(dto) {
        const sanitized = (0, sanitize_util_1.sanitizeObject)(dto, ['name', 'description']);
        const item = this.catalogRepo.create({
            name: sanitized.name,
            description: sanitized.description,
            price: sanitized.price,
            imageUrl: dto.imageUrls?.[0],
            createdBy: dto.createdBy,
            isGlobal: true,
            status: 'active',
        });
        const saved = await this.catalogRepo.save(item);
        if (dto.imageUrls?.length) {
            const images = dto.imageUrls.map((url, i) => this.imageRepo.create({ catalogItemId: saved.id, url, sortOrder: i }));
            await this.imageRepo.save(images);
        }
        return this.findById(saved.id);
    }
    async findAll(organizationId) {
        const relations = { images: true };
        if (!organizationId) {
            return this.catalogRepo.find({
                where: { status: 'active' },
                relations,
                order: { createdAt: 'DESC' },
            });
        }
        const items = await this.catalogRepo
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.images', 'images')
            .leftJoin('bnpl_catalog_org_eligibility', 'elig', 'elig.catalog_item_id = item.id')
            .where('item.status = :status', { status: 'active' })
            .andWhere('(item.is_global = true OR elig.organization_id = :orgId)', {
            orgId: organizationId,
        })
            .orderBy('item.created_at', 'DESC')
            .addOrderBy('images.sort_order', 'ASC')
            .getMany();
        return items;
    }
    async findById(id) {
        const item = await this.catalogRepo.findOne({
            where: { id },
            relations: { images: true },
        });
        if (!item) {
            throw new common_1.NotFoundException('Catalog item not found');
        }
        return item;
    }
    async update(id, dto) {
        const sanitized = (0, sanitize_util_1.sanitizeObject)(dto, ['name', 'description']);
        const updateData = {};
        if (sanitized.name !== undefined)
            updateData.name = sanitized.name;
        if (sanitized.description !== undefined)
            updateData.description = sanitized.description;
        if (dto.price !== undefined)
            updateData.price = dto.price;
        if (dto.status !== undefined)
            updateData.status = dto.status;
        if (dto.imageUrls !== undefined)
            updateData.imageUrl = dto.imageUrls[0] || null;
        await this.catalogRepo.update(id, updateData);
        if (dto.imageUrls !== undefined) {
            await this.imageRepo.delete({ catalogItemId: id });
            if (dto.imageUrls.length > 0) {
                const images = dto.imageUrls.map((url, i) => this.imageRepo.create({ catalogItemId: id, url, sortOrder: i }));
                await this.imageRepo.save(images);
            }
        }
        return this.findById(id);
    }
    async addImages(id, urls) {
        const item = await this.findById(id);
        if (!item.imageUrl && urls.length > 0) {
            await this.catalogRepo.update(id, { imageUrl: urls[0] });
        }
        const existingCount = item.images?.length ?? 0;
        const images = urls.map((url, i) => this.imageRepo.create({
            catalogItemId: id,
            url,
            sortOrder: existingCount + i,
        }));
        await this.imageRepo.save(images);
        return this.findById(id);
    }
    async setOrgEligibility(catalogItemId, organizationIds) {
        await this.eligibilityRepo.delete({ catalogItemId });
        const entries = organizationIds.map((orgId) => this.eligibilityRepo.create({ catalogItemId, organizationId: orgId }));
        if (entries.length > 0) {
            await this.eligibilityRepo.save(entries);
        }
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bnpl_catalog_item_entity_1.BnplCatalogItem)),
    __param(1, (0, typeorm_1.InjectRepository)(bnpl_catalog_image_entity_1.BnplCatalogImage)),
    __param(2, (0, typeorm_1.InjectRepository)(bnpl_catalog_org_eligibility_entity_1.BnplCatalogOrgEligibility)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map
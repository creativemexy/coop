import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sanitizeInput, sanitizeObject } from '../../../common/sanitize.util';
import { BnplCatalogItem } from '../entities/bnpl-catalog-item.entity';
import { BnplCatalogImage } from '../entities/bnpl-catalog-image.entity';
import { BnplCatalogOrgEligibility } from '../entities/bnpl-catalog-org-eligibility.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(BnplCatalogItem)
    private readonly catalogRepo: Repository<BnplCatalogItem>,
    @InjectRepository(BnplCatalogImage)
    private readonly imageRepo: Repository<BnplCatalogImage>,
    @InjectRepository(BnplCatalogOrgEligibility)
    private readonly eligibilityRepo: Repository<BnplCatalogOrgEligibility>,
  ) {}

  async create(dto: {
    name: string;
    description?: string;
    price: number;
    imageUrls?: string[];
    createdBy: string;
  }): Promise<BnplCatalogItem> {
    const sanitized = sanitizeObject(dto, ['name', 'description']);
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
      const images = dto.imageUrls.map((url, i) =>
        this.imageRepo.create({ catalogItemId: saved.id, url, sortOrder: i }),
      );
      await this.imageRepo.save(images);
    }

    return this.findById(saved.id);
  }

  async findAll(organizationId?: string): Promise<BnplCatalogItem[]> {
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
      .leftJoin(
        'bnpl_catalog_org_eligibility',
        'elig',
        'elig.catalog_item_id = item.id',
      )
      .where('item.status = :status', { status: 'active' })
      .andWhere('(item.is_global = true OR elig.organization_id = :orgId)', {
        orgId: organizationId,
      })
      .orderBy('item.created_at', 'DESC')
      .addOrderBy('images.sort_order', 'ASC')
      .getMany();
    return items;
  }

  async findById(id: string): Promise<BnplCatalogItem> {
    const item = await this.catalogRepo.findOne({
      where: { id },
      relations: { images: true },
    });
    if (!item) {
      throw new NotFoundException('Catalog item not found');
    }
    return item;
  }

  async update(
    id: string,
    dto: {
      name?: string;
      description?: string;
      price?: number;
      status?: string;
      imageUrls?: string[];
    },
  ): Promise<BnplCatalogItem> {
    const sanitized = sanitizeObject(dto, ['name', 'description']);
    const updateData: Record<string, any> = {};
    if (sanitized.name !== undefined) updateData.name = sanitized.name;
    if (sanitized.description !== undefined) updateData.description = sanitized.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.imageUrls !== undefined) updateData.imageUrl = dto.imageUrls[0] || null;

    await this.catalogRepo.update(id, updateData);

    if (dto.imageUrls !== undefined) {
      await this.imageRepo.delete({ catalogItemId: id });
      if (dto.imageUrls.length > 0) {
        const images = dto.imageUrls.map((url, i) =>
          this.imageRepo.create({ catalogItemId: id, url, sortOrder: i }),
        );
        await this.imageRepo.save(images);
      }
    }

    return this.findById(id);
  }

  async addImages(id: string, urls: string[]): Promise<BnplCatalogItem> {
    const item = await this.findById(id);
    if (!item.imageUrl && urls.length > 0) {
      await this.catalogRepo.update(id, { imageUrl: urls[0] });
    }
    const existingCount = item.images?.length ?? 0;
    const images = urls.map((url, i) =>
      this.imageRepo.create({
        catalogItemId: id,
        url,
        sortOrder: existingCount + i,
      }),
    );
    await this.imageRepo.save(images);
    return this.findById(id);
  }

  async setOrgEligibility(
    catalogItemId: string,
    organizationIds: string[],
  ): Promise<void> {
    await this.eligibilityRepo.delete({ catalogItemId });
    const entries = organizationIds.map((orgId) =>
      this.eligibilityRepo.create({ catalogItemId, organizationId: orgId }),
    );
    if (entries.length > 0) {
      await this.eligibilityRepo.save(entries);
    }
  }
}

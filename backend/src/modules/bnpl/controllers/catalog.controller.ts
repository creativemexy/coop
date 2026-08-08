import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CatalogService } from '../services/catalog.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { validateImageFile, isAllowedExtension } from '../../../common/file-validator.util';

@Controller('api/v1/bnpl/catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Post()
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async create(
    @Body()
    dto: {
      name: string;
      description?: string;
      price: number;
      imageUrls?: string[];
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.create({ ...dto, createdBy: userId });
  }

  @Get()
  async findAll(@Query('organizationId') organizationId?: string) {
    return this.service.findAll(organizationId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      price?: number;
      status?: string;
      imageUrls?: string[];
    },
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/upload-images')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'catalog-images'),
        filename: (_req: any, file: any, cb: (err: Error | null, name: string) => void) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: (err: Error | null, allowed: boolean) => void) => {
        if (!file.mimetype.match(/^image\/(png|jpeg|jpg|webp)$/)) {
          cb(new BadRequestException('Only PNG, JPG, and WebP images are allowed'), false);
          return;
        }
        if (!isAllowedExtension(file.originalname)) {
          cb(new BadRequestException('Invalid file extension'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: any[],
  ) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    for (const file of files) {
      validateImageFile(file.path);
    }
    const urls = files.map((f) => `/uploads/catalog-images/${f.filename}`);
    return this.service.addImages(id, urls);
  }

  @Post(':id/restrict')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async restrict(
    @Param('id') id: string,
    @Body() dto: { organizationIds: string[] },
  ) {
    await this.service.setOrgEligibility(id, dto.organizationIds);
    return { message: 'Eligibility updated' };
  }
}

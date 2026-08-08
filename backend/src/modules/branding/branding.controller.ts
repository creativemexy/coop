import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { SettingsService } from '../settings/settings.service';
import { sanitizeInput } from '../../common/sanitize.util';
import { validateImageFile, isAllowedExtension } from '../../common/file-validator.util';

@Controller('api/v1/branding')
export class BrandingController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  async get() {
    const [organizationName, logoPath, primaryColor, accentColor] =
      await Promise.all([
        this.settings.getValue('organization_name'),
        this.settings.getValue('logo_path'),
        this.settings.getValue('brand_primary_color'),
        this.settings.getValue('brand_accent_color'),
      ]);
    return {
      organizationName: organizationName || 'Coop BNPL',
      logoUrl: logoPath ? `/uploads/branding/${logoPath}` : null,
      primaryColor: primaryColor || '#2563eb',
      accentColor: accentColor || '#7c3aed',
    };
  }

  @Put('name')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async updateName(@Body() dto: { name: string }) {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('Organization name is required');
    }
    const sanitized = sanitizeInput(dto.name);
    if (!sanitized) {
      throw new BadRequestException('Organization name is required');
    }
    await this.settings.set('organization_name', sanitized);
    return { organizationName: sanitized };
  }

  @Put('colors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async updateColors(
    @Body() dto: { primaryColor: string; accentColor: string },
  ) {
    if (
      !dto.primaryColor?.startsWith('#') ||
      !dto.accentColor?.startsWith('#')
    ) {
      throw new BadRequestException('Colors must be hex values (e.g. #2563eb)');
    }
    await Promise.all([
      this.settings.set('brand_primary_color', dto.primaryColor),
      this.settings.set('brand_accent_color', dto.accentColor),
    ]);
    return { primaryColor: dto.primaryColor, accentColor: dto.accentColor };
  }

  @Post('logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'branding'),
        filename: (
          _req: any,
          file: any,
          cb: (err: Error | null, name: string) => void,
        ) => {
          const ext = extname(file.originalname);
          cb(null, `logo${ext}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (
        _req: any,
        file: any,
        cb: (err: Error | null, allowed: boolean) => void,
      ) => {
        if (!file.mimetype.match(/^image\/(png|jpeg|jpg|svg|webp)$/)) {
          cb(
            new BadRequestException(
              'Only image files (PNG, JPG, SVG, WebP) are allowed',
            ),
            false,
          );
          return;
        }
        if (!isAllowedExtension(file.originalname)) {
          cb(
            new BadRequestException(
              'File extension does not match allowed image formats',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    validateImageFile(file.path);
    await this.settings.set('logo_path', file.filename);
    return { logoUrl: `/uploads/branding/${file.filename}` };
  }
}

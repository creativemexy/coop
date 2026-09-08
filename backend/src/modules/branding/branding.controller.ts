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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SettingsService } from '../settings/settings.service';
import { sanitizeInput } from '../../common/sanitize.util';
import { validateImageFile, isAllowedExtension } from '../../common/file-validator.util';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { InvestmentHolding } from '../investments/entities/investment-holding.entity';
import { Role } from '../../common/enums/role.enum';

@Controller('api/v1/branding')
export class BrandingController {
  constructor(
    private readonly settings: SettingsService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Organization) private readonly organizations: Repository<Organization>,
    @InjectRepository(SavingsAccount) private readonly savingsAccounts: Repository<SavingsAccount>,
    @InjectRepository(InvestmentHolding) private readonly holdings: Repository<InvestmentHolding>,
  ) {}

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

  /** Public, aggregate-only figures for the marketing site. No member data is exposed. */
  @Get('impact')
  async impact() {
    const [members, organizations, savings, investments] = await Promise.all([
      this.users.count({ where: { role: Role.INDIVIDUAL, isActive: true } }),
      this.organizations.count({ where: { status: 'active' as any } }),
      this.savingsAccounts
        .createQueryBuilder('account')
        .select('COALESCE(SUM(account.balance + account.goal_balance), 0)', 'total')
        .where('account.status = :status', { status: 'active' })
        .getRawOne<{ total: string }>(),
      this.holdings
        .createQueryBuilder('holding')
        .select('COALESCE(SUM(holding.current_value), 0)', 'total')
        .where('holding.is_active = :isActive', { isActive: true })
        .getRawOne<{ total: string }>(),
    ]);

    return {
      members,
      organizations,
      savingsPool: Number(savings?.total || 0),
      investmentValue: Number(investments?.total || 0),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get('maintenance')
  async maintenance() {
    return { maintenance: (await this.settings.getValue('maintenance_mode')) === 'true' };
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
        destination: (_req: any, _file: any, cb: (error: Error | null, destination: string) => void) => {
          const destination = join(process.cwd(), 'uploads', 'branding');
          mkdirSync(destination, { recursive: true });
          cb(null, destination);
        },
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

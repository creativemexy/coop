import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { OrgStatus } from '../../common/enums/status.enum';

@Controller('api/v1/organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get('bank/resolve')
  @Roles(Role.SUPER_ADMIN)
  async resolveBankAccount(
    @Query('accountNumber') accountNumber: string,
    @Query('bankCode') bankCode: string,
  ) {
    return this.service.resolveBankAccount(accountNumber, bankCode);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN)
  async create(
    @Body() dto: {
      name: string;
      apexOrgId: string;
      address?: string;
      contactEmail?: string;
      contactPhone?: string;
      contactPersonName?: string;
      contactPersonPhone?: string;
      contactPersonEmail?: string;
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
      sortCode?: string;
      bankCode?: string;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.create({ ...dto, createdBy: userId });
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN)
  async findAll(@Query('apexOrgId') apexOrgId?: string) {
    return this.service.findAll(apexOrgId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      status?: OrgStatus;
      address?: string;
      contactEmail?: string;
      contactPhone?: string;
      contactPersonName?: string;
      contactPersonPhone?: string;
      contactPersonEmail?: string;
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
      sortCode?: string;
      bankCode?: string;
    },
  ) {
    return this.service.update(id, dto);
  }
}

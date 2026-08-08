import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from '../services/plans.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { InterestType, PlanStatus } from '../entities/bnpl-plan.entity';

@Controller('api/v1/bnpl/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Post()
  @Roles(Role.BNPL_MANAGER, Role.SUPER_ADMIN)
  async create(
    @Body()
    dto: {
      organizationId: string;
      catalogItemId: string;
      tenorOptions?: number[];
      minPrincipal?: number;
      maxPrincipal?: number;
      eligibilityBands?: Array<{ minScore: number; maxScore: number; maxPrincipal: number }>;
      downPaymentPercent: number;
      installmentCount: number;
      installmentFrequency: string;
      interestType?: InterestType;
      interestRate?: number;
      monthlyFeeRate?: number;
      gracePeriodDays?: number;
      lateFeeRate?: number;
      lateFeeCapDays?: number;
      isEnabled?: boolean;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.create({ ...dto, createdBy: userId });
  }

  @Get()
  @Roles(Role.BNPL_MANAGER, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.INDIVIDUAL)
  async findAll(@CurrentUser('organizationId') organizationId: string) {
    return this.service.findAllByOrg(organizationId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Roles(Role.BNPL_MANAGER, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body()
    dto: {
      status?: PlanStatus;
      isEnabled?: boolean;
      tenorOptions?: number[];
      minPrincipal?: number;
      maxPrincipal?: number;
      eligibilityBands?: Array<{ minScore: number; maxScore: number; maxPrincipal: number }>;
      downPaymentPercent?: number;
      installmentCount?: number;
      installmentFrequency?: string;
      interestType?: InterestType;
      interestRate?: number;
      monthlyFeeRate?: number;
      gracePeriodDays?: number;
      lateFeeRate?: number;
      lateFeeCapDays?: number;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.update(id, { ...dto, updatedBy: userId });
  }

  @Get(':id/version-history')
  @Roles(Role.BNPL_MANAGER, Role.SUPER_ADMIN)
  async getVersionHistory(@Param('id') id: string) {
    return this.service.getVersionHistory(id);
  }
}

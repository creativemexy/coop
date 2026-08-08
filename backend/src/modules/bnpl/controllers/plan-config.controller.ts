import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PlanConfigService } from '../services/plan-config.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { InterestModel, DueDateRule, LateFeeType } from '../entities/bnpl-plan-config.entity';

@Controller('api/v1/bnpl/plan-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanConfigController {
  constructor(private readonly service: PlanConfigService) {}

  @Get(':organizationId')
  @Roles(Role.SUPER_ADMIN)
  async get(@Param('organizationId') organizationId: string) {
    const config = await this.service.get(organizationId);
    if (!config) return { configured: false };
    return { configured: true, ...config };
  }

  @Put(':organizationId')
  @Roles(Role.SUPER_ADMIN)
  async upsert(
    @Param('organizationId') organizationId: string,
    @Body()
    dto: {
      availableTenors: { installmentCount: number; frequency: string; label: string }[];
      interestModel: InterestModel;
      maxPrincipal?: number;
      requireMembership?: boolean;
      dueDateRule: DueDateRule;
      gracePeriodDays?: number;
      lateFeeType: LateFeeType;
      lateFeeValue?: number;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.upsert(organizationId, { ...dto, updatedBy: userId });
  }
}
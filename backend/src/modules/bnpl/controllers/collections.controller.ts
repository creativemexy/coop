import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CollectionsService } from '../services/collections.service';
import { PriorityLevel, PriorityEntityType } from '../entities/collection-priority.entity';
import { ExceptionCaseStatus } from '../entities/exception-case.entity';
import { PlaybookTrigger } from '../entities/collection-playbook.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('api/v1/bnpl/collections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
export class CollectionsController {
  constructor(private readonly service: CollectionsService) {}

  @Get('cohorts')
  async getCohorts() {
    return this.service.getDelinquencyCohorts();
  }

  @Get('cohorts/:bucket/installments')
  async getCohortInstallments(
    @Param('bucket') bucket: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.getCohortInstallments(
      decodeURIComponent(bucket),
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 50,
    );
  }

  @Post('priority')
  async assignPriority(
    @Body() dto: { entityType: PriorityEntityType; entityId: string; priority: PriorityLevel; reason: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.assignPriority(dto.entityType, dto.entityId, dto.priority, dto.reason, userId);
  }

  @Get('priorities')
  async getPriorities(@Query('entityType') entityType?: PriorityEntityType) {
    return this.service.getPriorities(entityType);
  }

  @Get('exception-reasons')
  async getExceptionReasons() {
    return this.service.getExceptionReasons();
  }

  @Post('exception-cases')
  async createExceptionCase(
    @Body() dto: { subscriptionId: string; reasonId: string; description?: string; assignedTo?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.createExceptionCase({ ...dto, createdBy: userId });
  }

  @Patch('exception-cases/:id/resolve')
  async resolveExceptionCase(
    @Param('id') id: string,
    @Body() dto: { resolution: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.resolveExceptionCase(id, dto.resolution, userId);
  }

  @Get('exception-cases')
  async getExceptionCases(
    @Query('status') status?: ExceptionCaseStatus,
    @Query('subscriptionId') subscriptionId?: string,
  ) {
    return this.service.getExceptionCases({ status, subscriptionId });
  }

  @Get('playbooks')
  async getPlaybooks(@Query('triggerEvent') triggerEvent?: PlaybookTrigger) {
    return this.service.getPlaybooks(triggerEvent);
  }

  @Get('recommended-actions/:subscriptionId')
  async getRecommendedActions(@Param('subscriptionId') subscriptionId: string) {
    return this.service.getRecommendedActions(subscriptionId);
  }

  @Post('playbooks/seed')
  @Roles(Role.SUPER_ADMIN)
  async seedPlaybooks() {
    return this.service.seedPlaybooks();
  }
}

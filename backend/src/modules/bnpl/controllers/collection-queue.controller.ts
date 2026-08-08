import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CollectionQueueService } from '../services/collection-queue.service';
import { QueueStatus, QueuePriority } from '../entities/collection-queue.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('api/v1/bnpl/collection-queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
export class CollectionQueueController {
  constructor(private readonly service: CollectionQueueService) {}

  @Post(':subscriptionId/add')
  async addToQueue(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.addToQueue(subscriptionId, userId);
  }

  @Get()
  async listQueued(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.service.listQueued({ status, priority, assignedTo });
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: QueueStatus; note?: string },
  ) {
    return this.service.updateStatus(id, dto.status, dto.note);
  }

  @Patch(':id/assign')
  async assignTo(
    @Param('id') id: string,
    @Body() dto: { assignedTo: string },
  ) {
    return this.service.assignTo(id, dto.assignedTo);
  }

  @Get('aging')
  async getAgingSummary() {
    return this.service.getAgingSummary();
  }
}

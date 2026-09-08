import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { NotificationType } from './entities/in-app-notification.entity';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Roles(Role.INDIVIDUAL, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.BUSINESS_MANAGER)
  findAll(@CurrentUser('sub') userId: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.findByUser(userId, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
  }

  @Get('unread-count')
  @Roles(Role.INDIVIDUAL, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.BUSINESS_MANAGER)
  unreadCount(@CurrentUser('sub') userId: string) {
    return this.service.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @Roles(Role.INDIVIDUAL, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.BUSINESS_MANAGER)
  markRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.markAsRead(id, userId);
  }

  @Patch('read-all')
  @Roles(Role.INDIVIDUAL, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.BUSINESS_MANAGER)
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.service.markAllAsRead(userId);
  }

  @Post('broadcast')
  @Roles(Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN)
  broadcast(
    @Body() dto: { title: string; message?: string; type?: NotificationType; link?: string },
  ) {
    return this.service.broadcast(dto);
  }

  @Delete(':id')
  @Roles(Role.INDIVIDUAL, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN, Role.BUSINESS_MANAGER)
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.delete(id, userId);
  }
}
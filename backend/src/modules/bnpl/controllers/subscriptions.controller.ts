import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from '../services/subscriptions.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { KycGuard } from '../../../common/guards/kyc.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { SubscriptionStatus } from '../../../common/enums/status.enum';

@Controller('api/v1/bnpl/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard, KycGuard)
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post()
  @Roles(Role.INDIVIDUAL)
  async subscribe(
    @Body() dto: { planId: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.subscribe(userId, dto.planId);
  }

  @Get()
  async findMySubscriptions(@CurrentUser() user: Record<string, unknown>) {
    if (user.role === Role.INDIVIDUAL) {
      return this.service.findByUser(user.sub as string);
    }
    if (user.organizationId) {
      return this.service.findByOrg(user.organizationId as string);
    }
    return [];
  }

  @Get('orders')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async listOrders(
    @Query('status') status?: string,
    @Query('payoutStatus') payoutStatus?: string,
    @Query('search') search?: string,
    @Query('product') product?: string,
    @Query('tenor') tenor?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.listOrders({
      status,
      payoutStatus,
      search,
      product,
      tenor: tenor ? parseInt(tenor, 10) : undefined,
      dateFrom,
      dateTo,
    });
  }

  @Get('orders/:id/payments')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async getOrderPayments(@Param('id') id: string) {
    return this.service.getOrderPayments(id);
  }

  @Patch('orders/:id/status')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: { status: SubscriptionStatus; reason?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.updateOrderStatus(id, dto.status, userId, dto.reason);
  }

  @Patch('orders/:id/disburse')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async markDisbursed(
    @Param('id') id: string,
    @Body() dto: { disbursementReference: string; reason?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.markDisbursed(id, dto.disbursementReference, userId, dto.reason);
  }

  @Patch('orders/:id/settle')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async markSettled(
    @Param('id') id: string,
    @Body() dto: { reason?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.markSettled(id, userId, dto?.reason);
  }

  @Get('search-users')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async searchUsers(@Query('q') query: string) {
    return this.service.searchUsers(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}

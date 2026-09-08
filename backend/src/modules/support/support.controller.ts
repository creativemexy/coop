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
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { TicketStatus, TicketCategory } from '../bnpl/entities/support-ticket.entity';

@Controller('api/v1/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SupportController {
  constructor(private readonly service: SupportService) {}

  /* ── Orders (read-only) ── */

  @Get('orders')
  async listOrders() {
    return this.service.listOrders();
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.service.getOrder(id);
  }

  /* ── Repayments (read-only) ── */

  @Get('repayments/:orderId')
  async getRepaymentSchedule(@Param('orderId') orderId: string) {
    return this.service.getRepaymentSchedule(orderId);
  }

  /* ── Webhook Logs ── */

  @Get('webhook-logs')
  async getWebhookLogs(
    @Query('provider') provider?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getWebhookLogs({ provider, status, limit: limit ? Number(limit) : undefined });
  }

  @Get('webhook-logs/:id')
  async getWebhookLog(@Param('id') id: string) {
    return this.service.getWebhookLog(id);
  }

  /* ── Technical Actions ── */

  @Post('webhooks/resubmit/:paymentId')
  async resubmitWebhook(
    @Param('paymentId') paymentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.resubmitWebhook(paymentId, userId);
  }

  @Post('reconciliation/trigger')
  async triggerReconciliation(@CurrentUser('sub') userId: string) {
    return this.service.triggerReconciliation(userId);
  }

  /* ── Tickets ── */

  @Post('tickets')
  async createTicket(
    @Body() dto: {
      subject: string;
      description?: string;
      category?: TicketCategory;
      relatedOrderId?: string;
      relatedPaymentId?: string;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.createTicket({ ...dto, createdBy: userId });
  }

  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER_CARE)
  @Get('tickets')
  async listTickets(
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.service.listTickets({ status, category });
  }

  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER_CARE)
  @Patch('tickets/:id/status')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: { status: TicketStatus; note?: string },
  ) {
    return this.service.updateTicketStatus(id, dto.status, dto.note);
  }

  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER_CARE)
  @Get('tickets/:id/messages')
  async getTicketMessages(@Param('id') id: string) {
    return this.service.getTicketMessages(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.CUSTOMER_CARE)
  @Post('tickets/:id/messages')
  async addTicketMessage(
    @Param('id') id: string,
    @Body() dto: { message: string },
    @CurrentUser() user: any,
  ) {
    return this.service.addTicketMessage(id, user.sub, user.role, dto.message);
  }
}

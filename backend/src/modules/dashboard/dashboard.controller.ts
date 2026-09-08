import { Controller, Get, Post, Body, Param, Patch, Res, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { TicketCategory } from '../bnpl/entities/support-ticket.entity';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('super-admin')
  @Roles(Role.SUPER_ADMIN)
  superAdmin() {
    return this.service.getSuperAdminDashboard();
  }

  @Get('admin')
  @Roles(Role.OPERATIONAL_ADMIN)
  admin(@CurrentUser('apexOrgId') apexOrgId: string) {
    return this.service.getAdminDashboard(apexOrgId);
  }

  @Get('accountant')
  @Roles(Role.ACCOUNTANT)
  accountant(@CurrentUser('organizationId') organizationId: string) {
    return this.service.getAccountantDashboard(organizationId);
  }

  @Get('business-manager')
  @Roles(Role.BUSINESS_MANAGER)
  businessManager(@CurrentUser('organizationId') organizationId: string) {
    return this.service.getBusinessManagerDashboard(organizationId);
  }

  @Patch('business-manager/bank')
  @Roles(Role.BUSINESS_MANAGER)
  businessManagerBank(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: { bankName?: string; accountName?: string; accountNumber?: string; sortCode?: string; bankCode?: string },
  ) {
    return this.service.updateBusinessManagerOrgBank(organizationId, dto);
  }

  @Get('business-manager/members/:id/financials')
  @Roles(Role.BUSINESS_MANAGER)
  businessManagerMemberFinancials(
    @CurrentUser('sub') bmUserId: string,
    @Param('id') memberId: string,
  ) {
    return this.service.getMemberFinancials(bmUserId, memberId);
  }

  @Get('business-manager/members/transactions')
  @Roles(Role.BUSINESS_MANAGER)
  businessManagerMemberTransactions(@CurrentUser('sub') bmUserId: string) {
    return this.service.getBusinessManagerMemberTransactions(bmUserId);
  }

  @Get('bnpl-manager')
  @Roles(Role.BNPL_MANAGER)
  bnplManager(@CurrentUser('organizationId') organizationId: string) {
    return this.service.getBnplManagerDashboard(organizationId);
  }

  @Get('individual')
  @Roles(Role.INDIVIDUAL)
  individual(@CurrentUser('sub') userId: string) {
    return this.service.getIndividualDashboard(userId);
  }

  @Get('individual/transactions')
  @Roles(Role.INDIVIDUAL)
  individualTransactions(@CurrentUser('sub') userId: string) {
    return this.service.getUnifiedTransactions(userId);
  }

  @Get('individual/statement')
  @Roles(Role.INDIVIDUAL)
  memberStatement(@CurrentUser('sub') userId: string) {
    return this.service.getMemberStatement(userId);
  }

  @Get('individual/statement/export')
  @Roles(Role.INDIVIDUAL)
  async exportMemberStatement(@Res() res: any, @CurrentUser('sub') userId: string) {
    const csv = await this.service.exportMemberStatementCsv(userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="member-statement.csv"');
    res.send(csv);
  }

  @Get('individual/repayments')
  @Roles(Role.INDIVIDUAL)
  repaymentSchedule(@CurrentUser('sub') userId: string) {
    return this.service.getRepaymentSchedule(userId);
  }

  @Get('individual/tickets')
  @Roles(Role.INDIVIDUAL)
  memberTickets(@CurrentUser('sub') userId: string) {
    return this.service.getMemberTickets(userId);
  }

  @Post('individual/tickets')
  @Roles(Role.INDIVIDUAL)
  createMemberTicket(
    @CurrentUser('sub') userId: string,
    @Body() dto: { subject: string; description?: string; category?: TicketCategory; relatedOrderId?: string; relatedPaymentId?: string },
  ) {
    return this.service.createMemberTicket({ ...dto, createdBy: userId });
  }

  @Get('individual/tickets/:id/messages')
  @Roles(Role.INDIVIDUAL)
  memberTicketMessages(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.getMemberTicketMessages(id, userId);
  }

  @Post('individual/tickets/:id/messages')
  @Roles(Role.INDIVIDUAL)
  addMemberTicketMessage(
    @Param('id') id: string,
    @Body() dto: { message: string },
    @CurrentUser() user: any,
  ) {
    return this.service.addMemberTicketMessage(id, user.sub, dto.message);
  }
}

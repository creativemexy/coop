import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { maskEmail, maskName } from '../../common/mask.util';

import { DisputeStatus } from './entities/dispute.entity';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── User management ────────────────────────────────────────────

  @Post('users/:id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: { newPassword: string },
  ) {
    return this.adminService.resetPassword(id, dto.newPassword);
  }

  @Post('users/:id/revoke-sessions')
  async revokeSessions(@Param('id') id: string) {
    return this.adminService.revokeSessions(id);
  }

  @Patch('users/:id/role')
  async assignRole(
    @Param('id') id: string,
    @Body() dto: { role: Role; organizationId?: string; apexOrgId?: string },
    @CurrentUser() user: any,
  ) {
    return this.adminService.assignRole(id, dto.role, user.role, dto.organizationId, dto.apexOrgId);
  }

  // ─── Tenant management (base) ───────────────────────────────────

  @Get('tenants')
  async listTenants() {
    return this.adminService.listTenants();
  }

  @Get('tenants/:id')
  async getTenant(@Param('id') id: string) {
    return this.adminService.getTenantDetail(id);
  }

  @Get('tenants/:id/health')
  async getTenantHealth(@Param('id') id: string) {
    return this.adminService.getTenantHealth(id);
  }

  // ─── Tenant settings (profile + notifications) ──────────────────

  @Patch('tenants/:id/settings')
  async updateTenantSettings(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      status?: string;
      supportedProducts?: string[];
      notificationWebhookUrl?: string;
      notificationEmail?: string;
    },
  ) {
    return this.adminService.updateTenantSettings(id, dto);
  }

  @Get('tenants/:id/settings')
  async getTenantSettings(@Param('id') id: string) {
    return this.adminService.getTenantSettings(id);
  }

  // ─── Feature toggles & operational config (new) ─────────────────

  @Get('tenants/:id/config')
  async getTenantConfig(@Param('id') id: string) {
    return this.adminService.getTenantConfig(id);
  }

  @Patch('tenants/:id/config')
  async updateTenantConfig(
    @Param('id') id: string,
    @Body() dto: {
      bnplEnabled?: boolean;
      kycRequirementLevel?: string;
      repaymentRetryPolicy?: { maxAttempts: number; cooldownHours: number; autoRetryOnFailure: boolean };
      webhookProviders?: { paystack: { endpoint: string; enabled: boolean; retryOnFailure: boolean; retryMaxAttempts: number } };
      logRetentionDays?: number;
      name?: string;
      status?: string;
    },
  ) {
    return this.adminService.updateTenantConfig(id, dto);
  }

  // ─── Admin Overview Dashboard ───────────────────────────────────

  @Get('overview')
  async getOverview() {
    return this.adminService.getAdminOverview();
  }

  @Get('tenants-health')
  async getTenantsHealthTable() {
    return this.adminService.getTenantsHealthTable();
  }

  @Get('financial-reports')
  async getFinancialReports() {
    return this.adminService.getFinancialReports();
  }

  // ─── Users & Roles ──────────────────────────────────────────────

  @Get('users-by-org')
  async getUsersByOrg(@CurrentUser() user?: any) {
    const orgs = await this.adminService.getUsersByOrganization();
    if (user?.role === Role.SUPER_ADMIN) return orgs;
    return orgs.map((org: any) => ({
      ...org,
      users: org.users.map((u: any) => ({
        ...u,
        email: maskEmail(u.email),
        firstName: maskName(u.firstName),
        lastName: maskName(u.lastName),
      })),
    }));
  }

  // ─── Audit Logs ─────────────────────────────────────────────────

  @Get('audit-logs')
  async getAdminAuditLogs(
    @Query('tenantId') tenantId?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('days') days?: string,
  ) {
    return this.adminService.getAdminAuditLogs({
      tenantId,
      actorId,
      action,
      days: days ? Number(days) : undefined,
    });
  }

  // ─── Tenant Reports ─────────────────────────────────────────────

  @Get('tenants/:id/reports/order-volume')
  async getOrderVolume(@Param('id') id: string) {
    return this.adminService.getTenantOrderVolume(id);
  }

  @Get('tenants/:id/reports/repayment-kpis')
  async getRepaymentKpis(@Param('id') id: string) {
    return this.adminService.getTenantRepaymentKpis(id);
  }

  @Get('tenants/:id/reports/delinquency')
  async getDelinquency(@Param('id') id: string) {
    return this.adminService.getTenantDelinquencySnapshot(id);
  }

  @Get('tenants/:id/reports/export')
  async exportTenantReport(@Param('id') id: string, @Res() res: any) {
    const csv = await this.adminService.exportTenantReport(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tenant-${id}-report.csv"`);
    res.send(csv);
  }

  @Get('tenants/reports/member-statement')
  async getMemberStatement(@Query('userId') userId: string) {
    return this.adminService.getMemberStatement(userId);
  }

  // ─── Operational Monitoring ─────────────────────────────────────

  @Get('monitoring/webhooks')
  async getWebhookDeliveryStatus(
    @Query('days') days?: string,
  ) {
    return this.adminService.getWebhookDeliveryStatus(undefined, days ? Number(days) : 7);
  }

  @Get('monitoring/failed-jobs')
  async getFailedJobs(@Query('days') days?: string) {
    return this.adminService.getFailedJobs(undefined, days ? Number(days) : 7);
  }

  @Get('monitoring/queues')
  async getQueueStatus() {
    return this.adminService.getQueueStatus();
  }

  @Get('monitoring/logs')
  async getSystemLogs(@Query('days') days?: string) {
    return this.adminService.getSystemLogs(undefined, days ? Number(days) : 7);
  }

  // ─── Dispute Management ─────────────────────────────────────

  @Get('disputes')
  async getDisputes(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getDisputes({
      status,
      type,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Patch('disputes/:id/resolve')
  async resolveDispute(
    @Param('id') id: string,
    @Body() dto: { status: DisputeStatus; resolution: string },
    @CurrentUser() user: any,
  ) {
    return this.adminService.resolveDispute(id, dto, user.sub);
  }
}

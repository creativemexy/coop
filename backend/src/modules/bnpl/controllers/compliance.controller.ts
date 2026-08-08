import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ComplianceService } from '../services/compliance.service';
import { SubscriptionsService } from '../services/subscriptions.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';
import { RiskFlagStatus, RiskFlagEntityType } from '../entities/risk-flag.entity';

@Controller('api/v1/bnpl/compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(
    private readonly service: ComplianceService,
    private readonly subsService: SubscriptionsService,
  ) {}

  // ── Eligibility (Individual) ──

  @Get('eligibility')
  @Roles(Role.INDIVIDUAL)
  async checkEligibility(
    @Query('planId') planId: string,
    @CurrentUser('sub') userId: string,
  ) {
    if (!planId) throw new BadRequestException('planId query param is required');
    return this.subsService.checkEligibility(userId, planId);
  }

  // ── Risk Flags ──

  @Post('flags')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async createFlag(
    @Body()
    dto: {
      entityType: RiskFlagEntityType;
      entityId: string;
      reason: string;
      description?: string;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.createFlag({ ...dto, flaggedBy: userId });
  }

  @Get('flags')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async listFlags(
    @Query('status') status?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.service.listFlags({ status, entityType });
  }

  @Patch('flags/:id/resolve')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async resolveFlag(
    @Param('id') id: string,
    @Body() dto: { status: RiskFlagStatus; resolutionNote?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.resolveFlag(id, { ...dto, resolvedBy: userId });
  }

  // ── Exception Reasons ──

  @Get('exception-reasons')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async listExceptionReasons() {
    return this.service.listExceptionReasons();
  }

  @Post('exception-reasons')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async createExceptionReason(
    @Body() dto: { title: string; description?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.createExceptionReason({ ...dto, createdBy: userId });
  }

  @Patch('exception-reasons/:id')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async updateExceptionReason(
    @Param('id') id: string,
    @Body() dto: { title?: string; description?: string; status?: string },
  ) {
    return this.service.updateExceptionReason(id, dto);
  }

  @Delete('exception-reasons/:id')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async deleteExceptionReason(@Param('id') id: string) {
    await this.service.deleteExceptionReason(id);
    return { message: 'Deleted' };
  }

  // ── Reports ──

  @Get('portfolio-summary')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async getPortfolioSummary() {
    return this.service.getPortfolioSummary();
  }

  @Get('portfolio-kpis')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async getPortfolioKpis() {
    return this.service.getPortfolioKpis();
  }

  @Get('revenue-summary')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async getRevenueSummary() {
    return this.service.getRevenueSummary();
  }

  @Get('export')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async export(@Res() res: any) {
    const csv = await this.service.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bnpl-report.csv"');
    res.send(csv);
  }

  // ── Audit Logs ──

  @Get('audit-logs')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async listAuditLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('category') category?: string,
  ) {
    return this.service.listAuditLogs({ entityType, entityId, action, category });
  }

  @Get('audit-logs/:id')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async getAuditLog(@Param('id') id: string) {
    return this.service.getAuditLog(id);
  }

  @Get('audit-logs/:id/evidence')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async getAuditEvidence(@Param('id') id: string) {
    const evidence = await this.service.getAuditEvidence(id);
    if (!evidence) return { evidence: null };
    return { evidence };
  }

  // ── Delinquency Cohorts & Trends ──

  @Get('delinquency-cohorts')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async getDelinquencyCohorts() {
    return this.service.getDelinquencyCohorts();
  }

  @Get('delinquency-trends')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async getDelinquencyTrends() {
    return this.service.getDelinquencyTrends();
  }
}
import {
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
  Query,
  Param,
  Body,
  Res,
} from '@nestjs/common';
import { AccountantService } from './accountant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { ResultStatus } from './entities/reconciliation-result.entity';
import { AdjustmentType, AdjustmentStatus } from './entities/adjustment-request.entity';

@Controller('api/v1/accountant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ACCOUNTANT, Role.OPERATIONAL_ADMIN, Role.SUPER_ADMIN)
export class AccountantController {
  constructor(private readonly svc: AccountantService) {}

  // ─── BNPL Transaction Ledger (order-level) ─────────────────

  @Get('bnpl/orders')
  async getOrderLedger(@Query('orgId') orgId?: string, @Query('days') days?: string) {
    return this.svc.getOrderLedger(orgId, days ? Number(days) : undefined);
  }

  @Get('bnpl/orders/export')
  async exportOrderLedger(@Query('orgId') orgId: string = '', @Query('days') days: string = '', @Res() res: any) {
    const csv = await this.svc.exportOrderLedgerCsv(orgId || undefined, days ? Number(days) : undefined);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bnpl-order-ledger.csv"');
    res.send(csv);
  }

  // ─── Installment-level postings ────────────────────────────

  @Get('bnpl/installments')
  async getInstallmentLedger(@Query('orgId') orgId?: string, @Query('days') days?: string) {
    return this.svc.getInstallmentLedger(orgId, days ? Number(days) : undefined);
  }

  @Get('bnpl/installments/export')
  async exportInstallmentLedger(@Query('orgId') orgId: string = '', @Query('days') days: string = '', @Res() res: any) {
    const csv = await this.svc.exportInstallmentLedgerCsv(orgId || undefined, days ? Number(days) : undefined);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bnpl-installment-ledger.csv"');
    res.send(csv);
  }

  // ─── Payment References ────────────────────────────────────

  @Get('bnpl/payments')
  async getPaymentReferences(@Query('orgId') orgId?: string, @Query('days') days?: string) {
    return this.svc.getPaymentReferences(orgId, days ? Number(days) : undefined);
  }

  @Get('bnpl/payments/export')
  async exportPaymentReferences(@Query('orgId') orgId: string = '', @Query('days') days: string = '', @Res() res: any) {
    const csv = await this.svc.exportPaymentReferencesCsv(orgId || undefined, days ? Number(days) : undefined);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bnpl-payment-references.csv"');
    res.send(csv);
  }

  // ─── Settlement References ─────────────────────────────────

  @Get('bnpl/settlements')
  async getSettlementReferences(@Query('orgId') orgId?: string, @Query('days') days?: string) {
    return this.svc.getSettlementReferences(orgId, days ? Number(days) : undefined);
  }

  @Get('bnpl/settlements/export')
  async exportSettlementReferences(@Query('orgId') orgId: string = '', @Query('days') days: string = '', @Res() res: any) {
    const csv = await this.svc.exportSettlementReferencesCsv(orgId || undefined, days ? Number(days) : undefined);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bnpl-settlement-references.csv"');
    res.send(csv);
  }

  // ─── Tenants for filter ────────────────────────────────────

  @Get('tenants')
  async getTenants() {
    return this.svc.getTenants();
  }

  // ═══════════════════════════════════════════════════════════════
  //  RECONCILIATION WORKBENCH
  // ═══════════════════════════════════════════════════════════════

  @Post('reconciliation/run')
  async runReconciliation(
    @Body() dto: { rangeStart: string; rangeEnd: string; organizationId?: string },
    @CurrentUser() user: any,
  ) {
    return this.svc.runReconciliation({ ...dto, runBy: user.sub });
  }

  @Get('reconciliation/runs')
  async getReconciliationRuns(@Query('orgId') orgId?: string) {
    return this.svc.getReconciliationRuns(orgId);
  }

  @Get('reconciliation/runs/:id')
  async getReconciliationRun(@Param('id') id: string) {
    return this.svc.getReconciliationRun(id);
  }

  @Get('reconciliation/results')
  async getReconciliationResults(
    @Query('runId') runId: string,
    @Query('status') status?: ResultStatus,
  ) {
    return this.svc.getReconciliationResults(runId, status);
  }

  @Patch('reconciliation/results/:id')
  async updateReconciliationResult(
    @Param('id') id: string,
    @Body() dto: { status: ResultStatus; notes?: string },
  ) {
    return this.svc.updateReconciliationResult(id, dto);
  }

  @Get('reconciliation/export/:runId')
  async exportReconciliation(
    @Param('runId') runId: string,
    @Res() res: any,
  ) {
    const csv = await this.svc.exportReconciliationCsv(runId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reconciliation-${runId.slice(0, 8)}.csv"`);
    res.send(csv);
  }

  // ═══════════════════════════════════════════════════════════════
  //  ADJUSTMENT REQUESTS (approval-based, metadata corrections)
  // ═══════════════════════════════════════════════════════════════

  @Post('adjustments')
  async createAdjustment(
    @Body() dto: {
      adjustmentType: AdjustmentType;
      description: string;
      reasonCode: string;
      changes: Record<string, any>;
      referenceType?: string;
      referenceId?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.svc.createAdjustmentRequest({ ...dto, requestedBy: user.sub });
  }

  @Get('adjustments')
  async listAdjustments(@Query('status') status?: AdjustmentStatus) {
    return this.svc.listAdjustmentRequests(status);
  }

  @Get('adjustments/:id')
  async getAdjustment(@Param('id') id: string) {
    return this.svc.getAdjustmentRequest(id);
  }

  @Post('adjustments/:id/approve')
  async approveAdjustment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.approveAdjustmentRequest(id, user.sub);
  }

  @Post('adjustments/:id/reject')
  async rejectAdjustment(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.svc.rejectAdjustmentRequest(id, user.sub, dto.reason);
  }

  // ═══════════════════════════════════════════════════════════════
  //  STATEMENTS
  // ═══════════════════════════════════════════════════════════════

  @Get('statements/member/:userId')
  async getMemberStatement(@Param('userId') userId: string, @Query('days') days?: string) {
    return this.svc.getMemberStatement(userId, days ? Number(days) : undefined);
  }

  @Get('statements/member/:userId/export')
  async exportMemberStatement(@Param('userId') userId: string, @Res() res: any) {
    const csv = await this.svc.exportMemberStatementCsv(userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="member-statement-${userId.slice(0, 8)}.csv"`);
    res.send(csv);
  }

  @Get('statements/cooperative/:orgId')
  async getCooperativeStatement(@Param('orgId') orgId: string, @Query('days') days?: string) {
    return this.svc.getCooperativeStatement(orgId, days ? Number(days) : undefined);
  }

  @Get('statements/cooperative/:orgId/export')
  async exportCooperativeStatement(@Param('orgId') orgId: string, @Res() res: any) {
    const csv = await this.svc.exportCooperativeStatementCsv(orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cooperative-statement-${orgId.slice(0, 8)}.csv"`);
    res.send(csv);
  }

  // ═══════════════════════════════════════════════════════════════
  //  UNIFIED TRANSACTION REGISTER
  // ═══════════════════════════════════════════════════════════════

  @Get('transactions')
  async getTransactionRegister(
    @Query('source') source?: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.svc.getTransactionRegister({
      source,
      days: days ? Number(days) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('transactions/export')
  async exportTransactionRegister(
    @Res() res: any,
    @Query('source') source?: string,
    @Query('days') days?: string,
  ) {
    const csv = await this.svc.exportTransactionRegisterCsv({ source, days: days ? Number(days) : undefined });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transaction-register.csv"');
    res.send(csv);
  }

  // ═══════════════════════════════════════════════════════════════
  //  COMPLIANCE & AUDIT SUPPORT
  // ═══════════════════════════════════════════════════════════════

  @Get('audit/financial')
  async getFinancialAudit(
    @Query('days') days?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getFinancialAuditLog(
      days ? Number(days) : undefined,
      action,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('dashboard')
  async getDashboard() {
    return this.svc.getDashboard();
  }

  @Get('dashboard/fee-pots')
  async getFeePotStats(@Query('apexOrgId') apexOrgId?: string) {
    return this.svc.getFeePotStatsByOrg(apexOrgId);
  }

  @Get('apex-organizations')
  async getApexOrganizations() {
    return this.svc.getApexOrganizations();
  }
}

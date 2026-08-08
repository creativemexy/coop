import { Controller, Get, Post, Patch, Param, Body, Query, Res, UseGuards } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { KycGuard } from '../../common/guards/kyc.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('api/v1/investments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvestmentsController {
  constructor(private readonly svc: InvestmentsService) {}

  @Get('products')
  async listProducts(
    @Query('type') type?: string,
    @Query('riskTier') riskTier?: string,
  ) {
    return this.svc.listProducts({ type, riskTier, isOpen: true });
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.svc.getProduct(id);
  }

  @Post('orders')
  @UseGuards(KycGuard)
  @Roles(Role.INDIVIDUAL)
  async placeOrder(
    @CurrentUser('sub') userId: string,
    @Body() dto: { productId: string; amount: number },
  ) {
    return this.svc.placeOrder(userId, dto);
  }

  @Get('orders')
  @Roles(Role.INDIVIDUAL)
  async myOrders(@CurrentUser('sub') userId: string) {
    return this.svc.getMyOrders(userId);
  }

  @Post('orders/:id/confirm')
  @UseGuards(KycGuard)
  @Roles(Role.INDIVIDUAL)
  async confirmPayment(
    @Param('id') id: string,
    @Body() dto: { paymentReference: string; paymentId: string },
  ) {
    return this.svc.confirmPayment(id, dto.paymentReference, dto.paymentId);
  }

  @Get('holdings')
  @Roles(Role.INDIVIDUAL)
  async myHoldings(@CurrentUser('sub') userId: string) {
    return this.svc.getMyHoldings(userId);
  }

  @Get('portfolio')
  @Roles(Role.INDIVIDUAL)
  async portfolioSummary(@CurrentUser('sub') userId: string) {
    return this.svc.getPortfolioSummary(userId);
  }

  @Get('distributions')
  async listDistributions(@Query('productId') productId?: string) {
    return this.svc.getDistributions(productId);
  }

  @Get('distributions/mine')
  @Roles(Role.INDIVIDUAL)
  async myDistributions(@CurrentUser('sub') userId: string) {
    return this.svc.getMyDistributionHistory(userId);
  }

  @Get('distributions/pending')
  @Roles(Role.INDIVIDUAL)
  async pendingDistributions(@CurrentUser('sub') userId: string) {
    return this.svc.getPendingDistributions(userId);
  }

  @Post('redemptions')
  @UseGuards(KycGuard)
  @Roles(Role.INDIVIDUAL)
  async requestRedemption(
    @CurrentUser('sub') userId: string,
    @Body() dto: { holdingId: string; units: number; reason?: string },
  ) {
    return this.svc.requestRedemption(userId, dto);
  }

  @Get('redemptions')
  @Roles(Role.INDIVIDUAL)
  async myRedemptions(@CurrentUser('sub') userId: string) {
    return this.svc.getMyRedemptions(userId);
  }

  @Get('compliance')
  @Roles(Role.INDIVIDUAL)
  async compliance(
    @CurrentUser('sub') userId: string,
    @Query('productId') productId?: string,
  ) {
    return this.svc.getCompliance(userId, productId);
  }

  // ── Admin endpoints ──

  @Post('admin/products')
  @Roles(Role.SUPER_ADMIN)
  async createProduct(
    @Body() dto: {
      name: string;
      description?: string;
      type: string;
      riskTier?: string;
      minimumInvestment: number;
      maximumInvestment?: number;
      unitPrice?: number;
      lockInDays?: number;
      tenorDays?: number;
      managementFeeRate?: number;
      expectedReturnRate?: number;
      profitSharingRules?: string;
      distributionFrequency?: string;
      totalUnits?: number;
      availableUnits?: number;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.createProduct({ ...dto, type: dto.type as any, riskTier: dto.riskTier as any, distributionFrequency: dto.distributionFrequency as any, createdBy: userId });
  }

  @Patch('admin/products/:id')
  @Roles(Role.SUPER_ADMIN)
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
    @CurrentUser('sub') userId: string,
  ) {
    const changeSummary = dto.changeSummary || '';
    delete dto.changeSummary;
    return this.svc.updateProduct(id, dto, userId);
  }

  @Patch('admin/products/:id/status')
  @Roles(Role.SUPER_ADMIN)
  async setProductStatus(
    @Param('id') id: string,
    @Body() dto: { status: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.setProductStatus(id, dto.status as any, userId);
  }

  @Get('admin/products')
  @Roles(Role.SUPER_ADMIN)
  async adminListProducts(
    @Query('type') type?: string,
    @Query('riskTier') riskTier?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listAllProducts({ type, riskTier, status });
  }

  @Get('admin/products/:id/versions')
  @Roles(Role.SUPER_ADMIN)
  async getProductVersions(@Param('id') id: string) {
    return this.svc.getProductVersions(id);
  }

  @Get('admin/products/:id/eligibility')
  @Roles(Role.SUPER_ADMIN)
  async getEligibility(@Param('id') id: string) {
    return this.svc.getEligibilityRules(id);
  }

  @Patch('admin/products/:id/eligibility')
  @Roles(Role.SUPER_ADMIN)
  async updateEligibility(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.svc.updateEligibilityRules(id, dto);
  }

  @Patch('admin/products/:id/capacity')
  @Roles(Role.SUPER_ADMIN)
  async setCapacity(
    @Param('id') id: string,
    @Body() dto: { totalCapacity?: number; perInvestorCaps?: { min?: number; max?: number } },
  ) {
    return this.svc.setCapacity(id, dto);
  }

  @Post('admin/products/:id/issuance-cycles')
  @Roles(Role.SUPER_ADMIN)
  async createIssuanceCycle(
    @Param('id') id: string,
    @Body() dto: { cycleName: string; totalUnits: number; unitPrice: number; totalValue: number; openDate?: string; closeDate?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.createIssuanceCycle(id, { ...dto, createdBy: userId });
  }

  @Get('admin/products/:id/issuance-cycles')
  @Roles(Role.SUPER_ADMIN)
  async getIssuanceCycles(@Param('id') id: string) {
    return this.svc.getIssuanceCycles(id);
  }

  @Patch('admin/issuance-cycles/:cycleId/approve')
  @Roles(Role.SUPER_ADMIN)
  async approveIssuanceCycle(
    @Param('cycleId') cycleId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.approveIssuanceCycle(cycleId, userId);
  }

  @Get('admin/issuance-cycles')
  @Roles(Role.SUPER_ADMIN)
  async listAllIssuanceCycles() {
    return this.svc.listAllIssuanceCycles();
  }

  @Get('statement')
  @Roles(Role.INDIVIDUAL)
  async statement(@CurrentUser('sub') userId: string) {
    return this.svc.getInvestmentStatement(userId);
  }

  // ── Admin: Pricing config ──

  @Get('admin/products/:id/pricing')
  @Roles(Role.SUPER_ADMIN)
  async getPricingConfig(@Param('id') id: string) {
    return this.svc.getPricingConfig(id);
  }

  @Patch('admin/products/:id/pricing')
  @Roles(Role.SUPER_ADMIN)
  async updatePricingConfig(
    @Param('id') id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.svc.updatePricingConfig(id, dto);
  }

  // ── Admin: NAV snapshots ──

  @Post('admin/products/:id/nav-snapshots')
  @Roles(Role.SUPER_ADMIN)
  async recordNavSnapshot(
    @Param('id') id: string,
    @Body() dto: { nav: number; unitPrice: number; snapshotDate: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.recordNavSnapshot(id, dto, userId);
  }

  @Get('admin/products/:id/nav-snapshots')
  @Roles(Role.SUPER_ADMIN)
  async getNavSnapshots(@Param('id') id: string) {
    return this.svc.getNavSnapshots(id);
  }

  // ── Admin: Corporate actions ──

  @Post('admin/products/:id/corporate-actions')
  @Roles(Role.SUPER_ADMIN)
  async createCorporateAction(
    @Param('id') id: string,
    @Body() dto: { type: string; description?: string; ratioNumerator: number; ratioDenominator: number; effectiveDate: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.createCorporateAction(id, dto as any, userId);
  }

  @Get('admin/corporate-actions')
  @Roles(Role.SUPER_ADMIN)
  async listCorporateActions(@Query('productId') productId?: string) {
    return this.svc.listCorporateActions(productId);
  }

  @Get('admin/products/:id/corporate-actions')
  @Roles(Role.SUPER_ADMIN)
  async listProductCorporateActions(@Param('id') id: string) {
    return this.svc.listCorporateActions(id);
  }

  @Patch('admin/corporate-actions/:actionId/approve')
  @Roles(Role.SUPER_ADMIN)
  async approveCorporateAction(
    @Param('actionId') actionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.approveCorporateAction(actionId, userId);
  }

  @Post('admin/corporate-actions/:actionId/execute')
  @Roles(Role.SUPER_ADMIN)
  async executeCorporateAction(
    @Param('actionId') actionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.executeCorporateAction(actionId, userId);
  }

  // ── Admin: Distributions & payout runs ──

  @Post('admin/distributions')
  @Roles(Role.SUPER_ADMIN)
  async createDistribution(
    @Body() dto: { productId: string; type: string; amountPerUnit: number; totalPool: number; recordDate: string; payDate: string; description?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.createDistribution(dto as any, userId);
  }

  @Get('admin/distributions')
  @Roles(Role.SUPER_ADMIN)
  async listAdminDistributions(@Query('productId') productId?: string) {
    return this.svc.listAllAdminDistributions(productId);
  }

  @Patch('admin/distributions/:id/submit')
  @Roles(Role.SUPER_ADMIN)
  async submitDistribution(@Param('id') id: string) {
    return this.svc.submitDistributionForApproval(id);
  }

  @Patch('admin/distributions/:id/approve')
  @Roles(Role.SUPER_ADMIN)
  async approveDistribution(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.approveDistribution(id, userId);
  }

  @Post('admin/distributions/:id/compute-run')
  @Roles(Role.SUPER_ADMIN)
  async computeDistributionRun(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.computeDistributionRun(id, userId);
  }

  @Get('admin/distribution-runs')
  @Roles(Role.SUPER_ADMIN)
  async listDistributionRuns(@Query('productId') productId?: string) {
    return this.svc.listDistributionRuns(productId);
  }

  @Patch('admin/distribution-runs/:runId/approve')
  @Roles(Role.SUPER_ADMIN)
  async approveDistributionRun(
    @Param('runId') runId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.approveDistributionRun(runId, userId);
  }

  @Post('admin/distribution-runs/:runId/execute')
  @Roles(Role.SUPER_ADMIN)
  async executeDistributionRun(
    @Param('runId') runId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.executeDistributionRun(runId, userId);
  }

  @Get('admin/distributions/:id/payouts')
  @Roles(Role.SUPER_ADMIN)
  async getDistributionPayouts(@Param('id') id: string) {
    return this.svc.getDistributionPayouts(id);
  }

  @Patch('admin/payouts/:payoutId')
  @Roles(Role.SUPER_ADMIN)
  async markPayoutStatus(
    @Param('payoutId') payoutId: string,
    @Body() dto: { isPaid: boolean },
  ) {
    return this.svc.markPayoutStatus(payoutId, dto.isPaid);
  }
}

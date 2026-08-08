import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  StreamableFile,
  Header,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PolicyTemplateType, PolicyTemplateStatus } from './entities/policy-template.entity';
import { OnboardingStatus } from './entities/tenant-onboarding-request.entity';
import { FeatureFlagStatus } from './entities/feature-flag.entity';
import { IncidentStatus, IncidentSeverity, IncidentSource } from './entities/incident.entity';
import { SecretCategory } from './entities/secret.entity';
import { TemplateType } from './entities/notification-template.entity';
import { DisputeStatus } from './entities/dispute.entity';

@Controller('api/v1/admin/super')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly sa: SuperAdminService) {}

  // ─── User Management ──────────────────────────────────────────

  @Post('users')
  async createUser(
    @Body() dto: {
      email: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      role: Role;
      organizationId?: string;
      apexOrgId?: string;
    },
  ) {
    return this.sa.createUser(dto);
  }

  // ─── System Overview ──────────────────────────────────────────

  @Get('overview')
  async getOverview() {
    return this.sa.getSystemOverview();
  }

  @Get('audit-log')
  async getAuditLog(
    @Query('days') days?: string,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.sa.getGlobalAuditLog({
      days: days ? Number(days) : undefined,
      action,
      actorId,
    });
  }

  // ─── Policy Templates ─────────────────────────────────────────

  @Post('policies')
  async createPolicy(
    @Body() dto: {
      name: string;
      description?: string;
      templateType: PolicyTemplateType;
      rules: Record<string, any>;
      metadata?: Record<string, any>;
      isApplicableToAllTenants?: boolean;
      applicableTenantIds?: string[];
    },
    @CurrentUser() user: any,
  ) {
    return this.sa.createPolicyTemplate({ ...dto, createdBy: user.sub });
  }

  @Get('policies')
  async listPolicies(
    @Query('type') type?: PolicyTemplateType,
    @Query('status') status?: PolicyTemplateStatus,
  ) {
    return this.sa.listPolicyTemplates(type, status);
  }

  @Get('policies/:id')
  async getPolicy(@Param('id') id: string) {
    return this.sa.getPolicyTemplate(id);
  }

  @Patch('policies/:id')
  async updatePolicy(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      rules?: Record<string, any>;
      metadata?: Record<string, any>;
      isApplicableToAllTenants?: boolean;
      applicableTenantIds?: string[];
      changeSummary?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.sa.updatePolicyTemplate(id, { ...dto, updatedBy: user.sub });
  }

  @Post('policies/:id/versions')
  async createPolicyVersion(
    @Param('id') id: string,
    @Body() dto: { rules: Record<string, any>; changeSummary: string },
    @CurrentUser() user: any,
  ) {
    return this.sa.createPolicyVersion(id, { ...dto, createdBy: user.sub });
  }

  @Post('policies/:id/submit')
  async submitPolicy(@Param('id') id: string) {
    return this.sa.submitPolicyForApproval(id);
  }

  @Post('policies/:id/approve')
  async approvePolicy(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.sa.approvePolicyTemplate(id, user.sub);
  }

  @Post('policies/:id/reject')
  async rejectPolicy(
    @Param('id') id: string,
    @Body() dto: { reason: string },
  ) {
    return this.sa.rejectPolicyTemplate(id, dto.reason);
  }

  // ─── Tenant Onboarding ──────────────────────────────────────────

  @Post('onboarding')
  async createOnboarding(
    @Body() dto: {
      orgName: string;
      orgCode: string;
      apexOrgId: string;
      complianceDocs?: Record<string, any>;
      kycRequirements?: Record<string, any>;
      productConfig?: Record<string, any>;
      contactInfo?: Record<string, any>;
    },
    @CurrentUser() user: any,
  ) {
    return this.sa.createOnboardingRequest({ ...dto, submittedBy: user.sub });
  }

  @Get('onboarding')
  async listOnboarding(@Query('status') status?: OnboardingStatus) {
    return this.sa.listOnboardingRequests(status);
  }

  @Get('onboarding/:id')
  async getOnboarding(@Param('id') id: string) {
    return this.sa.getOnboardingRequest(id);
  }

  @Patch('onboarding/:id')
  async updateOnboarding(
    @Param('id') id: string,
    @Body() dto: {
      complianceDocs?: Record<string, any>;
      kycRequirements?: Record<string, any>;
      productConfig?: Record<string, any>;
      contactInfo?: Record<string, any>;
    },
  ) {
    return this.sa.updateOnboardingRequest(id, dto);
  }

  @Post('onboarding/:id/submit')
  async submitOnboarding(@Param('id') id: string) {
    return this.sa.submitOnboardingRequest(id);
  }

  @Post('onboarding/:id/approve')
  async approveOnboarding(
    @Param('id') id: string,
    @Body() dto: { reviewNotes?: string },
    @CurrentUser() user: any,
  ) {
    return this.sa.approveOnboardingRequest(id, user.sub, dto.reviewNotes);
  }

  @Post('onboarding/:id/reject')
  async rejectOnboarding(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.sa.rejectOnboardingRequest(id, user.sub, dto.reason);
  }

  @Post('onboarding/:id/complete')
  async completeOnboarding(@Param('id') id: string) {
    return this.sa.completeOnboarding(id);
  }

  // ─── Feature Flags ─────────────────────────────────────────────

  @Post('feature-flags')
  async createFeatureFlag(
    @Body() dto: {
      key: string;
      name: string;
      description?: string;
      environments?: Record<string, boolean>;
      isKillSwitch?: boolean;
      metadata?: Record<string, any>;
    },
    @CurrentUser() user: any,
  ) {
    return this.sa.createFeatureFlag({ ...dto, createdBy: user.sub });
  }

  @Get('feature-flags')
  async listFeatureFlags(@Query('status') status?: FeatureFlagStatus) {
    return this.sa.listFeatureFlags(status);
  }

  @Get('feature-flags/:id')
  async getFeatureFlag(@Param('id') id: string) {
    return this.sa.getFeatureFlag(id);
  }

  @Patch('feature-flags/:id')
  async updateFeatureFlag(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      status?: FeatureFlagStatus;
      environments?: Record<string, boolean>;
      cohortRules?: Record<string, any>;
      rolloutPercentage?: number;
      metadata?: Record<string, any>;
    },
    @CurrentUser() user: any,
  ) {
    return this.sa.updateFeatureFlag(id, { ...dto, updatedBy: user.sub });
  }

  @Delete('feature-flags/:id')
  async deleteFeatureFlag(@Param('id') id: string) {
    return this.sa.deleteFeatureFlag(id);
  }

  @Post('feature-flags/:id/toggle')
  async toggleFeatureFlag(
    @Param('id') id: string,
    @Body() dto: { enabled: boolean },
    @CurrentUser() user: any,
  ) {
    return this.sa.toggleFeatureFlag(id, dto.enabled, user.sub);
  }

  // ─── Incidents ─────────────────────────────────────────────────

  @Post('incidents')
  async createIncident(
    @Body() dto: {
      title: string;
      description?: string;
      severity: IncidentSeverity;
      source: IncidentSource;
      tenantId?: string;
      affectedSystems?: string[];
      metrics?: Record<string, any>;
    },
    @CurrentUser() user: any,
  ) {
    return this.sa.createIncident({ ...dto, reportedBy: user.sub });
  }

  @Get('incidents')
  async listIncidents(
    @Query('status') status?: IncidentStatus | string,
    @Query('severity') severity?: IncidentSeverity,
  ) {
    const statusArray = typeof status === 'string' && status.includes(',')
      ? status.split(',').map((s) => s.trim()) as IncidentStatus[]
      : status as IncidentStatus | undefined;
    return this.sa.listIncidents(statusArray, severity);
  }

  @Get('incidents/stats')
  async getIncidentStats() {
    return this.sa.getIncidentStats();
  }

  @Get('incidents/:id')
  async getIncident(@Param('id') id: string) {
    return this.sa.getIncident(id);
  }

  @Patch('incidents/:id')
  async updateIncident(
    @Param('id') id: string,
    @Body() dto: {
      status?: IncidentStatus;
      assignedTo?: string;
      resolutionSteps?: Record<string, any>[];
      rootCause?: string;
      actionItems?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.sa.updateIncident(id, { ...dto, resolvedBy: user.sub });
  }

  @Post('incidents/:id/assign')
  async assignIncident(
    @Param('id') id: string,
    @Body() dto: { assignedTo: string },
  ) {
    return this.sa.assignIncident(id, dto.assignedTo);
  }

  // ─── Security Config ───────────────────────────────────────────

  @Get('security')
  async getSecurityConfig() {
    return this.sa.getSecurityConfig();
  }

  @Post('security')
  async setSecurityConfig(
    @Body() dto: { key: string; value: string; description?: string; valueType?: string },
    @CurrentUser() user: any,
  ) {
    return this.sa.setSecurityConfig(dto.key, { ...dto, updatedBy: user.sub });
  }

  @Delete('security/:key')
  async deleteSecurityConfig(@Param('key') key: string) {
    return this.sa.deleteSecurityConfig(key);
  }

  // ─── Secrets ───────────────────────────────────────────────────

  @Post('secrets')
  async createSecret(
    @Body() dto: {
      key: string;
      encryptedValue: string;
      category: SecretCategory;
      description?: string;
      tenantId?: string;
      expiresAt?: Date;
    },
    @CurrentUser() user: any,
  ) {
    return this.sa.createSecret({ ...dto, createdBy: user.sub });
  }

  @Get('secrets')
  async listSecrets(@Query('category') category?: SecretCategory) {
    return this.sa.listSecrets(category);
  }

  @Get('secrets/:id')
  async getSecret(@Param('id') id: string) {
    return this.sa.getSecret(id);
  }

  @Patch('secrets/:id')
  async updateSecret(
    @Param('id') id: string,
    @Body() dto: {
      encryptedValue?: string;
      description?: string;
      category?: SecretCategory;
      isRotationEnabled?: boolean;
      rotationIntervalDays?: number;
      expiresAt?: Date;
    },
    @CurrentUser() user: any,
  ) {
    return this.sa.updateSecret(id, { ...dto, updatedBy: user.sub });
  }

  @Delete('secrets/:id')
  async deleteSecret(@Param('id') id: string) {
    return this.sa.deleteSecret(id);
  }

  @Post('secrets/:id/rotate')
  async rotateSecret(
    @Param('id') id: string,
    @Body() dto: { encryptedValue: string },
    @CurrentUser() user: any,
  ) {
    return this.sa.rotateSecret(id, dto.encryptedValue, user.sub);
  }

  // ─── KYC Compliance Overview ────────────────────────────────

  @Get('kyc-overview')
  async getKycOverview() {
    return this.sa.getKycOverview();
  }

  // ─── Payment Transaction Log ────────────────────────────────

  @Get('payment-transactions')
  async getPaymentTransactions(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sa.getPaymentTransactions({
      search,
      type,
      status,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  // ─── Notification Templates ─────────────────────────────────

  @Get('templates')
  async getTemplates() {
    return this.sa.getTemplates();
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.sa.getTemplate(id);
  }

  @Post('templates')
  async createTemplate(@Body() dto: {
    key: string;
    type: TemplateType;
    subject?: string;
    body: string;
    variables?: string[];
  }) {
    return this.sa.createTemplate(dto);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: Partial<{ subject: string; body: string; variables: string[] }>,
  ) {
    return this.sa.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.sa.deleteTemplate(id);
  }

  // ─── Global Risk Rules ──────────────────────────────────────

  @Get('risk-rules')
  async getRiskRules() {
    return this.sa.getRiskRules();
  }

  @Post('risk-rules')
  async createRiskRule(@Body() dto: { ruleKey: string; description: string; enabled: boolean; config: Record<string, any> }) {
    return this.sa.createRiskRule(dto);
  }

  @Patch('risk-rules/:id')
  async updateRiskRule(@Param('id') id: string, @Body() dto: Partial<{ enabled: boolean; config: Record<string, any>; description: string }>) {
    return this.sa.updateRiskRule(id, dto);
  }

  @Delete('risk-rules/:id')
  async deleteRiskRule(@Param('id') id: string) {
    return this.sa.deleteRiskRule(id);
  }

  // ─── Tax / Interest Rate Config ─────────────────────────────

  @Get('financial-config')
  async getFinancialConfig() {
    return this.sa.getFinancialConfig();
  }

  @Patch('financial-config')
  async updateFinancialConfig(@Body() dto: Record<string, string>) {
    return this.sa.updateFinancialConfig(dto);
  }

  // ─── Dispute Management ─────────────────────────────────────

  @Get('disputes')
  async getDisputes(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sa.getDisputes({
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
    return this.sa.resolveDispute(id, dto, user.sub);
  }

  // ─── System Config / Backup ─────────────────────────────────

  @Get('system-config')
  async getSystemConfig() {
    return this.sa.getSystemConfig();
  }

  @Patch('system-config')
  async updateSystemConfig(@Body() dto: Record<string, string>) {
    return this.sa.updateSystemConfig(dto);
  }

  @Post('backup')
  async triggerBackup() {
    return this.sa.triggerBackup();
  }

  @Get('backups')
  async listBackups() {
    return this.sa.listBackups();
  }

  @Get('backups/:filename/download')
  @Header('Content-Type', 'application/gzip')
  @Header('Content-Disposition', 'attachment; filename="backup.sql.gz"')
  async downloadBackup(@Param('filename') filename: string) {
    const stream = this.sa.getBackupStream(filename);
    return new StreamableFile(stream);
  }

  @Delete('backups/:filename')
  async deleteBackup(@Param('filename') filename: string) {
    return this.sa.deleteBackup(filename);
  }

  @Post('backups/:filename/restore')
  async restoreBackup(@Param('filename') filename: string) {
    return this.sa.restoreBackup(filename);
  }

  @Post('backups/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'storage', 'backups'),
        filename: (_req: any, file: any, cb: (err: Error | null, name: string) => void) => {
          const timestamp = Date.now();
          const originalName = file.originalname.replace(/\s+/g, '_');
          cb(null, `${timestamp}-${originalName}`);
        },
      }),
      limits: { fileSize: 500 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: (err: Error | null, allowed: boolean) => void) => {
        if (!file.originalname.endsWith('.sql.gz') && !file.originalname.endsWith('.sql')) {
          cb(new BadRequestException('Only .sql.gz and .sql files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadBackup(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { message: 'File uploaded', filename: file.filename, size: file.size };
  }

  // ─── Role Feature Permissions ────────────────────────────

  @Get('role-permissions')
  async getRolePermissions() {
    return this.sa.getRolePermissions();
  }

  @Put('role-permissions')
  async updateRolePermissions(@Body() dto: Record<string, { disabledFeatures: string[]; disabledMenuItems: string[] }>) {
    return this.sa.updateRolePermissions(dto);
  }
}

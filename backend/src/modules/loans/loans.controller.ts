import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { KycGuard } from '../../common/guards/kyc.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

interface Reviewer {
  sub: string;
  role: Role;
  apexOrgId?: string;
  organizationId?: string;
}

@Controller('api/v1/loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private readonly service: LoansService) {}

  @Post('apply')
  @UseGuards(KycGuard)
  @Roles(Role.INDIVIDUAL)
  apply(
    @CurrentUser('sub') userId: string,
    @Body() dto: { amount: number; duration: number; purpose?: string },
  ) {
    return this.service.apply(userId, dto);
  }

  @Get('eligibility')
  @Roles(Role.INDIVIDUAL)
  eligibility(@CurrentUser('sub') userId: string) {
    return this.service.checkEligibility(userId);
  }

  @Get('stage')
  @Roles(
    Role.APEX_BUSINESS_MANAGER,
    Role.BUSINESS_MANAGER,
    Role.LOAN_MANAGER,
    Role.ACCOUNTANT,
    Role.OPERATIONAL_ADMIN,
    Role.SUPER_ADMIN,
  )
  findStage(
    @Query('stage') stage: 'apex' | 'organization' | 'admin' | 'disbursement',
    @CurrentUser() reviewer: Reviewer,
  ) {
    return this.service.getStageLoans(stage || 'apex', reviewer);
  }

  @Get('pending')
  @Roles(Role.LOAN_MANAGER, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN)
  findPending() {
    return this.service.findPending();
  }

  @Get('defaulted')
  @Roles(Role.LOAN_MANAGER, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN)
  findDefaulted() {
    return this.service.getDefaultedLoans();
  }

  @Get()
  @Roles(Role.INDIVIDUAL, Role.LOAN_MANAGER, Role.ACCOUNTANT, Role.BUSINESS_MANAGER, Role.APEX_BUSINESS_MANAGER, Role.OPERATIONAL_ADMIN)
  findAll(@CurrentUser('sub') userId: string) {
    return this.service.findByUser(userId);
  }

  @Get(':id')
  @Roles(
    Role.INDIVIDUAL,
    Role.LOAN_MANAGER,
    Role.ACCOUNTANT,
    Role.OPERATIONAL_ADMIN,
    Role.SUPER_ADMIN,
    Role.BUSINESS_MANAGER,
    Role.APEX_BUSINESS_MANAGER,
  )
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.findOne(id, userId);
  }

  @Post(':loanId/apex-approve')
  @Roles(Role.APEX_BUSINESS_MANAGER, Role.LOAN_MANAGER, Role.OPERATIONAL_ADMIN, Role.SUPER_ADMIN)
  approveApex(
    @CurrentUser() reviewer: Reviewer,
    @Param('loanId') loanId: string,
  ) {
    return this.service.approveApex(loanId, reviewer);
  }

  @Post(':loanId/org-approve')
  @Roles(Role.BUSINESS_MANAGER, Role.LOAN_MANAGER, Role.OPERATIONAL_ADMIN, Role.SUPER_ADMIN)
  approveOrg(
    @CurrentUser() reviewer: Reviewer,
    @Param('loanId') loanId: string,
  ) {
    return this.service.approveOrganization(loanId, reviewer);
  }

  @Post(':loanId/admin-approve')
  @Roles(Role.OPERATIONAL_ADMIN, Role.SUPER_ADMIN)
  approveAdmin(
    @CurrentUser() reviewer: Reviewer,
    @Param('loanId') loanId: string,
  ) {
    return this.service.approveFinal(loanId, reviewer);
  }

  @Post(':loanId/disburse')
  @Roles(Role.ACCOUNTANT, Role.LOAN_MANAGER, Role.OPERATIONAL_ADMIN, Role.SUPER_ADMIN)
  disburse(
    @CurrentUser() reviewer: Reviewer,
    @Param('loanId') loanId: string,
  ) {
    return this.service.disburse(loanId, reviewer);
  }

  @Post(':loanId/reject')
  @Roles(
    Role.APEX_BUSINESS_MANAGER,
    Role.BUSINESS_MANAGER,
    Role.LOAN_MANAGER,
    Role.ACCOUNTANT,
    Role.OPERATIONAL_ADMIN,
    Role.SUPER_ADMIN,
  )
  reject(
    @CurrentUser() reviewer: Reviewer,
    @Param('loanId') loanId: string,
    @Body() dto: { reason?: string },
  ) {
    return this.service.reject(loanId, reviewer.sub, dto?.reason);
  }
}
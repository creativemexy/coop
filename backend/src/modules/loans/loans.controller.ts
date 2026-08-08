import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { KycGuard } from '../../common/guards/kyc.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

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
  @Roles(Role.INDIVIDUAL, Role.LOAN_MANAGER)
  findAll(@CurrentUser('sub') userId: string) {
    return this.service.findByUser(userId);
  }

  @Get(':id')
  @Roles(Role.INDIVIDUAL)
  findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.findOne(id, userId);
  }

  @Post(':loanId/approve')
  @Roles(Role.LOAN_MANAGER, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN)
  approve(@CurrentUser('sub') userId: string, @Param('loanId') loanId: string) {
    return this.service.approve(loanId, userId);
  }

  @Post(':loanId/reject')
  @Roles(Role.LOAN_MANAGER, Role.SUPER_ADMIN, Role.OPERATIONAL_ADMIN)
  reject(@CurrentUser('sub') userId: string, @Param('loanId') loanId: string) {
    return this.service.reject(loanId, userId);
  }
}

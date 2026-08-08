import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { FeePotService } from '../services/fee-pot.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('api/v1/ledger/fee-pots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeePotsController {
  constructor(private readonly service: FeePotService) {}

  @Get()
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN, Role.BUSINESS_MANAGER, Role.APEX_BUSINESS_MANAGER)
  async getPots() {
    return this.service.getPots();
  }

  @Get('my')
  @Roles(Role.BUSINESS_MANAGER, Role.APEX_BUSINESS_MANAGER)
  async getMyFeeSummary(@CurrentUser() user: any) {
    return this.service.getScopedFeeSummary({
      organizationId: user?.organizationId,
      apexOrgId: user?.apexOrgId,
    });
  }

  @Get('banks')
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN)
  async listBanks() {
    return this.service.listBanks();
  }

  @Get('ledger')
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN, Role.APEX_BUSINESS_MANAGER)
  async getFeeShareLedger() {
    return this.service.getFeeShareLedger();
  }

  @Post('withdraw/share')
  @Roles(Role.BUSINESS_MANAGER, Role.APEX_BUSINESS_MANAGER)
  async withdrawShare(@CurrentUser() user: any) {
    return this.service.withdrawShare({
      userId: user?.sub,
      role: user?.role,
      organizationId: user?.organizationId,
      apexOrgId: user?.apexOrgId,
    });
  }

  @Post('withdraw/admin')
  @Roles(Role.SUPER_ADMIN)
  async withdrawAdmin(
    @CurrentUser('sub') userId: string,
    @Body() dto: { accountNumber: string; bankCode: string; bankName: string },
  ) {
    return this.service.withdrawAdmin({ ...dto, userId });
  }

  @Post('withdraw/platform/request')
  @Roles(Role.ACCOUNTANT)
  async requestPlatformWithdrawal(
    @CurrentUser('sub') userId: string,
    @Body() dto?: { accountNumber?: string; bankCode?: string; bankName?: string },
  ) {
    return this.service.requestPlatformWithdrawal(userId, dto);
  }

  @Get('withdrawals')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  async getWithdrawalRequests() {
    return this.service.getWithdrawalRequests();
  }

  @Patch('withdrawals/:id/approve')
  @Roles(Role.SUPER_ADMIN)
  async approveWithdrawal(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto?: { accountNumber?: string; bankCode?: string; bankName?: string },
  ) {
    return this.service.approveWithdrawal(id, userId, dto);
  }

  @Patch('withdrawals/:id/reject')
  @Roles(Role.SUPER_ADMIN)
  async rejectWithdrawal(@Param('id') id: string) {
    return this.service.rejectWithdrawal(id);
  }
}

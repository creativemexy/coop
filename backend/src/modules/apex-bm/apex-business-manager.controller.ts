import { Controller, Get, Patch, UseGuards, Query, Body } from '@nestjs/common';
import { ApexBusinessManagerService } from './apex-business-manager.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('api/v1/apex-bm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.APEX_BUSINESS_MANAGER)
export class ApexBusinessManagerController {
  constructor(private readonly service: ApexBusinessManagerService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: any) {
    return this.service.getDashboard(user.apexOrgId);
  }

  @Get('users')
  async listUsers(
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    return this.service.listUsers(user.apexOrgId, search);
  }

  @Patch('bank')
  async updateBankDetails(
    @CurrentUser() user: any,
    @Body() dto: { bankName?: string; accountName?: string; accountNumber?: string; sortCode?: string; bankCode?: string },
  ) {
    return this.service.updateBankDetails(user.apexOrgId, dto);
  }
}

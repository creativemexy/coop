import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InstallmentsService } from '../services/installments.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('api/v1/bnpl/installments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstallmentsController {
  constructor(private readonly service: InstallmentsService) {}

  @Get('subscription/:subscriptionId')
  async findBySubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.service.findBySubscription(subscriptionId);
  }

  @Get('all')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async listAll(
    @Query('status') status?: string,
    @Query('overdue') overdue?: string,
  ) {
    return this.service.listAll({
      status,
      overdue: overdue === 'true',
    });
  }

  @Get('reconciliation/:subscriptionId')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async getReconciliation(@Param('subscriptionId') subscriptionId: string) {
    return this.service.getReconciliation(subscriptionId);
  }

  @Post(':id/pay')
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN, Role.BNPL_MANAGER)
  async markAsPaid(
    @Param('id') id: string,
    @Body() dto: { paymentReference: string },
  ) {
    return this.service.markAsPaid(id, dto.paymentReference);
  }

  @Post(':id/retry')
  @Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
  async retryInstallment(@Param('id') id: string) {
    return this.service.retryInstallment(id);
  }
}

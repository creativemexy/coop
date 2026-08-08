import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BusinessManagerService } from './business-manager.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { maskPhone } from '../../common/mask.util';

@Controller('api/v1/business-manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BUSINESS_MANAGER, Role.SUPERVISOR, Role.SUPER_ADMIN)
export class BusinessManagerController {
  constructor(private readonly service: BusinessManagerService) {}

  @Get('orders/lookup/:reference')
  async lookupOrder(
    @Param('reference') reference: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    return this.service.lookupOrder(reference, organizationId);
  }

  @Get('webhooks/status')
  async getWebhookStatus(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    return this.service.getWebhookStatus(
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
      organizationId,
    );
  }

  @Post('webhooks/resubmit/:paymentId')
  async resubmitWebhook(
    @Param('paymentId') paymentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    return this.service.resubmitWebhook(paymentId, organizationId, userId);
  }

  @Get('logs')
  async getLogs(
    @Query('type') type?: 'sms' | 'payment' | 'all',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    const logs = await this.service.getLogs(
      type || 'all',
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
      organizationId,
    );
    return {
      ...logs,
      smsLogs: logs.smsLogs.map((l) => ({ ...l, recipient: maskPhone(l.recipient) })),
    };
  }

  @Post('installments/mark-paid')
  async markInstallmentAsPaid(
    @Body()
    dto: { installmentId: string; providerReference: string; reason?: string },
    @CurrentUser() user: Record<string, unknown>,
  ) {
    const userId = user.sub as string;
    const role = user.role as string;
    const organizationId = user.organizationId as string | undefined;
    return this.service.markInstallmentAsPaidOrRequestApproval(
      dto.installmentId,
      dto.providerReference,
      userId,
      role,
      organizationId,
      dto.reason,
    );
  }
}

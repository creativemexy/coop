import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RepaymentService } from '../services/repayment.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('api/v1/bnpl/repayments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
export class RepaymentController {
  constructor(private readonly service: RepaymentService) {}

  @Get('schedule/:orderId')
  async getSchedule(@Param('orderId') orderId: string) {
    return this.service.getRepaymentSchedule(orderId);
  }

  @Post(':installmentId/retry')
  async safeRetry(
    @Param('installmentId') installmentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.safeRetry(installmentId, userId);
  }

  @Post(':installmentId/reconcile')
  async reconcile(
    @Param('installmentId') installmentId: string,
    @Body() dto: { status?: string; paymentReference?: string; paidAt?: string; note?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.reconcile(installmentId, {
      status: dto.status as any,
      paymentReference: dto.paymentReference,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      note: dto.note,
    }, userId);
  }

  @Patch(':installmentId/metadata')
  async updateMetadata(
    @Param('installmentId') installmentId: string,
    @Body() dto: Record<string, any>,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.updateMetadata(installmentId, dto, userId);
  }

  @Post(':installmentId/partial-payment')
  async partialPayment(
    @Param('installmentId') installmentId: string,
    @Body() dto: { amount: number; paymentReference: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.handlePartialPayment(installmentId, dto.amount, dto.paymentReference, userId);
  }
}

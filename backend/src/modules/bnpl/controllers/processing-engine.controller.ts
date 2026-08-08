import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ProcessingEngineService } from '../services/processing-engine.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';

@Controller('api/v1/bnpl/processing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.BNPL_MANAGER, Role.BUSINESS_MANAGER, Role.SUPER_ADMIN)
export class ProcessingEngineController {
  constructor(private readonly service: ProcessingEngineService) {}

  @Post(':subscriptionId/payment-intent')
  async createPaymentIntent(
    @Param('subscriptionId') subscriptionId: string,
    @Body('idempotencyKey') idempotencyKey?: string,
  ) {
    return this.service.createPaymentIntent(subscriptionId, idempotencyKey);
  }

  @Post(':subscriptionId/disburse')
  async disburse(
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: { disbursementReference: string; idempotencyKey?: string },
  ) {
    return this.service.executeDisbursement(subscriptionId, dto.disbursementReference, dto.idempotencyKey);
  }

  @Get(':subscriptionId/steps')
  async getSteps(@Param('subscriptionId') subscriptionId: string) {
    return this.service.getProcessingSteps(subscriptionId);
  }

  @Post('steps/:stepId/retry')
  async retryStep(@Param('stepId') stepId: string) {
    return this.service.retryStep(stepId);
  }
}

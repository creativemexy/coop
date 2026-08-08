import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaymentProvider } from '../../common/enums/status.enum';
import { SkipCsrf } from '../../common/guards/csrf.guard';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INDIVIDUAL)
  async initiate(
    @Body()
    dto: {
      subscriptionId?: string;
      amount: number;
      provider?: PaymentProvider;
      purpose?: string;
      callbackUrl?: string;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.initiate({
      userId,
      subscriptionId: dto.subscriptionId,
      amount: dto.amount,
      provider: dto.provider || PaymentProvider.PAYSTACK,
      purpose: dto.purpose,
      callbackUrl: dto.callbackUrl,
    });
  }

  @Post('initiate-registration')
  @SkipCsrf()
  async initiateRegistration(
    @Body()
    dto: {
      userId: string;
      amount: number;
      callbackUrl?: string;
    },
  ) {
    return this.service.initiate({
      userId: dto.userId,
      amount: dto.amount,
      provider: PaymentProvider.PAYSTACK,
      purpose: 'registration',
      callbackUrl: dto.callbackUrl,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByUser(@CurrentUser('sub') userId: string) {
    return this.service.findByUser(userId);
  }

  @Get('verify/:reference')
  @SkipCsrf()
  async verify(@Param('reference') reference: string) {
    return this.service.verify(reference);
  }
}

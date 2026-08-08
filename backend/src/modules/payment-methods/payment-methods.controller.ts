import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaymentMethodType } from './entities/saved-payment-method.entity';

@Controller('api/v1/payment-methods')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get()
  @Roles(Role.INDIVIDUAL)
  findAll(@CurrentUser('sub') userId: string) {
    return this.service.findByUser(userId);
  }

  @Post()
  @Roles(Role.INDIVIDUAL)
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: {
      type: PaymentMethodType;
      provider: string;
      providerToken?: string;
      last4?: string;
      cardBrand?: string;
      expiryMonth?: string;
      expiryYear?: string;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
      isDefault?: boolean;
    },
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @Roles(Role.INDIVIDUAL)
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: { isDefault?: boolean },
  ) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  @Roles(Role.INDIVIDUAL)
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.remove(id, userId);
  }
}

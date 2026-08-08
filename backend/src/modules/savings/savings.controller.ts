import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SavingsService } from './savings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { KycGuard } from '../../common/guards/kyc.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('api/v1/savings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SavingsController {
  constructor(private readonly service: SavingsService) {}

  @Get()
  @Roles(Role.INDIVIDUAL)
  async getAccount(@CurrentUser('sub') userId: string) {
    const account = await this.service.getAccount(userId);
    const withdrawalsEnabled = await this.service.areWithdrawalsEnabled();
    return { ...account, withdrawalsEnabled };
  }

  @Get('transactions')
  @Roles(Role.INDIVIDUAL)
  async getTransactions(@CurrentUser('sub') userId: string) {
    return this.service.getTransactions(userId);
  }

  @Post('deposit')
  @Roles(Role.INDIVIDUAL)
  async deposit(
    @CurrentUser('sub') userId: string,
    @Body() dto: { amount: number; description?: string; type?: 'general' | 'goal' },
  ) {
    return this.service.deposit(userId, dto.amount, dto.description, dto.type);
  }

  @Post('withdraw')
  @UseGuards(KycGuard)
  @Roles(Role.INDIVIDUAL)
  async withdraw(
    @CurrentUser('sub') userId: string,
    @Body() dto: { amount: number; description?: string; type?: 'general' | 'goal' },
  ) {
    return this.service.withdraw(userId, dto.amount, dto.description, dto.type);
  }

  @Post('target')
  @Roles(Role.INDIVIDUAL)
  async setTarget(
    @CurrentUser('sub') userId: string,
    @Body() dto: { targetAmount: number },
  ) {
    return this.service.setTarget(userId, dto.targetAmount);
  }
}

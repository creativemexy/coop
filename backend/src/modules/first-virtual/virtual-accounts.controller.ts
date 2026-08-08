import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { VirtualAccountsService } from './virtual-accounts.service';
import { DepositType } from './entities/pending-deposit.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('api/v1/virtual-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VirtualAccountsController {
  constructor(private readonly service: VirtualAccountsService) {}

  @Get('me')
  @Roles(Role.INDIVIDUAL)
  async getMine(@CurrentUser('sub') userId: string) {
    const account = await this.service.getForUser(userId);
    if (!account) {
      return null;
    }
    return {
      id: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      bankName: account.bankName,
      status: account.status,
      provider: account.provider,
    };
  }

  @Post('deposits/initiate')
  @Roles(Role.INDIVIDUAL)
  async initiateDeposit(
    @CurrentUser('sub') userId: string,
    @Body() body: { amount: number; type?: DepositType },
  ) {
    const type = body.type === 'goal' ? 'goal' : 'general';
    if (body.amount === undefined || body.amount === null) {
      throw new BadRequestException('Amount is required');
    }
    const deposit = await this.service.initiateDeposit(
      userId,
      body.amount,
      type,
    );
    return this.toDto(deposit);
  }

  @Get('deposits/latest')
  @Roles(Role.INDIVIDUAL)
  async getLatestDeposit(@CurrentUser('sub') userId: string) {
    const deposit = await this.service.findMyPending(userId);
    if (!deposit) {
      return null;
    }
    return this.toDto(deposit);
  }

  @Post('deposits/:id/verify')
  @Roles(Role.INDIVIDUAL)
  async verifyDeposit(
    @CurrentUser('sub') userId: string,
    @Param('id') depositId: string,
  ) {
    const deposit = await this.service.verifyDeposit(userId, depositId);
    return this.toDto(deposit);
  }

  @Post('loan-repayments/:repaymentId/initiate')
  @Roles(Role.INDIVIDUAL)
  async initiateLoanRepayment(
    @CurrentUser('sub') userId: string,
    @Param('repaymentId') repaymentId: string,
  ) {
    const pending = await this.service.initiateLoanRepayment(
      userId,
      repaymentId,
    );
    return this.toDto(pending);
  }

  @Get('loan-repayments/:repaymentId')
  @Roles(Role.INDIVIDUAL)
  async getLoanRepaymentInstruction(
    @CurrentUser('sub') userId: string,
    @Param('repaymentId') repaymentId: string,
  ) {
    const pending = await this.service.findLoanRepaymentInstruction(
      userId,
      repaymentId,
    );
    return pending ? this.toDto(pending) : null;
  }

  @Post('loan-repayments/:repaymentId/verify')
  @Roles(Role.INDIVIDUAL)
  async verifyLoanRepayment(
    @CurrentUser('sub') userId: string,
    @Param('repaymentId') repaymentId: string,
  ) {
    const pending = await this.service.verifyLoanRepayment(
      userId,
      repaymentId,
    );
    return this.toDto(pending);
  }

  private toDto(deposit: {
    id: string;
    amount: number;
    type: DepositType;
    reference: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    status: string;
    expiresAt: Date | null;
    creditedAt: Date | null;
    createdAt: Date | null;
  }) {
    return {
      id: deposit.id,
      amount: Number(deposit.amount),
      type: deposit.type,
      reference: deposit.reference,
      accountNumber: deposit.accountNumber,
      accountName: deposit.accountName,
      bankName: deposit.bankName,
      status: deposit.status,
      expiresAt: deposit.expiresAt,
      creditedAt: deposit.creditedAt,
    };
  }
}

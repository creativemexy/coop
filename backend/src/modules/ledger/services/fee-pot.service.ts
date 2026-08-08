import { Injectable } from '@nestjs/common';
import { FeeShareService } from './fee-share.service';
import { FeeWithdrawalRequest } from '../entities/fee-withdrawal-request.entity';

@Injectable()
export class FeePotService {
  constructor(private readonly feeShareService: FeeShareService) {}

  async getPots() {
    return this.feeShareService.getPots();
  }

  async listBanks() {
    return this.feeShareService.listBanks();
  }

  async getFeeShareLedger() {
    return this.feeShareService.getFeeShareLedger();
  }

  async getScopedFeeSummary(ctx: { organizationId?: string; apexOrgId?: string }) {
    return this.feeShareService.getScopedFeeSummary(ctx);
  }

  async withdrawShare(ctx: { userId: string; role: string; organizationId?: string; apexOrgId?: string }) {
    return this.feeShareService.withdrawShare(ctx);
  }

  async withdrawAdmin(dto: { accountNumber: string; bankCode: string; bankName: string; userId: string }) {
    return this.feeShareService.withdrawAdmin(dto);
  }

  async requestPlatformWithdrawal(
    userId: string,
    dto?: { accountNumber?: string; bankCode?: string; bankName?: string },
  ) {
    return this.feeShareService.requestPlatformWithdrawal(userId, dto);
  }

  async getWithdrawalRequests(): Promise<FeeWithdrawalRequest[]> {
    return this.feeShareService.getWithdrawalRequests();
  }

  async approveWithdrawal(
    id: string,
    approvedBy: string,
    dto?: { accountNumber?: string; bankCode?: string; bankName?: string },
  ) {
    return this.feeShareService.approveWithdrawal(id, approvedBy, dto);
  }

  async rejectWithdrawal(id: string) {
    return this.feeShareService.rejectWithdrawal(id);
  }
}

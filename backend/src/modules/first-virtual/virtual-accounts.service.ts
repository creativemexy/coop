import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { VirtualAccount } from './entities/virtual-account.entity';
import { PendingDeposit, DepositType } from './entities/pending-deposit.entity';
import {
  FirstCheckoutClient,
  DepositNotificationData,
} from './firstcheckout.client';
import { SavingsService } from '../savings/savings.service';
import { LoansService } from '../loans/loans.service';
import { RiskService } from '../../common/risk.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

const DEPOSIT_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class VirtualAccountsService {
  private readonly logger = new Logger(VirtualAccountsService.name);
  private readonly inFlight = new Map<string, Promise<VirtualAccount | null>>();

  constructor(
    @InjectRepository(VirtualAccount)
    private readonly accountRepo: Repository<VirtualAccount>,
    @InjectRepository(PendingDeposit)
    private readonly pendingRepo: Repository<PendingDeposit>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly client: FirstCheckoutClient,
    private readonly savingsService: SavingsService,
    private readonly loansService: LoansService,
    private readonly configService: ConfigService,
    private readonly riskService: RiskService,
  ) {}

  async getForUser(userId: string): Promise<VirtualAccount | null> {
    const existing = await this.accountRepo.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    return this.provisionForUser(userId);
  }

  provisionForUser(userId: string): Promise<VirtualAccount | null> {
    const running = this.inFlight.get(userId);
    if (running) {
      return running;
    }
    const promise = this.doProvision(userId);
    this.inFlight.set(userId, promise);
    void promise.finally(() => this.inFlight.delete(userId));
    return promise;
  }

  private async doProvision(userId: string): Promise<VirtualAccount | null> {
    const existing = await this.accountRepo.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== Role.INDIVIDUAL) {
      return null;
    }

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      'Coop Member';
    const reference = `FCO-${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 8)}`.toUpperCase();
    const initAmount = this.configService.get<number>(
      'FIRST_BANKOUT_VA_INIT_AMOUNT',
      5000,
    );

    try {
      const tx = await this.client.initiateTransaction({
        reference,
        amount: initAmount,
        email: user.email || '',
        name,
        purpose: 'Virtual account provisioning',
      });
      const draft = await this.client.initiatePayWithTransfer({
        transactionReference: tx.accessCode,
      });

      const account = this.accountRepo.create({
        userId,
        provider: 'firstcheckout',
        accountNumber: draft.accountNumber,
        accountName: draft.accountName || name,
        bankName: draft.bankName || 'First Bank',
        bankReference: tx.accessCode,
        token: draft.token || null,
        status: 'active',
      });
      const saved = await this.accountRepo.save(account);

      this.logger.log(
        `Provisioned virtual account ${saved.accountNumber} for user ${userId}`,
      );
      return saved;
    } catch (error: unknown) {
      this.logger.error(
        `Virtual account provisioning failed for ${userId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return null;
    }
  }

  /**
   * Called by the FirstCheckout / Interswitch virtual-account deposit callback.
   * Idempotent by requestReference — safe to retry.
   *
   * A credit is ONLY recorded against an existing pending_deposits instruction
   * and ONLY after the gateway confirms the transfer. Callbacks with no
   * matching pending instruction are never credited (no fallback path).
   */
  async handleDepositNotification(payload: DepositNotificationData): Promise<{
    status:
      | 'processed'
      | 'duplicate'
      | 'unknown_account'
      | 'invalid_amount'
      | 'ignored';
    creditedAmount?: number;
  }> {
    const accountNumber = payload.recipientAccountNumber;
    const reference = payload.requestReference;

    if (!accountNumber || !reference || !payload.amount) {
      return { status: 'ignored' };
    }

    const divisor =
      Number(
        this.configService.get<string>('FIRST_BANKOUT_AMOUNT_DIVISOR', '1'),
      ) || 1;
    const amount = Number(payload.amount) / divisor;

    if (!Number.isFinite(amount) || amount <= 0) {
      this.logger.warn(
        `Ignoring deposit with invalid amount: ${payload.amount}`,
      );
      return { status: 'invalid_amount' };
    }

    const pending = await this.pendingRepo.findOne({
      where: { accountNumber },
    });
    if (pending) {
      return this.creditPendingDeposit(pending, reference, amount);
    }

    this.logger.warn(
      `Deposit notification for ${accountNumber} (${reference}) has no pending instruction — cannot verify, not crediting`,
    );
    return { status: 'ignored' };
  }

  /**
   * Shared verification gate. No credit / repayment is ever recorded unless the
   * gateway confirms the transfer. When FirstCheckout is not configured
   * (stub mode), the query is intentionally BLOCKED so nothing is marked as
   * paid before real gateway keys are set.
   */
  private async confirmInstruction(
    pending: PendingDeposit,
  ): Promise<{ confirmed: boolean; amount?: number }> {
    try {
      if (this.client.isStubbed()) {
        const res = await this.client.queryTransaction(pending.reference);
        return { confirmed: res.status === 'SUCCESS' };
      }
      const res = await this.client.confirmPayWithTransfer({
        reference: pending.bankReference ?? pending.reference,
        accountNumber: pending.accountNumber,
        token: pending.token ?? undefined,
      });
      return {
        confirmed: res.paymentStatus === 'SUCCESSFUL',
        amount: res.amount ? Number(res.amount) : undefined,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Verification failed for ${pending.reference}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return { confirmed: false };
    }
  }

  private async creditPendingDeposit(
    pending: PendingDeposit,
    reference: string,
    amount: number,
  ): Promise<{ status: 'processed' | 'duplicate' | 'ignored'; creditedAmount?: number }> {
    if (pending.status !== 'pending') {
      return { status: 'duplicate' };
    }

    // Never record a credit/repayment from a callback alone — confirm the
    // transfer with FirstCheckout first.
    const { confirmed, amount: confirmedAmount } = await this.confirmInstruction(pending);
    if (!confirmed) {
      this.logger.log(
        `Ignoring ${pending.type} notification for ${pending.reference} — transfer not confirmed`,
      );
      return { status: 'ignored' };
    }

    if (pending.type === 'loan') {
      if (!pending.loanRepaymentId) {
        return { status: 'duplicate' };
      }
      const expected = Number(pending.amount);
      const received = confirmedAmount ?? amount;
      if (Math.abs(received - expected) / expected > 0.02) {
        this.logger.warn(
          `Loan payment ${pending.reference} amount mismatch: expected ₦${expected}, received ₦${received} — not crediting`,
        );
        return { status: 'ignored' };
      }
      await this.loansService.markRepaymentPaid(pending.userId, pending.loanRepaymentId);
      await this.pendingRepo.update(pending.id, {
        status: 'credited',
        bankReference: reference,
        creditedAt: new Date(),
      });
      this.logger.log(
        `Confirmed loan repayment ₦${expected} (${pending.reference}, ${reference}) for user ${pending.userId}`,
      );
      return { status: 'processed', creditedAmount: expected };
    }

    const credited = await this.savingsService.applyExternalDeposit(
      pending.userId,
      amount,
      `Bank transfer credit via virtual account — ${reference}`,
      reference,
      pending.type,
    );
    if (!credited) {
      return { status: 'duplicate' };
    }

    await this.pendingRepo.update(pending.id, {
      status: 'credited',
      bankReference: reference,
      creditedAt: new Date(),
    });
    this.logger.log(
      `Credited ₦${amount} to ${pending.type} savings for user ${pending.userId} from pending deposit ${pending.reference} (${reference})`,
    );
    return { status: 'processed', creditedAmount: amount };
  }

  /**
   * Issue a bank-transfer deposit instruction for savings. The deposit is NOT
   * credited here — it stays `pending` until `verifyDeposit` confirms the
   * transfer with FirstCheckout (or the virtual-account webhook fires).
   */
  async initiateDeposit(
    userId: string,
    amountParam: number,
    type: DepositType = 'general',
  ): Promise<PendingDeposit> {
    const amount = Number(amountParam);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const minCheck = await this.riskService.checkMin(
      'min_deposit_amount',
      amount,
    );
    if (minCheck && !minCheck.allowed) {
      throw new BadRequestException(
        `Minimum deposit is ₦${minCheck.min.toLocaleString()}`,
      );
    }
    const maxCheck = await this.riskService.checkMinMax(
      'max_single_deposit',
      amount,
    );
    if (maxCheck && !maxCheck.allowed) {
      throw new BadRequestException(
        `Maximum single deposit is ₦${maxCheck.limit.toLocaleString()}`,
      );
    }

    await this.pendingRepo.update(
      { userId, status: 'pending' as const },
      { status: 'expired' },
    );

    const active = await this.pendingRepo.findOne({
      where: {
        userId,
        status: 'pending',
        expiresAt: MoreThan(new Date()),
      },
    });
    if (active) {
      return active;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== Role.INDIVIDUAL) {
      throw new BadRequestException('Only individual members can save');
    }

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      'Coop Member';
    const reference = `FCSV-${crypto.randomUUID().replace(/-/g, '').slice(0, 26).toUpperCase()}`;

    const va = await this.client.createDepositVirtualAccount({
      reference,
      amount,
      email: user.email || '',
      name,
      purpose: `Savings ${type} deposit`,
    });

    const pending = this.pendingRepo.create({
      userId,
      amount,
      type,
      reference,
      accountNumber: va.accountNumber,
      accountName: va.accountName || name,
      bankName: va.bankName || 'First Bank',
      bankReference: va.accessCode,
      token: va.token || null,
      status: 'pending',
      expiresAt: new Date(Date.now() + DEPOSIT_TTL_MS),
    });
    const saved = await this.pendingRepo.save(pending);
    this.logger.log(
      `Issued ${type} deposit instruction ${saved.reference} (₦${amount}) for user ${userId} on account ${saved.accountNumber} — awaiting verification`,
    );

    return saved;
  }

  /**
   * Verify a pending deposit against FirstCheckout and — only if the transfer
   * is confirmed — record the credit. Never records an unverified transaction.
   * Never double-credits (idempotent on the deposit reference).
   */
  async verifyDeposit(
    userId: string,
    depositId: string,
  ): Promise<PendingDeposit> {
    const deposit = await this.pendingRepo.findOne({
      where: { id: depositId },
    });
    if (!deposit || deposit.userId !== userId) {
      throw new NotFoundException('Deposit not found');
    }
    if (deposit.status !== 'pending') {
      return deposit;
    }
    if (deposit.expiresAt && deposit.expiresAt < new Date()) {
      await this.pendingRepo.update(deposit.id, { status: 'expired' });
      deposit.status = 'expired';
      return deposit;
    }

    const { confirmed, amount: confirmedAmount } =
      await this.confirmInstruction(deposit);
    const amount = confirmedAmount ?? Number(deposit.amount);

    if (!confirmed) {
      this.logger.log(
        `Deposit ${deposit.reference} is pending — transfer not yet confirmed, no credit recorded`,
      );
      return deposit;
    }

    const credited = await this.savingsService.applyExternalDeposit(
      deposit.userId,
      amount,
      `Bank transfer credit via virtual account — ${deposit.reference}`,
      deposit.reference,
      deposit.type === 'loan' ? 'general' : deposit.type,
    );
    if (!credited) {
      return deposit;
    }

    await this.pendingRepo.update(deposit.id, {
      status: 'credited',
      bankReference: deposit.reference,
      creditedAt: new Date(),
    });
    this.logger.log(
      `Verified + credited ₦${amount} to ${deposit.type} savings for user ${deposit.userId} (${deposit.reference})`,
    );

    return this.pendingRepo.findOne({
      where: { id: deposit.id },
    }) as Promise<PendingDeposit>;
  }

  /** Latest active (or recently credited) deposit for the member. */
  async findMyPending(userId: string): Promise<PendingDeposit | null> {
    return this.pendingRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Issue a bank-transfer loan-repayment instruction via FirstCheckout.
   * The repayment is NOT recorded here — it stays `pending` until
   * `verifyLoanRepayment` confirms the transfer (or the webhook fires).
   */
  async initiateLoanRepayment(
    userId: string,
    repaymentId: string,
  ): Promise<PendingDeposit> {
    const repayment = await this.loansService.getRepaymentForPayment(
      userId,
      repaymentId,
    );
    if (!repayment) {
      throw new BadRequestException('Repayment is not payable');
    }

    const amount = Number(repayment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid repayment amount');
    }

    const active = await this.pendingRepo.findOne({
      where: {
        userId,
        type: 'loan' as const,
        loanRepaymentId: repaymentId,
        status: 'pending',
        expiresAt: MoreThan(new Date()),
      },
    });
    if (active) {
      return active;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== Role.INDIVIDUAL) {
      throw new BadRequestException('Only individual members can repay loans');
    }

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      'Coop Member';
    const reference = `FCLN-${crypto.randomUUID()
      .replace(/-/g, '')
      .slice(0, 26)
      .toUpperCase()}`;

    const va = await this.client.createDepositVirtualAccount({
      reference,
      amount,
      email: user.email || '',
      name,
      purpose: 'Loan repayment',
    });

    const pending = this.pendingRepo.create({
      userId,
      amount,
      type: 'loan' as DepositType,
      loanRepaymentId: repaymentId,
      reference,
      accountNumber: va.accountNumber,
      accountName: va.accountName || name,
      bankName: va.bankName || 'First Bank',
      bankReference: va.accessCode,
      token: va.token || null,
      status: 'pending',
      expiresAt: new Date(Date.now() + DEPOSIT_TTL_MS),
    });
    const saved = await this.pendingRepo.save(pending);
    this.logger.log(
      `Issued loan repayment instruction ${saved.reference} (₦${amount}) for user ${userId} on account ${saved.accountNumber}`,
    );
    return saved;
  }

  /** Latest instruction (incl. status) for a loan repayment. */
  async findLoanRepaymentInstruction(
    userId: string,
    repaymentId: string,
  ): Promise<PendingDeposit | null> {
    return this.pendingRepo.findOne({
      where: {
        userId,
        loanRepaymentId: repaymentId,
        type: 'loan' as const,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Confirm a loan repayment with FirstCheckout and — only if the transfer is
   * confirmed — record the repayment. Never marks paid without verification.
   * Idempotent (never double-pays a repayment).
   */
  async verifyLoanRepayment(
    userId: string,
    repaymentId: string,
  ): Promise<PendingDeposit> {
    const pending = await this.findLoanRepaymentInstruction(userId, repaymentId);
    if (!pending) {
      throw new NotFoundException('Payment instruction not found');
    }
    if (pending.status !== 'pending') {
      return pending;
    }
    if (pending.expiresAt && pending.expiresAt < new Date()) {
      await this.pendingRepo.update(pending.id, { status: 'expired' });
      pending.status = 'expired';
      return pending;
    }

    const { confirmed, amount: confirmedAmount } =
      await this.confirmInstruction(pending);

    if (!confirmed) {
      this.logger.log(
        `Loan payment ${pending.reference} is pending — transfer not yet confirmed, not marked paid`,
      );
      return pending;
    }

    const expected = Number(pending.amount);
    const received = confirmedAmount ?? expected;
    if (Math.abs(received - expected) / expected > 0.02) {
      this.logger.warn(
        `Loan payment ${pending.reference} amount mismatch: expected ₦${expected}, confirmed ₦${received} — not marking paid`,
      );
      return pending;
    }

    const { paid } = await this.loansService.markRepaymentPaid(
      userId,
      repaymentId,
    );
    if (!paid) {
      await this.pendingRepo.update(pending.id, { status: 'credited' });
      pending.status = 'credited';
      return pending;
    }

    await this.pendingRepo.update(pending.id, {
      status: 'credited',
      bankReference: pending.reference,
      creditedAt: new Date(),
    });
    this.logger.log(
      `Verified + recorded loan repayment for ${userId} (${pending.reference})`,
    );

    return this.findLoanRepaymentInstruction(userId, repaymentId) as Promise<PendingDeposit>;
  }
}

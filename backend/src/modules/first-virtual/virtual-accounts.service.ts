import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { PendingDeposit, DepositType } from './entities/pending-deposit.entity';
import {
  FirstCheckoutClient,
  DepositNotificationData,
} from './firstcheckout.client';
import { SavingsService } from '../savings/savings.service';
import { LoansService } from '../loans/loans.service';
import { InvestmentsService } from '../investments/investments.service';
import { RiskService } from '../../common/risk.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';

const DEPOSIT_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class VirtualAccountsService {
  private readonly logger = new Logger(VirtualAccountsService.name);
  /** Last unconfirmed reason logged per reference, to avoid 5s poll spam. */
  private readonly lastPendingReason = new Map<string, string>();

  constructor(
    @InjectRepository(PendingDeposit)
    private readonly pendingRepo: Repository<PendingDeposit>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly client: FirstCheckoutClient,
    private readonly savingsService: SavingsService,
    private readonly loansService: LoansService,
    private readonly investmentsService: InvestmentsService,
    private readonly configService: ConfigService,
    private readonly riskService: RiskService,
    private readonly notifications: NotificationsService,
  ) {}

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
  ): Promise<{ confirmed: boolean; amount?: number; reason?: string }> {
    const txReference = pending.bankReference ?? pending.reference;
    try {
      if (this.client.isStubbed()) {
        const res = await this.client.queryTransaction(pending.reference);
        return { confirmed: res.status === 'SUCCESS', reason: res.status };
      }
      const res = await this.client.confirmPayWithTransfer({
        reference: txReference,
        accountNumber: pending.accountNumber,
        token: pending.token ?? undefined,
      });
      if (res.confirmed) {
        return {
          confirmed: true,
          amount: res.amount ? Number(res.amount) : undefined,
        };
      }

      // Confirm-payment only reports a completed transfer; the documented
      // Query Transaction endpoint is the gateway's authoritative status.
      const query = await this.client
        .queryTransaction(txReference)
        .catch(() => null);
      const queryStatus = query?.status?.toUpperCase();
      if (queryStatus === 'SUCCESS') {
        // Credit the instructed amount — the transaction was initiated for it.
        return { confirmed: true };
      }

      const reason = [
        res.paymentStatus,
        res.message,
        queryStatus ? `transaction status ${queryStatus}` : undefined,
      ]
        .filter(Boolean)
        .join(' — ');
      return { confirmed: false, reason: reason || undefined };
    } catch (error: unknown) {
      const detail = this.gatewayErrorDetail(error);
      this.logger.warn(
        `Verification failed for ${pending.reference}: ${detail}`,
      );
      return { confirmed: false, reason: `verification error: ${detail}` };
    }
  }

  private gatewayErrorDetail(error: unknown): string {
    const e = error as {
      message?: string;
      response?: { status?: number; data?: { message?: string } | string };
    };
    const body = e?.response?.data;
    const bodyMessage = typeof body === 'string' ? body : body?.message;
    return (
      [e?.response?.status, bodyMessage ?? e?.message]
        .filter(Boolean)
        .join(' ') || 'unknown error'
    );
  }

  /** Log an unconfirmed poll at LOG level only when the gateway's answer changes. */
  private logUnconfirmed(
    reference: string,
    message: string,
    reason?: string,
  ): void {
    const key = reason ?? 'no gateway detail';
    const line = `${message} (gateway: ${key})`;
    if (this.lastPendingReason.get(reference) === key) {
      this.logger.debug(line);
      return;
    }
    this.lastPendingReason.set(reference, key);
    this.logger.log(line);
  }

  private async creditPendingDeposit(
    pending: PendingDeposit,
    reference: string,
    amount: number,
  ): Promise<{
    status: 'processed' | 'duplicate' | 'ignored';
    creditedAmount?: number;
  }> {
    if (pending.status !== 'pending') {
      return { status: 'duplicate' };
    }

    // Never record a credit/repayment from a callback alone — confirm the
    // transfer with FirstCheckout first.
    const { confirmed, amount: confirmedAmount } =
      await this.confirmInstruction(pending);
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
      await this.loansService.markRepaymentPaid(
        pending.userId,
        pending.loanRepaymentId,
      );
      await this.pendingRepo.update(pending.id, {
        status: 'credited',
        bankReference: reference,
        creditedAt: new Date(),
      });
      this.logger.log(
        `Confirmed loan repayment ₦${expected} (${pending.reference}, ${reference}) for user ${pending.userId}`,
      );
      await this.notifications.create({
        userId: pending.userId,
        title: 'Loan repayment received',
        message: `Your loan repayment of ₦${Number(expected).toLocaleString()} was received and confirmed.`,
        type: 'success',
      });
      return { status: 'processed', creditedAmount: expected };
    }

    if (pending.type === 'investment') {
      if (!pending.investmentOrderId) {
        return { status: 'duplicate' };
      }
      const expected = Number(pending.amount);
      const received = confirmedAmount ?? amount;
      if (Math.abs(received - expected) / expected > 0.02) {
        this.logger.warn(
          `Investment payment ${pending.reference} amount mismatch: expected ₦${expected}, received ₦${received} — not crediting`,
        );
        return { status: 'ignored' };
      }
      await this.investmentsService.confirmPayment(
        pending.investmentOrderId,
        reference,
        reference,
      );
      await this.pendingRepo.update(pending.id, {
        status: 'credited',
        bankReference: reference,
        creditedAt: new Date(),
      });
      this.logger.log(
        `Confirmed investment order ${pending.investmentOrderId} for ₦${expected} (${pending.reference}, ${reference}) for user ${pending.userId}`,
      );
      await this.notifications.create({
        userId: pending.userId,
        title: 'Investment confirmed',
        message: `Your investment of ₦${Number(expected).toLocaleString()} was confirmed and allocated.`,
        type: 'success',
      });
      return { status: 'processed', creditedAmount: expected };
    }

    const credited = await this.savingsService.applyExternalDeposit(
      pending.userId,
      amount,
      'Bank transfer credit',
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
    await this.notifications.create({
      userId: pending.userId,
      title: 'Deposit credited',
      message: `₦${Number(amount).toLocaleString()} was credited to your ${pending.type === 'goal' ? 'goal savings' : 'savings'} account.`,
      type: 'success',
    });
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
      this.lastPendingReason.delete(deposit.reference);
      deposit.status = 'expired';
      return deposit;
    }

    const {
      confirmed,
      amount: confirmedAmount,
      reason,
    } = await this.confirmInstruction(deposit);
    const amount = confirmedAmount ?? Number(deposit.amount);

    if (!confirmed) {
      this.logUnconfirmed(
        deposit.reference,
        `Deposit ${deposit.reference} is pending — transfer not yet confirmed, no credit recorded`,
        reason,
      );
      return deposit;
    }
    this.lastPendingReason.delete(deposit.reference);

    const savingsType: 'general' | 'goal' | undefined =
      deposit.type === 'goal'
        ? 'goal'
        : deposit.type === 'general'
          ? 'general'
          : undefined;

    if (!savingsType) {
      this.logger.log(
        `Deposit ${deposit.reference} is not a savings deposit (${deposit.type}) — no balance credit`,
      );
      return deposit;
    }

    const credited = await this.savingsService.applyExternalDeposit(
      deposit.userId,
      amount,
      'Bank transfer credit',
      deposit.reference,
      savingsType,
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
    await this.notifications.create({
      userId: deposit.userId,
      title: 'Deposit credited',
      message: `₦${Number(amount).toLocaleString()} was credited to your ${deposit.type === 'goal' ? 'goal savings' : 'savings'} account.`,
      type: 'success',
    });

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
    const reference = `FCLN-${crypto
      .randomUUID()
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
    const pending = await this.findLoanRepaymentInstruction(
      userId,
      repaymentId,
    );
    if (!pending) {
      throw new NotFoundException('Payment instruction not found');
    }
    if (pending.status !== 'pending') {
      return pending;
    }
    if (pending.expiresAt && pending.expiresAt < new Date()) {
      await this.pendingRepo.update(pending.id, { status: 'expired' });
      this.lastPendingReason.delete(pending.reference);
      pending.status = 'expired';
      return pending;
    }

    const {
      confirmed,
      amount: confirmedAmount,
      reason,
    } = await this.confirmInstruction(pending);

    if (!confirmed) {
      this.logUnconfirmed(
        pending.reference,
        `Loan payment ${pending.reference} is pending — transfer not yet confirmed, not marked paid`,
        reason,
      );
      return pending;
    }
    this.lastPendingReason.delete(pending.reference);

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

    return this.findLoanRepaymentInstruction(
      userId,
      repaymentId,
    ) as Promise<PendingDeposit>;
  }

  /**
   * Issue a bank-transfer payment instruction for an investment order via
   * FirstCheckout. The order is NOT confirmed here — it stays `pending` until
   * `verifyInvestmentOrder` confirms the transfer (or the webhook fires).
   */
  async initiateInvestmentOrderPayment(
    userId: string,
    orderId: string,
  ): Promise<PendingDeposit> {
    const order = await this.investmentsService.getOrderForPayment(
      userId,
      orderId,
    );
    const amount = Number(order.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid order amount');
    }

    const active = await this.pendingRepo.findOne({
      where: {
        userId,
        type: 'investment' as const,
        investmentOrderId: orderId,
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
      throw new BadRequestException('Only individual members can invest');
    }

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      'Coop Member';
    const reference = `FCIN-${crypto
      .randomUUID()
      .replace(/-/g, '')
      .slice(0, 26)
      .toUpperCase()}`;

    const va = await this.client.createDepositVirtualAccount({
      reference,
      amount,
      email: user.email || '',
      name,
      purpose: 'Investment order payment',
    });

    const pending = this.pendingRepo.create({
      userId,
      amount,
      type: 'investment' as DepositType,
      investmentOrderId: orderId,
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
      `Issued investment payment instruction ${saved.reference} (₦${amount}) for order ${orderId} for user ${userId} on account ${saved.accountNumber}`,
    );
    return saved;
  }

  /** Latest instruction (incl. status) for an investment order. */
  async findInvestmentOrderInstruction(
    userId: string,
    orderId: string,
  ): Promise<PendingDeposit | null> {
    return this.pendingRepo.findOne({
      where: {
        userId,
        investmentOrderId: orderId,
        type: 'investment' as const,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Confirm an investment order payment with FirstCheckout and — only if the
   * transfer is confirmed — confirm the order (allocates the holding). Never
   * confirms without verification. Idempotent.
   */
  async verifyInvestmentOrder(
    userId: string,
    orderId: string,
  ): Promise<PendingDeposit> {
    const pending = await this.findInvestmentOrderInstruction(userId, orderId);
    if (!pending) {
      throw new NotFoundException('Payment instruction not found');
    }
    if (pending.status !== 'pending') {
      return pending;
    }
    if (pending.expiresAt && pending.expiresAt < new Date()) {
      await this.pendingRepo.update(pending.id, { status: 'expired' });
      this.lastPendingReason.delete(pending.reference);
      pending.status = 'expired';
      return pending;
    }

    const {
      confirmed,
      amount: confirmedAmount,
      reason,
    } = await this.confirmInstruction(pending);

    if (!confirmed) {
      this.logUnconfirmed(
        pending.reference,
        `Investment payment ${pending.reference} is pending — transfer not yet confirmed, order not confirmed`,
        reason,
      );
      return pending;
    }
    this.lastPendingReason.delete(pending.reference);

    const expected = Number(pending.amount);
    const received = confirmedAmount ?? expected;
    if (Math.abs(received - expected) / expected > 0.02) {
      this.logger.warn(
        `Investment payment ${pending.reference} amount mismatch: expected ₦${expected}, confirmed ₦${received} — not confirming`,
      );
      return pending;
    }

    await this.investmentsService.confirmPayment(
      orderId,
      pending.reference,
      pending.reference,
    );
    await this.pendingRepo.update(pending.id, {
      status: 'credited',
      bankReference: pending.reference,
      creditedAt: new Date(),
    });
    this.logger.log(
      `Verified + confirmed investment order ${orderId} for ${userId} (${pending.reference})`,
    );

    return this.findInvestmentOrderInstruction(
      userId,
      orderId,
    ) as Promise<PendingDeposit>;
  }
}

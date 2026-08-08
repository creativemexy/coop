import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentStatus, PayoutStatus, PaymentProvider } from '../../common/enums/status.enum';
import { PaystackClient } from './providers/paystack/paystack.client';
import { UsersService } from '../users/users.service';
import { RiskService } from '../../common/risk.service';
import { FeeShareService } from '../ledger/services/fee-share.service';
import { DoubleEntryService } from '../ledger/services/double-entry.service';
import { AccountsService } from '../ledger/services/accounts.service';
export declare class PaymentsService {
    private readonly repo;
    private readonly paystackClient;
    private readonly usersService;
    private readonly riskService;
    private readonly feeShareService;
    private readonly doubleEntryService;
    private readonly accountsService;
    private readonly logger;
    constructor(repo: Repository<Payment>, paystackClient: PaystackClient, usersService: UsersService, riskService: RiskService, feeShareService: FeeShareService, doubleEntryService: DoubleEntryService, accountsService: AccountsService);
    initiate(dto: {
        userId: string;
        subscriptionId?: string;
        amount: number;
        provider: PaymentProvider;
        purpose?: string;
        callbackUrl?: string;
    }): Promise<{
        payment: Payment;
        authorizationUrl?: string;
    }>;
    findByProviderReference(reference: string): Promise<Payment | null>;
    updateStatus(id: string, status: PaymentStatus, metadata?: Record<string, any>): Promise<Payment>;
    verify(reference: string): Promise<{
        status: string;
        payment?: Payment;
    }>;
    findByUser(userId: string): Promise<Payment[]>;
    updatePayoutStatus(id: string, payoutStatus: PayoutStatus, payoutReference?: string): Promise<void>;
    private recordRegistrationLedger;
}

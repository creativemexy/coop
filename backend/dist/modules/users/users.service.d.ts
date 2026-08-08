import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserActivity } from './entities/user-activity.entity';
import { Referral } from './entities/referral.entity';
import { Role } from '../../common/enums/role.enum';
import { LoginHistory } from '../auth/entities/login-history.entity';
import { DeviceSession } from '../auth/entities/device-session.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { Loan } from '../loans/entities/loan.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { Payment } from '../payments/entities/payment.entity';
import { KycSubmission } from '../kyc/entities/kyc-submission.entity';
import { InAppNotification } from '../notifications/entities/in-app-notification.entity';
import { SavedPaymentMethod } from '../payment-methods/entities/saved-payment-method.entity';
import { SupportTicket } from '../bnpl/entities/support-ticket.entity';
import { InvestmentHolding } from '../investments/entities/investment-holding.entity';
import { InvestmentOrder } from '../investments/entities/investment-order.entity';
import { RedemptionRequest } from '../investments/entities/redemption-request.entity';
import { DistributionPayment } from '../investments/entities/distribution-payment.entity';
import { AuditService } from '../../common/audit.service';
export declare class UsersService {
    private readonly userRepository;
    private readonly activityRepo;
    private readonly referralRepo;
    private readonly auditService;
    constructor(userRepository: Repository<User>, activityRepo: Repository<UserActivity>, referralRepo: Repository<Referral>, auditService: AuditService);
    findById(id: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findGlobalBusinessManager(): Promise<User>;
    findBySocial(provider: string, socialId: string): Promise<User | null>;
    createSocialUser(dto: {
        email: string;
        firstName: string;
        lastName: string;
        socialProvider: string;
        socialId: string;
    }): Promise<User>;
    createBusinessManager(dto: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
    }): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User>;
    listUsers(role?: Role, organizationId?: string, apexOrgId?: string, filters?: {
        kycStatus?: string;
        isActive?: boolean;
        search?: string;
    }): Promise<User[]>;
    search(query: string): Promise<{
        id: string;
        name: string;
        email: string;
    }[]>;
    generateReferralCode(userId: string): Promise<string>;
    getReferralStats(userId: string): Promise<{
        referralCode: string;
        referralCount: number;
        referralEarnings: number;
    }>;
    exportData(userId: string): Promise<{
        exportedAt: string;
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            role: Role;
            kycStatus: import("../../common/enums/status.enum").KycStatus;
            isActive: boolean;
            registrationFeePaid: boolean;
            referralCode: string;
            createdAt: Date;
        };
        activity: UserActivity[];
        referrals: Referral[];
        loginHistory: never[] | LoginHistory[];
        deviceSessions: never[] | DeviceSession[];
        bnplSubscriptions: never[] | BnplSubscription[];
        loans: never[] | Loan[];
        savings: never[] | SavingsAccount[];
        payments: never[] | Payment[];
        kycSubmissions: never[] | KycSubmission[];
        notifications: never[] | InAppNotification[];
        savedPaymentMethods: never[] | SavedPaymentMethod[];
        supportTickets: never[] | SupportTicket[];
        investments: {
            holdings: never[] | InvestmentHolding[];
            orders: never[] | InvestmentOrder[];
            redemptions: never[] | RedemptionRequest[];
            distributionPayments: never[] | DistributionPayment[];
        };
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
}

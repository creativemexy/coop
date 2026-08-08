import { UsersService } from './users.service';
import { ReferralsService } from './referrals.service';
import { UserActivityService } from './user-activity.service';
import { Role } from '../../common/enums/role.enum';
import { KycStatus } from '../../common/enums/status.enum';
export declare class UsersController {
    private readonly usersService;
    private readonly referralsService;
    private readonly activityService;
    constructor(usersService: UsersService, referralsService: ReferralsService, activityService: UserActivityService);
    getMe(userId: string): Promise<import("./entities/user.entity").User>;
    updateMe(userId: string, updates: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        notificationPreferences?: {
            email?: boolean;
            sms?: boolean;
            inApp?: boolean;
        };
    }): Promise<import("./entities/user.entity").User>;
    listUsers(role?: Role, organizationId?: string, kycStatus?: string, isActive?: string, search?: string, user?: any): Promise<import("./entities/user.entity").User[]>;
    getUser(id: string, user?: any): Promise<import("./entities/user.entity").User>;
    updateUser(id: string, updates: {
        role?: Role;
        isActive?: boolean;
        firstName?: string;
        lastName?: string;
        kycStatus?: KycStatus;
    }): Promise<import("./entities/user.entity").User>;
    deleteAccount(userId: string): Promise<{
        message: string;
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
            kycStatus: KycStatus;
            isActive: boolean;
            registrationFeePaid: boolean;
            referralCode: string;
            createdAt: Date;
        };
        activity: import("./entities/user-activity.entity").UserActivity[];
        referrals: import("./entities/referral.entity").Referral[];
        loginHistory: never[] | import("../auth/entities/login-history.entity").LoginHistory[];
        deviceSessions: never[] | import("../auth/entities/device-session.entity").DeviceSession[];
        bnplSubscriptions: never[] | import("../bnpl/entities/bnpl-subscription.entity").BnplSubscription[];
        loans: never[] | import("../loans/entities/loan.entity").Loan[];
        savings: never[] | import("../savings/entities/savings-account.entity").SavingsAccount[];
        payments: never[] | import("../payments/entities/payment.entity").Payment[];
        kycSubmissions: never[] | import("../kyc/entities/kyc-submission.entity").KycSubmission[];
        notifications: never[] | import("../notifications/entities/in-app-notification.entity").InAppNotification[];
        savedPaymentMethods: never[] | import("../payment-methods/entities/saved-payment-method.entity").SavedPaymentMethod[];
        supportTickets: never[] | import("../bnpl/entities/support-ticket.entity").SupportTicket[];
        investments: {
            holdings: never[] | import("../investments/entities/investment-holding.entity").InvestmentHolding[];
            orders: never[] | import("../investments/entities/investment-order.entity").InvestmentOrder[];
            redemptions: never[] | import("../investments/entities/redemption-request.entity").RedemptionRequest[];
            distributionPayments: never[] | import("../investments/entities/distribution-payment.entity").DistributionPayment[];
        };
    }>;
    getReferralCode(userId: string): Promise<{
        referralCode: string;
    }>;
    getReferralStats(userId: string): Promise<{
        referralCode: string;
        referralCount: number;
        referralEarnings: number;
    }>;
    getMyReferrals(userId: string): Promise<{
        sent: import("./entities/referral.entity").Referral[];
        received: import("./entities/referral.entity").Referral[];
    }>;
    createReferral(userId: string, dto: {
        refereeEmail: string;
    }): Promise<import("./entities/referral.entity").Referral>;
    getActivity(userId: string, limit?: string, offset?: string): Promise<{
        data: import("./entities/user-activity.entity").UserActivity[];
        total: number;
    }>;
}

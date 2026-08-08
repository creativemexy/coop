export declare enum ReferralStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    EXPIRED = "expired"
}
export declare class Referral {
    id: string;
    referrerId: string;
    refereeId: string;
    refereeEmail: string;
    referralCode: string;
    status: ReferralStatus;
    rewardAmount: number;
    rewardPaid: boolean;
    createdAt: Date;
    updatedAt: Date;
}

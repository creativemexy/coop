import { Distribution } from './distribution.entity';
export declare class DistributionPayment {
    id: string;
    userId: string;
    holdingId: string;
    distributionId: string;
    distribution: Distribution;
    amount: number;
    unitsAtRecord: number;
    isPaid: boolean;
    paidAt: Date | null;
    createdAt: Date;
}

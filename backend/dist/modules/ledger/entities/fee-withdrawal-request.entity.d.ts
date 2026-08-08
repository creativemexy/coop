import { PayoutStatus } from '../../../common/enums/status.enum';
import { PotType } from '../../../common/enums/status.enum';
export declare class FeeWithdrawalRequest {
    id: string;
    potType: PotType;
    amount: number;
    status: PayoutStatus;
    requestedBy: string;
    approvedBy?: string;
    accountNumber?: string;
    bankCode?: string;
    bankName?: string;
    note?: string;
    paystackReference?: string;
    createdAt: Date;
    updatedAt: Date;
}

import { PotType } from '../../../common/enums/status.enum';
export declare class FeePot {
    id: string;
    potType: PotType;
    entityId: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

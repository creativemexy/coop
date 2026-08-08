import { AccountType } from '../../../common/enums/status.enum';
export declare class Account {
    id: string;
    code: string;
    name: string;
    description: string;
    type: AccountType;
    organizationId: string;
    isSystem: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

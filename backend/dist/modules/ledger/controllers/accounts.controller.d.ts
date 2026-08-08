import { AccountsService } from '../services/accounts.service';
import { AccountType } from '../../../common/enums/status.enum';
export declare class AccountsController {
    private readonly service;
    constructor(service: AccountsService);
    create(dto: {
        code: string;
        name: string;
        type: AccountType;
        description?: string;
        organizationId?: string;
    }): Promise<import("../entities/account.entity").Account>;
    findAll(): Promise<import("../entities/account.entity").Account[]>;
    findById(id: string): Promise<import("../entities/account.entity").Account>;
    update(id: string, dto: {
        code?: string;
        name?: string;
        type?: AccountType;
        description?: string;
        isActive?: boolean;
    }): Promise<import("../entities/account.entity").Account>;
}

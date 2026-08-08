import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { AccountType } from '../../../common/enums/status.enum';
export declare class AccountsService {
    private readonly repo;
    constructor(repo: Repository<Account>);
    create(dto: {
        code: string;
        name: string;
        type: AccountType;
        description?: string;
        organizationId?: string;
    }): Promise<Account>;
    findAll(organizationId?: string): Promise<Account[]>;
    findById(id: string): Promise<Account>;
    findByCode(code: string): Promise<Account | null>;
    update(id: string, dto: {
        code?: string;
        name?: string;
        type?: AccountType;
        description?: string;
        isActive?: boolean;
    }): Promise<Account>;
}

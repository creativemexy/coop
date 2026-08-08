import { ApexOrganizationsService } from './apex-organizations.service';
import { OrgStatus } from '../../common/enums/status.enum';
export declare class ApexOrganizationsController {
    private readonly service;
    constructor(service: ApexOrganizationsService);
    resolveBankAccount(accountNumber: string, bankCode: string): Promise<{
        resolved: boolean;
        message: string;
        accountName?: undefined;
        accountNumber?: undefined;
    } | {
        resolved: boolean;
        accountName: string;
        accountNumber: string;
        message?: undefined;
    }>;
    create(dto: {
        name: string;
        address?: string;
        contactEmail?: string;
        contactPhone?: string;
        contactPersonName?: string;
        contactPersonPhone?: string;
        contactPersonEmail?: string;
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        sortCode?: string;
        bankCode?: string;
    }, userId: string): Promise<import("./entities/apex-organization.entity").ApexOrganization & {
        generatedEmail?: string;
        generatedPassword?: string;
    }>;
    findAll(): Promise<import("./entities/apex-organization.entity").ApexOrganization[]>;
    findById(id: string): Promise<import("./entities/apex-organization.entity").ApexOrganization>;
    update(id: string, dto: {
        name?: string;
        status?: OrgStatus;
        address?: string;
        contactEmail?: string;
        contactPhone?: string;
        contactPersonName?: string;
        contactPersonPhone?: string;
        contactPersonEmail?: string;
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        sortCode?: string;
        bankCode?: string;
    }): Promise<import("./entities/apex-organization.entity").ApexOrganization>;
}

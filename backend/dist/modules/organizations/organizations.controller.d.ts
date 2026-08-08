import { OrganizationsService } from './organizations.service';
import { OrgStatus } from '../../common/enums/status.enum';
export declare class OrganizationsController {
    private readonly service;
    constructor(service: OrganizationsService);
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
        apexOrgId: string;
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
    }, userId: string): Promise<import("./entities/organization.entity").Organization & {
        generatedEmail?: string;
        generatedPassword?: string;
    }>;
    findAll(apexOrgId?: string): Promise<import("./entities/organization.entity").Organization[]>;
    findById(id: string): Promise<import("./entities/organization.entity").Organization>;
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
    }): Promise<import("./entities/organization.entity").Organization>;
}

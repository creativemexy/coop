import { Repository } from 'typeorm';
import { ApexOrganization } from './entities/apex-organization.entity';
import { OrgStatus } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { PaystackClient } from '../payments/providers/paystack/paystack.client';
export declare class ApexOrganizationsService {
    private readonly repo;
    private readonly userRepo;
    private readonly emailService;
    private readonly smsService;
    private readonly paystackClient;
    private readonly logger;
    constructor(repo: Repository<ApexOrganization>, userRepo: Repository<User>, emailService: EmailService, smsService: SmsService, paystackClient: PaystackClient);
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
    private generateCode;
    private ensureUniqueCode;
    create(dto: {
        name: string;
        createdBy: string;
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
    }): Promise<ApexOrganization & {
        generatedEmail?: string;
        generatedPassword?: string;
    }>;
    findAll(): Promise<ApexOrganization[]>;
    findById(id: string): Promise<ApexOrganization>;
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
    }): Promise<ApexOrganization>;
}

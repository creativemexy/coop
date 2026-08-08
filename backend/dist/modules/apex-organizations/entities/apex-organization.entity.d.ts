import { OrgStatus } from '../../../common/enums/status.enum';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
export declare class ApexOrganization {
    id: string;
    name: string;
    code: string;
    status: OrgStatus;
    address: string;
    contactEmail: string;
    contactPhone: string;
    contactPersonName: string;
    contactPersonPhone: string;
    contactPersonEmail: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    sortCode: string;
    bankCode: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    organizations: Organization[];
    users: User[];
}

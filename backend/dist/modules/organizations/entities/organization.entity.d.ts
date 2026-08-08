import { OrgStatus } from '../../../common/enums/status.enum';
import { ApexOrganization } from '../../apex-organizations/entities/apex-organization.entity';
import { User } from '../../users/entities/user.entity';
export declare class Organization {
    id: string;
    name: string;
    code: string;
    apexOrgId: string;
    apexOrg: ApexOrganization;
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
    status: OrgStatus;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    users: User[];
}

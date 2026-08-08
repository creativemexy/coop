import { Repository } from 'typeorm';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../organizations/entities/organization.entity';
export declare class RegistrationsController {
    private readonly apexRepo;
    private readonly orgRepo;
    constructor(apexRepo: Repository<ApexOrganization>, orgRepo: Repository<Organization>);
    getApexOrgs(): Promise<{
        id: string;
        name: string;
    }[]>;
    getOrgs(apexOrgId?: string): Promise<{
        id: string;
        name: string;
        code: string;
    }[]>;
}

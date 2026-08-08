import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Controller('api/v1/registrations')
export class RegistrationsController {
  constructor(
    @InjectRepository(ApexOrganization)
    private readonly apexRepo: Repository<ApexOrganization>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  @Get('apex-organizations')
  async getApexOrgs() {
    const orgs = await this.apexRepo.find({
      order: { name: 'ASC' },
    });
    return orgs.map((o) => ({ id: o.id, name: o.name }));
  }

  @Get('organizations')
  async getOrgs(@Query('apexOrgId') apexOrgId?: string) {
    const where: Record<string, unknown> = {};
    if (apexOrgId) where.apexOrgId = apexOrgId;
    const orgs = await this.orgRepo.find({
      where,
      order: { name: 'ASC' },
    });
    return orgs.map((o) => ({ id: o.id, name: o.name, code: o.code }));
  }
}

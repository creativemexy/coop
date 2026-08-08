import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { FeeShareLedger } from '../ledger/entities/fee-share-ledger.entity';
import { FeePot } from '../ledger/entities/fee-pot.entity';
import { PotType, FeeSource } from '../../common/enums/status.enum';
import { Role } from '../../common/enums/role.enum';
import { hashForLookup } from '../../common/encryption.service';
import { maskUser } from '../../common/mask.util';

@Injectable()
export class ApexBusinessManagerService {
  constructor(
    @InjectRepository(ApexOrganization)
    private readonly apexOrgRepo: Repository<ApexOrganization>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(FeeShareLedger)
    private readonly ledgerRepo: Repository<FeeShareLedger>,
    @InjectRepository(FeePot)
    private readonly potRepo: Repository<FeePot>,
  ) {}

  async listUsers(apexOrgId: string, search?: string) {
    const apexOrg = await this.apexOrgRepo.findOne({
      where: { id: apexOrgId },
      relations: { organizations: true },
    });
    const orgs = apexOrg?.organizations || [];
    const orgIds = orgs.map((o) => o.id);

    const qb = this.userRepo.createQueryBuilder('u');
    if (orgIds.length > 0) {
      qb.where('u.apex_org_id = :apexOrgId', { apexOrgId })
        .orWhere('u.organization_id IN (:...orgIds)', { orgIds });
    } else {
      qb.where('u.apex_org_id = :apexOrgId', { apexOrgId });
    }
    if (search) {
      qb.andWhere('u.email_hash = :hash', { hash: hashForLookup(search) });
    }
    qb.orderBy('u.created_at', 'DESC');
    const users = await qb.getMany();

    const individualIds = users
      .filter((u) => u.role === Role.INDIVIDUAL)
      .map((u) => u.id);

    const memberCounts =
      individualIds.length > 0
        ? await this.userRepo
            .createQueryBuilder('u')
            .select('u.organization_id', 'organizationId')
            .addSelect('COUNT(*)', 'count')
            .where('u.organization_id IN (:...orgIds)', { orgIds })
            .andWhere('u.role = :role', { role: Role.INDIVIDUAL })
            .groupBy('u.organization_id')
            .getRawMany<{ organizationId: string; count: string }>()
        : [];

    const countMap = new Map(memberCounts.map((m) => [m.organizationId, Number(m.count)]));

    return {
      organizations: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        code: o.code,
        status: o.status,
        memberCount: countMap.get(o.id) || 0,
      })),
      individuals: users
        .filter((u) => u.role === Role.INDIVIDUAL)
        .map((u) => maskUser(u)),
    };
  }

  async getDashboard(apexOrgId: string) {
    const apexOrg = await this.apexOrgRepo.findOne({
      where: { id: apexOrgId },
    });
    if (!apexOrg) throw new Error('Apex organization not found');

    const orgs = await this.orgRepo.find({
      where: { apexOrgId },
      select: { id: true },
    });
    const orgIds = orgs.map((o) => o.id);

    const memberQuery = this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: Role.INDIVIDUAL });
    if (orgIds.length > 0) {
      memberQuery.andWhere(
        '(u.apex_org_id = :apexOrgId OR u.organization_id IN (:...orgIds))',
        { apexOrgId, orgIds },
      );
    } else {
      memberQuery.andWhere('u.apex_org_id = :apexOrgId', { apexOrgId });
    }
    const memberCount = await memberQuery.getCount();

    // Registration fee shares for this apex
    const feeLedger = await this.ledgerRepo.find({
      where: { apexOrgId, source: FeeSource.REGISTRATION },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const totalFees = feeLedger.reduce((s, l) => s + Number(l.totalFee), 0);
    const apexShare = feeLedger.reduce((s, l) => s + Number(l.apexShare), 0);
    const orgShares = feeLedger.reduce((s, l) => s + Number(l.organizationShare), 0);

    // Apex fee pot balance
    const apexPot = await this.potRepo.findOne({ where: { potType: PotType.APEX, entityId: apexOrgId } });
    const apexBalance = apexPot ? Number(apexPot.balance) : 0;

    return {
      apexOrg: {
        id: apexOrg.id,
        name: apexOrg.name,
        code: apexOrg.code,
        bankName: apexOrg.bankName,
        accountName: apexOrg.accountName,
        accountNumber: apexOrg.accountNumber,
        sortCode: apexOrg.sortCode,
        bankCode: apexOrg.bankCode,
      },
      stats: { organizations: orgIds.length, members: memberCount },
      fees: { totalFees, apexShare, orgShares, apexBalance, ledgerEntries: feeLedger.length },
      recentLedger: feeLedger.slice(0, 10),
    };
  }

  async updateBankDetails(
    apexOrgId: string,
    dto: { bankName?: string; accountName?: string; accountNumber?: string; sortCode?: string; bankCode?: string },
  ) {
    await this.apexOrgRepo.update(apexOrgId, dto);
    return this.apexOrgRepo.findOne({ where: { id: apexOrgId } });
  }
}

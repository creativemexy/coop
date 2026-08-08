import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../modules/users/entities/user.entity';
import { ApexOrganization } from '../../modules/apex-organizations/entities/apex-organization.entity';
import { hashForLookup } from '../../common/encryption.service';

export async function seedApexBusinessManager(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const apexRepo = dataSource.getRepository(ApexOrganization);

  const apexOrgs = await apexRepo.find();
  if (apexOrgs.length === 0) {
    console.log('No apex orgs found, skipping apex BM seed');
    return;
  }

  let seeded = 0;
  for (const apexOrg of apexOrgs) {
    const existing = await userRepo.findOne({
      where: { role: Role.APEX_BUSINESS_MANAGER, apexOrgId: apexOrg.id },
    });
    if (existing) {
      console.log(`Apex BM for ${apexOrg.code} already exists, skipping`);
      continue;
    }

    const passwordHash = await bcrypt.hash('ApexBM@123456', 10);
    const slug = apexOrg.code.toLowerCase().replace(/[^a-z0-9]/g, '');

    await userRepo.save({
      email: `apexbm-${slug}@coop.com`,
      emailHash: hashForLookup(`apexbm-${slug}@coop.com`),
      passwordHash,
      firstName: 'Apex',
      lastName: `BM - ${apexOrg.name}`,
      phone: '08000000006',
      role: Role.APEX_BUSINESS_MANAGER,
      apexOrgId: apexOrg.id,
      isActive: true,
    });

    console.log(`Apex BM seeded for ${apexOrg.code}: apexbm-${slug}@coop.com / ApexBM@123456`);
    seeded++;
  }

  if (seeded === 0) console.log('All apex BMs already exist, skipping');
}

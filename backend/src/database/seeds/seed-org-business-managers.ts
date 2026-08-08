import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../modules/users/entities/user.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { hashForLookup } from '../../common/encryption.service';

export async function seedOrgBusinessManagers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const orgRepo = dataSource.getRepository(Organization);

  const orgs = await orgRepo.find();
  if (orgs.length === 0) {
    console.log('No organizations found, skipping org BM seed');
    return;
  }

  let seeded = 0;
  for (const org of orgs) {
    const existing = await userRepo.findOne({
      where: { role: Role.BUSINESS_MANAGER, organizationId: org.id },
    });
    if (existing) {
      console.log(`BM for ${org.code} already exists, skipping`);
      continue;
    }

    const passwordHash = await bcrypt.hash('BM@123456', 10);
    const slug = org.code.toLowerCase().replace(/[^a-z0-9]/g, '');

    await userRepo.save({
      email: `bm-${slug}@coop.com`,
      emailHash: hashForLookup(`bm-${slug}@coop.com`),
      passwordHash,
      firstName: 'Business',
      lastName: `Manager - ${org.name}`,
      phone: '08000000001',
      role: Role.BUSINESS_MANAGER,
      organizationId: org.id,
      apexOrgId: org.apexOrgId,
      isActive: true,
    });

    console.log(`BM seeded for ${org.code}: bm-${slug}@coop.com / BM@123456`);
    seeded++;
  }

  if (seeded === 0) console.log('All org BMs already exist, skipping');
}

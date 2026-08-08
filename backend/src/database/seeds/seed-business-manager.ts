import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../modules/users/entities/user.entity';
import { hashForLookup } from '../../common/encryption.service';

export async function seedBusinessManager(
  dataSource: DataSource,
): Promise<void> {
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({
    where: { role: Role.BUSINESS_MANAGER, isActive: true },
  });
  if (existing) {
    console.log('Business manager already exists, skipping seed');
    return;
  }

  const passwordHash = await bcrypt.hash('BM@123456', 10);

  await userRepo.save({
    email: 'bm@coop.com',
    emailHash: hashForLookup('bm@coop.com'),
    passwordHash,
    firstName: 'Business',
    lastName: 'Manager',
    phone: '08000000001',
    phoneHash: hashForLookup('08000000001'),
    role: Role.BUSINESS_MANAGER,
    isActive: true,
  });

  console.log('Business manager seeded: bm@coop.com / BM@123456');
}

import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { hashForLookup } from '../../common/encryption.service';
import { normalizePhoneForSms } from '../../common/temp-password.util';

export async function backfillEncryptionHashes(
  dataSource: DataSource,
): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const users = await userRepo.find({ where: { emailHash: null as any } });

  for (const user of users) {
    user.emailHash = hashForLookup(user.email ?? '');
    user.phoneHash = user.phone
      ? hashForLookup(normalizePhoneForSms(user.phone))
      : null;
    await userRepo.save(user);
  }

  console.log(`Backfilled encryption hashes for ${users.length} users`);
}

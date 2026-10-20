import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './modules/users/entities/user.entity';
import { Role } from './common/enums/role.enum';
import { hashForLookup } from './common/encryption.service';

@Injectable()
export class BootstrapAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapAdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.ensureSuperAdmin();
    } catch (err) {
      this.logger.error(
        `Failed to ensure super admin: ${(err as Error).message}`,
      );
    }
  }

  private async ensureSuperAdmin(): Promise<void> {
    const enableBootstrap =
      process.env.BOOTSTRAP_ADMIN_ENABLED === 'true' ||
      process.env.BOOTSTRAP_ADMIN_ENABLED === '1';

    if (!enableBootstrap) {
      return;
    }

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

    if (!bootstrapSecret || !password || !email) {
      throw new Error(
        'ADMIN_BOOTSTRAP_SECRET and SUPER_ADMIN_PASSWORD must be set before bootstrap is enabled',
      );
    }

    const existing = await this.userRepo.findOne({
      where: { role: Role.SUPER_ADMIN },
    });
    if (existing) {
      if (!existing.emailHash) {
        await this.userRepo.update(existing.id, {
          emailHash: hashForLookup(existing.email ?? ''),
        });
      }
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.userRepo.save({
      email,
      emailHash: hashForLookup(email),
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '08000000000',
      phoneHash: hashForLookup('08000000000'),
      role: Role.SUPER_ADMIN,
      isActive: true,
      registrationFeePaid: true,
    });

    this.logger.warn(
      `Super admin auto-provisioned only after explicit bootstrap approval for ${email}`,
    );
  }
}

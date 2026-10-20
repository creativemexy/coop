import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BootstrapAdminService } from './bootstrap-admin.service';
import { User } from './modules/users/entities/user.entity';

describe('BootstrapAdminService', () => {
  let service: BootstrapAdminService;
  let userRepo: { findOne: jest.Mock; save: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    process.env.NODE_ENV = 'production';
    process.env.BOOTSTRAP_ADMIN_ENABLED = 'true';
    delete process.env.SUPER_ADMIN_PASSWORD;
    delete process.env.SUPER_ADMIN_EMAIL;

    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BootstrapAdminService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
      ],
    }).compile();

    service = module.get(BootstrapAdminService);
  });

  afterEach(() => {
    delete process.env.BOOTSTRAP_ADMIN_ENABLED;
    delete process.env.SUPER_ADMIN_PASSWORD;
    delete process.env.SUPER_ADMIN_EMAIL;
    delete process.env.ADMIN_BOOTSTRAP_SECRET;
  });

  it('fails closed when bootstrap is enabled without a bootstrap secret and password', async () => {
    await expect(service['ensureSuperAdmin']()).rejects.toThrow(
      'ADMIN_BOOTSTRAP_SECRET and SUPER_ADMIN_PASSWORD must be set before bootstrap is enabled',
    );
  });
});

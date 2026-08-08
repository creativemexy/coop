import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: Role.INDIVIDUAL,
    isActive: true,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.findById('user-1');
      expect(result.id).toBe('user-1');
    });

    it('should throw if not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user or null', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      expect(await service.findByEmail('test@test.com')).toBeTruthy();

      userRepo.findOne.mockResolvedValue(null);
      expect(await service.findByEmail('none@test.com')).toBeNull();
    });
  });

  describe('createBusinessManager', () => {
    it('should throw if BM already exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      await expect(
        service.createBusinessManager({
          email: 'bm@test.com',
          password: 'pass',
          firstName: 'BM',
          lastName: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create BM', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({ ...mockUser, role: Role.BUSINESS_MANAGER });
      const result = await service.createBusinessManager({
        email: 'bm@test.com',
        password: 'pass',
        firstName: 'BM',
        lastName: 'Test',
      });
      expect(result.role).toBe(Role.BUSINESS_MANAGER);
    });
  });

  describe('listUsers', () => {
    it('should filter by role', async () => {
      userRepo.find.mockResolvedValue([mockUser]);
      await service.listUsers(Role.INDIVIDUAL);
      expect(userRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: Role.INDIVIDUAL }),
        }),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SseAuthGuard } from './sse-auth.guard';
import { User } from '../users/entities/user.entity';

describe('SseAuthGuard', () => {
  let guard: SseAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let userRepo: { findOne: jest.Mock };

  const makeExecutionContext = (req: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => undefined,
        getNext: () => undefined,
      }),
    }) as any;

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };
    userRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SseAuthGuard,
        { provide: JwtService, useValue: jwtService },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
      ],
    }).compile();

    guard = module.get(SseAuthGuard);
  });

  it('requires a Bearer token in the Authorization header', async () => {
    const req = {
      headers: {},
      query: { token: 'query-token' },
    } as any;

    await expect(
      guard.canActivate(makeExecutionContext(req)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a valid bearer token and attaches the user', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'individual',
      apexOrgId: null,
      organizationId: null,
      isActive: true,
    });

    const req = {
      headers: { authorization: 'Bearer valid-token' },
      query: {},
    } as any;

    await expect(guard.canActivate(makeExecutionContext(req))).resolves.toBe(
      true,
    );
    expect(req.user.sub).toBe('user-1');
  });
});

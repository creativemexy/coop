import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InstallmentsService } from './installments.service';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { InstallmentStatus } from '../../../common/enums/status.enum';

describe('InstallmentsService', () => {
  let service: InstallmentsService;
  let repo: jest.Mocked<Repository<BnplInstallment>>;

  const mockInstallment = {
    id: 'inst-1',
    subscriptionId: 'sub-1',
    dueDate: new Date('2026-02-01'),
    amount: 28333.33,
    status: InstallmentStatus.PENDING,
    paidAt: null,
    paymentReference: null,
  } as BnplInstallment;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstallmentsService,
        {
          provide: getRepositoryToken(BnplInstallment),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InstallmentsService>(InstallmentsService);
    repo = module.get(getRepositoryToken(BnplInstallment));
  });

  describe('findBySubscription', () => {
    it('should return installments ordered by dueDate', async () => {
      repo.find.mockResolvedValue([mockInstallment]);
      const results = await service.findBySubscription('sub-1');
      expect(results).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub-1' },
        order: { dueDate: 'ASC' },
      });
    });
  });

  describe('markAsPaid', () => {
    it('should throw if installment not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.markAsPaid('invalid', 'ref-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should mark installment as paid', async () => {
      const paid = {
        ...mockInstallment,
        status: InstallmentStatus.PAID,
        paidAt: new Date(),
        paymentReference: 'ref-1',
      };
      repo.findOne.mockResolvedValue(mockInstallment);
      repo.save.mockResolvedValue(paid as BnplInstallment);

      const result = await service.markAsPaid('inst-1', 'ref-1');
      expect(result.status).toBe(InstallmentStatus.PAID);
      expect(result.paymentReference).toBe('ref-1');
      expect(result.paidAt).toBeInstanceOf(Date);
    });
  });
});

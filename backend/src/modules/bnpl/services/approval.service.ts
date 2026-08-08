/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApprovalRequest,
  ApprovalRequestType,
  ApprovalStatus,
} from '../entities/approval-request.entity';
import { CatalogService } from './catalog.service';
import { PlansService } from './plans.service';
import { PlanConfigService } from './plan-config.service';
import { SubscriptionsService } from './subscriptions.service';
import { InstallmentsService } from './installments.service';
import { UsersService } from '../../users/users.service';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { AppSetting } from '../../settings/entities/app-setting.entity';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalRequest)
    private readonly repo: Repository<ApprovalRequest>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(AppSetting)
    private readonly settingRepo: Repository<AppSetting>,
    private readonly catalogService: CatalogService,
    private readonly plansService: PlansService,
    private readonly planConfigService: PlanConfigService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly installmentsService: InstallmentsService,
    private readonly usersService: UsersService,
  ) {}

  async submit(dto: {
    requestType: ApprovalRequestType;
    requestData: Record<string, any>;
    reason?: string;
    requestedBy: string;
  }): Promise<ApprovalRequest> {
    const request = this.repo.create({
      requestType: dto.requestType,
      requestData: dto.requestData,
      reason: dto.reason,
      requestedBy: dto.requestedBy,
      status: ApprovalStatus.PENDING,
    });
    return this.repo.save(request);
  }

  async list(filters?: {
    status?: string;
    requestType?: string;
  }): Promise<ApprovalRequest[]> {
    const qb = this.repo.createQueryBuilder('a');
    if (filters?.status) {
      qb.andWhere('a.status = :status', { status: filters.status });
    }
    if (filters?.requestType) {
      qb.andWhere('a.request_type = :requestType', {
        requestType: filters.requestType,
      });
    }
    qb.orderBy('a.created_at', 'DESC');
    return qb.getMany();
  }

  async findById(id: string): Promise<ApprovalRequest> {
    const req = await this.repo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Approval request not found');
    return req;
  }

  async approve(
    id: string,
    reviewedBy: string,
    reviewerRole?: string,
  ): Promise<ApprovalRequest> {
    const request = await this.findById(id);
    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    const superAdminTypes = [
      ApprovalRequestType.TENANT_PRODUCT_ENABLEMENT,
      ApprovalRequestType.POLICY_TEMPLATE_CHANGE,
    ];
    if (
      superAdminTypes.includes(request.requestType) &&
      reviewerRole !== 'super_admin'
    ) {
      throw new ForbiddenException(
        'Only Super Admin can approve tenant-level policy changes',
      );
    }

    await this._execute(request);

    request.status = ApprovalStatus.APPROVED;
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    return this.repo.save(request);
  }

  async reject(
    id: string,
    reviewedBy: string,
    rejectionReason?: string,
  ): Promise<ApprovalRequest> {
    const request = await this.findById(id);
    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }
    request.status = ApprovalStatus.REJECTED;
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();
    request.rejectionReason = (rejectionReason || null) as any;
    return this.repo.save(request);
  }

  private async _execute(request: ApprovalRequest): Promise<void> {
    const data = request.requestData;

    switch (request.requestType) {
      case ApprovalRequestType.PRODUCT_CHANGE: {
        if (data.planId && data.planChanges) {
          await this.plansService.update(data.planId, data.planChanges);
        }
        if (data.catalogItemId) {
          await this.catalogService.update(data.catalogItemId, {
            name: data.name,
            description: data.description,
            price: data.price,
            status: data.status,
          });
        }
        if (data.organizationId && data.feeRules) {
          await this.planConfigService.upsert(data.organizationId, {
            ...data.feeRules,
            updatedBy: request.reviewedBy || request.requestedBy,
          });
        }
        break;
      }

      case ApprovalRequestType.RESTRUCTURING: {
        if (data.subscriptionId && data.rescheduledInstallments) {
          const items = data.rescheduledInstallments as Array<{
            installmentId: string;
            newDueDate?: string;
            newAmount?: number;
          }>;
          for (const item of items) {
            if (item.newDueDate) {
              const inst = await this.instRepo.findOne({
                where: { id: item.installmentId },
              });
              if (inst) {
                inst.dueDate = new Date(item.newDueDate);
                if (item.newAmount !== undefined) {
                  inst.amount = item.newAmount;
                }
                await this.instRepo.save(inst);
              }
            }
          }
        }
        if (data.subscriptionId && data.newDownPayment !== undefined) {
          const sub = await this.subscriptionsService.findById(
            data.subscriptionId,
          );
          if (sub) {
            sub.downPayment = data.newDownPayment;
            const subRepo =
              this.instRepo.manager.getRepository('BnplSubscription');
            await subRepo.save(sub);
          }
        }
        break;
      }

      case ApprovalRequestType.WRITE_OFF: {
        if (data.subscriptionId) {
          await this.subscriptionsService.updateOrderStatus(
            data.subscriptionId,
            'defaulted' as any,
          );
        }
        break;
      }

      case ApprovalRequestType.MANUAL_OVERRIDE: {
        if (data.installmentId) {
          await this.installmentsService.markAsPaid(
            data.installmentId,
            data.paymentReference || 'manual-override',
          );
        }
        break;
      }

      case ApprovalRequestType.USER_SUSPENSION: {
        if (data.userId && data.isActive !== undefined) {
          await this.usersService.updateUser(data.userId, {
            isActive: data.isActive,
          });
        }
        break;
      }

      case ApprovalRequestType.ELIGIBILITY_EXCEPTION: {
        if (data.userId && data.bypassEligibility !== undefined) {
          await this.usersService.updateUser(data.userId, { isActive: true });
        }
        if (data.subscriptionId && data.bypassScoreCheck) {
          const sub = await this.subscriptionsService.findById(
            data.subscriptionId,
          );
          if (sub) {
            const subRepo =
              this.instRepo.manager.getRepository('BnplSubscription');
            await subRepo.save(sub);
          }
        }
        break;
      }

      case ApprovalRequestType.TENANT_PRODUCT_ENABLEMENT: {
        if (data.tenantId && data.bnplEnabled !== undefined) {
          await this.settingRepo.upsert(
            {
              key: `tenant:${data.tenantId}:bnpl_enabled`,
              value: String(data.bnplEnabled),
            },
            ['key'],
          );
        }
        if (data.tenantId && data.supportedProducts) {
          await this.settingRepo.upsert(
            {
              key: `tenant:${data.tenantId}:supported_products`,
              value: JSON.stringify(data.supportedProducts),
            },
            ['key'],
          );
        }
        break;
      }

      case ApprovalRequestType.POLICY_TEMPLATE_CHANGE: {
        if (data.tenantId && data.config) {
          const entries = Object.entries(data.config);
          const allowedKeys = [
            'kyc_requirement_level',
            'repayment_retry_policy',
            'log_retention_days',
            'webhook_providers',
          ];
          for (const [key, value] of entries) {
            if (allowedKeys.includes(key)) {
              await this.settingRepo.upsert(
                {
                  key: `tenant:${data.tenantId}:${key}`,
                  value:
                    typeof value === 'string' ? value : JSON.stringify(value),
                },
                ['key'],
              );
            }
          }
        }
        break;
      }

      default: {
        throw new BadRequestException(
          `Unknown request type: ${String(request.requestType)}`,
        );
      }
    }
  }
}

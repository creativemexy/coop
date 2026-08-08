"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const approval_request_entity_1 = require("../entities/approval-request.entity");
const catalog_service_1 = require("./catalog.service");
const plans_service_1 = require("./plans.service");
const plan_config_service_1 = require("./plan-config.service");
const subscriptions_service_1 = require("./subscriptions.service");
const installments_service_1 = require("./installments.service");
const users_service_1 = require("../../users/users.service");
const bnpl_installment_entity_1 = require("../entities/bnpl-installment.entity");
const app_setting_entity_1 = require("../../settings/entities/app-setting.entity");
let ApprovalService = class ApprovalService {
    repo;
    instRepo;
    settingRepo;
    catalogService;
    plansService;
    planConfigService;
    subscriptionsService;
    installmentsService;
    usersService;
    constructor(repo, instRepo, settingRepo, catalogService, plansService, planConfigService, subscriptionsService, installmentsService, usersService) {
        this.repo = repo;
        this.instRepo = instRepo;
        this.settingRepo = settingRepo;
        this.catalogService = catalogService;
        this.plansService = plansService;
        this.planConfigService = planConfigService;
        this.subscriptionsService = subscriptionsService;
        this.installmentsService = installmentsService;
        this.usersService = usersService;
    }
    async submit(dto) {
        const request = this.repo.create({
            requestType: dto.requestType,
            requestData: dto.requestData,
            reason: dto.reason,
            requestedBy: dto.requestedBy,
            status: approval_request_entity_1.ApprovalStatus.PENDING,
        });
        return this.repo.save(request);
    }
    async list(filters) {
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
    async findById(id) {
        const req = await this.repo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Approval request not found');
        return req;
    }
    async approve(id, reviewedBy, reviewerRole) {
        const request = await this.findById(id);
        if (request.status !== approval_request_entity_1.ApprovalStatus.PENDING) {
            throw new common_1.BadRequestException('Request is not pending');
        }
        const superAdminTypes = [
            approval_request_entity_1.ApprovalRequestType.TENANT_PRODUCT_ENABLEMENT,
            approval_request_entity_1.ApprovalRequestType.POLICY_TEMPLATE_CHANGE,
        ];
        if (superAdminTypes.includes(request.requestType) &&
            reviewerRole !== 'super_admin') {
            throw new common_1.ForbiddenException('Only Super Admin can approve tenant-level policy changes');
        }
        await this._execute(request);
        request.status = approval_request_entity_1.ApprovalStatus.APPROVED;
        request.reviewedBy = reviewedBy;
        request.reviewedAt = new Date();
        return this.repo.save(request);
    }
    async reject(id, reviewedBy, rejectionReason) {
        const request = await this.findById(id);
        if (request.status !== approval_request_entity_1.ApprovalStatus.PENDING) {
            throw new common_1.BadRequestException('Request is not pending');
        }
        request.status = approval_request_entity_1.ApprovalStatus.REJECTED;
        request.reviewedBy = reviewedBy;
        request.reviewedAt = new Date();
        request.rejectionReason = (rejectionReason || null);
        return this.repo.save(request);
    }
    async _execute(request) {
        const data = request.requestData;
        switch (request.requestType) {
            case approval_request_entity_1.ApprovalRequestType.PRODUCT_CHANGE: {
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
            case approval_request_entity_1.ApprovalRequestType.RESTRUCTURING: {
                if (data.subscriptionId && data.rescheduledInstallments) {
                    const items = data.rescheduledInstallments;
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
                    const sub = await this.subscriptionsService.findById(data.subscriptionId);
                    if (sub) {
                        sub.downPayment = data.newDownPayment;
                        const subRepo = this.instRepo.manager.getRepository('BnplSubscription');
                        await subRepo.save(sub);
                    }
                }
                break;
            }
            case approval_request_entity_1.ApprovalRequestType.WRITE_OFF: {
                if (data.subscriptionId) {
                    await this.subscriptionsService.updateOrderStatus(data.subscriptionId, 'defaulted');
                }
                break;
            }
            case approval_request_entity_1.ApprovalRequestType.MANUAL_OVERRIDE: {
                if (data.installmentId) {
                    await this.installmentsService.markAsPaid(data.installmentId, data.paymentReference || 'manual-override');
                }
                break;
            }
            case approval_request_entity_1.ApprovalRequestType.USER_SUSPENSION: {
                if (data.userId && data.isActive !== undefined) {
                    await this.usersService.updateUser(data.userId, {
                        isActive: data.isActive,
                    });
                }
                break;
            }
            case approval_request_entity_1.ApprovalRequestType.ELIGIBILITY_EXCEPTION: {
                if (data.userId && data.bypassEligibility !== undefined) {
                    await this.usersService.updateUser(data.userId, { isActive: true });
                }
                if (data.subscriptionId && data.bypassScoreCheck) {
                    const sub = await this.subscriptionsService.findById(data.subscriptionId);
                    if (sub) {
                        const subRepo = this.instRepo.manager.getRepository('BnplSubscription');
                        await subRepo.save(sub);
                    }
                }
                break;
            }
            case approval_request_entity_1.ApprovalRequestType.TENANT_PRODUCT_ENABLEMENT: {
                if (data.tenantId && data.bnplEnabled !== undefined) {
                    await this.settingRepo.upsert({
                        key: `tenant:${data.tenantId}:bnpl_enabled`,
                        value: String(data.bnplEnabled),
                    }, ['key']);
                }
                if (data.tenantId && data.supportedProducts) {
                    await this.settingRepo.upsert({
                        key: `tenant:${data.tenantId}:supported_products`,
                        value: JSON.stringify(data.supportedProducts),
                    }, ['key']);
                }
                break;
            }
            case approval_request_entity_1.ApprovalRequestType.POLICY_TEMPLATE_CHANGE: {
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
                            await this.settingRepo.upsert({
                                key: `tenant:${data.tenantId}:${key}`,
                                value: typeof value === 'string' ? value : JSON.stringify(value),
                            }, ['key']);
                        }
                    }
                }
                break;
            }
            default: {
                throw new common_1.BadRequestException(`Unknown request type: ${String(request.requestType)}`);
            }
        }
    }
};
exports.ApprovalService = ApprovalService;
exports.ApprovalService = ApprovalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(approval_request_entity_1.ApprovalRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(2, (0, typeorm_1.InjectRepository)(app_setting_entity_1.AppSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        catalog_service_1.CatalogService,
        plans_service_1.PlansService,
        plan_config_service_1.PlanConfigService,
        subscriptions_service_1.SubscriptionsService,
        installments_service_1.InstallmentsService,
        users_service_1.UsersService])
], ApprovalService);
//# sourceMappingURL=approval.service.js.map
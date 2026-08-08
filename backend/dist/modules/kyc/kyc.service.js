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
var KycService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kyc_submission_entity_1 = require("./entities/kyc-submission.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const users_service_1 = require("../users/users.service");
const korapay_client_1 = require("./korapay/korapay.client");
const notifications_service_1 = require("../notifications/notifications.service");
const KYC_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;
let KycService = KycService_1 = class KycService {
    repo;
    usersService;
    korapayClient;
    notifications;
    logger = new common_1.Logger(KycService_1.name);
    constructor(repo, usersService, korapayClient, notifications) {
        this.repo = repo;
        this.usersService = usersService;
        this.korapayClient = korapayClient;
        this.notifications = notifications;
    }
    static isKycExpired(kycVerifiedAt) {
        if (!kycVerifiedAt)
            return true;
        return Date.now() - kycVerifiedAt.getTime() > KYC_EXPIRY_MS;
    }
    verifyWebhookSignature(rawBody, signature) {
        return this.korapayClient.verifyWebhookSignature(rawBody, signature);
    }
    normalize(str) {
        return (str ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    }
    matchField(userVal, korapayVal) {
        if (!userVal || !korapayVal)
            return false;
        return this.normalize(userVal) === this.normalize(korapayVal);
    }
    async initiate(userId, id, identityType) {
        const user = await this.usersService.findById(userId);
        if (user.kycStatus === status_enum_1.KycStatus.APPROVED && !KycService_1.isKycExpired(user.kycVerifiedAt)) {
            throw new common_1.BadRequestException('KYC already approved');
        }
        const reference = `KYC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        try {
            const result = await this.korapayClient.verifyIdentity({
                id,
                type: identityType || 'bvn',
                reference,
            });
            const firstNameMatch = this.matchField(user.firstName, result.first_name);
            const lastNameMatch = this.matchField(user.lastName, result.last_name);
            let emailMatch = null;
            if (user.email) {
                emailMatch = this.matchField(user.email, result.email);
            }
            let phoneMatch = null;
            if (user.phone) {
                const userPhone = user.phone.replace(/\D/g, '');
                const resultPhone = (result.phone_number || '').replace(/\D/g, '');
                phoneMatch = resultPhone.length > 0 && (resultPhone.includes(userPhone) || userPhone.includes(resultPhone));
            }
            const match = {
                firstName: { user: user.firstName, korapay: result.first_name, match: firstNameMatch },
                lastName: { user: user.lastName, korapay: result.last_name, match: lastNameMatch },
                email: user.email ? { user: user.email, korapay: result.email, match: emailMatch } : null,
                phone: user.phone ? { user: user.phone, korapay: result.phone_number, match: phoneMatch } : null,
            };
            const kycImage = result.image || null;
            const submission = this.repo.create({
                userId,
                provider: status_enum_1.KycProvider.KORAPAY,
                identityType: identityType || 'bvn',
                reference,
                status: status_enum_1.KycStatus.PENDING,
                submittedAt: new Date(),
                providerResponse: { korapayData: result, userData: { firstName: user.firstName, lastName: user.lastName, phone: user.phone }, match },
            });
            await this.repo.save(submission);
            await this.usersService.updateUser(userId, {
                kycReference: reference,
                kycStatus: status_enum_1.KycStatus.PENDING,
                kycImage,
            });
            await this.notifications.create({
                userId,
                title: 'KYC Verification Submitted',
                message: `Your ${identityType || 'BVN'} verification has been submitted for review.`,
                type: 'info',
                link: '/individual/kyc',
            });
            this.logger.log(`KYC initiated for user ${userId}, type: ${identityType || 'bvn'}, reference: ${reference}`);
            return { status: status_enum_1.KycStatus.PENDING, reference, match, korapayData: result };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const submission = this.repo.create({
                userId,
                provider: status_enum_1.KycProvider.KORAPAY,
                identityType: identityType || 'bvn',
                reference,
                status: status_enum_1.KycStatus.REJECTED,
                processedAt: new Date(),
                rejectionReason: errorMessage,
                providerResponse: { error: errorMessage },
                submittedAt: new Date(),
            });
            await this.repo.save(submission);
            await this.usersService.updateUser(userId, {
                kycReference: reference,
                kycStatus: status_enum_1.KycStatus.REJECTED,
                kycVerifiedAt: null,
            });
            this.logger.warn(`KYC submission failed for user ${userId}: ${errorMessage}`);
            return { status: status_enum_1.KycStatus.REJECTED, reference };
        }
    }
    async handleWebhook(payload) {
        const parsed = this.korapayClient.parseWebhookPayload(payload);
        if (!parsed)
            return;
        const submission = await this.repo.findOne({
            where: { reference: parsed.data.reference },
        });
        if (!submission)
            return;
        if (parsed.data.type) {
            submission.identityType = parsed.data.type;
        }
        const kycStatus = parsed.data.status === 'success' ? status_enum_1.KycStatus.APPROVED : status_enum_1.KycStatus.REJECTED;
        submission.status = kycStatus;
        submission.processedAt = new Date();
        submission.providerResponse = payload;
        await this.repo.save(submission);
        await this.usersService.updateUser(submission.userId, {
            kycStatus,
            kycVerifiedAt: kycStatus === status_enum_1.KycStatus.APPROVED ? new Date() : undefined,
        });
    }
    async getStatus(userId) {
        const user = await this.usersService.findById(userId);
        const lastSubmission = await this.repo.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        return {
            kycStatus: user.kycStatus,
            lastSubmission,
        };
    }
    async listSubmissions(filters) {
        const qb = this.repo.createQueryBuilder('k');
        if (filters?.status) {
            qb.andWhere('k.status = :status', { status: filters.status });
        }
        if (filters?.search) {
            qb.andWhere('k.reference ILIKE :search OR k.user_id::text ILIKE :search', { search: `%${filters.search}%` });
        }
        qb.orderBy('k.submitted_at', 'DESC');
        return qb.getMany();
    }
    async reviewSubmission(id, dto) {
        const submission = await this.repo.findOne({ where: { id } });
        if (!submission) {
            throw new common_1.BadRequestException('Submission not found');
        }
        if (submission.status !== status_enum_1.KycStatus.PENDING) {
            throw new common_1.BadRequestException('Submission already processed');
        }
        submission.status = dto.status;
        submission.processedAt = new Date();
        if (dto.rejectionReason) {
            submission.rejectionReason = dto.rejectionReason;
        }
        await this.repo.save(submission);
        await this.usersService.updateUser(submission.userId, {
            kycStatus: dto.status,
            kycVerifiedAt: dto.status === status_enum_1.KycStatus.APPROVED ? new Date() : undefined,
        });
        const isApproved = dto.status === status_enum_1.KycStatus.APPROVED;
        await this.notifications.create({
            userId: submission.userId,
            title: isApproved ? 'KYC Verification Approved' : 'KYC Verification Rejected',
            message: isApproved
                ? 'Your identity has been verified successfully.'
                : `Your KYC verification was rejected.${dto.rejectionReason ? ` Reason: ${dto.rejectionReason}` : ''}`,
            type: isApproved ? 'success' : 'error',
            link: '/individual/kyc',
        });
        return submission;
    }
};
exports.KycService = KycService;
exports.KycService = KycService = KycService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kyc_submission_entity_1.KycSubmission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        korapay_client_1.KorapayClient,
        notifications_service_1.NotificationsService])
], KycService);
//# sourceMappingURL=kyc.service.js.map
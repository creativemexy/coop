"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OrganizationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const organization_entity_1 = require("./entities/organization.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const user_entity_1 = require("../users/entities/user.entity");
const role_enum_1 = require("../../common/enums/role.enum");
const email_service_1 = require("../email/email.service");
const sms_service_1 = require("../sms/sms.service");
const paystack_client_1 = require("../payments/providers/paystack/paystack.client");
const mask_util_1 = require("../../common/mask.util");
const encryption_service_1 = require("../../common/encryption.service");
const temp_password_util_1 = require("../../common/temp-password.util");
let OrganizationsService = OrganizationsService_1 = class OrganizationsService {
    repo;
    userRepo;
    emailService;
    smsService;
    paystackClient;
    logger = new common_1.Logger(OrganizationsService_1.name);
    constructor(repo, userRepo, emailService, smsService, paystackClient) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.emailService = emailService;
        this.smsService = smsService;
        this.paystackClient = paystackClient;
    }
    async resolveBankAccount(accountNumber, bankCode) {
        if (!accountNumber || !bankCode) {
            throw new common_1.BadRequestException('accountNumber and bankCode are required');
        }
        const result = await this.paystackClient.resolveBankAccount(accountNumber, bankCode);
        if (!result) {
            return { resolved: false, message: 'Bank account resolution is not configured' };
        }
        return { resolved: true, accountName: result.accountName, accountNumber: result.accountNumber };
    }
    generateCode(name) {
        const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
        const words = cleaned.split(/\s+/);
        let code;
        if (words.length === 1) {
            code = words[0].substring(0, 6).toUpperCase();
        }
        else {
            code = words.map((w) => w[0]).join('').substring(0, 5).toUpperCase();
        }
        const suffix = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0');
        code = `${code}${suffix}`;
        return code;
    }
    async ensureUniqueCode(base) {
        let code = base;
        let attempts = 0;
        while (await this.repo.findOne({ where: { code } })) {
            attempts++;
            const suffix = Math.floor(Math.random() * 9999)
                .toString()
                .padStart(4, '0');
            code = `${base.substring(0, 4)}${suffix}`;
            if (attempts > 50) {
                code = `ORG${Date.now().toString(36).toUpperCase()}`;
                break;
            }
        }
        return code;
    }
    async create(dto) {
        const code = await this.ensureUniqueCode(this.generateCode(dto.name));
        const org = this.repo.create({
            name: dto.name,
            code,
            apexOrgId: dto.apexOrgId,
            createdBy: dto.createdBy,
            status: status_enum_1.OrgStatus.ACTIVE,
            address: dto.address,
            contactEmail: dto.contactEmail,
            contactPhone: dto.contactPhone,
            contactPersonName: dto.contactPersonName,
            contactPersonPhone: dto.contactPersonPhone,
            contactPersonEmail: dto.contactPersonEmail,
            bankName: dto.bankName,
            accountName: dto.accountName,
            accountNumber: dto.accountNumber,
            sortCode: dto.sortCode,
            bankCode: dto.bankCode,
        });
        const saved = await this.repo.save(org);
        const slug = code.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `bm-${slug}@coop.com`;
        const password = (0, temp_password_util_1.generateTemporaryPassword)();
        const passwordHash = await bcrypt.hash(password, 10);
        const phone = dto.contactPhone || dto.contactPersonPhone || '08000000001';
        const bmUser = this.userRepo.create({
            email,
            emailHash: (0, encryption_service_1.hashForLookup)(email),
            passwordHash,
            firstName: 'Business',
            lastName: `Manager - ${dto.name}`,
            phone,
            phoneHash: (0, encryption_service_1.hashForLookup)(phone),
            role: role_enum_1.Role.BUSINESS_MANAGER,
            organizationId: saved.id,
            apexOrgId: dto.apexOrgId,
            isActive: true,
            mustChangePassword: true,
        });
        await this.userRepo.save(bmUser);
        const recipientEmail = dto.contactPersonEmail || dto.contactEmail || email;
        await this.emailService.send({
            to: recipientEmail,
            subject: `Organization Created — ${dto.name}`,
            text: [
                `Dear ${dto.contactPersonName || 'Business Manager'},`,
                '',
                `Your organization "${dto.name}" has been created successfully.`,
                '',
                `Organization Code: ${code}`,
                '',
                `Business Manager Login Credentials:`,
                `Email: ${email}`,
                `Temporary Password: ${password}`,
                '',
                `Please log in at the platform dashboard. You will be required to change this password on first login.`,
                '',
                'Regards,',
                'Coop BNPL Team',
            ].join('\n'),
        });
        await this.smsService.send((0, temp_password_util_1.normalizePhoneForSms)(phone), [
            `Your organization "${dto.name}" (code ${code}) has been created.`,
            `Login: ${email}`,
            `Temporary password: ${password}`,
            'Change it on first login. - Coop BNPL',
        ].join('\n'), 'organization_created');
        this.logger.log(`Org created: ${code}, BM user: ${(0, mask_util_1.maskEmail)(email)}`);
        return { ...saved, generatedEmail: email, generatedPassword: password };
    }
    async findAll(apexOrgId) {
        const where = {};
        if (apexOrgId)
            where.apexOrgId = apexOrgId;
        return this.repo.find({ where, relations: { apexOrg: true }, order: { createdAt: 'DESC' } });
    }
    async findById(id) {
        const org = await this.repo.findOne({
            where: { id },
            relations: { apexOrg: true },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return org;
    }
    async update(id, dto) {
        await this.repo.update(id, dto);
        return this.findById(id);
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = OrganizationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        email_service_1.EmailService,
        sms_service_1.SmsService,
        paystack_client_1.PaystackClient])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map
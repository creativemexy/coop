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
exports.KycController = void 0;
const common_1 = require("@nestjs/common");
const kyc_service_1 = require("./kyc.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let KycController = class KycController {
    service;
    constructor(service) {
        this.service = service;
    }
    async initiate(userId, body) {
        return this.service.initiate(userId, body.id, body.type);
    }
    async webhook(req, signature) {
        const rawBody = req.rawBody;
        if (!this.service.verifyWebhookSignature(rawBody, signature)) {
            throw new common_1.UnauthorizedException('Invalid webhook signature');
        }
        await this.service.handleWebhook(req.body);
        return { status: 'processed' };
    }
    async getStatus(userId) {
        return this.service.getStatus(userId);
    }
    async listSubmissions(status, search) {
        return this.service.listSubmissions({ status, search });
    }
    async reviewSubmission(id, dto) {
        return this.service.reviewSubmission(id, dto);
    }
    async export(res) {
        const submissions = await this.service.listSubmissions();
        const header = 'ID,User ID,Provider,Reference,Status,Rejection Reason,Submitted At,Processed At\n';
        const rows = submissions
            .map((s) => `${s.id},${s.userId},${s.provider},${s.reference},${s.status},${s.rejectionReason || ''},${s.submittedAt?.toISOString() || ''},${s.processedAt?.toISOString() || ''}`)
            .join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="kyc-submissions.csv"');
        res.send(header + rows);
    }
};
exports.KycController = KycController;
__decorate([
    (0, common_1.Post)('initiate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "initiate", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-korapay-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "webhook", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('submissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "listSubmissions", null);
__decorate([
    (0, common_1.Patch)('submissions/:id/review'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "reviewSubmission", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "export", null);
exports.KycController = KycController = __decorate([
    (0, common_1.Controller)('api/v1/kyc'),
    __metadata("design:paramtypes", [kyc_service_1.KycService])
], KycController);
//# sourceMappingURL=kyc.controller.js.map
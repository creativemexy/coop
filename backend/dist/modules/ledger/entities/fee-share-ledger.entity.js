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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeShareLedger = void 0;
const typeorm_1 = require("typeorm");
const status_enum_1 = require("../../../common/enums/status.enum");
let FeeShareLedger = class FeeShareLedger {
    id;
    paymentId;
    source;
    totalFee;
    superAdminShare;
    superAdminUserId;
    platformShare;
    organizationShare;
    organizationId;
    apexShare;
    apexOrgId;
    createdAt;
};
exports.FeeShareLedger = FeeShareLedger;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FeeShareLedger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'payment_id' }),
    __metadata("design:type", String)
], FeeShareLedger.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: status_enum_1.FeeSource }),
    __metadata("design:type", String)
], FeeShareLedger.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'total_fee', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], FeeShareLedger.prototype, "totalFee", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        name: 'super_admin_share',
        precision: 15,
        scale: 2,
    }),
    __metadata("design:type", Number)
], FeeShareLedger.prototype, "superAdminShare", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'super_admin_user_id', nullable: true }),
    __metadata("design:type", String)
], FeeShareLedger.prototype, "superAdminUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'platform_share', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], FeeShareLedger.prototype, "platformShare", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        name: 'organization_share',
        precision: 15,
        scale: 2,
    }),
    __metadata("design:type", Number)
], FeeShareLedger.prototype, "organizationShare", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'organization_id', nullable: true }),
    __metadata("design:type", String)
], FeeShareLedger.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'apex_share', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], FeeShareLedger.prototype, "apexShare", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'apex_org_id', nullable: true }),
    __metadata("design:type", String)
], FeeShareLedger.prototype, "apexOrgId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], FeeShareLedger.prototype, "createdAt", void 0);
exports.FeeShareLedger = FeeShareLedger = __decorate([
    (0, typeorm_1.Entity)('fee_share_ledger')
], FeeShareLedger);
//# sourceMappingURL=fee-share-ledger.entity.js.map
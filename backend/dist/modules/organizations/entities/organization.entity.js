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
exports.Organization = void 0;
const typeorm_1 = require("typeorm");
const status_enum_1 = require("../../../common/enums/status.enum");
const apex_organization_entity_1 = require("../../apex-organizations/entities/apex-organization.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let Organization = class Organization {
    id;
    name;
    code;
    apexOrgId;
    apexOrg;
    address;
    contactEmail;
    contactPhone;
    contactPersonName;
    contactPersonPhone;
    contactPersonEmail;
    bankName;
    accountName;
    accountNumber;
    sortCode;
    bankCode;
    status;
    createdBy;
    createdAt;
    updatedAt;
    users;
};
exports.Organization = Organization;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Organization.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], Organization.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'apex_org_id' }),
    __metadata("design:type", String)
], Organization.prototype, "apexOrgId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => apex_organization_entity_1.ApexOrganization, (apex) => apex.organizations),
    (0, typeorm_1.JoinColumn)({ name: 'apex_org_id' }),
    __metadata("design:type", apex_organization_entity_1.ApexOrganization)
], Organization.prototype, "apexOrg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'contact_email', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'contact_phone', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "contactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'contact_person_name', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "contactPersonName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'contact_person_phone', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "contactPersonPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'contact_person_email', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "contactPersonEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'bank_name', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'account_name', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "accountName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'account_number', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'sort_code', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "sortCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'bank_code', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "bankCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: status_enum_1.OrgStatus, default: status_enum_1.OrgStatus.ACTIVE }),
    __metadata("design:type", String)
], Organization.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Organization.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Organization.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_entity_1.User, (user) => user.organization),
    __metadata("design:type", Array)
], Organization.prototype, "users", void 0);
exports.Organization = Organization = __decorate([
    (0, typeorm_1.Entity)('organizations')
], Organization);
//# sourceMappingURL=organization.entity.js.map
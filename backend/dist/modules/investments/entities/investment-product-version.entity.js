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
exports.InvestmentProductVersion = void 0;
const typeorm_1 = require("typeorm");
const investment_product_entity_1 = require("./investment-product.entity");
let InvestmentProductVersion = class InvestmentProductVersion {
    id;
    productId;
    product;
    version;
    snapshot;
    changeSummary;
    changedBy;
    createdAt;
};
exports.InvestmentProductVersion = InvestmentProductVersion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InvestmentProductVersion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id' }),
    __metadata("design:type", String)
], InvestmentProductVersion.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => investment_product_entity_1.InvestmentProduct),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", investment_product_entity_1.InvestmentProduct)
], InvestmentProductVersion.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InvestmentProductVersion.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'snapshot' }),
    __metadata("design:type", Object)
], InvestmentProductVersion.prototype, "snapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'change_summary', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProductVersion.prototype, "changeSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'changed_by', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProductVersion.prototype, "changedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InvestmentProductVersion.prototype, "createdAt", void 0);
exports.InvestmentProductVersion = InvestmentProductVersion = __decorate([
    (0, typeorm_1.Entity)('investment_product_versions')
], InvestmentProductVersion);
//# sourceMappingURL=investment-product-version.entity.js.map
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
exports.BnplCatalogItem = void 0;
const typeorm_1 = require("typeorm");
const bnpl_plan_entity_1 = require("./bnpl-plan.entity");
const bnpl_catalog_image_entity_1 = require("./bnpl-catalog-image.entity");
let BnplCatalogItem = class BnplCatalogItem {
    id;
    name;
    description;
    price;
    imageUrl;
    createdBy;
    isGlobal;
    status;
    createdAt;
    updatedAt;
    plans;
    images;
};
exports.BnplCatalogItem = BnplCatalogItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BnplCatalogItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], BnplCatalogItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BnplCatalogItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], BnplCatalogItem.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'image_url', nullable: true }),
    __metadata("design:type", String)
], BnplCatalogItem.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], BnplCatalogItem.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_global', default: true }),
    __metadata("design:type", Boolean)
], BnplCatalogItem.prototype, "isGlobal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'active' }),
    __metadata("design:type", String)
], BnplCatalogItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BnplCatalogItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BnplCatalogItem.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bnpl_plan_entity_1.BnplPlan, (plan) => plan.catalogItem),
    __metadata("design:type", Array)
], BnplCatalogItem.prototype, "plans", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bnpl_catalog_image_entity_1.BnplCatalogImage, (img) => img.catalogItem, { cascade: true }),
    __metadata("design:type", Array)
], BnplCatalogItem.prototype, "images", void 0);
exports.BnplCatalogItem = BnplCatalogItem = __decorate([
    (0, typeorm_1.Entity)('bnpl_catalog_items')
], BnplCatalogItem);
//# sourceMappingURL=bnpl-catalog-item.entity.js.map
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
exports.BnplCatalogImage = void 0;
const typeorm_1 = require("typeorm");
const bnpl_catalog_item_entity_1 = require("./bnpl-catalog-item.entity");
let BnplCatalogImage = class BnplCatalogImage {
    id;
    catalogItemId;
    catalogItem;
    url;
    sortOrder;
    createdAt;
};
exports.BnplCatalogImage = BnplCatalogImage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BnplCatalogImage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'catalog_item_id' }),
    __metadata("design:type", String)
], BnplCatalogImage.prototype, "catalogItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bnpl_catalog_item_entity_1.BnplCatalogItem, (item) => item.images, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'catalog_item_id' }),
    __metadata("design:type", bnpl_catalog_item_entity_1.BnplCatalogItem)
], BnplCatalogImage.prototype, "catalogItem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], BnplCatalogImage.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'sort_order', default: 0 }),
    __metadata("design:type", Number)
], BnplCatalogImage.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BnplCatalogImage.prototype, "createdAt", void 0);
exports.BnplCatalogImage = BnplCatalogImage = __decorate([
    (0, typeorm_1.Entity)('bnpl_catalog_images')
], BnplCatalogImage);
//# sourceMappingURL=bnpl-catalog-image.entity.js.map
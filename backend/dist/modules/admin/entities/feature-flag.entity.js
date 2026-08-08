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
exports.FeatureFlag = exports.FeatureFlagStatus = exports.FeatureFlagEnvironment = void 0;
const typeorm_1 = require("typeorm");
var FeatureFlagEnvironment;
(function (FeatureFlagEnvironment) {
    FeatureFlagEnvironment["DEVELOPMENT"] = "development";
    FeatureFlagEnvironment["STAGING"] = "staging";
    FeatureFlagEnvironment["PRODUCTION"] = "production";
})(FeatureFlagEnvironment || (exports.FeatureFlagEnvironment = FeatureFlagEnvironment = {}));
var FeatureFlagStatus;
(function (FeatureFlagStatus) {
    FeatureFlagStatus["ENABLED"] = "enabled";
    FeatureFlagStatus["DISABLED"] = "disabled";
    FeatureFlagStatus["ROLLING_OUT"] = "rolling_out";
    FeatureFlagStatus["DEPRECATED"] = "deprecated";
})(FeatureFlagStatus || (exports.FeatureFlagStatus = FeatureFlagStatus = {}));
let FeatureFlag = class FeatureFlag {
    id;
    key;
    name;
    description;
    status;
    environments;
    cohortRules;
    rolloutPercentage;
    createdBy;
    updatedBy;
    enabledAt;
    isKillSwitch;
    metadata;
    createdAt;
    updatedAt;
};
exports.FeatureFlag = FeatureFlag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FeatureFlag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], FeatureFlag.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FeatureFlag.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FeatureFlag.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FeatureFlagStatus,
        default: FeatureFlagStatus.DISABLED,
    }),
    __metadata("design:type", String)
], FeatureFlag.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'environments', default: {} }),
    __metadata("design:type", Object)
], FeatureFlag.prototype, "environments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'cohort_rules', nullable: true }),
    __metadata("design:type", Object)
], FeatureFlag.prototype, "cohortRules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'rollout_percentage', default: 0 }),
    __metadata("design:type", Number)
], FeatureFlag.prototype, "rolloutPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], FeatureFlag.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'updated_by', nullable: true }),
    __metadata("design:type", String)
], FeatureFlag.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'enabled_at', nullable: true }),
    __metadata("design:type", Date)
], FeatureFlag.prototype, "enabledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_kill_switch', default: false }),
    __metadata("design:type", Boolean)
], FeatureFlag.prototype, "isKillSwitch", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'metadata', nullable: true }),
    __metadata("design:type", Object)
], FeatureFlag.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], FeatureFlag.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], FeatureFlag.prototype, "updatedAt", void 0);
exports.FeatureFlag = FeatureFlag = __decorate([
    (0, typeorm_1.Entity)('feature_flags')
], FeatureFlag);
//# sourceMappingURL=feature-flag.entity.js.map
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
exports.Incident = exports.IncidentSource = exports.IncidentStatus = exports.IncidentSeverity = void 0;
const typeorm_1 = require("typeorm");
var IncidentSeverity;
(function (IncidentSeverity) {
    IncidentSeverity["CRITICAL"] = "critical";
    IncidentSeverity["HIGH"] = "high";
    IncidentSeverity["MEDIUM"] = "medium";
    IncidentSeverity["LOW"] = "low";
})(IncidentSeverity || (exports.IncidentSeverity = IncidentSeverity = {}));
var IncidentStatus;
(function (IncidentStatus) {
    IncidentStatus["DETECTED"] = "detected";
    IncidentStatus["INVESTIGATING"] = "investigating";
    IncidentStatus["MITIGATED"] = "mitigated";
    IncidentStatus["RESOLVED"] = "resolved";
    IncidentStatus["CLOSED"] = "closed";
})(IncidentStatus || (exports.IncidentStatus = IncidentStatus = {}));
var IncidentSource;
(function (IncidentSource) {
    IncidentSource["MONITORING"] = "monitoring";
    IncidentSource["USER_REPORTED"] = "user_reported";
    IncidentSource["SYSTEM_ALERT"] = "system_alert";
    IncidentSource["PAYMENT_FAILURE"] = "payment_failure";
    IncidentSource["SECURITY"] = "security";
    IncidentSource["PERFORMANCE"] = "performance";
})(IncidentSource || (exports.IncidentSource = IncidentSource = {}));
let Incident = class Incident {
    id;
    title;
    description;
    severity;
    status;
    source;
    tenantId;
    affectedSystems;
    metrics;
    resolutionSteps;
    assignedTo;
    reportedBy;
    resolvedBy;
    detectedAt;
    resolvedAt;
    rootCause;
    actionItems;
    createdAt;
    updatedAt;
};
exports.Incident = Incident;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Incident.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Incident.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Incident.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IncidentSeverity,
    }),
    __metadata("design:type", String)
], Incident.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IncidentStatus,
        default: IncidentStatus.DETECTED,
    }),
    __metadata("design:type", String)
], Incident.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IncidentSource,
        name: 'source',
    }),
    __metadata("design:type", String)
], Incident.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'tenant_id', nullable: true }),
    __metadata("design:type", String)
], Incident.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'affected_systems', nullable: true }),
    __metadata("design:type", Array)
], Incident.prototype, "affectedSystems", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'metrics', nullable: true }),
    __metadata("design:type", Object)
], Incident.prototype, "metrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'resolution_steps', nullable: true }),
    __metadata("design:type", Array)
], Incident.prototype, "resolutionSteps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'assigned_to', nullable: true }),
    __metadata("design:type", String)
], Incident.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reported_by' }),
    __metadata("design:type", String)
], Incident.prototype, "reportedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'resolved_by', nullable: true }),
    __metadata("design:type", String)
], Incident.prototype, "resolvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'detected_at', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Incident.prototype, "detectedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'resolved_at', nullable: true }),
    __metadata("design:type", Date)
], Incident.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'root_cause', nullable: true }),
    __metadata("design:type", String)
], Incident.prototype, "rootCause", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'action_items', nullable: true }),
    __metadata("design:type", String)
], Incident.prototype, "actionItems", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Incident.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Incident.prototype, "updatedAt", void 0);
exports.Incident = Incident = __decorate([
    (0, typeorm_1.Entity)('incidents')
], Incident);
//# sourceMappingURL=incident.entity.js.map
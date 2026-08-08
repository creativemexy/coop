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
exports.FeePotService = void 0;
const common_1 = require("@nestjs/common");
const fee_share_service_1 = require("./fee-share.service");
let FeePotService = class FeePotService {
    feeShareService;
    constructor(feeShareService) {
        this.feeShareService = feeShareService;
    }
    async getPots() {
        return this.feeShareService.getPots();
    }
    async listBanks() {
        return this.feeShareService.listBanks();
    }
    async getFeeShareLedger() {
        return this.feeShareService.getFeeShareLedger();
    }
    async getScopedFeeSummary(ctx) {
        return this.feeShareService.getScopedFeeSummary(ctx);
    }
    async withdrawShare(ctx) {
        return this.feeShareService.withdrawShare(ctx);
    }
    async withdrawAdmin(dto) {
        return this.feeShareService.withdrawAdmin(dto);
    }
    async requestPlatformWithdrawal(userId, dto) {
        return this.feeShareService.requestPlatformWithdrawal(userId, dto);
    }
    async getWithdrawalRequests() {
        return this.feeShareService.getWithdrawalRequests();
    }
    async approveWithdrawal(id, approvedBy, dto) {
        return this.feeShareService.approveWithdrawal(id, approvedBy, dto);
    }
    async rejectWithdrawal(id) {
        return this.feeShareService.rejectWithdrawal(id);
    }
};
exports.FeePotService = FeePotService;
exports.FeePotService = FeePotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fee_share_service_1.FeeShareService])
], FeePotService);
//# sourceMappingURL=fee-pot.service.js.map
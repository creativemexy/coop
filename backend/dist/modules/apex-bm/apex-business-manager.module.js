"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApexBusinessManagerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const apex_business_manager_controller_1 = require("./apex-business-manager.controller");
const apex_business_manager_service_1 = require("./apex-business-manager.service");
const apex_organization_entity_1 = require("../apex-organizations/entities/apex-organization.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const user_entity_1 = require("../users/entities/user.entity");
const fee_share_ledger_entity_1 = require("../ledger/entities/fee-share-ledger.entity");
const fee_pot_entity_1 = require("../ledger/entities/fee-pot.entity");
let ApexBusinessManagerModule = class ApexBusinessManagerModule {
};
exports.ApexBusinessManagerModule = ApexBusinessManagerModule;
exports.ApexBusinessManagerModule = ApexBusinessManagerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([apex_organization_entity_1.ApexOrganization, organization_entity_1.Organization, user_entity_1.User, fee_share_ledger_entity_1.FeeShareLedger, fee_pot_entity_1.FeePot]),
        ],
        controllers: [apex_business_manager_controller_1.ApexBusinessManagerController],
        providers: [apex_business_manager_service_1.ApexBusinessManagerService],
    })
], ApexBusinessManagerModule);
//# sourceMappingURL=apex-business-manager.module.js.map
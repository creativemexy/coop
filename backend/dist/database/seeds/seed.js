"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const typeorm_1 = require("typeorm");
const app_module_1 = require("../../app.module");
const seed_business_manager_1 = require("./seed-business-manager");
const seed_accounts_1 = require("./seed-accounts");
const seed_demo_data_1 = require("./seed-demo-data");
const seed_settings_1 = require("./seed-settings");
const seed_catalog_1 = require("./seed-catalog");
const seed_savings_1 = require("./seed-savings");
const seed_loans_1 = require("./seed-loans");
const seed_apex_business_manager_1 = require("./seed-apex-business-manager");
const seed_org_business_managers_1 = require("./seed-org-business-managers");
const seed_catalog_images_1 = require("./seed-catalog-images");
const seed_global_risk_rules_1 = require("./seed-global-risk-rules");
const seed_notification_templates_1 = require("./seed-notification-templates");
const seed_investment_governance_1 = require("./seed-investment-governance");
const seed_investment_augment_1 = require("./seed-investment-augment");
const seed_policy_templates_1 = require("./seed-policy-templates");
const seed_accountant_data_1 = require("./seed-accountant-data");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const dataSource = app.get(typeorm_1.DataSource);
    try {
        console.log('Starting seed...\n');
        await (0, seed_business_manager_1.seedBusinessManager)(dataSource);
        await (0, seed_accounts_1.seedChartOfAccounts)(dataSource);
        await (0, seed_demo_data_1.seedDemoData)(dataSource);
        await (0, seed_settings_1.seedSettings)(dataSource);
        await (0, seed_catalog_1.seedCatalog)(dataSource);
        await (0, seed_savings_1.seedSavings)(dataSource);
        await (0, seed_loans_1.seedLoans)(dataSource);
        await (0, seed_apex_business_manager_1.seedApexBusinessManager)(dataSource);
        await (0, seed_org_business_managers_1.seedOrgBusinessManagers)(dataSource);
        await (0, seed_catalog_images_1.seedCatalogImages)(dataSource);
        await (0, seed_global_risk_rules_1.seedGlobalRiskRules)(dataSource);
        await (0, seed_notification_templates_1.seedNotificationTemplates)(dataSource);
        await (0, seed_investment_governance_1.seedInvestmentGovernance)(dataSource);
        await (0, seed_investment_augment_1.augmentInvestmentGovernance)(dataSource);
        await (0, seed_policy_templates_1.seedPolicyTemplates)(dataSource);
        await (0, seed_accountant_data_1.seedAccountantData)(dataSource);
        console.log('\nAll seeds completed successfully');
    }
    catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=seed.js.map
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { seedBusinessManager } from './seed-business-manager';
import { seedChartOfAccounts } from './seed-accounts';
import { seedDemoData } from './seed-demo-data';
import { seedSettings } from './seed-settings';
import { seedCatalog } from './seed-catalog';
import { seedSavings } from './seed-savings';
import { seedLoans } from './seed-loans';
import { seedApexBusinessManager } from './seed-apex-business-manager';
import { seedOrgBusinessManagers } from './seed-org-business-managers';
import { seedCatalogImages } from './seed-catalog-images';
import { seedGlobalRiskRules } from './seed-global-risk-rules';
import { seedNotificationTemplates } from './seed-notification-templates';
import { seedInvestmentGovernance } from './seed-investment-governance';
import { augmentInvestmentGovernance } from './seed-investment-augment';
import { seedPolicyTemplates } from './seed-policy-templates';
import { seedAccountantData } from './seed-accountant-data';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('Starting seed...\n');

    await seedBusinessManager(dataSource);
    await seedChartOfAccounts(dataSource);
    await seedDemoData(dataSource);
    await seedSettings(dataSource);
    await seedCatalog(dataSource);
    await seedSavings(dataSource);
    await seedLoans(dataSource);
    await seedApexBusinessManager(dataSource);
    await seedOrgBusinessManagers(dataSource);
    await seedCatalogImages(dataSource);
    await seedGlobalRiskRules(dataSource);
    await seedNotificationTemplates(dataSource);
    await seedInvestmentGovernance(dataSource);
    await augmentInvestmentGovernance(dataSource);
    await seedPolicyTemplates(dataSource);
    await seedAccountantData(dataSource);

    console.log('\nAll seeds completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();

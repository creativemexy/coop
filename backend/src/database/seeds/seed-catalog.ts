import { DataSource } from 'typeorm';
import { BnplCatalogItem } from '../../modules/bnpl/entities/bnpl-catalog-item.entity';
import { BnplPlan, PlanStatus } from '../../modules/bnpl/entities/bnpl-plan.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

const demoCatalog = [
  { name: 'MacBook Pro 14"', description: 'Apple M3 Pro, 18GB RAM, 512GB SSD', price: 2_500_000 },
  { name: 'iPhone 16 Pro', description: 'Apple iPhone 16 Pro 256GB', price: 1_200_000 },
  { name: 'Samsung Galaxy S25', description: 'Samsung Galaxy S25 Ultra 512GB', price: 1_100_000 },
  { name: 'Sony WH-1000XM6', description: 'Wireless noise-cancelling headphones', price: 350_000 },
  { name: 'Dell XPS 16', description: 'Intel Ultra 9, 32GB RAM, 1TB SSD', price: 2_800_000 },
  { name: 'iPad Air M3', description: 'Apple iPad Air 11-inch M3 chip', price: 750_000 },
];

const demoPlans = [
  { downPaymentPercent: 20, installmentCount: 3, installmentFrequency: 'monthly', interestRate: 0, tenorOptions: [3], minPrincipal: 100000, maxPrincipal: 5000000 },
  { downPaymentPercent: 10, installmentCount: 6, installmentFrequency: 'monthly', interestRate: 5, tenorOptions: [6], minPrincipal: 100000, maxPrincipal: 5000000 },
  { downPaymentPercent: 0, installmentCount: 12, installmentFrequency: 'monthly', interestRate: 10, tenorOptions: [12], minPrincipal: 100000, maxPrincipal: 5000000 },
];

export async function seedCatalog(dataSource: DataSource): Promise<void> {
  const catalogRepo = dataSource.getRepository(BnplCatalogItem);
  const planRepo = dataSource.getRepository(BnplPlan);
  const orgRepo = dataSource.getRepository(Organization);

  const org = await orgRepo.findOne({ where: { code: 'ORG001' } });
  const superAdmin = await dataSource.getRepository(User).findOne({ where: { role: Role.SUPER_ADMIN } });
  const createdBy = superAdmin?.id as string;

  for (const item of demoCatalog) {
    let saved = await catalogRepo.findOne({ where: { name: item.name } });
    if (!saved) {
      saved = await catalogRepo.save({
        ...item,
        createdBy,
        status: 'active',
        isGlobal: true,
      });
      console.log(`Catalog item created: ${saved.name} (₦${saved.price})`);
    }

    const existingPlans = await planRepo.find({ where: { catalogItemId: saved.id } });
    if (existingPlans.length > 0) {
      console.log(`  Plans already exist for: ${saved.name} (${existingPlans.length})`);
      continue;
    }

    for (const plan of demoPlans) {
      const entity = planRepo.create({
        ...plan,
        catalogItem: saved,
        organizationId: org?.id,
        createdBy,
        status: PlanStatus.ACTIVE,
      });
      await planRepo.save(entity);
    }
    console.log(`  3 plans created for: ${saved.name}`);
  }

  console.log('Catalog and plans seeded successfully');
}

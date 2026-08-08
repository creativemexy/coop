import { DataSource } from 'typeorm';
import { GlobalRiskRule } from '../../modules/admin/entities/global-risk-rule.entity';

const DEFAULT_RULES = [
  {
    ruleKey: 'max_single_withdrawal',
    description: 'Maximum amount allowed per single withdrawal from savings',
    enabled: true,
    config: { amount: 500000 },
  },
  {
    ruleKey: 'max_daily_withdrawal_total',
    description: 'Total withdrawal amount allowed per day per user',
    enabled: true,
    config: { amount: 1000000 },
  },
  {
    ruleKey: 'min_savings_balance',
    description: 'Minimum balance that must remain in savings after a withdrawal',
    enabled: true,
    config: { amount: 0 },
  },
  {
    ruleKey: 'max_single_deposit',
    description: 'Maximum amount allowed per single deposit to savings',
    enabled: true,
    config: { amount: 5000000 },
  },
  {
    ruleKey: 'max_daily_deposit_total',
    description: 'Total deposit amount allowed per day per user',
    enabled: true,
    config: { amount: 10000000 },
  },
  {
    ruleKey: 'max_loan_amount',
    description: 'Maximum principal amount for any loan',
    enabled: true,
    config: { amount: 5000000 },
  },
  {
    ruleKey: 'min_loan_amount',
    description: 'Minimum principal amount for any loan',
    enabled: true,
    config: { amount: 10000 },
  },
  {
    ruleKey: 'max_loan_duration_months',
    description: 'Maximum repayment duration in months for a loan',
    enabled: true,
    config: { months: 12 },
  },
  {
    ruleKey: 'min_savings_for_loan',
    description: 'Minimum savings balance required before user can apply for a loan',
    enabled: true,
    config: { amount: 50000 },
  },
  {
    ruleKey: 'loan_interest_rate',
    description: 'Default annual interest rate percentage for loans',
    enabled: true,
    config: { rate: 5 },
  },
  {
    ruleKey: 'max_payment_amount',
    description: 'Maximum amount for a single payment transaction',
    enabled: true,
    config: { amount: 10000000 },
  },
  {
    ruleKey: 'max_subscription_amount',
    description: 'Maximum total amount for a BNPL subscription order',
    enabled: true,
    config: { amount: 10000000 },
  },
  {
    ruleKey: 'min_deposit_amount',
    description: 'Minimum amount allowed per deposit to savings',
    enabled: true,
    config: { amount: 100 },
  },
  {
    ruleKey: 'max_daily_loan_applications',
    description: 'Maximum number of loan applications allowed per day per user',
    enabled: true,
    config: { count: 3 },
  },
];

export async function seedGlobalRiskRules(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(GlobalRiskRule);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('Global risk rules already seeded, skipping');
    return;
  }

  for (const rule of DEFAULT_RULES) {
    await repo.save(repo.create(rule));
  }

  console.log(`Seeded ${DEFAULT_RULES.length} global risk rules`);
}

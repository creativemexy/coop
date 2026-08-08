import { DataSource } from 'typeorm';
import { AccountType } from '../../common/enums/status.enum';
import { Account } from '../../modules/ledger/entities/account.entity';

interface AccountSeed {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  isSystem?: boolean;
}

const defaultAccounts: AccountSeed[] = [
  // ─── Assets ───────────────────────────────────────────────────
  { code: '1000', name: 'Cash', type: AccountType.ASSET, isSystem: true, description: 'Physical cash on hand and petty cash floats.' },
  { code: '1010', name: 'Bank Account - Main Operations', type: AccountType.ASSET, description: 'Primary operating bank account for day-to-day settlements.' },
  { code: '1020', name: 'Bank Account - Paystack Settlement', type: AccountType.ASSET, description: 'Holds funds settled by Paystack before distribution to fee pots.' },
  { code: '1030', name: 'Bank Account - Investment Sweep', type: AccountType.ASSET, description: 'Bank account backing pooled and fixed-income investment products.' },
  { code: '1100', name: 'Bank Account', type: AccountType.ASSET, isSystem: true, description: 'General bank account used for settlements and operations.' },
  { code: '1200', name: 'Accounts Receivable', type: AccountType.ASSET, isSystem: true, description: 'Amounts owed to the platform by customers and merchants.' },
  { code: '1110', name: 'BNPL Loans Receivable', type: AccountType.ASSET, description: 'Principal outstanding on BNPL and micro-loan facilities.' },
  { code: '1120', name: 'Accrued Interest Receivable', type: AccountType.ASSET, description: 'Interest income earned but not yet received or invoiced.' },
  { code: '1130', name: 'Fee Receivable from Tenants', type: AccountType.ASSET, description: 'Fee share owed by tenant organizations to the platform.' },
  { code: '1240', name: 'Prepaid Expenses', type: AccountType.ASSET, description: 'Payments made in advance for services consumed over time.' },
  { code: '1300', name: 'Investment Securities', type: AccountType.ASSET, description: 'Marketable securities and pooled investment holdings.' },
  { code: '1400', name: 'Allowance for Credit Losses', type: AccountType.ASSET, description: 'Contra-asset reserving expected credit losses on receivables.' },
  { code: '1500', name: 'Intercompany Receivable', type: AccountType.ASSET, description: 'Funds owed between group entities.' },

  // ─── Liabilities ──────────────────────────────────────────────
  { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, isSystem: true, description: 'Amounts owed to suppliers and vendors.' },
  { code: '2100', name: 'BNPL Revenue Liability', type: AccountType.LIABILITY, isSystem: true, description: 'Unearned BNPL fees recognised as liabilities until earned.' },
  { code: '2110', name: 'Member Deposits & Savings', type: AccountType.LIABILITY, description: 'Customer savings and deposits held by the platform.' },
  { code: '2120', name: 'Unearned Revenue', type: AccountType.LIABILITY, description: 'Revenue received in advance and not yet earned.' },
  { code: '2130', name: 'Fee Pots Payable', type: AccountType.LIABILITY, description: 'Accumulated fee shares owed to fee pots and their stakeholders.' },
  { code: '2200', name: 'Accrued Expenses', type: AccountType.LIABILITY, description: 'Expenses incurred but not yet paid.' },
  { code: '2210', name: 'Interest Payable', type: AccountType.LIABILITY, description: 'Interest owed to members and lenders.' },
  { code: '2220', name: 'Withholding Tax Payable', type: AccountType.LIABILITY, description: 'WHT collected and due to the tax authority.' },
  { code: '2300', name: 'Intercompany Payable', type: AccountType.LIABILITY, description: 'Funds owed between group entities.' },

  // ─── Equity ───────────────────────────────────────────────────
  { code: '3000', name: 'Retained Earnings', type: AccountType.EQUITY, isSystem: true, description: 'Cumulative earnings retained in the business.' },
  { code: '3010', name: 'Share Capital', type: AccountType.EQUITY, description: 'Paid-in capital contributed by shareholders.' },
  { code: '3020', name: 'Current Year Earnings', type: AccountType.EQUITY, description: 'Net profit attributable to the current accounting period.' },
  { code: '3030', name: 'Appropriated Reserves', type: AccountType.EQUITY, description: 'Earnings set aside for defined purposes.' },

  // ─── Revenue ──────────────────────────────────────────────────
  { code: '4000', name: 'BNPL Fee Revenue', type: AccountType.REVENUE, isSystem: true, description: 'Fees earned from BNPL facilities.' },
  { code: '4100', name: 'Platform Fee Revenue', type: AccountType.REVENUE, isSystem: true, description: 'Platform usage and subscription fees.' },
  { code: '4200', name: 'Registration Fee Revenue', type: AccountType.REVENUE, isSystem: true, description: 'One-time member and organization registration fees.' },
  { code: '4300', name: 'Interest Income - BNPL', type: AccountType.REVENUE, description: 'Interest earned on BNPL and loan principal.' },
  { code: '4310', name: 'Late Fee Income', type: AccountType.REVENUE, description: 'Penalty and late-payment fees collected.' },
  { code: '4320', name: 'Investment Income', type: AccountType.REVENUE, description: 'Returns from pooled and fixed-income investments.' },
  { code: '4330', name: 'Merchant Commission Revenue', type: AccountType.REVENUE, description: 'Commission earned from merchant sales.' },
  { code: '4340', name: 'Withdrawal & Payout Fee Revenue', type: AccountType.REVENUE, description: 'Fees charged on withdrawals and payouts.' },

  // ─── Expenses ─────────────────────────────────────────────────
  { code: '5000', name: 'Operating Expenses', type: AccountType.EXPENSE, isSystem: true, description: 'General day-to-day operating costs.' },
  { code: '5100', name: 'Payout Expenses', type: AccountType.EXPENSE, isSystem: true, description: 'Costs incurred when disbursing payouts.' },
  { code: '5200', name: 'Processing Fees', type: AccountType.EXPENSE, isSystem: true, description: 'Payment and transaction processing charges.' },
  { code: '5210', name: 'Payment Gateway Fees', type: AccountType.EXPENSE, description: 'Card, transfer and gateway transaction fees.' },
  { code: '5220', name: 'Bank Charges', type: AccountType.EXPENSE, description: 'Account maintenance and bank service charges.' },
  { code: '5300', name: 'Salaries & Wages', type: AccountType.EXPENSE, description: 'Staff compensation and benefits.' },
  { code: '5310', name: 'Marketing & Advertising', type: AccountType.EXPENSE, description: 'Customer acquisition and brand marketing spend.' },
  { code: '5320', name: 'Rent & Utilities', type: AccountType.EXPENSE, description: 'Office rent and utility bills.' },
  { code: '5330', name: 'Software & Subscriptions', type: AccountType.EXPENSE, description: 'SaaS and infrastructure subscriptions.' },
  { code: '5400', name: 'Depreciation & Amortisation', type: AccountType.EXPENSE, description: 'Systematic allocation of fixed asset and intangible costs.' },
  { code: '5410', name: 'Allowance for Bad Debts', type: AccountType.EXPENSE, description: 'Charges recognising expected uncollectible receivables.' },
  { code: '5500', name: 'Tax Expense', type: AccountType.EXPENSE, description: 'Corporate income tax and other tax charges.' },
];

export async function seedChartOfAccounts(
  dataSource: DataSource,
): Promise<void> {
  const accountRepo = dataSource.getRepository(Account);

  for (const account of defaultAccounts) {
    const existing = await accountRepo.findOne({
      where: { code: account.code },
    });
    if (!existing) {
      await accountRepo.save(
        accountRepo.create({
          code: account.code,
          name: account.name,
          type: account.type,
          description: account.description,
          isSystem: account.isSystem ?? false,
        }),
      );
      console.log(`Account created: ${account.code} - ${account.name}`);
    }
  }

  console.log('Chart of accounts seeded successfully');
}

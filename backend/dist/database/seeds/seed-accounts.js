"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedChartOfAccounts = seedChartOfAccounts;
const status_enum_1 = require("../../common/enums/status.enum");
const account_entity_1 = require("../../modules/ledger/entities/account.entity");
const defaultAccounts = [
    { code: '1000', name: 'Cash', type: status_enum_1.AccountType.ASSET, isSystem: true, description: 'Physical cash on hand and petty cash floats.' },
    { code: '1010', name: 'Bank Account - Main Operations', type: status_enum_1.AccountType.ASSET, description: 'Primary operating bank account for day-to-day settlements.' },
    { code: '1020', name: 'Bank Account - Paystack Settlement', type: status_enum_1.AccountType.ASSET, description: 'Holds funds settled by Paystack before distribution to fee pots.' },
    { code: '1030', name: 'Bank Account - Investment Sweep', type: status_enum_1.AccountType.ASSET, description: 'Bank account backing pooled and fixed-income investment products.' },
    { code: '1100', name: 'Bank Account', type: status_enum_1.AccountType.ASSET, isSystem: true, description: 'General bank account used for settlements and operations.' },
    { code: '1200', name: 'Accounts Receivable', type: status_enum_1.AccountType.ASSET, isSystem: true, description: 'Amounts owed to the platform by customers and merchants.' },
    { code: '1110', name: 'BNPL Loans Receivable', type: status_enum_1.AccountType.ASSET, description: 'Principal outstanding on BNPL and micro-loan facilities.' },
    { code: '1120', name: 'Accrued Interest Receivable', type: status_enum_1.AccountType.ASSET, description: 'Interest income earned but not yet received or invoiced.' },
    { code: '1130', name: 'Fee Receivable from Tenants', type: status_enum_1.AccountType.ASSET, description: 'Fee share owed by tenant organizations to the platform.' },
    { code: '1240', name: 'Prepaid Expenses', type: status_enum_1.AccountType.ASSET, description: 'Payments made in advance for services consumed over time.' },
    { code: '1300', name: 'Investment Securities', type: status_enum_1.AccountType.ASSET, description: 'Marketable securities and pooled investment holdings.' },
    { code: '1400', name: 'Allowance for Credit Losses', type: status_enum_1.AccountType.ASSET, description: 'Contra-asset reserving expected credit losses on receivables.' },
    { code: '1500', name: 'Intercompany Receivable', type: status_enum_1.AccountType.ASSET, description: 'Funds owed between group entities.' },
    { code: '2000', name: 'Accounts Payable', type: status_enum_1.AccountType.LIABILITY, isSystem: true, description: 'Amounts owed to suppliers and vendors.' },
    { code: '2100', name: 'BNPL Revenue Liability', type: status_enum_1.AccountType.LIABILITY, isSystem: true, description: 'Unearned BNPL fees recognised as liabilities until earned.' },
    { code: '2110', name: 'Member Deposits & Savings', type: status_enum_1.AccountType.LIABILITY, description: 'Customer savings and deposits held by the platform.' },
    { code: '2120', name: 'Unearned Revenue', type: status_enum_1.AccountType.LIABILITY, description: 'Revenue received in advance and not yet earned.' },
    { code: '2130', name: 'Fee Pots Payable', type: status_enum_1.AccountType.LIABILITY, description: 'Accumulated fee shares owed to fee pots and their stakeholders.' },
    { code: '2200', name: 'Accrued Expenses', type: status_enum_1.AccountType.LIABILITY, description: 'Expenses incurred but not yet paid.' },
    { code: '2210', name: 'Interest Payable', type: status_enum_1.AccountType.LIABILITY, description: 'Interest owed to members and lenders.' },
    { code: '2220', name: 'Withholding Tax Payable', type: status_enum_1.AccountType.LIABILITY, description: 'WHT collected and due to the tax authority.' },
    { code: '2300', name: 'Intercompany Payable', type: status_enum_1.AccountType.LIABILITY, description: 'Funds owed between group entities.' },
    { code: '3000', name: 'Retained Earnings', type: status_enum_1.AccountType.EQUITY, isSystem: true, description: 'Cumulative earnings retained in the business.' },
    { code: '3010', name: 'Share Capital', type: status_enum_1.AccountType.EQUITY, description: 'Paid-in capital contributed by shareholders.' },
    { code: '3020', name: 'Current Year Earnings', type: status_enum_1.AccountType.EQUITY, description: 'Net profit attributable to the current accounting period.' },
    { code: '3030', name: 'Appropriated Reserves', type: status_enum_1.AccountType.EQUITY, description: 'Earnings set aside for defined purposes.' },
    { code: '4000', name: 'BNPL Fee Revenue', type: status_enum_1.AccountType.REVENUE, isSystem: true, description: 'Fees earned from BNPL facilities.' },
    { code: '4100', name: 'Platform Fee Revenue', type: status_enum_1.AccountType.REVENUE, isSystem: true, description: 'Platform usage and subscription fees.' },
    { code: '4200', name: 'Registration Fee Revenue', type: status_enum_1.AccountType.REVENUE, isSystem: true, description: 'One-time member and organization registration fees.' },
    { code: '4300', name: 'Interest Income - BNPL', type: status_enum_1.AccountType.REVENUE, description: 'Interest earned on BNPL and loan principal.' },
    { code: '4310', name: 'Late Fee Income', type: status_enum_1.AccountType.REVENUE, description: 'Penalty and late-payment fees collected.' },
    { code: '4320', name: 'Investment Income', type: status_enum_1.AccountType.REVENUE, description: 'Returns from pooled and fixed-income investments.' },
    { code: '4330', name: 'Merchant Commission Revenue', type: status_enum_1.AccountType.REVENUE, description: 'Commission earned from merchant sales.' },
    { code: '4340', name: 'Withdrawal & Payout Fee Revenue', type: status_enum_1.AccountType.REVENUE, description: 'Fees charged on withdrawals and payouts.' },
    { code: '5000', name: 'Operating Expenses', type: status_enum_1.AccountType.EXPENSE, isSystem: true, description: 'General day-to-day operating costs.' },
    { code: '5100', name: 'Payout Expenses', type: status_enum_1.AccountType.EXPENSE, isSystem: true, description: 'Costs incurred when disbursing payouts.' },
    { code: '5200', name: 'Processing Fees', type: status_enum_1.AccountType.EXPENSE, isSystem: true, description: 'Payment and transaction processing charges.' },
    { code: '5210', name: 'Payment Gateway Fees', type: status_enum_1.AccountType.EXPENSE, description: 'Card, transfer and gateway transaction fees.' },
    { code: '5220', name: 'Bank Charges', type: status_enum_1.AccountType.EXPENSE, description: 'Account maintenance and bank service charges.' },
    { code: '5300', name: 'Salaries & Wages', type: status_enum_1.AccountType.EXPENSE, description: 'Staff compensation and benefits.' },
    { code: '5310', name: 'Marketing & Advertising', type: status_enum_1.AccountType.EXPENSE, description: 'Customer acquisition and brand marketing spend.' },
    { code: '5320', name: 'Rent & Utilities', type: status_enum_1.AccountType.EXPENSE, description: 'Office rent and utility bills.' },
    { code: '5330', name: 'Software & Subscriptions', type: status_enum_1.AccountType.EXPENSE, description: 'SaaS and infrastructure subscriptions.' },
    { code: '5400', name: 'Depreciation & Amortisation', type: status_enum_1.AccountType.EXPENSE, description: 'Systematic allocation of fixed asset and intangible costs.' },
    { code: '5410', name: 'Allowance for Bad Debts', type: status_enum_1.AccountType.EXPENSE, description: 'Charges recognising expected uncollectible receivables.' },
    { code: '5500', name: 'Tax Expense', type: status_enum_1.AccountType.EXPENSE, description: 'Corporate income tax and other tax charges.' },
];
async function seedChartOfAccounts(dataSource) {
    const accountRepo = dataSource.getRepository(account_entity_1.Account);
    for (const account of defaultAccounts) {
        const existing = await accountRepo.findOne({
            where: { code: account.code },
        });
        if (!existing) {
            await accountRepo.save(accountRepo.create({
                code: account.code,
                name: account.name,
                type: account.type,
                description: account.description,
                isSystem: account.isSystem ?? false,
            }));
            console.log(`Account created: ${account.code} - ${account.name}`);
        }
    }
    console.log('Chart of accounts seeded successfully');
}
//# sourceMappingURL=seed-accounts.js.map
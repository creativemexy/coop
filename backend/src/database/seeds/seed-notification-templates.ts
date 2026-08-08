import { DataSource } from 'typeorm';
import { NotificationTemplate, TemplateType } from '../../modules/admin/entities/notification-template.entity';

const TEMPLATES = [
  {
    key: 'welcome_email',
    type: TemplateType.EMAIL,
    subject: 'Welcome to {{platform_name}}',
    body: `Hi {{name}},

Welcome to {{platform_name}}! Your account has been successfully created.

You can now:
- Save and invest for your goals
- Apply for BNPL financing
- Track your portfolio and earnings

Get started by visiting your dashboard:
{{dashboard_url}}

Best,
The {{platform_name}} Team`,
    variables: ['name', 'platform_name', 'dashboard_url'],
  },
  {
    key: 'kyc_approved',
    type: TemplateType.EMAIL,
    subject: 'KYC Verification Approved',
    body: `Hi {{name}},

Your KYC verification has been approved. You now have full access to all platform features including withdrawals and loan applications.

Thank you for your cooperation.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'platform_name'],
  },
  {
    key: 'kyc_rejected',
    type: TemplateType.EMAIL,
    subject: 'KYC Verification Requires Attention',
    body: `Hi {{name}},

Your KYC verification was not approved.

Reason: {{reason}}

Please submit a new KYC application with the correct information.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'reason', 'platform_name'],
  },
  {
    key: 'deposit_confirmation',
    type: TemplateType.EMAIL,
    subject: 'Deposit Confirmed - {{amount}}',
    body: `Hi {{name}},

Your deposit of {{amount}} has been confirmed.

New balance: {{balance}}
Date: {{date}}

Thank you for saving with {{platform_name}}.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'amount', 'balance', 'date', 'platform_name'],
  },
  {
    key: 'withdrawal_confirmation',
    type: TemplateType.EMAIL,
    subject: 'Withdrawal Processed - {{amount}}',
    body: `Hi {{name}},

Your withdrawal of {{amount}} has been processed successfully.

New balance: {{balance}}
Date: {{date}}

Best,
The {{platform_name}} Team`,
    variables: ['name', 'amount', 'balance', 'date', 'platform_name'],
  },
  {
    key: 'loan_approved',
    type: TemplateType.EMAIL,
    subject: 'Loan Approved - {{amount}}',
    body: `Hi {{name}},

Congratulations! Your loan application for {{amount}} has been approved.

Loan Details:
- Amount: {{amount}}
- Duration: {{duration}} months
- Monthly Payment: {{monthly_payment}}
- Total Repayment: {{total_repayment}}

Funds will be disbursed to your account shortly.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'amount', 'duration', 'monthly_payment', 'total_repayment', 'platform_name'],
  },
  {
    key: 'payment_due_reminder',
    type: TemplateType.EMAIL,
    subject: 'Payment Due Reminder',
    body: `Hi {{name}},

This is a reminder that your payment of {{amount}} is due on {{due_date}}.

Please ensure your account has sufficient funds to avoid late fees.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'amount', 'due_date', 'platform_name'],
  },
  {
    key: 'payment_received',
    type: TemplateType.EMAIL,
    subject: 'Payment Received - {{amount}}',
    body: `Hi {{name}},

Your payment of {{amount}} has been received successfully.

Reference: {{reference}}
Date: {{date}}

Thank you for your prompt payment.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'amount', 'reference', 'date', 'platform_name'],
  },
  {
    key: 'subscription_settled',
    type: TemplateType.EMAIL,
    subject: 'BNPL Order Settled - {{item_name}}',
    body: `Hi {{name}},

Congratulations! Your BNPL order for {{item_name}} has been fully paid off.

Total paid: {{total_paid}}
Settled on: {{date}}

Thank you for choosing {{platform_name}}.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'item_name', 'total_paid', 'date', 'platform_name'],
  },
  {
    key: 'password_reset',
    type: TemplateType.EMAIL,
    subject: 'Reset Your Password',
    body: `Hi {{name}},

You recently requested to reset your password. Click the link below to set a new password:

{{reset_link}}

This link expires in 1 hour. If you did not request this, please ignore this email.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'reset_link', 'platform_name'],
  },
  {
    key: 'login_alert',
    type: TemplateType.EMAIL,
    subject: 'New Login to Your Account',
    body: `Hi {{name}},

A new login was detected on your account.

Time: {{time}}
Device: {{device}}
Location: {{location}}

If this was you, no action is needed. If not, please secure your account immediately.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'time', 'device', 'location', 'platform_name'],
  },
  {
    key: 'investment_matured',
    type: TemplateType.EMAIL,
    subject: 'Investment Matured - {{product_name}}',
    body: `Hi {{name}},

Your investment in {{product_name}} has matured.

Invested Amount: {{invested_amount}}
Returns: {{returns}}
Total Payout: {{total_payout}}

Funds have been credited to your wallet.

Best,
The {{platform_name}} Team`,
    variables: ['name', 'product_name', 'invested_amount', 'returns', 'total_payout', 'platform_name'],
  },
  {
    key: 'referral_bonus',
    type: TemplateType.EMAIL,
    subject: 'Referral Bonus Earned!',
    body: `Hi {{name}},

Great news! You earned a referral bonus of {{bonus_amount}} because {{referred_name}} just joined {{platform_name}}.

Keep sharing your referral link to earn more:
{{referral_link}}

Best,
The {{platform_name}} Team`,
    variables: ['name', 'bonus_amount', 'referred_name', 'referral_link', 'platform_name'],
  },
  {
    key: 'welcome_sms',
    type: TemplateType.SMS,
    subject: null,
    body: 'Welcome to {{platform_name}}, {{name}}! Your account is ready. Start saving and investing today.',
    variables: ['name', 'platform_name'],
  },
  {
    key: 'deposit_sms',
    type: TemplateType.SMS,
    subject: null,
    body: '{{platform_name}}: Deposit of {{amount}} confirmed. New balance: {{balance}}.',
    variables: ['amount', 'balance', 'platform_name'],
  },
  {
    key: 'otp_sms',
    type: TemplateType.SMS,
    subject: null,
    body: '{{platform_name}}: Your OTP is {{otp}}. Valid for 5 minutes.',
    variables: ['otp', 'platform_name'],
  },
];

export async function seedNotificationTemplates(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(NotificationTemplate);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('Notification templates already seeded, skipping');
    return;
  }

  for (const tpl of TEMPLATES) {
    await repo.save(repo.create(tpl));
  }

  console.log(`Seeded ${TEMPLATES.length} notification templates`);
}

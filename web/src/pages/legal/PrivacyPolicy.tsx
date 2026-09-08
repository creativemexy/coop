import { LegalPage } from './LegalPage'

const sections = [
  {
    title: '1. Introduction',
    body: 'The Cooperative respects your privacy and is committed to protecting the personal data you entrust to us. This Privacy Policy explains what information we collect, why we collect it, how we use, store, and share it, and the rights you have over it. It applies to the Coop BNPL platform, our website, and the Coop BNPL mobile app.',
  },
  {
    title: '2. Who we are & how to contact us',
    body: '"The Cooperative", "we", "us" or "our" refers to the entity operating Coop BNPL. We are based in the Federal Republic of Nigeria and are subject to the Nigeria Data Protection Regulation (NDPR) and other applicable law. For privacy questions, contact our Data Protection Officer at privacy@coop-bnpl.com or through the member support team in the app.',
  },
  {
    title: '3. Information we collect (data minimisation)',
    body: 'We only collect the information needed to provide our services, comply with the law, and keep your account secure. We do not collect data "just in case". Specifically, at each step we collect no more than:',
    items: [
      'Registration: your name, one contact identifier (email and/or phone number), a password, and the cooperative you are joining (where applicable).',
      'KYC verification: proof of identity and supporting documents required by anti-money-laundering rules and provider specifications (verified through Korapay).',
      'Transactions: payment method, amounts, dates, and references needed to operate your savings, BNPL, loans and investments.',
      'Security: device information, IP address and login history to detect and prevent fraud, as set out in the platform security policy.',
      'Support: whatever you choose to share when creating a ticket or contacting us.',
    ],
  },
  {
    title: '4. Why we collect this information',
    body: 'Each piece of data we hold serves a specific purpose:',
    items: [
      'Fulfilling our contract with you (operating your account, savings, BNPL plans, loans and investments).',
      'Complying with legal and regulatory obligations (KYC, anti-money-laundering, record-keeping, tax).',
      'Securing your account and the platform (authentication, fraud prevention, monitoring).',
      'Improving our products with your consent where we do so.',
      'Service and transaction messaging (alerts, receipts, statements).',
    ],
  },
  {
    title: '5. Lawful basis for processing',
    body: 'We process personal data on the basis of contract (membership and service agreements), legal obligation (KYC and financial regulation), legitimate interests (security and fraud prevention), and consent (optional marketing and advertising, which you can withdraw at any time).',
  },
  {
    title: '6. How we share your data',
    body: 'We never sell your personal data. We share it only with service providers who need it to operate the platform, under contracts that oblige them to protect it:',
    items: [
      'Paystack — card and bank payment processing and reconciliation.',
      'Korapay — identity verification (KYC).',
      'FirstCheckout — virtual bank accounts and deposit collection.',
      'Termii and our email provider — SMS and email delivery.',
      'Google (mobile app only) — advertising where you have consented. The mobile app can show ads; if you opt out, no ads are served and no ad data is collected. See the Cookie Policy.',
    ],
  },
  {
    title: '7. Cookies, local storage & tracking',
    body: 'The web console sets no advertising, analytics or marketing cookies. We use a strictly-necessary security cookie (CSRF protection), and your tokens are stored in your browser\u2019s local storage so you stay signed in. See our Cookie Policy for the full list and how to control them.',
  },
  {
    title: '8. How long we keep your data',
    body: 'We keep personal data only for as long as required by law or needed for the purpose it was collected, then delete or anonymise it. Retention periods are defined by platform policy and include: login history (90 days), device sessions (180 days), webhook logs (30 days), support tickets (365 days), KYC submissions (5 years, as required by regulation), and closed accounts (up to 2 years where law may require records). Transactions and audit records are kept according to financial record-keeping rules.',
  },
  {
    title: '9. Your rights',
    body: 'Subject to applicable law, you have the right to:',
    items: [
      'Access a copy of the personal data we hold about you.',
      'Request correction of inaccurate or incomplete data.',
      'Request deletion or restriction of processing where the law permits.',
      'Withdraw consent for optional processing (e.g. marketing, advertising).',
      'Lodge a complaint with the Nigeria Data Protection Commission if you believe your rights have been breached.',
    ],
  },
  {
    title: '10. How we protect your data',
    body: 'We use strong encryption for data in transit and at rest, including field-level encryption of personal identifiers in our database. Passwords are hashed, sessions use rotating tokens, and access is restricted by role and tenant. We monitor for suspicious activity and respond to security incidents in line with our incident management policy.',
  },
  {
    title: '11. Children',
    body: 'Our services are for individuals aged 18 and over. We do not knowingly collect data from children. If we learn that an account belongs to a minor, we will close it and delete the associated data in accordance with this policy.',
  },
  {
    title: '12. International transfers',
    body: 'Where we use service providers that operate outside Nigeria, we ensure appropriate safeguards are in place (such as contractual clauses and security assessments) before any personal data is transferred.',
  },
  {
    title: '13. Changes to this policy',
    body: 'We may update this policy as our services and legal obligations evolve. Material changes will be communicated through the platform. The "Effective date" at the top shows the latest version; continued use after the effective date means you accept the updated policy.',
  },
  {
    title: '14. Contact',
    body: 'Questions, requests, or complaints about your personal data can be sent to privacy@coop-bnpl.com. We aim to respond within 30 days.',
  },
]

export function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveDate="September 8, 2026"
      sections={sections}
    />
  )
}
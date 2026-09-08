import { LegalPage } from './LegalPage'

const sections = [
  {
    title: '1. Introduction',
    body: 'FENAC Cooperative Society Ltd. respects your privacy and protects the personal data entrusted to us. This policy explains what we collect, why we collect it, how we use and share it, how long we retain it, and the rights available to you. It applies to the FENAC COOP website, web platform, and mobile app.',
  },
  {
    title: '2. Who we are & how to contact us',
    body: '"FENAC COOP", "we", "us" and "our" mean FENAC Cooperative Society Ltd., also known as Forward Ever Apex Cooperative Society Ltd. We operate from Nigeria and process data under the Nigeria Data Protection Act 2023 and other applicable law. Contact our privacy team at hello@fenacoop.org.',
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
    body: 'We process personal data on the basis of contract, legal obligation, legitimate interests such as security and fraud prevention, and consent for optional marketing or advertising. You may withdraw consent at any time.',
  },
  {
    title: '6. How we share your data',
    body: 'We do not sell personal data. We disclose it only when necessary, with trusted processors that are required to protect it, or when disclosure is required by law:',
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
    body: 'The website currently uses only strictly necessary security cookies and browser storage for consent, authentication, and session security. We do not run optional analytics or advertising tracking on the website. See the Cookie Policy for details.',
  },
  {
    title: '8. How long we keep your data',
    body: 'We keep personal data only for as long as needed for the stated purpose or required by law, then securely delete or anonymise it. Retention periods are documented in our retention schedule; financial, KYC, tax, audit, and transaction records may be retained longer where a legal or regulatory duty requires it.',
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
    body: 'Questions, rights requests, or complaints about personal data can be sent to hello@fenacoop.org. Please provide enough information for us to verify your identity and locate your records. We aim to respond within the period required by applicable law.',
  },
]

export function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="Learn how FENAC COOP collects, uses, protects, shares, and retains personal data and how to exercise your privacy rights."
      effectiveDate="September 8, 2026"
      sections={sections}
    />
  )
}
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/card'

const sections = [
  {
    title: '1. Introduction',
    body: 'These Terms & Conditions ("Terms") govern your membership and use of the Coop BNPL digital platform and services (the "Platform"), operated by the Cooperative. By creating an account, you agree to be bound by these Terms, our Privacy Policy, and any other policies referenced herein. If you do not agree, do not register or use the Platform.',
  },
  {
    title: '2. Membership & Eligibility',
    body: [
      'Membership is open to individuals who are 18 years or older and legally capable of entering into binding agreements.',
      'You must provide accurate, current, and complete information during registration and keep it up to date.',
      'Each registration creates a single member account. Duplicate or fraudulent registrations are prohibited.',
      'Membership is subject to a one-time registration fee as set by the Cooperative from time to time. Your account becomes fully active once the fee is paid.',
    ],
  },
  {
    title: '3. Know Your Customer (KYC) & Verification',
    body: [
      'All members must complete KYC verification before accessing BNPL and certain financial services.',
      'You agree to provide valid identification and any supporting documents requested.',
      'Failure to complete or pass KYC verification may limit or prevent access to services.',
      'The Cooperative may decline, suspend, or revoke membership if verification fails or information is found to be false.',
    ],
  },
  {
    title: '4. BNPL (Buy Now, Pay Later) Services',
    body: [
      'BNPL credit limits and approvals are discretionary and subject to the Cooperative\u2019s credit assessment.',
      'Approved purchase plans are repaid in installments according to the schedule disclosed at checkout.',
      'You agree to make all payments by their due dates. Late payments may incur fees as disclosed in the plan and in line with applicable law.',
      'Defaulting on a plan may result in suspension of services, reporting to credit bureaus where permitted, and recovery action.',
    ],
  },
  {
    title: '5. Savings, Investments & Deposits',
    body: [
      'Savings deposits, withdrawals, and any investment products are subject to the terms of each specific product.',
      'Withdrawal and redemption timelines, minimums, and conditions are disclosed for each product.',
      'The Cooperative is not a deposit-taking institution unless licensed as one. Interest or returns, where offered, are subject to the terms of each product and prevailing policy.',
    ],
  },
  {
    title: '6. Registration Fee, Fees & Charges',
    body: [
      'The one-time membership registration fee is payable at registration unless waived.',
      'Other fees (late payment, transaction, withdrawal, etc.) are disclosed at the point of use and may be updated with notice.',
      'All payments must be made through approved channels. We are not responsible for unauthorised transactions arising from your negligence.',
    ],
  },
  {
    title: '7. Account Security & Credentials',
    body: [
      'You are responsible for safeguarding your login credentials, device, and any biometric or multi-factor authentication settings.',
      'Notify us immediately of any unauthorised access or suspected compromise.',
      'The Cooperative may require re-verification or suspend access when it suspects security risks.',
    ],
  },
  {
    title: '8. Acceptable Use & Prohibited Conduct',
    body: [
      'You agree not to use the Platform for any unlawful purpose, fraud, money laundering, or to violate the rights of others.',
      'You may not attempt to gain unauthorised access, interfere with, or reverse-engineer the Platform.',
      'The Cooperative reserves the right to investigate and take action, including termination of membership.',
    ],
  },
  {
    title: '9. Data Protection & Privacy',
    body: [
      'Personal data is processed in accordance with our Privacy Policy and applicable data protection laws.',
      'Your information may be shared with service providers, payment processors, and regulators where required.',
      'You may request access to, correction of, or deletion of your personal data subject to legal and operational obligations.',
    ],
  },
  {
    title: '10. Communication & Notifications',
    body: 'By registering, you consent to receive service notifications, transaction alerts, and updates by email, SMS, push, or in-app. You may manage marketing preferences, but transactional messages cannot be opted out of.',
  },
  {
    title: '11. Suspension, Termination & Exit',
    body: [
      'The Cooperative may suspend or terminate your account for breach of these Terms, suspected fraud, or inactivity as defined in policy.',
      'You may close your account at any time, subject to outstanding obligations being settled.',
      'On termination, you lose access to services; unclaimed balances are handled per Cooperative policy and applicable law.',
    ],
  },
  {
    title: '12. Limitation of Liability',
    body: [
      'The Platform and services are provided "as is" without warranties beyond those implied by law.',
      'To the maximum extent permitted by law, the Cooperative is not liable for indirect, incidental, or consequential losses.',
      'Nothing in these Terms excludes liability that cannot lawfully be excluded, including for fraud or gross negligence.',
    ],
  },
  {
    title: '13. Changes to These Terms',
    body: 'We may amend these Terms from time to time. Material changes will be communicated through the Platform. Continued use after changes take effect constitutes acceptance. Where required by law, we will seek your consent.',
  },
  {
    title: '14. Governing Law & Disputes',
    body: 'These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall first be referred to the Cooperative\u2019s internal dispute resolution process, then to mediation, and failing that, to the courts of competent jurisdiction.',
  },
  {
    title: '15. Contact',
    body: 'Questions about these Terms or your membership should be directed to the Cooperative\u2019s member support team through the Platform or the contact details provided on the official website.',
  },
]

export function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Card>
          <h1 className="text-2xl font-bold mb-1 dark:text-gray-100">Terms &amp; Conditions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Effective date: August 5, 2026</p>

          <div className="space-y-6">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-base font-semibold mb-2 dark:text-gray-100">{s.title}</h2>
                {Array.isArray(s.body) ? (
                  <ul className="list-disc pl-5 space-y-1.5">
                    {s.body.map((b, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.body}</p>
                )}
              </section>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <Link to="/register" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to Registration</Link>
            <Link to="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Sign In</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

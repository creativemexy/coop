import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, FileText, ShieldCheck, UsersRound } from 'lucide-react'

export const termsSections = [
  {
    title: '1. Introduction',
    body: 'These Terms of Service ("Terms") govern membership and use of the FENAC COOP website, digital platform, and services (the "Platform"), operated by FENAC Cooperative Society Ltd. By creating an account or using the Platform, you agree to these Terms, the Privacy Policy, and the Cookie Policy. If you do not agree, do not use the Platform.',
  },
  {
    title: '2. Membership and eligibility',
    body: [
      'Membership is available to eligible associations, clubs, NGOs, and other approved member organizations. Authorized representatives must be legally capable of entering into binding agreements.',
      'You must provide accurate, current, and complete information during registration and keep it up to date.',
      'Each registration creates a single member account. Duplicate or fraudulent registrations are prohibited.',
      'Membership is subject to a one-time registration fee as set by the Cooperative from time to time. Your account becomes fully active once the fee is paid.',
    ],
  },
  {
    title: '3. Know Your Customer (KYC) & Verification',
    body: [
      'Members must complete KYC and organization verification before accessing certain financial services.',
      'You agree to provide valid identification and any supporting documents requested.',
      'Failure to complete or pass KYC verification may limit or prevent access to services.',
      'The Cooperative may decline, suspend, or revoke membership if verification fails or information is found to be false.',
    ],
  },
  {
    title: '4. Digital financial services',
    body: [
      'Any financing or credit limits are discretionary and subject to FENAC assessment and the applicable product terms.',
      'Approved financial plans are repaid according to the schedule and terms disclosed before you accept them.',
      'You agree to make all payments by their due dates. Late payments may incur fees as disclosed in the plan and in line with applicable law.',
      'Default may result in suspension of services, reporting to credit bureaus where permitted, and lawful recovery action.',
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
    body: 'These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall first be referred to the Cooperative internal dispute resolution process, then to mediation, and failing that, to the courts of competent jurisdiction.',
  },
  {
    title: '15. Contact',
    body: 'Questions about these Terms or your membership should be directed to hello@fenacoop.org or the contact details provided on the official website.',
  },
]

const keyPoints = [
  {
    title: 'Member-First Terms',
    description: 'Our terms are designed to be fair, transparent, and focused on protecting member interests.',
    icon: UsersRound,
  },
  {
    title: 'Clear Communication',
    description: 'We provide advance notice of material changes and seek consent where required by law.',
    icon: FileText,
  },
  {
    title: 'Fair Dispute Resolution',
    description: 'Internal resolution and mediation processes before legal action.',
    icon: ShieldCheck,
  },
  {
    title: 'Your Rights Protected',
    description: 'Terms cannot exclude liabilities that cannot lawfully be excluded.',
    icon: CheckCircle2,
  },
]

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Service | FENAC COOP'
    const description = document.querySelector('meta[name="description"]')
    description?.setAttribute('content', 'Read the FENAC COOP Terms of Service covering membership, digital financial services, account security, privacy, and disputes.')
    const canonical = document.querySelector('link[rel="canonical"]')
    canonical?.setAttribute('href', window.location.href.split('?')[0])
  }, [])

  return (
    <div className="overflow-hidden bg-[#FFF9EF] text-[#23150F]">
      <section className="relative isolate overflow-hidden bg-[#20120E] text-[#FFF9EF]">
        <div className="absolute inset-0 bg-[#20120E]" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B100C]/95 via-[#25140D]/75 to-[#1B100C]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(247,183,51,0.22),_transparent_24%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#F7D674]/40 bg-[#20120E]/30 px-4 py-2 text-[0.68rem] font-bold tracking-[0.18em] text-[#F8CE68] uppercase backdrop-blur-sm">
              Legal
            </p>

            <h1 className="mt-6 text-5xl font-black leading-[0.96] tracking-[-0.05em] text-[#FFF9EF] sm:text-6xl xl:text-[5.3rem]">
              Terms of Service
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#F5E9D9]/90 sm:text-xl">
              Clear, fair terms that govern your membership and use of FENAC COOP services. We believe in transparency and member-first agreements.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-7 py-4 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
              >
                Accept and continue
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
              >
                Ask a question
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#176B5B]">Key principles</p>
            <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
              Terms designed for members.
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
            Our terms are written to be clear, fair, and focused on protecting member interests. We prioritize transparency and seek your consent for material changes.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {keyPoints.map((point) => {
            const Icon = point.icon
            return (
              <article
                key={point.title}
                className="rounded-[1.6rem] border border-[#EDE2D3] bg-white p-6 shadow-[0_8px_30px_rgba(79,43,17,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(79,43,17,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F0E5] text-[#176B5B]">
                  <Icon size={24} />
                </div>

                <h3 className="mt-5 text-lg font-black tracking-[-0.03em] text-[#2C1B13]">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B5245]">{point.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="bg-[#F0DDAD] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#9D4824]">Full terms</p>
            <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
              Complete Terms of Service
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#6B5245]">
              Effective date: September 8, 2026 · Last updated: September 8, 2026
            </p>
          </div>

          <div className="rounded-[1.8rem] border border-[#9D623A]/15 bg-[#FFF9EF] p-8 shadow-[0_12px_35px_rgba(79,43,17,0.05)] sm:p-12">
            <div className="space-y-8">
              {termsSections.map((section) => (
                <section key={section.title}>
                  <h3 className="text-lg font-black tracking-[-0.03em] text-[#2C1B13]">{section.title}</h3>
                  {Array.isArray(section.body) ? (
                    <ul className="mt-3 space-y-2">
                      {section.body.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-[#6B5245]">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9D4824]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{section.body}</p>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#176B5B] px-4 py-20 text-center text-[#FFF9EF] sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F7D674]">Need clarification?</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
          We are here to help you understand.
        </h2>
        <div className="mx-auto mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F7B733] px-8 py-4 text-sm font-bold text-[#28170E] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFE08B]"
          >
            Contact our team
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/privacy"
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
          >
            Privacy Policy
          </Link>
        </div>
      </section>
    </div>
  )
}
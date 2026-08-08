import { Link } from 'react-router-dom'
import { useBranding } from '../../stores/branding.store'

const benefits = [
  { title: 'Shared Ownership', description: 'Your membership gives you a voice and a stake in the cooperative.' },
  { title: 'Access to BNPL', description: 'Shop now and pay in installments, backed by your savings record.' },
  { title: 'Competitive Savings', description: 'Grow your savings with fair, transparent interest.' },
  { title: 'Member Loans', description: 'Borrow at member-friendly rates when you need a hand.' },
  { title: 'Investment Access', description: 'Invest in curated cooperative-backed opportunities.' },
  { title: 'Community Support', description: 'Join a community that reinvests in its own members.' },
]

const steps = [
  { step: '1', title: 'Create Your Account', description: 'Sign up in minutes with an email or phone number.' },
  { step: '2', title: 'Pay the Registration Fee', description: 'A one-time fee activates your membership.' },
  { step: '3', title: 'Complete KYC', description: 'Verify your identity quickly and securely.' },
  { step: '4', title: 'Start Saving & Enjoying', description: 'Save, shop on credit, invest, and borrow.' },
]

export default function Membership() {
  const { branding } = useBranding()
  return (
    <div>
      <section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Membership</h1>
          <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-400 text-lg">
            Joining {branding.organizationName} is simple. Membership is open to individuals 18 and older who share
            our values of mutual support and responsible finance.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-10">Member Benefits</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{b.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-10">How to Join</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white text-lg font-bold"
                  style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
                >
                  {s.step}
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl p-10 md:p-14 text-white text-center" style={{ background: 'linear-gradient(135deg, var(--brand-primary, #2563eb) 0%, var(--brand-accent, #7c3aed) 100%)' }}>
          <h2 className="text-3xl font-bold">Membership is open now</h2>
          <p className="mt-3 max-w-xl mx-auto text-white/85">
            Start your journey with {branding.organizationName} today and unlock savings, credit, and community.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-block rounded-xl bg-white px-10 py-4 text-base font-semibold text-gray-900 hover:bg-gray-50"
          >
            Become a Member
          </Link>
        </div>
      </section>
    </div>
  )
}

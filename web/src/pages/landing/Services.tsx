import { Link } from 'react-router-dom'
import { site } from './site.config'
import { useBranding } from '../../stores/branding.store'

const details: Record<string, string[]> = {
  Savings: [
    'Flexible and fixed-term savings plans',
    'Target-based saving goals for your dreams',
    'Competitive, transparent interest',
    'Withdraw when you need, with clear terms',
  ],
  'Buy Now, Pay Later': [
    'Shop essentials and pay in installments',
    'Simple, understandable repayment schedules',
    'No hidden fees — the total cost is clear upfront',
    'Quick approval based on your savings history',
  ],
  'Investment Opportunities': [
    'Cooperative-backed investment products',
    'Steady, member-first returns',
    'Diversified options for every risk appetite',
    'Full transparency on fees and timelines',
  ],
  'Low-Interest Loans': [
    'Member-friendly rates well below market',
    'Transparent terms and repayment plans',
    'Fast processing for active members',
    'Backed by your own cooperative',
  ],
}

export default function Services() {
  const { branding } = useBranding()
  return (
    <div>
      <section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Our Services</h1>
          <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-400 text-lg">
            Every {branding.organizationName} service is designed around one goal: helping members save more, spend
            smarter, and grow together.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-10">
          {site.services.map((s) => (
            <div
              key={s.title}
              className="grid gap-8 lg:grid-cols-2 items-center rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm"
            >
              <div>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl text-white"
                  style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
                >
                  {s.icon}
                </div>
                <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-100">{s.title}</h2>
                <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">{s.description}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
                  What's included
                </h3>
                <ul className="space-y-3">
                  {(details[s.title] ?? []).map((d) => (
                    <li key={d} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <span
                        className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white text-xs"
                        style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
                      >
                        ✓
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Not sure where to start?</h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Our membership team is happy to guide you.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="rounded-xl px-8 py-4 text-base font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
          >
            Become a Member
          </Link>
          <Link
            to="/contact"
            className="rounded-xl border border-gray-300 dark:border-gray-700 px-8 py-4 text-base font-semibold text-gray-800 dark:text-gray-200"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}

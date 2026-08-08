import { Link } from 'react-router-dom'
import { site } from './site.config'
import { useBranding } from '../../stores/branding.store'

export default function About() {
  const { branding } = useBranding()
  return (
    <div>
      <section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">About {branding.organizationName}</h1>
          <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-400 text-lg">
            We are a member-owned cooperative using technology to make fair, transparent financial
            services accessible to everyone.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Who We Are</h2>
            <div className="mt-4 space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                {branding.organizationName} is a digital cooperative built on the timeless principle of mutual aid:
                members pooling resources to support one another financially.
              </p>
              <p>
                Our platform combines the trust and community of a traditional cooperative with the
                speed and convenience of modern digital banking — so members can save, invest, borrow,
                and shop on credit without leaving the community behind.
              </p>
              <p>
                Every member is an owner. Surpluses are reinvested into better products, lower fees,
                and stronger services for the community.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Our Mission</h3>
            <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
              To empower every member with the tools to save, grow, and access credit responsibly —
              built on trust, transparency, and shared ownership.
            </p>
            <h3 className="mt-8 text-lg font-semibold text-gray-900 dark:text-gray-100">Our Vision</h3>
            <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
              A world where financial opportunity is a community resource, not a privilege — accessible
              to every member, everywhere.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-10">Our Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {site.values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 text-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{v.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Become part of our story</h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Join {branding.organizationName} and help shape the future of community finance.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-block rounded-xl px-8 py-4 text-base font-semibold text-white"
          style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
        >
          Become a Member
        </Link>
      </section>
    </div>
  )
}

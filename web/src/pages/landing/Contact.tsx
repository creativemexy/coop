import { site } from './site.config'

export default function Contact() {
  return (
    <div>
      <section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Contact Us</h1>
          <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-400 text-lg">
            We would love to hear from you. Reach out with questions, partnership ideas, or feedback
            about your membership.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="mt-1 text-xl">📧</span>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Email</div>
                  <a href={`mailto:${site.email}`} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                    {site.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="mt-1 text-xl">📞</span>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Phone</div>
                  <a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                    {site.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="mt-1 text-xl">📍</span>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Address</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{site.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="mt-1 text-xl">🕘</span>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hours</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{site.hours}</div>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Send us a message</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your name</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#2563eb)]"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#2563eb)]"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#2563eb)]"
                  placeholder="How can we help?"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl py-4 text-base font-semibold text-white"
                style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

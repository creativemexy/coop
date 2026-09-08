import { Link } from 'react-router-dom'

/**
 * Shared accessible layout for legal documents (Privacy Policy, Cookie Policy).
 * Body copy uses gray-700/gray-300 (≥ 4.5:1 on white and gray-900 surfaces).
 */
export interface LegalSection {
  title: string
  body?: string | string[]
  items?: string[]
}

export function LegalPage(opts: {
  title: string
  effectiveDate: string
  updatedDate?: string
  sections: LegalSection[]
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <article className="rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{opts.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Effective date: {opts.effectiveDate}
            {opts.updatedDate ? ` · Last updated: ${opts.updatedDate}` : ''}
          </p>

          <div className="space-y-6">
            {opts.sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{s.title}</h2>
                {Array.isArray(s.body)
                  ? s.body.map((paragraph, i) => (
                    <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{paragraph}</p>
                  ))
                  : s.body && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{s.body}</p>}
                {s.items && (
                  <ul className="list-disc pl-5 space-y-1.5">
                    {s.items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
            <Link to="/terms" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">Terms & Conditions</Link>
            <Link to="/privacy" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">Privacy Policy</Link>
            <Link to="/cookies" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">Cookie Policy</Link>
            <Link to="/" className="text-sm text-gray-500 dark:text-gray-400 hover:underline">Back to Home</Link>
          </div>
        </article>
      </div>
    </div>
  )
}
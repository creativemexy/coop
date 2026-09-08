import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useConsent } from '../../stores/consent.store'

/**
 * Accessible cookie-consent banner.
 *
 * - `role="dialog"` (non-modal) with a labelled heading
 * - Auto-focuses the first action so keyboard users can decide immediately
 * - Dismissible with Escape
 * - Honours `prefers-reduced-motion` via the global reduced-motion CSS
 *
 * We set no analytics/advertising/marketing cookies, so consent simply records
 * the visitor's informed choice (see `stores/consent.store.ts`).
 */
export function CookieConsentBanner() {
  const { state, init, acceptAll, decline } = useConsent()
  const acceptRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (state === 'unknown') acceptRef.current?.focus()
  }, [state])

  if (state !== 'unknown') return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
      onKeyDown={(e) => {
        if (e.key === 'Escape') decline()
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <h2 id="cookie-consent-title" className="font-semibold">
            We value your privacy
          </h2>
          <p id="cookie-consent-desc">
            We only use a strictly-necessary security cookie to protect your
            session. We do not use tracking, analytics, or advertising cookies.
            Learn more in our{' '}
            <Link to="/cookies" className="underline text-blue-700 dark:text-blue-400 hover:text-blue-900">
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline text-blue-700 dark:text-blue-400 hover:text-blue-900">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            ref={(el) => { acceptRef.current = el }}
            type="button"
            onClick={acceptAll}
            className="rounded-lg bg-[var(--brand-primary,#2563eb)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-primary,#1d4fd8)] focus-visible:outline-2"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={decline}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-2"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}
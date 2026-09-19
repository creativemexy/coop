import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, ShieldCheck, UsersRound } from 'lucide-react'

/**
 * Shared accessible layout for legal documents (Privacy Policy, Cookie Policy).
 * Body copy uses warm neutral colors for FENAC brand consistency.
 */
export interface LegalSection {
  title: string
  body?: string | string[]
  items?: string[]
}

const keyPoints = {
  privacy: [
    {
      title: 'Data Minimisation',
      description: 'We only collect information needed to provide our services.',
      icon: ShieldCheck,
    },
    {
      title: 'Your Control',
      description: 'You have rights to access, correct, and delete your personal data.',
      icon: UsersRound,
    },
    {
      title: 'No Selling',
      description: 'We never sell personal data to third parties.',
      icon: ShieldCheck,
    },
  ],
  cookies: [
    {
      title: 'Strictly Necessary',
      description: 'Only essential cookies for security and functionality.',
      icon: ShieldCheck,
    },
    {
      title: 'Your Choice',
      description: 'Control optional cookies through consent management.',
      icon: UsersRound,
    },
    {
      title: 'Transparent',
      description: 'Clear disclosure of all cookies and their purposes.',
      icon: FileText,
    },
  ],
}

export function LegalPage(opts: {
  title: string
  description: string
  effectiveDate: string
  updatedDate?: string
  sections: LegalSection[]
  type?: 'privacy' | 'cookies'
}) {
  const type = opts.type || 'privacy'
  const points = keyPoints[type] || keyPoints.privacy

  useEffect(() => {
    document.title = `${opts.title} | FENAC COOP`
    let description = document.querySelector('meta[name="description"]')
    if (!description) {
      description = document.createElement('meta')
      description.setAttribute('name', 'description')
      document.head.appendChild(description)
    }
    description.setAttribute('content', opts.description)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', window.location.href.split('?')[0])
  }, [opts.description, opts.title])

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
              {opts.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#F5E9D9]/90 sm:text-xl">
              {opts.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-7 py-4 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
              >
                Back to home
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
              Your {type === 'privacy' ? 'privacy' : 'data'} matters.
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
            {type === 'privacy'
              ? 'We are committed to protecting your personal data and being transparent about how we collect, use, and share it. Your privacy is fundamental to our cooperative values.'
              : 'We believe in being transparent about the cookies and tracking technologies we use. You have control over your data and can make informed choices.'}
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {points.map((point) => {
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
            <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#9D4824]">Full policy</p>
            <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
              Complete {opts.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#6B5245]">
              Effective date: {opts.effectiveDate}
              {opts.updatedDate ? ` · Last updated: ${opts.updatedDate}` : ''}
            </p>
          </div>

          <div className="rounded-[1.8rem] border border-[#9D623A]/15 bg-[#FFF9EF] p-8 shadow-[0_12px_35px_rgba(79,43,17,0.05)] sm:p-12">
            <div className="space-y-8">
              {opts.sections.map((section) => (
                <section key={section.title}>
                  <h3 className="text-lg font-black tracking-[-0.03em] text-[#2C1B13]">{section.title}</h3>
                  {Array.isArray(section.body) ? (
                    section.body.map((paragraph, index) => (
                      <p key={index} className="mt-3 text-sm leading-relaxed text-[#6B5245]">{paragraph}</p>
                    ))
                  ) : section.body && (
                    <p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{section.body}</p>
                  )}
                  {section.items && (
                    <ul className="mt-3 space-y-2">
                      {section.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-[#6B5245]">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9D4824]" />
                          {item}
                        </li>
                      ))}
                    </ul>
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
            to="/terms"
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
          >
            Terms of Service
          </Link>
        </div>
      </section>
    </div>
  )
}
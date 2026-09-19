import { useState } from 'react'
import { ArrowRight, Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { site } from './site.config'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    value: site.email,
    link: `mailto:${site.email}`,
    description: 'We typically respond within one working day.',
  },
  {
    icon: Phone,
    title: 'Phone',
    value: site.phone,
    link: `tel:${site.phone}`,
    description: 'Available during office hours for urgent matters.',
  },
  {
    icon: MapPin,
    title: 'Office',
    value: site.address,
    link: null,
    description: 'Visit us for in-person consultations.',
  },
  {
    icon: Clock3,
    title: 'Office Hours',
    value: site.hours,
    link: null,
    description: 'Monday through Friday, West African Time.',
  },
]

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consent) {
      setStatus('error')
      setError('Please tick the consent box so we can reply to your message.')
      return
    }
    setStatus('sending')
    setError('')
    try {
      await api.post('/contact', { name, email, message, consent })
      setStatus('sent')
    } catch (err: unknown) {
      setStatus('error')
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      setError(
        Array.isArray(msg)
          ? msg.join(' ')
          : msg || 'Sorry, your message could not be sent. Please try again.',
      )
    }
  }

  return (
    <div className="overflow-hidden bg-[#FFF9EF] text-[#23150F]">
      <section className="relative isolate overflow-hidden bg-[#20120E] text-[#FFF9EF]">
        <div className="absolute inset-0 bg-[#20120E]" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B100C]/95 via-[#25140D]/75 to-[#1B100C]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(247,183,51,0.22),_transparent_24%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#F7D674]/40 bg-[#20120E]/30 px-4 py-2 text-[0.68rem] font-bold tracking-[0.18em] text-[#F8CE68] uppercase backdrop-blur-sm">
                Contact
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[0.96] tracking-[-0.05em] text-[#FFF9EF] sm:text-6xl xl:text-[5.3rem]">
                Bring your organization's <span className="text-[#F7B733]">next chapter.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#F5E9D9]/90 sm:text-xl">
                Whether you are exploring membership, partnership, or digital financial services, the FENAC team is ready to listen and help you move forward.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-7 py-4 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
                >
                  Email us directly
                  <ArrowRight size={18} />
                </a>

                <Link
                  to="/membership"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
                >
                  Explore membership
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-3 shadow-[0_30px_80px_rgba(9,8,7,0.35)] backdrop-blur-md">
                <div className="overflow-hidden rounded-[1.45rem] border border-[#F7D674]/20 bg-[#F7F2E8]/5">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-[#F7E8C6]">
                    <span>Contact Information</span>
                    <span className="rounded-full bg-[#E4A42A]/20 px-2 py-1 text-[#F7D674]">4 Ways</span>
                  </div>

                  <div className="space-y-4 p-4">
                    {contactMethods.slice(0, 2).map((method) => {
                      const Icon = method.icon
                      return (
                        <div key={method.title} className="rounded-2xl border border-white/10 bg-[#1F2C29]/40 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#D7C7AF]">{method.title}</p>
                              <p className="mt-2 text-lg font-black tracking-[-0.05em] text-white">{method.value}</p>
                            </div>
                            <div className="rounded-2xl bg-[#D8F0EA] p-3 text-[#176B5B]">
                              <Icon size={22} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#176B5B]">Get in touch</p>
            <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
              Multiple ways to start the conversation.
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
            Choose the contact method that works best for you. We respond to all enquiries within one working day and are committed to helping you find the right solution.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map((method) => {
            const Icon = method.icon
            const content = method.link ? (
              <a href={method.link} className="group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0E5] text-[#176B5B] transition duration-200 group-hover:bg-[#176B5B] group-hover:text-white">
                  <Icon size={28} />
                </div>
              </a>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0E5] text-[#176B5B]">
                <Icon size={28} />
              </div>
            )

            return (
              <article
                key={method.title}
                className="group relative overflow-hidden rounded-[1.8rem] border border-[#EDE2D3] bg-white p-8 shadow-[0_12px_35px_rgba(79,43,17,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(79,43,17,0.09)]"
              >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-[#176B5B]" />

                {content}

                <h3 className="mt-6 text-lg font-black tracking-[-0.03em] text-[#2C1B13]">{method.title}</h3>
                <p className="mt-2 text-sm font-medium text-[#6B5245]">{method.value}</p>
                <p className="mt-3 text-xs leading-relaxed text-[#6B5245]">{method.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="bg-[#F0DDAD] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#9D4824]">Send a message</p>
              <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
                We are ready to help you move forward.
              </h2>
            </div>

            <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
              Fill out the form below and our team will get back to you within one working day. For urgent matters, please call us directly during office hours.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <div className="rounded-[1.8rem] border border-[#9D623A]/15 bg-[#FFF9EF] p-8 shadow-[0_12px_35px_rgba(79,43,17,0.05)]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#9D4824]" size={24} />
                <h3 className="text-lg font-black tracking-[-0.03em] text-[#2C1B13]">What to expect</h3>
              </div>

              <ul className="mt-6 space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#9D4824]" />
                  <div>
                    <p className="text-sm font-bold text-[#2C1B13]">Response within 1 working day</p>
                    <p className="mt-1 text-sm text-[#6B5245]">We prioritise all enquiries and aim to respond quickly.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#9D4824]" />
                  <div>
                    <p className="text-sm font-bold text-[#2C1B13]">Personalized support</p>
                    <p className="mt-1 text-sm text-[#6B5245]">Our team provides tailored guidance for your specific needs.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#9D4824]" />
                  <div>
                    <p className="text-sm font-bold text-[#2C1B13]">No commitment required</p>
                    <p className="mt-1 text-sm text-[#6B5245]">Explore your options without any pressure or obligation.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#9D4824]" />
                  <div>
                    <p className="text-sm font-bold text-[#2C1B13]">Secure and confidential</p>
                    <p className="mt-1 text-sm text-[#6B5245]">Your information is protected and used only to respond to your enquiry.</p>
                  </div>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="rounded-[1.8rem] bg-white p-8 shadow-[0_16px_40px_rgba(79,43,17,0.1)] sm:p-10">
              <div className="flex items-center gap-3">
                <MessageCircle className="text-[#176B5B]" size={24} />
                <h2 className="text-lg font-black tracking-[-0.03em] text-[#2C1B13]">Contact form</h2>
              </div>

              {status === 'sent' ? (
                <div role="status" className="mt-7 rounded-xl border border-[#176B5B]/25 bg-[#E8F3EA] p-6">
                  <p className="font-bold text-[#176B5B]">Thank you — your message is on its way.</p>
                  <p className="mt-2 text-sm text-[#2C1B13]">
                    We aim to reply to enquiries within one working day. A copy of your message has been delivered to {site.email}.
                  </p>
                </div>
              ) : (
                <div className="mt-7 space-y-4">
                  <label className="block text-sm font-medium text-[#2C1B13]">
                    Your name
                    <input
                      name="contact-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D8C9A9] bg-[#FFF9EF] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B]"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[#2C1B13]">
                    Email
                    <input
                      name="contact-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D8C9A9] bg-[#FFF9EF] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B]"
                      placeholder="you@example.com"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[#2C1B13]">
                    Message
                    <textarea
                      name="contact-message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D8C9A9] bg-[#FFF9EF] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#176B5B]"
                      placeholder="How can we help?"
                    />
                  </label>
                  <div className="flex items-start gap-2">
                    <input
                      id="contact-consent"
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 rounded border border-[#D8C9A9] text-[#176B5B] focus:ring-[#176B5B]"
                    />
                    <label htmlFor="contact-consent" className="text-sm leading-relaxed text-[#6B5245]">
                      I consent to {site.name} using my details solely to respond to this enquiry.{' '}
                      <Link to="/privacy" className="text-[#176B5B] hover:underline">Privacy Policy</Link>.
                    </label>
                  </div>

                  {status === 'error' && error && (
                    <p role="alert" className="text-sm text-[#B42318]">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full rounded-full bg-[#176B5B] py-4 text-base font-semibold text-white hover:bg-[#0F594B] disabled:opacity-70 disabled:pointer-events-none transition duration-200"
                  >
                    {status === 'sending' ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      <section className="bg-[#176B5B] px-4 py-20 text-center text-[#FFF9EF] sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F7D674]">Ready to start?</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
          The right conversation starts with a single step.
        </h2>
        <div className="mx-auto mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`mailto:${site.email}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F7B733] px-8 py-4 text-sm font-bold text-[#28170E] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFE08B]"
          >
            Email us now
            <ArrowRight size={18} />
          </a>
          <Link
            to="/membership"
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
          >
            Explore membership
          </Link>
        </div>
      </section>
    </div>
  )
}
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, FileCheck2, Handshake, Landmark, ShieldCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const membershipBenefits = [
  {
    title: 'Affordable Access',
    description: 'Member-friendly pricing designed for associations, clubs, and NGOs of all sizes.',
    icon: Landmark,
    details: ['Low membership fees', 'No hidden charges', 'Flexible payment options', 'Scale-based pricing'],
  },
  {
    title: 'Financial Services',
    description: 'Access savings, loans, investments, and BNPL with cooperative terms.',
    icon: Building2,
    details: ['Competitive interest rates', 'Quick loan processing', 'Investment opportunities', 'Flexible repayment'],
  },
  {
    title: 'Collective Voice',
    description: 'Your organization gains representation in a federation built for shared influence.',
    icon: UsersRound,
    details: ['Shared advocacy', 'Policy influence', 'Network connections', 'Community support'],
  },
  {
    title: 'Trust & Security',
    description: 'Bank-grade security protects your organization finances and member data.',
    icon: ShieldCheck,
    details: ['Secure transactions', 'Data protection', 'Transparent operations', 'Regular audits'],
  },
  {
    title: 'Capacity Building',
    description: 'Strengthen institutional capability through training and technical support.',
    icon: BadgeCheck,
    details: ['Training programs', 'Technical assistance', 'Best practices', 'Resource sharing'],
  },
  {
    title: 'Growth Support',
    description: 'Connect with like-minded organizations and access new opportunities.',
    icon: Handshake,
    details: ['Networking events', 'Partnership opportunities', 'Market access', 'Collaborative projects'],
  },
]

const membershipSteps = [
  {
    step: '01',
    title: 'Initial Conversation',
    description: 'Tell us about your organization, its goals, and how membership can help.',
    duration: '1-2 days',
    action: 'Contact our team to discuss your needs',
  },
  {
    step: '02',
    title: 'Application Review',
    description: 'Submit your organization details for federation review and eligibility assessment.',
    duration: '3-5 business days',
    action: 'Complete the membership application form',
  },
  {
    step: '03',
    title: 'Verification',
    description: 'Confirm your organization status and authorize representatives securely.',
    duration: '5-7 business days',
    action: 'Provide required documentation and KYC',
  },
  {
    step: '04',
    title: 'Membership Activation',
    description: 'Access full member services, representation, and begin growing together.',
    duration: 'Immediate',
    action: 'Start using all member benefits',
  },
]

const eligibilityCriteria = [
  { category: 'Organization Type', items: ['Registered associations', 'Clubs and societies', 'NGOs and non-profits', 'Cooperative societies'] },
  { category: 'Requirements', items: ['Valid registration documents', 'Minimum 6 months operation', 'Active governance structure', 'Clear organizational objectives'] },
  { category: 'Documentation', items: ['Certificate of incorporation', 'Constitution or bylaws', 'Board resolution', 'Authorized representative details'] },
]

export default function Membership() {
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
                Membership
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[0.96] tracking-[-0.05em] text-[#FFF9EF] sm:text-6xl xl:text-[5.3rem]">
                Grow with a federation that <span className="text-[#F7B733]">moves together.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#F5E9D9]/90 sm:text-xl">
                FENAC membership is for associations, clubs, and NGOs ready to build institutional strength and lasting wealth together through shared ownership and collective power.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-7 py-4 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
                >
                  Start your application
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/services"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
                >
                  Explore member benefits
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#F7E7C8]">
                {[
                  'Affordable fees',
                  'Quick approval',
                  'Instant access',
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#F7D674]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-3 shadow-[0_30px_80px_rgba(9,8,7,0.35)] backdrop-blur-md">
                <div className="overflow-hidden rounded-[1.45rem] border border-[#F7D674]/20 bg-[#F7F2E8]/5">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-[#F7E8C6]">
                    <span>Membership Overview</span>
                    <span className="rounded-full bg-[#E4A42A]/20 px-2 py-1 text-[#F7D674]">4 Steps</span>
                  </div>

                  <div className="space-y-4 p-4">
                    {membershipSteps.slice(0, 2).map((step) => (
                      <div key={step.step} className="rounded-2xl border border-white/10 bg-[#1F2C29]/40 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#D7C7AF]">{step.step}</p>
                            <p className="mt-2 text-lg font-black tracking-[-0.05em] text-white">{step.title}</p>
                          </div>
                          <div className="rounded-2xl bg-[#D8F0EA] p-3 text-[#176B5B]">
                            <FileCheck2 size={22} />
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-[#E9D7B3]">{step.duration}</p>
                      </div>
                    ))}
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
            <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#176B5B]">Why join FENAC</p>
            <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
              Membership built around your organization needs.
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
            Every benefit is designed to help your association, club, or NGO grow stronger, access better financial services, and gain collective influence.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {membershipBenefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <article
                key={benefit.title}
                className="group relative overflow-hidden rounded-[1.8rem] border border-[#EDE2D3] bg-white p-8 shadow-[0_12px_35px_rgba(79,43,17,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(79,43,17,0.09)]"
              >
                <div className="absolute inset-x-0 top-0 h-1.5 bg-[#176B5B]" />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0E5] text-[#176B5B]">
                  <Icon size={28} />
                </div>

                <h3 className="mt-6 text-xl font-black tracking-[-0.03em] text-[#2C1B13]">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{benefit.description}</p>

                <ul className="mt-6 space-y-2">
                  {benefit.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm text-[#6B5245]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#176B5B]" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      <section className="bg-[#F0DDAD] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#9D4824]">The path to membership</p>
              <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
                A clear, low-friction journey to collective growth.
              </h2>
            </div>

            <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
              From first conversation to full membership activation, we have designed a straightforward process that respects your time and gets you access to benefits quickly.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {membershipSteps.map((step) => (
              <article key={step.step} className="relative rounded-[1.8rem] border border-[#9D623A]/15 bg-[#FFF9EF] p-8 shadow-[0_12px_35px_rgba(79,43,17,0.05)]">
                <span className="font-serif text-5xl font-bold leading-none text-[#D78135]/35">{step.step}</span>
                <h3 className="mt-6 text-lg font-black tracking-[-0.03em] text-[#2C1B13]">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{step.description}</p>
                <div className="mt-6 rounded-xl bg-[#D8C9A9]/20 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9D4824]">{step.duration}</p>
                  <p className="mt-1 text-xs text-[#6B5245]">{step.action}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#176B5B]">Eligibility</p>
            <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
              Clear requirements for transparent membership.
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
            We maintain straightforward eligibility criteria to ensure our federation serves organizations that share our cooperative values and commitment to collective growth.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {eligibilityCriteria.map((category) => (
            <article key={category.category} className="rounded-[1.6rem] border border-[#EDE2D3] bg-white p-8">
              <h3 className="text-lg font-black tracking-[-0.03em] text-[#2C1B13]">{category.category}</h3>
              <ul className="mt-4 space-y-3">
                {category.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#6B5245]">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#176B5B]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#176B5B] px-4 py-20 text-center text-[#FFF9EF] sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F7D674]">Ready to join the federation?</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
          Your organization belongs in the conversation.
        </h2>
        <div className="mx-auto mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F7B733] px-8 py-4 text-sm font-bold text-[#28170E] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFE08B]"
          >
            Start your application
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/faq"
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
          >
            View FAQ
          </Link>
        </div>
      </section>
    </div>
  )
}

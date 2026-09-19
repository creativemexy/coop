import { ArrowRight, Building2, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

const serviceCategories = [
  {
    id: 'savings',
    title: 'Savings & Wealth Building',
    description: 'Secure your future with flexible savings plans designed for collective growth.',
    icon: PiggyBank,
    color: '#176B5B',
    services: [
      {
        name: 'Digital Savings',
        description: 'Flexible savings plans with competitive interest rates and transparent access.',
        benefits: ['Competitive interest rates', 'Flexible contribution plans', 'Real-time balance tracking', 'Withdrawal on demand'],
        useCase: 'Perfect for building emergency funds, saving for goals, or growing wealth steadily.',
      },
      {
        name: 'Fixed Deposits',
        description: 'Lock your savings for higher returns with guaranteed security.',
        benefits: ['Higher interest rates', 'Flexible tenure options', 'Guaranteed principal protection', 'Auto-renewal available'],
        useCase: 'Ideal for members who want predictable returns on lump-sum savings.',
      },
    ],
  },
  {
    id: 'bnpl',
    title: 'Buy Now, Pay Later',
    description: 'Access essential goods and services today with manageable installment plans.',
    icon: Wallet,
    color: '#D49728',
    services: [
      {
        name: 'Installment Plans',
        description: 'Spread payments over time with clear terms and no hidden fees.',
        benefits: ['Flexible repayment schedules', 'No hidden charges', 'Quick approval process', 'Multiple payment options'],
        useCase: 'Great for purchasing equipment, inventory, or essential household items.',
      },
      {
        name: 'Member Credit',
        description: 'Access credit based on your membership standing and cooperative history.',
        benefits: ['Based on membership tenure', 'Lower interest rates', 'Build credit history', 'Support for productive purchases'],
        useCase: 'Support members who need financing for business or personal development.',
      },
    ],
  },
  {
    id: 'loans',
    title: 'Loans & Financing',
    description: 'Affordable financing solutions designed to support productive community activity.',
    icon: Building2,
    color: '#C85B23',
    services: [
      {
        name: 'Business Loans',
        description: 'Financing to grow your business with member-friendly terms.',
        benefits: ['Competitive interest rates', 'Flexible repayment terms', 'Quick processing', 'Business support available'],
        useCase: 'Perfect for expanding operations, purchasing inventory, or equipment upgrades.',
      },
      {
        name: 'Personal Loans',
        description: 'Access funds for personal needs with transparent terms.',
        benefits: ['Affordable rates', 'Clear repayment schedules', 'No hidden fees', 'Member-first approach'],
        useCase: 'Support education, healthcare, housing, or other personal development goals.',
      },
    ],
  },
  {
    id: 'investment',
    title: 'Investment Opportunities',
    description: 'Cooperative-backed investment products designed for steady, member-first returns.',
    icon: TrendingUp,
    color: '#7F3F2A',
    services: [
      {
        name: 'Cooperative Investments',
        description: 'Pool resources with other members for collective investment opportunities.',
        benefits: ['Diversified portfolio', 'Professional management', 'Regular returns', 'Risk-mitigated approach'],
        useCase: 'Grow wealth while supporting community development projects.',
      },
      {
        name: 'Target-Based Plans',
        description: 'Invest toward specific goals with structured timelines and returns.',
        benefits: ['Goal-oriented investing', 'Clear maturity dates', 'Projected returns', 'Flexible contribution levels'],
        useCase: 'Plan for education, retirement, or major life events with confidence.',
      },
    ],
  },
]

export default function Services() {
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
                Financial Services
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[0.96] tracking-[-0.05em] text-[#FFF9EF] sm:text-6xl xl:text-[5.3rem]">
                Finance built for <span className="text-[#F7B733]">real community needs.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#F5E9D9]/90 sm:text-xl">
                From savings and loans to investments and BNPL, our services are designed to help associations, clubs, NGOs, and their members grow together.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/membership"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-7 py-4 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
                >
                  Become a member
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
                >
                  Talk to an advisor
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-3 shadow-[0_30px_80px_rgba(9,8,7,0.35)] backdrop-blur-md">
                <div className="overflow-hidden rounded-[1.45rem] border border-[#F7D674]/20 bg-[#F7F2E8]/5">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-[#F7E8C6]">
                    <span>Service Overview</span>
                    <span className="rounded-full bg-[#E4A42A]/20 px-2 py-1 text-[#F7D674]">4 Categories</span>
                  </div>

                  <div className="space-y-4 p-4">
                    {serviceCategories.slice(0, 2).map((category) => {
                      const Icon = category.icon
                      return (
                        <div key={category.id} className="rounded-2xl border border-white/10 bg-[#1F2C29]/40 p-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl p-2" style={{ backgroundColor: `${category.color}20` }}>
                              <Icon size={20} style={{ color: category.color }} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{category.title}</p>
                              <p className="text-xs text-[#D7C7AF]">{category.services.length} services</p>
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
            <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#176B5B]">Our services</p>
            <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
              Financial solutions that work for everyone.
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
            Every service is designed with cooperative values at its core, transparency, accessibility, and collective growth for members and their communities.
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {serviceCategories.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.id} className="scroll-mt-24" id={category.id}>
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${category.color}15` }}>
                    <Icon size={32} style={{ color: category.color }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-[-0.03em] text-[#2C1B13]">{category.title}</h3>
                    <p className="mt-1 text-base leading-relaxed text-[#6B5245]">{category.description}</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {category.services.map((service) => (
                    <article
                      key={service.name}
                      className="group relative overflow-hidden rounded-[1.8rem] border border-[#EDE2D3] bg-white p-8 shadow-[0_12px_35px_rgba(79,43,17,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(79,43,17,0.09)]"
                    >
                      <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: category.color }} />

                      <h4 className="text-xl font-black tracking-[-0.03em] text-[#2C1B13]">{service.name}</h4>
                      <p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{service.description}</p>

                      <div className="mt-6">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B5B]">Key benefits</p>
                        <ul className="mt-3 space-y-2">
                          {service.benefits.map((benefit) => (
                            <li key={benefit} className="flex items-start gap-2 text-sm text-[#6B5245]">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 rounded-xl bg-[#F7F2E8] p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B5245]">Best for</p>
                        <p className="mt-2 text-sm leading-relaxed text-[#2C1B13]">{service.useCase}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-[#176B5B] px-4 py-20 text-center text-[#FFF9EF] sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F7D674]">Ready to get started?</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
          The right service starts with the right conversation.
        </h2>
        <Link
          to="/contact"
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#F7B733] px-8 py-4 text-sm font-bold text-[#28170E] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFE08B]"
        >
          Talk to FENAC
          <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  )
}

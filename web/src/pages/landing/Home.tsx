import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Landmark,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { site } from './site.config'
import { useBranding } from '../../stores/branding.store'
import { api } from '../../api/client'

const serviceColors = ['#C85B23', '#176B5B', '#D49728', '#7F3F2A']
const serviceIcons = [Landmark, HandCoins, TrendingUp, ShieldCheck]

const heroSlides = [
  { title: 'Agriculture that feeds futures', label: 'Agro', image: 'https://pachamamafoodsng.com/wp-content/uploads/2024/06/Empowering-women-through-cooperative-farming-in-Nigeria.png', alt: 'Nigerian women working together on a farm' },
  { title: 'A cooperative built by its members', label: 'Cooperatives', image: 'https://www.awf.org/sites/default/files/media/images/Nasaruni_Jane%20Meshami.jpg', alt: 'Members gathered for a cooperative meeting' },
  { title: 'Every contribution moves us forward', label: 'Savings', image: 'https://www.coopi.org/uploads/home/15dea3f421cf67.png', alt: 'A community savings group meeting' },
  { title: 'More room to grow', label: 'Empowerment', image: 'https://womenforwomen.org.uk/sites/default/files/styles/gallery_image/public/Countries/Nigeria/NIG_Sept142017_DemonstrationFarm_Monilekan_P.jpg?itok=db0gGg4_', alt: 'Women working together in a Nigerian field' },
  { title: 'Invest in what matters to your community', label: 'Investment', image: 'https://static.wixstatic.com/media/a1f099_6610827a727846189fc8314e1d5f82bf~mv2.jpg/v1/fill/w_1000%2Ch_626%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01/a1f099_6610827a727846189fc8314e1d5f82bf~mv2.jpg', alt: 'A rural cooperative community meeting' },
]

type Impact = { members: number; organizations: number; savingsPool: number; investmentValue: number }

function compactNaira(value: number) {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`
  return `₦${Math.round(value).toLocaleString()}`
}

export default function Home() {
  const { branding } = useBranding()
  const [activeSlide, setActiveSlide] = useState(0)
  const [impact, setImpact] = useState<Impact | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActiveSlide((slide) => (slide + 1) % heroSlides.length), 5600)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    api.get<Impact>('/branding/impact').then(({ data }) => setImpact(data)).catch(() => undefined)
  }, [])

  const stats = impact
    ? [
        { value: impact.members.toLocaleString(), label: 'Active members' },
        { value: compactNaira(impact.savingsPool), label: 'Savings pool' },
        { value: impact.organizations.toLocaleString(), label: 'Partner cooperatives' },
        { value: compactNaira(impact.investmentValue), label: 'Member investments' },
      ]
    : site.stats

  const slide = heroSlides[activeSlide]

  return (
    <div className="overflow-hidden bg-[#FFF9EF] text-[#23150F]">
      <section className="relative isolate overflow-hidden bg-[#20120E] text-[#FFF9EF]">
        <div className="absolute inset-0 bg-[#20120E]" aria-hidden="true">
          {heroSlides.map((item, index) => (
            <img
              key={item.label}
              src={item.image}
              alt={index === activeSlide ? item.alt : ''}
              aria-hidden={index !== activeSlide}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${index === activeSlide ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B100C]/95 via-[#25140D]/75 to-[#1B100C]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(247,183,51,0.22),_transparent_24%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#F7D674]/40 bg-[#20120E]/30 px-4 py-2 text-[0.68rem] font-bold tracking-[0.18em] text-[#F8CE68] uppercase backdrop-blur-sm">
                <Sparkles size={14} />
                {slide.label} · Rooted in community
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[0.96] tracking-[-0.05em] text-[#FFF9EF] sm:text-6xl xl:text-[5.3rem]">
                {slide.title}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#F5E9D9]/90 sm:text-xl">
                {site.description} We help members save, borrow, invest, and grow with a financial partner that understands real community needs.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-7 py-4 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
                >
                  Become a member
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/services"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-4 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
                >
                  Explore services
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#F7E7C8]">
                {[
                  'Member-owned',
                  'Built for Nigeria',
                  'Transparent terms',
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <Check size={16} className="text-[#F7D674]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white/10 bg-white/8 p-3 shadow-[0_30px_80px_rgba(9,8,7,0.35)] backdrop-blur-md">
                <div className="overflow-hidden rounded-[1.45rem] border border-[#F7D674]/20 bg-[#F7F2E8]/5">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-[#F7E8C6]">
                    <span>Member overview</span>
                    <span className="rounded-full bg-[#E4A42A]/20 px-2 py-1 text-[#F7D674]">Live</span>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="rounded-2xl bg-[#FFF9EF] p-4 text-[#23150F] shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#6B5245]">Savings pool</p>
                          <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#176B5B]">{stats[1]?.value ?? '₦2.4B'}</p>
                        </div>
                        <div className="rounded-2xl bg-[#D8F0EA] p-3 text-[#176B5B]">
                          <TrendingUp size={22} />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {stats.slice(0, 2).map((stat, index) => (
                        <div key={stat.label} className="rounded-2xl border border-white/10 bg-[#1F2C29]/40 p-4">
                          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#D7C7AF]">{stat.label}</p>
                          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">{stat.value}</p>
                          {index === 0 && <p className="mt-3 text-xs text-[#E9D7B3]">+14% from last quarter</p>}
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-[#F7D674]/25 bg-[#F2E7CA]/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#F7D674]">Support</p>
                          <p className="mt-2 text-lg font-bold text-white">Loans that fit real life</p>
                        </div>
                        <Users className="text-[#F7D674]" size={22} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-5">
            <div className="flex flex-wrap gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xl font-black tracking-[-0.04em] text-[#F7D674]">{stat.value}</p>
                  <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[#F1E7D8]/70">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSlide((activeSlide + heroSlides.length - 1) % heroSlides.length)}
                className="rounded-full border border-white/15 bg-white/5 p-3 text-white transition hover:bg-white/10"
                aria-label="Show previous image"
              >
                <ChevronLeft size={19} />
              </button>

              <div className="flex gap-2">
                {heroSlides.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Show ${item.label} image`}
                    aria-current={index === activeSlide}
                    className={`h-2 rounded-full transition-all ${index === activeSlide ? 'w-7 bg-[#F7D674]' : 'w-2 bg-white/55 hover:bg-white'}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveSlide((activeSlide + 1) % heroSlides.length)}
                className="rounded-full border border-white/15 bg-white/5 p-3 text-white transition hover:bg-white/10"
                aria-label="Show next image"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FFF9EF] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="afro-kicker">Made for everyday progress</p>
              <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
                Your ambitions deserve a community behind them.
              </h2>
            </div>

            <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
              From school fees and stock for your business to home deposits and long-term investments, our services are shaped around the moments that matter most to you.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {site.services.map((service, index) => {
              const Icon = serviceIcons[index % serviceIcons.length]

              return (
                <article
                  key={service.title}
                  className="group relative overflow-hidden rounded-[1.7rem] border border-[#EDE2D3] bg-white p-6 shadow-[0_12px_35px_rgba(79,43,17,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(79,43,17,0.09)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: serviceColors[index] }} />

                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${serviceColors[index]}1A` }}>
                    <Icon size={24} style={{ color: serviceColors[index] }} />
                  </div>

                  <h3 className="text-xl font-black tracking-[-0.03em] text-[#2C1B13]">{service.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{service.description}</p>

                  <Link to="/services" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#176B5B] opacity-0 transition duration-200 group-hover:opacity-100">
                    Explore
                    <ArrowRight size={15} />
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F0DDAD] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="afro-kicker text-[#9D4824]">A simple beginning</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
              Come in. Grow with us.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {site.steps.map((step, index) => (
              <div key={step.title} className="relative rounded-[1.8rem] border border-[#9D623A]/15 bg-[#FFF9EF] p-8 shadow-[0_12px_35px_rgba(79,43,17,0.05)]">
                <span className="font-serif text-6xl font-bold leading-none text-[#D78135]/35">0{index + 1}</span>
                <h3 className="mt-7 text-xl font-black tracking-[-0.03em] text-[#2C1B13]">{step.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-[#6B5245]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#176B5B] py-20 text-[#FFF9EF] sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="afro-kicker text-[#F7D674]">The cooperative way</p>
              <h2 className="mt-4 max-w-lg text-4xl font-black leading-[1.04] tracking-[-0.05em] text-white sm:text-5xl">
                Finance with dignity, warmth, and a shared purpose.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {site.values.map((value, index) => (
                <div key={value.title} className="rounded-[1.6rem] border border-white/12 bg-white/6 p-6">
                  <span className="font-serif text-2xl font-bold text-[#F7D674]">0{index + 1}</span>
                  <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-white">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#E5F0E7]/75">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="afro-cta mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] px-7 py-14 text-center text-[#FFF9EF] sm:px-12 sm:py-20">
          <p className="text-sm font-bold tracking-[0.18em] uppercase text-[#F8CE68]">The next chapter is yours</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl">
            Let’s build a future that reaches further.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#FFF3D8]/80">
            Join {branding.organizationName} and turn collective strength into real possibilities.
          </p>
          <Link
            to="/register"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#F7B733] px-8 py-4 text-sm font-bold text-[#28170E] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFE08B]"
          >
            Become a member
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}

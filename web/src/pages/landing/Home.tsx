import { useEffect, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { site } from './site.config'
import { useBranding } from '../../stores/branding.store'
import { api } from '../../api/client'

const serviceColors = ['#C85B23', '#176B5B', '#D49728', '#7F3F2A']

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
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-[#25140D] text-[#FFF9EF]">
        <div className="absolute inset-0 bg-[#25140D]" aria-hidden="true">
          {heroSlides.map((item, index) => <img key={item.label} src={item.image} alt={index === activeSlide ? item.alt : ''} aria-hidden={index !== activeSlide} className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${index === activeSlide ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`} />)}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1D100B]/90 via-[#25140D]/55 to-[#25140D]/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1D100B]/75 via-transparent to-[#1D100B]/20" />
        </div>
        <div className="afro-pattern absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#E4A42A]/45 bg-black/15 px-4 py-2 text-xs font-bold tracking-[0.16em] text-[#F8CE68] uppercase backdrop-blur-sm">
              <Sparkles size={14} /> {slide.label} · Rooted in community
            </p>
            <h1 className="mt-7 max-w-3xl font-serif text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl xl:text-8xl">
              {slide.title}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#FFF3D8]/90 sm:text-xl">
              {site.description} Build your savings, access what you need, and move forward with a cooperative that grows with you.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-7 py-4 font-bold text-[#26170F] transition hover:-translate-y-0.5 hover:bg-[#F7B733]">
                Join the cooperative <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="inline-flex items-center justify-center rounded-full border border-white/45 px-7 py-4 font-semibold transition hover:bg-white/10">
                Discover our story
              </Link>
            </div>
            <div className="mt-11 flex flex-wrap gap-x-8 gap-y-4 text-sm text-[#FFF3D8]">
              <span className="flex items-center gap-2"><Check size={17} className="text-[#F7B733]" /> Member-owned</span>
              <span className="flex items-center gap-2"><Check size={17} className="text-[#F7B733]" /> Built for Nigeria</span>
              <span className="flex items-center gap-2"><Check size={17} className="text-[#F7B733]" /> Clear, fair terms</span>
            </div>
          </div>
          <div className="mt-14 flex flex-wrap items-end justify-between gap-8">
            <div className="flex flex-wrap gap-3">
              {stats.slice(0, 4).map((stat) => <div key={stat.label} className="rounded-xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-sm"><p className="font-serif text-xl font-bold text-[#F7D674]">{stat.value}</p><p className="text-xs text-white/75">{stat.label}</p></div>)}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setActiveSlide((activeSlide + heroSlides.length - 1) % heroSlides.length)} className="rounded-full bg-black/35 p-3 text-white transition hover:bg-black/60" aria-label="Show previous image"><ChevronLeft size={19} /></button>
              <div className="flex gap-1.5">{heroSlides.map((item, index) => <button type="button" key={item.label} onClick={() => setActiveSlide(index)} aria-label={`Show ${item.label} image`} aria-current={index === activeSlide} className={`h-2 rounded-full transition-all ${index === activeSlide ? 'w-6 bg-[#F7D674]' : 'w-2 bg-white/70 hover:bg-white'}`} />)}</div>
              <button type="button" onClick={() => setActiveSlide((activeSlide + 1) % heroSlides.length)} className="rounded-full bg-black/35 p-3 text-white transition hover:bg-black/60" aria-label="Show next image"><ChevronRight size={19} /></button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-1 bg-[#FFF9EF] py-18 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
            <div>
              <p className="afro-kicker">Made for everyday progress</p>
              <h2 className="mt-4 max-w-md font-serif text-4xl font-bold leading-tight text-[#2C1B13] sm:text-5xl">Your ambitions deserve a community behind them.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">From school fees and stock for your business to a home deposit and long-term investments, our services are shaped around the moments that matter to you.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {site.services.map((service, index) => (
              <article key={service.title} className="group relative overflow-hidden rounded-[1.6rem] bg-white p-7 shadow-[0_12px_35px_rgba(79,43,17,0.08)] transition duration-300 hover:-translate-y-1">
                <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: serviceColors[index] }} />
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${serviceColors[index]}18` }}>{service.icon}</span>
                <h3 className="mt-6 text-xl font-bold text-[#2C1B13]">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{service.description}</p>
                <Link to="/services" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#176B5B] opacity-0 transition group-hover:opacity-100">Explore <ArrowRight size={15} /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="afro-sand-pattern bg-[#F0DDAD] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="afro-kicker text-[#9D4824]">A simple beginning</p>
            <h2 className="mt-4 font-serif text-4xl font-bold text-[#2C1B13] sm:text-5xl">Come in. Grow with us.</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {site.steps.map((step, index) => (
              <div key={step.title} className="relative rounded-[1.8rem] border border-[#9D623A]/15 bg-[#FFF9EF] p-8 shadow-sm">
                <span className="font-serif text-6xl font-bold leading-none text-[#D78135]/35">0{index + 1}</span>
                <h3 className="mt-7 text-xl font-bold text-[#2C1B13]">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-[#6B5245]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#176B5B] py-20 text-[#FFF9EF] sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="afro-kicker text-[#F7D674]">The cooperative way</p>
              <h2 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">Finance with dignity, warmth, and a shared purpose.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {site.values.map((value, index) => (
                <div key={value.title} className="rounded-2xl border border-white/15 bg-white/8 p-6">
                  <span className="font-serif text-2xl text-[#F7D674]">0{index + 1}</span>
                  <h3 className="mt-5 text-lg font-bold">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#E5F0E7]/75">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="afro-cta mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] px-7 py-14 text-center text-[#FFF9EF] sm:px-12 sm:py-20">
          <p className="text-sm font-bold tracking-[0.16em] uppercase text-[#F8CE68]">The next chapter is yours</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl">Let’s build a future that reaches further.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#FFF3D8]/80">Join {branding.organizationName} and turn collective strength into real possibilities.</p>
          <Link to="/register" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#F7B733] px-8 py-4 font-bold text-[#28170E] transition hover:-translate-y-0.5 hover:bg-[#FFE08B]">Become a member <ArrowRight size={18} /></Link>
        </div>
      </section>
    </div>
  )
}

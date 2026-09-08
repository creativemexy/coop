import { ArrowRight, Building2, Landmark, LineChart, ShieldCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { site } from './site.config'

const details: Record<string, string[]> = {
  Savings: [
    'Digital savings services for member organizations',
    'Clear records and transparent account access',
    'Structures that support collective wealth building',
    'Practical tools for stronger member communities',
  ],
  'Buy Now, Pay Later': [
    'Flexible access to approved financial services',
    'Simple, understandable repayment schedules',
    'Transparent terms from application to completion',
    'Designed around the needs of organized members',
  ],
  'Investment Opportunities': [
    'Cooperative-backed investment opportunities',
    'Member-first structures and clear timelines',
    'Responsible options for associations and communities',
    'Full transparency on fees, risks, and returns',
  ],
  'Low-Interest Loans': [
    'Accessible financing for eligible members',
    'Transparent terms and repayment plans',
    'Support for productive community activity',
    'Backed by cooperative values and accountability',
  ],
}

export default function Services() {
  return (
    <div className="overflow-hidden bg-[#FFF9EF] text-[#23150F]">
      <section className="afro-hero relative isolate overflow-hidden text-[#FFF9EF]"><div className="afro-pattern absolute inset-0 opacity-20" aria-hidden="true" /><div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><p className="afro-kicker text-[#F7D674]">Our services</p><h1 className="mt-5 max-w-4xl font-serif text-5xl font-bold leading-[0.98] sm:text-6xl lg:text-8xl">Finance that makes <span className="text-[#F7B733]">cooperation stronger.</span></h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#FFF3D8]/85 sm:text-xl">Digital financial services built for associations, clubs, NGOs, and the communities they serve.</p></div></section>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="grid gap-5 md:grid-cols-2">{site.services.map((service, index) => { const icons = [Landmark, ShieldCheck, LineChart, Building2]; const Icon = icons[index] || UsersRound; return <article key={service.title} className="group relative overflow-hidden rounded-[1.8rem] bg-white p-8 shadow-[0_16px_40px_rgba(79,43,17,0.08)] transition duration-300 hover:-translate-y-1 sm:p-10"><div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: ['#C85B23', '#176B5B', '#D49728', '#7F3F2A'][index] }} /><div className="flex items-start justify-between gap-6"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0E5] text-[#176B5B]"><Icon size={28} /></span><span className="font-serif text-5xl font-bold text-[#D8C9A9]/60">0{index + 1}</span></div><h2 className="mt-8 font-serif text-3xl font-bold text-[#2C1B13]">{service.title}</h2><p className="mt-4 leading-relaxed text-[#6B5245]">{service.description}</p><ul className="mt-7 space-y-3 border-t border-[#E8DDC4] pt-6">{(details[service.title] ?? []).map((detail) => <li key={detail} className="flex items-start gap-3 text-sm text-[#6B5245]"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C85B23]" />{detail}</li>)}</ul></article> })}</div></section>
      <section className="bg-[#176B5B] px-4 py-20 text-center text-[#FFF9EF] sm:px-6 lg:px-8 lg:py-24"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F7D674]">Built for the movement</p><h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-bold sm:text-6xl">The right service starts with the right conversation.</h2><Link to="/contact" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#F7B733] px-8 py-4 font-bold text-[#28170E]">Talk to FENAC <ArrowRight size={18} /></Link></section>
    </div>
  )
}

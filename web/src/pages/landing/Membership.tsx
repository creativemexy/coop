import { ArrowRight, BadgeCheck, FileCheck2, Handshake, Landmark, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const benefits = [
  { title: 'Shared representation', description: 'Bring your association’s voice into a federation built for collective influence.', icon: UsersRound },
  { title: 'Digital financial access', description: 'Use practical tools and services designed around organized members.', icon: Landmark },
  { title: 'Capacity building', description: 'Strengthen institutional and technical capability for lasting impact.', icon: BadgeCheck },
  { title: 'Collective opportunity', description: 'Access savings, investment, and financing pathways with clear terms.', icon: Handshake },
  { title: 'A stronger network', description: 'Connect with like-minded associations, clubs, and NGOs.', icon: UsersRound },
  { title: 'Member-first advocacy', description: 'Support a cooperative movement that works for its members.', icon: FileCheck2 },
]

const steps = [
  { step: '1', title: 'Start a conversation', description: 'Tell us about your association, club, or NGO and its goals.' },
  { step: '2', title: 'Submit your details', description: 'Share the organization information needed for federation review.' },
  { step: '3', title: 'Complete verification', description: 'Confirm your organization and authorized representatives securely.' },
  { step: '4', title: 'Grow with FENAC', description: 'Access shared services, representation, and capacity-building support.' },
]

export default function Membership() {
  return (
    <div className="overflow-hidden bg-[#FFF9EF] text-[#23150F]">
      <section className="afro-hero relative isolate overflow-hidden text-[#FFF9EF]"><div className="afro-pattern absolute inset-0 opacity-20" aria-hidden="true" /><div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><p className="afro-kicker text-[#F7D674]">Membership</p><h1 className="mt-5 max-w-4xl font-serif text-5xl font-bold leading-[0.98] sm:text-6xl lg:text-8xl">Grow with a federation that <span className="text-[#F7B733]">moves together.</span></h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#FFF3D8]/85 sm:text-xl">FENAC membership is for associations, clubs, and NGOs ready to build institutional strength and lasting wealth together.</p></div></section>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{benefits.map(({ title, description, icon: Icon }) => <article key={title} className="rounded-[1.6rem] border border-[#D8C9A9] bg-white/70 p-7"><Icon className="text-[#176B5B]" size={28} /><h2 className="mt-6 font-serif text-2xl font-bold text-[#2C1B13]">{title}</h2><p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{description}</p></article>)}</div></section>
      <section className="bg-[#F0DDAD] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><p className="afro-kicker">The path to membership</p><h2 className="mt-4 max-w-xl font-serif text-4xl font-bold text-[#2C1B13] sm:text-5xl">A clear beginning for collective progress.</h2><div className="mt-12 grid gap-5 md:grid-cols-4">{steps.map((step) => <article key={step.step} className="border-t-2 border-[#176B5B] pt-5"><span className="font-serif text-5xl font-bold text-[#C85B23]">{step.step}</span><h3 className="mt-5 font-bold text-[#2C1B13]">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{step.description}</p></article>)}</div></div></section>
      <section className="bg-[#176B5B] px-4 py-20 text-center text-[#FFF9EF] sm:px-6 lg:px-8 lg:py-24"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F7D674]">Become a member organization</p><h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-bold sm:text-6xl">Your community belongs in the conversation.</h2><Link to="/contact" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#F7B733] px-8 py-4 font-bold text-[#28170E]">Start a conversation <ArrowRight size={18} /></Link></section>
    </div>
  )
}

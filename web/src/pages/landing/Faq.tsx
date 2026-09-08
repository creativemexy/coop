import { useState } from 'react'
import { ChevronDown, CircleHelp } from 'lucide-react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    q: 'What is FENAC COOP?',
    a: 'FENAC Cooperative Society Ltd., fully Forward Ever Apex Cooperative Society Ltd., is an apex and umbrella cooperative registered under Nigerian cooperative law. We bring associations, clubs, and NGOs together to access shared digital financial services, representation, and capacity-building support.',
  },
  {
    q: 'Who can join FENAC?',
    a: 'FENAC membership is designed for associations, clubs, NGOs, and other organized groups that want to strengthen their institutions and communities through collective action.',
  },
  {
    q: 'What does membership provide?',
    a: 'Members can access shared digital financial services, representation, institutional and technical capacity-building, and a stronger network for collective opportunity.',
  },
  {
    q: 'What digital financial services are available?',
    a: 'FENAC is building accessible services around savings, investment opportunities, financing, and transparent digital account access. Availability and eligibility depend on the product and member organization.',
  },
  {
    q: 'How does FENAC support member communities?',
    a: 'We combine financial access with capacity-building and advocacy, helping member organizations improve their institutional strength while creating better opportunities for the communities they serve.',
  },
  {
    q: 'Is FENAC a primary cooperative?',
    a: 'No. FENAC operates as an apex or umbrella cooperative. Its membership base is made up of associations, clubs, and NGOs rather than individual farmers or traders joining as a primary cooperative.',
  },
  {
    q: 'What does “Building Wealth Together” mean?',
    a: 'It means using shared ownership, smart technology, and collective strength to help member organizations and their communities create lasting wealth.',
  },
  {
    q: 'How do I contact FENAC?',
    a: 'Send us an email at hello@fenacoop.org or visit our office at Plot 7, Nyala Close, Wuse, Zone 6, Abuja, Nigeria. We welcome questions, partnership conversations, and membership enquiries.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="overflow-hidden bg-[#FFF9EF] text-[#23150F]">
      <section className="afro-hero relative isolate overflow-hidden text-[#FFF9EF]"><div className="afro-pattern absolute inset-0 opacity-20" aria-hidden="true" /><div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><p className="afro-kicker text-[#F7D674]">Questions, answered</p><h1 className="mt-5 max-w-4xl font-serif text-5xl font-bold leading-[0.98] sm:text-6xl lg:text-8xl">Make the next step with <span className="text-[#F7B733]">confidence.</span></h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#FFF3D8]/85 sm:text-xl">A quick guide to FENAC COOP, our federation model, and how we build wealth together.</p></div></section>
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="overflow-hidden rounded-[1.4rem] border border-[#D8C9A9] bg-white/70">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full cursor-pointer items-center justify-between gap-5 px-6 py-6 text-left sm:px-8">
                <span className="flex items-center gap-4 font-serif text-xl font-bold text-[#2C1B13]"><CircleHelp className="shrink-0 text-[#C85B23]" size={23} />{f.q}</span>
                <ChevronDown className={`shrink-0 text-[#176B5B] transition-transform ${open === i ? 'rotate-180' : ''}`} size={22} />
              </button>
              {open === i && (
                <div className="px-6 pb-7 pl-[4.25rem] text-sm leading-relaxed text-[#6B5245] sm:px-8 sm:pl-[4.75rem]">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-[1.8rem] bg-[#F0DDAD] p-8 text-center sm:p-10"><p className="font-serif text-2xl font-bold text-[#2C1B13]">Still have a question?</p><p className="mt-3 text-[#6B5245]">Our team is ready to help your organization find its next step.</p><Link to="/contact" className="mt-6 inline-flex rounded-full bg-[#176B5B] px-8 py-3.5 text-sm font-semibold text-white">Contact FENAC</Link></div>
      </section>
    </div>
  )
}

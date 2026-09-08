import { ArrowRight, Building2, Eye, HeartHandshake, ShieldCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="overflow-hidden bg-[#FFF9EF] text-[#23150F]">
      <section className="afro-hero relative isolate overflow-hidden text-[#FFF9EF]">
        <div className="afro-pattern absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:px-8 lg:py-28">
          <div>
            <p className="afro-kicker text-[#F7D674]">Who we are</p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl font-bold leading-[0.98] sm:text-6xl lg:text-8xl">Building wealth <span className="text-[#F7B733]">together.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#FFF3D8]/85 sm:text-xl">FENAC Cooperative Society Ltd. is a digital smart cooperative financial institution connecting associations, clubs, and NGOs to shared opportunity.</p>
          </div>
          <div className="border-l border-[#F7D674]/40 pl-6 lg:mb-2 lg:pl-8">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F8CE68]">Our identity</p>
            <p className="mt-4 font-serif text-2xl leading-tight text-white">Forward Ever Apex Cooperative Society Ltd.</p>
            <p className="mt-4 text-sm leading-relaxed text-[#FFF3D8]/75">An apex and umbrella cooperative serving member organizations across West Africa.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <p className="afro-kicker">The FENAC difference</p>
            <h2 className="mt-4 max-w-sm font-serif text-4xl font-bold leading-tight text-[#2C1B13] sm:text-5xl">A federation with a bigger purpose.</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-[#6B5245]">
            <p>FENAC Cooperative Society Ltd. is registered as a cooperative society under Nigerian cooperative law, operating as an apex and umbrella cooperative rather than a primary cooperative of individual farmers or traders.</p>
            <p>Our membership base is made up of associations, clubs, and NGOs that join the federation to access shared digital financial services, representation, and capacity-building support.</p>
            <p>We bring the strength of collective ownership together with the reach of modern technology, helping member associations and their communities create lasting prosperity.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#F0DDAD] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-[1.8rem] bg-[#176B5B] p-8 text-[#FFF9EF] shadow-[0_18px_40px_rgba(23,107,91,0.18)] sm:p-12">
            <Eye className="text-[#F7D674]" size={34} />
            <p className="mt-10 text-sm font-bold uppercase tracking-[0.16em] text-[#F7D674]">Our vision</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl">West Africa&apos;s leading digital cooperative federation.</h2>
            <p className="mt-6 leading-relaxed text-[#E5F0E7]/85">Where member associations and their communities build lasting wealth through shared ownership, smart technology, and collective strength.</p>
          </article>
          <article className="rounded-[1.8rem] bg-[#FFF9EF] p-8 text-[#2C1B13] shadow-[0_18px_40px_rgba(79,43,17,0.1)] sm:p-12">
            <HeartHandshake className="text-[#C85B23]" size={34} />
            <p className="mt-10 text-sm font-bold uppercase tracking-[0.16em] text-[#C85B23]">Our mission</p>
            <p className="mt-4 text-xl font-semibold leading-relaxed">FENAC Cooperative Society Ltd. exists to strengthen member associations and their communities.</p>
            <p className="mt-5 leading-relaxed text-[#6B5245]">We provide accessible digital financial services, build institutional and technical capacity, and advocate for a cooperative movement that works for its members — delivered with integrity, transparency, and the technology of a modern financial institution.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-8 border-b border-[#D8C9A9] pb-10 sm:flex-row sm:items-end">
          <div><p className="afro-kicker">How we show up</p><h2 className="mt-4 font-serif text-4xl font-bold text-[#2C1B13] sm:text-5xl">Collective strength, made practical.</h2></div>
          <p className="max-w-md text-[#6B5245]">Our work is grounded in the principles that make cooperation powerful and enduring.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[{ title: 'Federated by design', text: 'Associations, clubs, and NGOs grow stronger through shared representation.', icon: Building2 }, { title: 'Member-led', text: 'We build with the people and organizations we exist to serve.', icon: UsersRound }, { title: 'Trust by default', text: 'Integrity and transparency guide every relationship and service.', icon: ShieldCheck }, { title: 'Technology with purpose', text: 'Smart digital tools make cooperative finance more accessible.', icon: Eye }].map(({ title, text, icon: Icon }) => <article key={title} className="rounded-2xl border border-[#D8C9A9] bg-white/60 p-6"><Icon className="text-[#176B5B]" size={25} /><h3 className="mt-6 font-bold text-[#2C1B13]">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[#6B5245]">{text}</p></article>)}
        </div>
      </section>

      <section className="bg-[#176B5B] px-4 py-20 text-center text-[#FFF9EF] sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F7D674]">Forward ever</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl">Join the movement building wealth together.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[#E5F0E7]/80">Connect your association or organization to a stronger, smarter cooperative future.</p>
        <Link to="/register" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#F7B733] px-8 py-4 font-bold text-[#28170E] transition hover:-translate-y-0.5 hover:bg-[#FFE08B]">Become a member <ArrowRight size={18} /></Link>
      </section>
    </div>
  )
}

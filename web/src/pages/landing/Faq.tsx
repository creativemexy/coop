import { useState } from 'react'
import { ArrowRight, ChevronDown, CircleHelp, Handshake, MessageCircle, Phone, ShieldCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const faqCategories = [
  {
    category: 'Getting Started',
    icon: UsersRound,
    questions: [
      {
        q: 'What is FENAC COOP?',
        a: 'FENAC Cooperative Society Ltd. is an apex and umbrella cooperative registered under Nigerian cooperative law. We bring associations, clubs, and NGOs together to access shared digital financial services, representation, and capacity-building support.',
      },
      {
        q: 'Who can join FENAC?',
        a: 'FENAC membership is designed for associations, clubs, NGOs, and other organized groups that want to strengthen their institutions and communities through collective action.',
      },
      {
        q: 'How do I apply for membership?',
        a: 'Start by contacting our team to discuss your organization needs. We will guide you through a simple application process that typically takes 5-7 business days from submission to activation.',
      },
      {
        q: 'What documents do I need to apply?',
        a: 'You will need your certificate of incorporation, constitution or bylaws, board resolution authorizing membership, and details of authorized representatives. Our team will provide a complete checklist during your initial consultation.',
      },
      {
        q: 'Is there a minimum organization size requirement?',
        a: 'We welcome organizations of all sizes, from small community groups to large associations. Our membership tiers are designed to scale with your organization needs and capacity.',
      },
      {
        q: 'Can international organizations join?',
        a: 'Currently, FENAC membership is focused on Nigerian-registered organizations. However, we welcome partnerships with international organizations working in Nigeria and may expand membership in the future.',
      },
    ],
  },
  {
    category: 'Membership & Benefits',
    icon: ShieldCheck,
    questions: [
      {
        q: 'What does membership provide?',
        a: 'Members access shared digital financial services, representation, institutional and technical capacity-building, and a stronger network for collective opportunity. This includes savings, loans, investments, and BNPL services.',
      },
      {
        q: 'What are the membership fees?',
        a: 'We offer affordable, scale-based pricing designed for organizations of all sizes. Contact our team for a customized quote based on your organization size and needs.',
      },
      {
        q: 'Can individual members join directly?',
        a: 'FENAC operates as an apex cooperative, so our membership base consists of associations, clubs, and NGOs rather than individuals. Individual members benefit through their parent organization membership.',
      },
      {
        q: 'What are the different membership tiers?',
        a: 'We offer tiered membership based on organization size and needs. Each tier provides access to core services, with higher tiers offering enhanced benefits, lower rates, and additional support services.',
      },
      {
        q: 'How is membership governed?',
        a: 'FENAC is governed by a board elected from member organizations. Each member has voting rights in general meetings and can participate in shaping the cooperative direction and policies.',
      },
      {
        q: 'Can membership be cancelled?',
        a: 'Yes, membership can be cancelled with proper notice. We work with exiting members to ensure smooth transition of services and settlement of any outstanding obligations.',
      },
      {
        q: 'What networking opportunities are available?',
        a: 'Members gain access to a network of like-minded organizations, networking events, partnership opportunities, and collaborative projects that can amplify your impact.',
      },
    ],
  },
  {
    category: 'Services & Security',
    icon: MessageCircle,
    questions: [
      {
        q: 'What digital financial services are available?',
        a: 'FENAC provides savings accounts, low-interest loans, investment opportunities, and Buy Now Pay Later options. Service availability depends on your membership tier and eligibility.',
      },
      {
        q: 'How secure are my funds and data?',
        a: 'We use bank-grade security to protect your finances and data. All transactions are encrypted, and we maintain strict data protection policies in compliance with Nigerian regulations.',
      },
      {
        q: 'What are the interest rates for loans and savings?',
        a: 'Our rates are member-friendly and competitive. Loan rates vary by product and membership tier, while savings accounts offer competitive interest rates designed to help your money grow.',
      },
      {
        q: 'How do I access the digital platform?',
        a: 'Once your membership is activated, you will receive login credentials for our secure digital platform. The platform is accessible via web and mobile, with 24/7 availability for basic services.',
      },
      {
        q: 'What is the process for loan applications?',
        a: 'Loan applications are submitted through our digital platform and reviewed based on your membership standing, repayment capacity, and intended use. Approval typically takes 3-5 business days for complete applications.',
      },
      {
        q: 'Are there withdrawal limits on savings?',
        a: 'Withdrawal limits vary by account type and membership tier. We design flexible options that balance liquidity needs with the cooperative investment model. Specific limits are detailed in your membership agreement.',
      },
      {
        q: 'How are investment returns calculated?',
        a: 'Investment returns are based on the performance of cooperative-backed investment products. We provide transparent reporting on fees, risks, and historical returns, and members can choose products matching their risk tolerance.',
      },
      {
        q: 'What happens if I miss a loan payment?',
        a: 'We work proactively with members to avoid missed payments through flexible scheduling and communication. If issues arise, we engage early to find solutions rather than immediately penalizing.',
      },
    ],
  },
  {
    category: 'Support & Contact',
    icon: Phone,
    questions: [
      {
        q: 'How do I contact FENAC for support?',
        a: 'Email us at hello@fenacoop.org or visit our office at Plot 7, Nyala Close, Wuse, Zone 6, Abuja, Nigeria. Our team typically responds within one working day.',
      },
      {
        q: 'What are your office hours?',
        a: 'We are open Monday through Friday, 8:00am to 5:00pm West African Time. You can reach us by email anytime, and we will respond during business hours.',
      },
      {
        q: 'Do you offer training for member organizations?',
        a: 'Yes, we provide capacity-building programs including financial literacy training, technical assistance, and best practices workshops to help strengthen your institution.',
      },
      {
        q: 'What technical support is available?',
        a: 'We provide technical support for our digital platform via email and phone during business hours. Premium members may receive access to dedicated support channels and faster response times.',
      },
      {
        q: 'How do I report issues or make complaints?',
        a: 'Issues and complaints can be submitted through our digital platform or by email. We have a formal complaints process with defined response times and escalation procedures to ensure fair resolution.',
      },
      {
        q: 'Can I get in-person support?',
        a: 'Yes, members can visit our Abuja office for in-person consultations by appointment. We also conduct periodic field visits to member organizations for on-site support.',
      },
      {
        q: 'How do I stay updated on FENAC news and updates?',
        a: 'Members receive regular newsletters, access to a member portal with updates, and invitations to annual general meetings and special events. Non-members can follow our social media channels.',
      },
    ],
  },
  {
    category: 'Partnerships & Growth',
    icon: Handshake,
    questions: [
      {
        q: 'Does FENAC partner with other organizations?',
        a: 'Yes, we actively seek partnerships with development agencies, financial institutions, and other cooperatives to expand services and opportunities for our members.',
      },
      {
        q: 'How can my organization partner with FENAC?',
        a: 'Partnership opportunities include service collaborations, capacity-building programs, and joint initiatives. Contact our team to discuss how we can work together to strengthen the cooperative ecosystem.',
      },
      {
        q: 'What is the difference between membership and partnership?',
        a: 'Membership is for organizations that want to access FENAC services and governance. Partnership is for organizations that want to collaborate with FENAC on specific programs or initiatives without full membership.',
      },
      {
        q: 'Can members refer other organizations?',
        a: 'Yes, we encourage member referrals. Members who refer successful new members may receive benefits or recognition as part of our community growth initiatives.',
      },
      {
        q: 'How does FENAC contribute to community development?',
        a: 'We support community development through member organization activities, targeted programs, and advocacy for cooperative-friendly policies. Members amplify this impact through their local work.',
      },
    ],
  },
]

export default function Faq() {
  const [openCategory, setOpenCategory] = useState<string | null>('Getting Started')
  const [openQuestion, setOpenQuestion] = useState<number | null>(0)

  const activeCategory = faqCategories.find(cat => cat.category === openCategory)

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
                Questions, answered
              </p>

              <h1 className="mt-6 text-5xl font-black leading-[0.96] tracking-[-0.05em] text-[#FFF9EF] sm:text-6xl xl:text-[5.3rem]">
                Make the next step with <span className="text-[#F7B733]">confidence.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#F5E9D9]/90 sm:text-xl">
                A practical guide to FENAC COOP, our federation model, and how we build wealth together through shared ownership and collective strength.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-7 py-4 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
                >
                  Ask a question
                  <ArrowRight size={18} />
                </Link>

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
                    <span>Quick Answers</span>
                    <span className="rounded-full bg-[#E4A42A]/20 px-2 py-1 text-[#F7D674]">5 Categories</span>
                  </div>

                  <div className="space-y-3 p-4">
                    {faqCategories.slice(0, 3).map((category) => {
                      const Icon = category.icon
                      return (
                        <div key={category.category} className="rounded-xl border border-white/10 bg-[#1F2C29]/40 p-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2 bg-[#E8F0E5] text-[#176B5B]">
                              <Icon size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{category.category}</p>
                              <p className="text-[10px] text-[#D7C7AF]">{category.questions.length} questions</p>
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
            <p className="text-[0.72rem] font-bold tracking-[0.17em] uppercase text-[#176B5B]">Frequently asked questions</p>
            <h2 className="mt-4 max-w-md text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#2C1B13] sm:text-5xl">
              Clear answers for common questions.
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-relaxed text-[#6B5245]">
            Browse questions by category or search for specific topics. Our team is also available to provide personalized answers for your unique situation.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-2">
              {faqCategories.map((category) => {
                const Icon = category.icon
                const isActive = openCategory === category.category
                return (
                  <button
                    key={category.category}
                    onClick={() => {
                      setOpenCategory(category.category)
                      setOpenQuestion(0)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition duration-200 ${
                      isActive
                        ? 'bg-[#176B5B] text-white'
                        : 'bg-white text-[#2C1B13] hover:bg-[#F7F2E8]'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-[#F7D674]' : 'text-[#176B5B]'} />
                    <span className="text-sm font-semibold">{category.category}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeCategory && (
              <div className="space-y-4">
                {activeCategory.questions.map((faq, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-[1.6rem] border border-[#EDE2D3] bg-white shadow-[0_8px_30px_rgba(79,43,17,0.04)] transition duration-300 hover:shadow-[0_12px_35px_rgba(79,43,17,0.08)]"
                  >
                    <button
                      onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
                      className="flex w-full cursor-pointer items-center justify-between gap-5 px-6 py-6 text-left sm:px-8"
                    >
                      <span className="flex items-start gap-4 text-base font-bold text-[#2C1B13] sm:text-lg">
                        <CircleHelp className="mt-1 shrink-0 text-[#C85B23]" size={20} />
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`shrink-0 text-[#176B5B] transition-transform duration-300 ${
                          openQuestion === index ? 'rotate-180' : ''
                        }`}
                        size={22}
                      />
                    </button>
                    {openQuestion === index && (
                      <div className="px-6 pb-7 pl-[3.5rem] text-sm leading-relaxed text-[#6B5245] sm:px-8 sm:pl-[4.5rem]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#176B5B] px-4 py-20 text-center text-[#FFF9EF] sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#F7D674]">Still have questions?</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
          The right answer starts with the right conversation.
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

import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    q: 'What is a cooperative, and how is ' + 'this different?',
    a: 'A cooperative is a member-owned organization where people pool resources for mutual benefit. Unlike a typical bank, every member is an owner, and surpluses are reinvested into better services and lower fees for members.',
  },
  {
    q: 'How do I become a member?',
    a: 'Simply create an account with an email or phone number, pay the one-time registration fee, and complete KYC verification. Once done, you can save, shop on credit, invest, and borrow.',
  },
  {
    q: 'Is there a registration fee?',
    a: 'Yes, there is a one-time membership registration fee. This fee activates your membership and gives you access to all cooperative services. You can only complete registration once it is paid.',
  },
  {
    q: 'How does Buy Now, Pay Later work?',
    a: 'As a member, you can shop for approved items and spread the cost into installments. Your repayment schedule is shown clearly at checkout, with no hidden fees.',
  },
  {
    q: 'Is my money safe?',
    a: 'We use bank-grade encryption and security practices to protect your data and savings. All transactions are monitored, and your account is protected by secure authentication.',
  },
  {
    q: 'Can I withdraw my savings anytime?',
    a: 'Savings products have clear terms. Flexible savings can usually be withdrawn anytime, while fixed-term products have a defined maturity period. Terms are disclosed for each product.',
  },
  {
    q: 'Who is eligible to join?',
    a: 'Membership is open to individuals who are 18 years or older and legally capable of entering into agreements.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach our member support team through the contact page, by email, or by phone. Our support hours are listed on the contact page.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div>
      <section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Frequently Asked Questions</h1>
          <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-400 text-lg">
            Answers to the questions we hear most from members.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
              >
                <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{f.q}</span>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-sm transition-transform"
                  style={{ backgroundColor: 'var(--brand-primary, #2563eb)', transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Still have questions?</p>
          <Link
            to="/contact"
            className="mt-3 inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}

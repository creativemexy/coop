import { Link } from 'react-router-dom'
import { site } from './site.config'
import { useBranding } from '../../stores/branding.store'

export default function Home() {
  const { branding } = useBranding()
  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center"
        style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 22%, #081C3A)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(1200px 700px at 85% -10%, color-mix(in srgb, var(--brand-accent) 14%, transparent) 0%, transparent 60%), radial-gradient(900px 600px at 8% 110%, color-mix(in srgb, var(--brand-primary) 12%, transparent) 0%, transparent 55%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse at 50% 20%, black 0%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 50% 20%, black 0%, transparent 75%)',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-24 w-full">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            {/* Left — content */}
            <div className="max-w-2xl">
              <span
                className="inline-flex items-center gap-2.5 rounded-full border px-5 py-2 text-xs font-semibold tracking-wide"
                style={{
                  borderColor: 'color-mix(in srgb, var(--brand-accent) 45%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--brand-accent) 12%, transparent)',
                  color: 'var(--brand-accent)',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--brand-accent)' }} />
                A Member-Owned Digital Cooperative
              </span>

              <h1 className="mt-7 text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                {site.tagline.split('. ').map((part, i, arr) => (
                  <span key={i}>
                    <span
                      style={
                        part.toLowerCase().includes('wealth')
                          ? {
                              background:
                                'linear-gradient(120deg, var(--brand-accent) 0%, var(--brand-primary) 45%, var(--brand-accent) 100%)',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              color: 'transparent',
                            }
                          : undefined
                      }
                    >
                      {part}
                    </span>
                    {i < arr.length - 1 ? '. ' : '.'}
                  </span>
                ))}
              </h1>

              <p className="mt-7 text-lg text-[#D9D9D9] leading-relaxed max-w-xl">
                {site.description}
              </p>

              <div
                className="mt-8 h-px w-40"
                style={{
                  background:
                    'linear-gradient(90deg, var(--brand-accent) 0%, color-mix(in srgb, var(--brand-accent) 15%, transparent) 100%)',
                }}
              />

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="rounded-full px-9 py-4 text-base font-semibold text-white text-center transition-all hover:scale-[1.03]"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-primary) 100%)',
                    boxShadow: '0 18px 40px -12px color-mix(in srgb, var(--brand-primary) 60%, transparent)',
                  }}
                >
                  Become a Member
                </Link>
                <Link
                  to="/about"
                  className="rounded-full border-2 px-9 py-4 text-base font-semibold text-center backdrop-blur transition-all"
                  style={{
                    borderColor: 'var(--brand-accent)',
                    color: 'var(--brand-accent)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--brand-accent) 10%, transparent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Learn More
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[
                    'var(--brand-accent)',
                    'var(--brand-primary)',
                    'color-mix(in srgb, var(--brand-accent) 55%, #ffffff)',
                    'color-mix(in srgb, var(--brand-primary) 55%, #ffffff)',
                  ].map((c, i) => (
                    <span
                      key={i}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#081C3A] text-sm font-semibold text-white"
                      style={{ backgroundColor: c }}
                    >
                      {['JD', 'MA', 'KO', 'SL'][i]}
                    </span>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--brand-accent)' }}>★★★★★</div>
                  <p className="text-sm text-[#D9D9D9]">Trusted by 10,000+ members nationwide</p>
                </div>
              </div>
            </div>

            {/* Right — premium graphic */}
            <div className="hidden lg:block relative h-[560px]">
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[440px] w-[440px] rounded-full animate-pulse-glow"
                style={{
                  background:
                    'radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 32%, transparent) 0%, color-mix(in srgb, var(--brand-primary) 12%, transparent) 45%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />

              {/* Abstract growth curve */}
              <svg
                className="absolute -top-4 right-0 h-64 w-80 opacity-80"
                viewBox="0 0 320 260"
                fill="none"
              >
                <path
                  d="M10,220 C60,200 80,150 130,140 C180,130 200,80 250,60 C280,48 300,40 315,30"
                  stroke="var(--brand-accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.55"
                />
                <path
                  d="M10,235 C70,220 100,175 150,165 C200,155 220,110 270,92 C292,84 305,78 315,70"
                  stroke="var(--brand-primary)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.35"
                />
                <path
                  d="M10,220 C60,200 80,150 130,140 C180,130 200,80 250,60 C280,48 300,40 315,30 L315,260 L10,260 Z"
                  fill="url(#brandCurveFade)"
                  opacity="0.35"
                />
                <defs>
                  <linearGradient id="brandCurveFade" x1="160" y1="30" x2="160" y2="260" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--brand-accent)" stopOpacity="0.35" />
                    <stop offset="1" stopColor="var(--brand-accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <circle cx="315" cy="30" r="5" fill="var(--brand-accent)" opacity="0.9" />
              </svg>

              {/* Main glass dashboard card */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] rounded-[28px] p-7 border border-white/10 animate-float-slow"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 40px 80px -24px rgba(0,0,0,0.6)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#D9D9D9]/70">Portfolio Growth</p>
                    <p className="mt-1 text-3xl font-extrabold text-white">₦2.4B</p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1.5 text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--brand-accent), var(--brand-primary))' }}
                  >
                    +24.8%
                  </span>
                </div>

                <div className="mt-6 flex h-32 items-end gap-3">
                  {[45, 65, 52, 80, 60, 92, 70, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-lg"
                      style={{
                        height: `${h}%`,
                        background:
                          i === 7
                            ? 'linear-gradient(180deg, var(--brand-accent), var(--brand-primary))'
                            : 'linear-gradient(180deg, color-mix(in srgb, var(--brand-accent) 55%, transparent), color-mix(in srgb, var(--brand-primary) 30%, transparent))',
                        boxShadow:
                          i === 7
                            ? '0 0 24px color-mix(in srgb, var(--brand-primary) 60%, transparent)'
                            : undefined,
                      }}
                    />
                  ))}
                </div>

                <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                  {[
                    ['Savings', '₦ 1,200,000'],
                    ['Investments', '₦ 860,000'],
                    ['Affordable Loans', '₦ 340,000'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-[#D9D9D9]/80">{label}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating card — top right */}
              <div
                className="absolute right-[4%] top-[6%] rounded-2xl border border-white/10 px-5 py-4 animate-float-slower"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 24px 48px -16px rgba(0,0,0,0.55)',
                }}
              >
                <p className="text-xs text-[#D9D9D9]/80">Monthly Savings</p>
                <p className="mt-1 text-xl font-bold" style={{ color: 'var(--brand-accent)' }}>₦ 480,000</p>
              </div>

              {/* Floating card — bottom left */}
              <div
                className="absolute bottom-[8%] left-[2%] flex items-center gap-3 rounded-2xl border border-white/10 px-5 py-4 animate-float-slow"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 24px 48px -16px rgba(0,0,0,0.55)',
                }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{ background: 'linear-gradient(135deg, var(--brand-accent), var(--brand-primary))' }}
                >
                  🤝
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">2,400+ members</p>
                  <p className="text-xs text-[#D9D9D9]/80">joined this month</p>
                </div>
              </div>

              {/* Geometric accents */}
              <div
                className="absolute left-[8%] top-[16%] h-10 w-10 rotate-45 rounded-md border-2 animate-float-slow"
                style={{ borderColor: 'color-mix(in srgb, var(--brand-accent) 70%, transparent)' }}
              />
              <div
                className="absolute right-[14%] bottom-[20%] h-24 w-24 rounded-full border-2 border-dashed animate-spin-slow"
                style={{ borderColor: 'color-mix(in srgb, var(--brand-accent) 40%, transparent)' }}
              />
              <div
                className="absolute left-[16%] bottom-[30%] h-14 w-14 rotate-12 rounded-2xl border animate-float-slower"
                style={{ borderColor: 'color-mix(in srgb, var(--brand-accent) 50%, transparent)' }}
              />

              {/* Glowing particles */}
              {[
                { left: '4%', top: '46%', size: 10, delay: '0s' },
                { left: '18%', top: '4%', size: 7, delay: '1.2s' },
                { left: '38%', top: '-2%', size: 12, delay: '0.6s' },
                { left: '72%', top: '2%', size: 6, delay: '1.8s' },
                { left: '96%', top: '28%', size: 9, delay: '0.9s' },
                { left: '2%', top: '68%', size: 6, delay: '2.1s' },
                { left: '90%', top: '66%', size: 8, delay: '0.3s' },
                { left: '10%', top: '90%', size: 7, delay: '1.5s' },
              ].map((p, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse-glow"
                  style={{
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    backgroundColor: 'var(--brand-accent)',
                    boxShadow: '0 0 16px color-mix(in srgb, var(--brand-primary) 90%, transparent)',
                    animationDelay: p.delay,
                  }}
                />
              ))}
            </div>

            {/* Mobile graphic */}
            <div className="lg:hidden relative h-64">
              <div
                className="absolute inset-x-0 top-1/2 h-48 -translate-y-1/2 rounded-[24px] border border-white/10"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))',
                  boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)',
                }}
              />
              <div className="relative flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-widest text-[#D9D9D9]/70">Portfolio Growth</p>
                  <p className="mt-2 text-4xl font-extrabold text-white">₦2.4B</p>
                  <span
                    className="mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--brand-accent), var(--brand-primary))' }}
                  >
                    +24.8%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Glassmorphism feature cards */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {site.heroCards.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-white/10 p-6 transition-colors hover:border-[color-mix(in_srgb,var(--brand-accent)_50%,transparent)]"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 20px 40px -18px rgba(0,0,0,0.5)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                    style={{
                      background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--brand-accent) 25%, transparent), color-mix(in srgb, var(--brand-primary) 15%, transparent))',
                      border: '1px solid color-mix(in srgb, var(--brand-accent) 35%, transparent)',
                    }}
                  >
                    {c.icon}
                  </span>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--brand-accent)',
                      boxShadow: '0 0 10px color-mix(in srgb, var(--brand-primary) 90%, transparent)',
                    }}
                  />
                </div>
                <h3 className="mt-5 text-base font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#D9D9D9]/85">{c.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Curved divider */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg
            viewBox="0 0 1440 120"
            className="block w-full h-[80px] md:h-[120px] text-white dark:text-gray-950"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,70 C360,130 1080,10 1440,70 L1440,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">What We Offer</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Financial services built around the needs of our members — transparent, accessible, and
            member-first.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {site.services.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-white"
                style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
              >
                {s.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Getting Started</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Join in three simple steps.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {site.steps.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white text-lg font-bold"
                  style={{ backgroundColor: 'var(--brand-primary, #2563eb)' }}
                >
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Our Values</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">What guides every decision we make.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {site.values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{v.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="rounded-3xl px-8 py-14 text-center text-white"
          style={{
            background:
              'linear-gradient(135deg, var(--brand-primary, #2563eb) 0%, var(--brand-accent, #7c3aed) 100%)',
          }}
        >
          <h2 className="text-3xl font-bold">Ready to grow together?</h2>
          <p className="mt-3 max-w-xl mx-auto text-white/85">
            Join thousands of members building a stronger financial future with {branding.organizationName}.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-gray-900 hover:bg-gray-50"
            >
              Become a Member
            </Link>
            <Link
              to="/contact"
              className="rounded-xl border border-white/40 px-8 py-4 text-base font-semibold text-white hover:bg-white/10"
            >
              Talk to Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { site, navLinks } from '../../pages/landing/site.config'
import { useBranding } from '../../stores/branding.store'
import { cn } from '../../lib/utils'

function LandingHeader() {
  const { branding, load, loaded } = useBranding()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { if (!loaded) load() }, [loaded, load])

  return (
    <header
      className="sticky top-0 z-50 border-b border-[#F7D674]/20 bg-[#173F38]/95 backdrop-blur"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={site.name} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <img src={site.logoPath} alt={site.name} className="h-9 w-9 rounded-lg object-cover" />
            )}
            <span className="text-lg font-bold text-white">{site.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.path}
                to={l.path}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/12 text-white'
                      : 'text-[#E7EFE8]/80 hover:bg-white/8 hover:text-white',
                  )
                }
                style={({ isActive }) =>
                  isActive ? { background: '#ffffff1f' } : undefined
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/register"
              className="rounded-full bg-[#E4A42A] px-5 py-2 text-sm font-bold text-[#2B1A10] transition hover:bg-[#F7B733]"
            >
              Become a Member
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-white"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 space-y-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.path}
                to={l.path}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-sm font-medium',
                  location.pathname === l.path
                    ? 'text-white'
                    : 'text-[#E7EFE8]',
                )}
                style={location.pathname === l.path ? { background: '#ffffff1f' } : undefined}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="pt-3 px-3">
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-[#E4A42A] px-4 py-2 text-center text-sm font-bold text-[#2B1A10]"
              >
                Become a Member
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function LandingFooter() {
  const { branding } = useBranding()
  return (
    <footer className="bg-[#173F38] text-[#E7EFE8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.organizationName} className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <img src={site.logoPath} alt={branding.organizationName} className="h-9 w-9 rounded-lg object-cover" />
              )}
            <span className="text-lg font-bold text-white">{branding.organizationName}</span>
            </div>
            <p className="text-sm leading-relaxed text-[#E7EFE8]/70">{site.description}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {navLinks.map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="text-sm text-gray-300 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              {site.services.map((s) => (
                <li key={s.title}>{s.title}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>{site.address}</li>
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-white">
                  {site.email}
                </a>
              </li>
              <li>
                <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="hover:text-white">
                  {site.phone}
                </a>
              </li>
              <li>{site.hours}</li>
            </ul>
            <div className="flex gap-3 mt-4">
              {(
                [
                  ['facebook', site.social.facebook],
                  ['instagram', site.social.instagram],
                  ['twitter', site.social.twitter],
                  ['linkedin', site.social.linkedin],
                ] as const
              ).map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  aria-label={`${site.name} on ${label}`}
                  className="text-gray-300 hover:text-white text-xs uppercase tracking-wide"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-700 text-sm text-gray-300 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white">
              Terms &amp; Conditions
            </Link>
            <Link to="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/cookies" className="hover:text-white">
              Cookie Policy
            </Link>
            <Link to="/login" className="hover:text-white">
              Member Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <LandingHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}

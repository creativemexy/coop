import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Phone, User, X, Building2, CheckCircle2 } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../stores/auth.store'
import { useBranding } from '../../stores/branding.store'
import { DesignCredit } from '../../components/layout/DesignCredit'
import { termsSections } from '../landing/Terms'

interface ApexOrg { id: string; name: string }
interface Org { id: string; name: string; code: string }

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
const strengthTextColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500']

function passwordStrength(pw: string): number {
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

export function Register() {
  const navigate = useNavigate()
  const { register, isAuthenticated, user } = useAuth()
  const { branding, load, loaded } = useBranding()

  const [step, setStep] = useState(1)
  const [apexOrgs, setApexOrgs] = useState<ApexOrg[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [selectedApex, setSelectedApex] = useState('')
  const [selectedOrg, setSelectedOrg] = useState('')
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const strength = useMemo(() => passwordStrength(form.password), [form.password])

  useEffect(() => { if (!loaded) load() }, [loaded, load])

  useEffect(() => {
    api.get('/registrations/apex-organizations').then((r) => setApexOrgs(r.data))
  }, [])

  useEffect(() => {
    if (selectedApex) {
      api.get(`/registrations/organizations?apexOrgId=${selectedApex}`).then((r) => setOrgs(r.data))
    } else {
      setOrgs([])
    }
  }, [selectedApex])

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role.replace(/_/g, '-')}`} replace />
  }

  const goTo = (s: number) => {
    setStep(s)
  }

  const apexName = apexOrgs.find((o) => o.id === selectedApex)?.name
  const orgName = orgs.find((o) => o.id === selectedOrg)?.name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.password) {
      setError('Please fill in all required fields')
      return
    }
    if (!form.email && !form.phone) {
      setError('Please provide either an email or phone number (required for login)')
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please provide a valid email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      const org = orgs.find((o) => o.id === selectedOrg)
      const res = await register({ ...form, organizationCode: org?.code })
      if (res.registrationFeeRequired) {
        navigate('/register/pay-fee', { state: { feeAmount: res.registrationFeeAmount, pendingUserId: res.pendingUserId }, replace: true })
      } else {
        navigate('/individual', { replace: true })
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF9EF]">
      <div className="absolute inset-0 bg-[#20120E]" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B100C]/95 via-[#25140D]/85 to-[#20120E]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(247,183,51,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(23,107,91,0.12),_transparent_40%)]" />
      </div>

      <div className="relative w-full max-w-md px-4">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 backdrop-blur-md p-8 shadow-[0_30px_80px_rgba(9,8,7,0.35)] sm:p-10">
          <div className="flex flex-col items-center mb-8">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.organizationName} className="h-16 w-16 rounded-2xl object-contain mb-4" />
            ) : (
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-[#F7D674] bg-[#E4A42A]/20">
                {(branding.organizationName || 'F').charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-black tracking-[-0.03em] text-[#FFF9EF]">Create Account</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#F5E9D9]/80">Join your cooperative community</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 ${
                    step === s ? 'bg-[#E4A42A] text-white scale-110' : step > s ? 'bg-[#176B5B] text-white' : 'bg-white/10 text-[#F5E9D9]/50'
                  }`}
                >
                  {step > s ? <CheckCircle2 size={18} /> : s}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs">
              <span className={`font-medium ${step === 1 ? 'text-[#F7D674]' : 'text-[#F5E9D9]/60'}`}>Organization</span>
              <span className={`font-medium ${step === 2 ? 'text-[#F7D674]' : 'text-[#F5E9D9]/60'}`}>Selection</span>
              <span className={`font-medium ${step === 3 ? 'text-[#F7D674]' : 'text-[#F5E9D9]/60'}`}>Your Details</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#F5E9D9] mb-2">Select Apex Organization</label>
                  <select
                    value={selectedApex}
                    onChange={(e) => { setSelectedApex(e.target.value); setSelectedOrg('') }}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                    required
                  >
                    <option value="">Choose your apex organization</option>
                    {apexOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  disabled={!selectedApex}
                  className="w-full rounded-full bg-[#E4A42A] px-6 py-3.5 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B] disabled:opacity-70 disabled:pointer-events-none"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#F5E9D9] mb-2">Select Member Organization</label>
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                    required
                  >
                    <option value="">Choose your member organization</option>
                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => goTo(1)}
                    className="flex-1 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-[#FFF9EF] hover:bg-white/10 transition duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(3)}
                    disabled={!selectedOrg}
                    className="flex-1 rounded-full bg-[#E4A42A] px-6 py-3.5 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B] disabled:opacity-70 disabled:pointer-events-none"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="rounded-xl bg-[#E4A42A]/10 border border-[#E4A42A]/30 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-5 w-5 text-[#E4A42A] shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#E4A42A]">Selected Organization</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#F5E9D9]/90">
                        <span className="font-medium text-[#F5E9D9]">Apex:</span> {apexName}
                      </p>
                      <p className="text-xs leading-relaxed text-[#F5E9D9]/90">
                        <span className="font-medium text-[#F5E9D9]">Member:</span> {orgName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#F5E9D9] mb-2">First Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5E9D9]/50" />
                      <input
                        id="firstName"
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        required
                        placeholder="First name"
                        className="w-full rounded-xl border border-white/20 bg-white/10 pl-12 pr-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#F5E9D9] mb-2">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5E9D9]/50" />
                      <input
                        id="lastName"
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        required
                        placeholder="Last name"
                        className="w-full rounded-xl border border-white/20 bg-white/10 pl-12 pr-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F5E9D9] mb-2">Email <span className="text-[#F5E9D9]/50 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5E9D9]/50" />
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/20 bg-white/10 pl-12 pr-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F5E9D9] mb-2">Phone <span className="text-[#F5E9D9]/50 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5E9D9]/50" />
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                      className="w-full rounded-xl border border-white/20 bg-white/10 pl-12 pr-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-[#F5E9D9]/60 mt-1">Provide either email or phone number (one is required for login)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F5E9D9] mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5E9D9]/50" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      placeholder="Min 8 characters"
                      className="w-full rounded-xl border border-white/20 bg-white/10 pl-12 pr-12 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5E99D]/60 hover:text-[#F5E9D9] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {form.password && (
                  <div className="space-y-2">
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength]}`}
                        style={{ width: `${(strength / 4) * 100}%` }}
                      />
                    </div>
                    <p className={`text-xs font-medium ${strengthTextColors[strength]}`}>
                      {strengthLabels[strength] || ''}
                    </p>
                  </div>
                )}

                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-white/10 text-[#E4A42A] focus:ring-2 focus:ring-[#E4A42A]"
                    required
                    aria-describedby="consent-hint"
                  />
                  <span className="text-[#F5E9D9]/80">
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-[#F7D674] hover:text-[#F8CE68] transition-colors"
                    >
                      Terms & Conditions
                    </button>
                    ,{' '}
                    <Link to="/privacy" className="text-[#F7D674] hover:text-[#F8CE68] transition-colors">
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link to="/cookies" className="text-[#F7D674] hover:text-[#F8CE68] transition-colors">
                      Cookie Policy
                    </Link>
                  </span>
                </label>
                <p id="consent-hint" className="text-xs text-[#F5E9D9]/60 mt-1">
                  We only collect what we need to operate your account. See our policies for details.
                </p>

                {error && <p className="text-sm text-[#F87171]">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => goTo(2)}
                    className="flex-1 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-[#FFF9EF] hover:bg-white/10 transition duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !termsAccepted}
                    className="flex-1 rounded-full bg-[#E4A42A] px-6 py-3.5 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B] disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-[#F5E9D9]/70">
            Already have an account? <Link to="/login" className="text-[#F7D674] hover:text-[#F8CE68] transition-colors">Sign in</Link>
          </p>

          <div className="mt-4 flex justify-center gap-6 text-xs text-[#F5E9D9]/50">
            <Link to="/terms" className="hover:text-[#F5E9D9] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#F5E9D9] transition-colors">Privacy</Link>
            <Link to="/cookies" className="hover:text-[#F5E9D9] transition-colors">Cookies</Link>
          </div>
        </div>
      </div>

      {showTerms && (
        <div role="dialog" aria-modal="true" aria-label="Terms & Conditions" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[1.8rem] border border-white/10 bg-[#20120E] backdrop-blur-md shadow-[0_30px_80px_rgba(9,8,7,0.35)] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#FFF9EF]">Terms &amp; Conditions</h2>
              <button
                type="button"
                aria-label="Close terms"
                onClick={() => setShowTerms(false)}
                className="text-[#F5E9D9]/60 hover:text-[#F5E9D9] transition-colors cursor-pointer text-2xl leading-none"
              >
                <X size={24} />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto space-y-5">
              {termsSections.map((s) => (
                <section key={s.title}>
                  <h3 className="text-sm font-semibold mb-1 text-[#FFF9EF]">{s.title}</h3>
                  {Array.isArray(s.body) ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {s.body.map((b, i) => (
                        <li key={i} className="text-sm text-[#F5E9D9]/80 leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#F5E9D9]/80 leading-relaxed">{s.body}</p>
                  )}
                </section>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="rounded-full bg-[#E4A42A] px-6 py-3 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
        <DesignCredit onDark />
      </div>
    </div>
  )
}

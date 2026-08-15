import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../stores/auth.store'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { termsSections } from './Terms'

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
      setError('Provide either an email or phone number to log in')
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/login-bg.jpeg)' }}
      />
      <div className="absolute inset-0" style={{ background: 'rgba(8,28,58,0.55)' }} />
      <Card className="relative w-full max-w-sm">
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step === s ? 'bg-blue-600 text-white scale-110' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-center dark:text-gray-100 transition-opacity duration-200">
            {step === 1 ? 'Select Apex' : step === 2 ? 'Select Organization' : 'Your Details'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-2 animate-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              <select
                value={selectedApex}
                onChange={(e) => { setSelectedApex(e.target.value); setSelectedOrg('') }}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-3 text-sm"
                required
              >
                <option value="">Choose apex organization</option>
                {apexOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <Button type="button" className="w-full mt-4" disabled={!selectedApex} onClick={() => goTo(2)}>Next</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2 animate-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-3 text-sm"
                required
              >
                <option value="">Choose organization</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <div className="flex gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => goTo(1)} className="flex-1">Back</Button>
                <Button type="button" className="flex-1" disabled={!selectedOrg} onClick={() => goTo(3)}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 animate-in" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Apex:</span> {apexName}</p>
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Org:</span> {orgName}</p>
              </div>
              <Input id="firstName" label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              <Input id="lastName" label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input id="phone" label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">Provide either an email or phone number (used to log in).</p>
              <div className="relative">
                <Input id="password" label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer text-sm">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength]}`} style={{ width: `${(strength / 4) * 100}%` }} />
                  </div>
                  <p className={`text-xs font-medium ${strengthTextColors[strength]}`}>
                    {strengthLabels[strength] || ''}
                  </p>
                </div>
              )}
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  required
                />
                <span className="text-gray-600 dark:text-gray-400">
                  I accept the{' '}
                  <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    Terms &amp; Conditions
                  </button>
                </span>
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => goTo(2)} className="flex-1">Back</Button>
                <Button type="submit" className="flex-1" disabled={loading || !termsAccepted}>{loading ? 'Registering...' : 'Register'}</Button>
              </div>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Sign in</Link>
        </p>

        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-bold dark:text-gray-100">Terms &amp; Conditions</h2>
                <button type="button" onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer text-2xl leading-none">×</button>
              </div>
              <div className="px-6 py-4 overflow-y-auto space-y-5">
                {termsSections.map((s) => (
                  <section key={s.title}>
                    <h3 className="text-sm font-semibold mb-1 dark:text-gray-100">{s.title}</h3>
                    {Array.isArray(s.body) ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {s.body.map((b, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{b}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.body}</p>
                    )}
                  </section>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button type="button" onClick={() => setShowTerms(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </Card>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

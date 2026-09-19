import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../stores/auth.store'
import { useBranding } from '../../stores/branding.store'
import { api } from '../../api/client'
import { DesignCredit } from '../../components/layout/DesignCredit'

const ROLE_ROUTES: Record<string, string> = {
  apex_business_manager: '/apex-bm',
}
const rolePath = (role: string) => ROLE_ROUTES[role] ?? `/${role.replace(/_/g, '-')}`

const GOOGLE_AUTH_URL = '/api/v1/auth/google'

export function Login() {
  const navigate = useNavigate()
  const { login, completeFirstLogin, isAuthenticated, user } = useAuth()
  const { branding, load, loaded } = useBranding()
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [resetFor, setResetFor] = useState<{ emailOrPhone: string; currentPassword: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetting, setResetting] = useState(false)
  const [maintenance, setMaintenance] = useState(false)
  const [maintenanceLoaded, setMaintenanceLoaded] = useState(false)

  useEffect(() => { if (!loaded) load() }, [loaded, load])

  useEffect(() => {
    api.get<{ maintenance: boolean }>('/branding/maintenance')
      .then(({ data }) => setMaintenance(data.maintenance))
      .catch(() => setMaintenance(false))
      .finally(() => setMaintenanceLoaded(true))
  }, [])

  if (isAuthenticated && user && maintenanceLoaded && (!maintenance || user.role === 'super_admin')) {
    return <Navigate to={rolePath(user.role)} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const u = await login(emailOrPhone, password)
      if (u.passwordChangeRequired) {
        setResetFor({ emailOrPhone, currentPassword: password })
        return
      }
      navigate(rolePath(u.role), { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Login failed')
    }
  }

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetFor) return
    setResetError('')
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match')
      return
    }
    setResetting(true)
    try {
      const u = await completeFirstLogin(resetFor.emailOrPhone, resetFor.currentPassword, newPassword)
      setResetFor(null)
      setNewPassword('')
      setConfirmPassword('')
      navigate(rolePath(u.role), { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setResetError(msg || 'Failed to set password')
    }
    setResetting(false)
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
            <h1 className="text-2xl font-black tracking-[-0.03em] text-[#FFF9EF]">Welcome Back</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#F5E9D9]/80">Sign in to your account</p>
          </div>

          {resetFor ? (
            <form onSubmit={handleSetNewPassword} className="space-y-5">
              <div className="rounded-xl bg-[#E4A42A]/10 border border-[#E4A42A]/30 px-4 py-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[#E4A42A] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[#E4A42A]">Security Required</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#F5E9D9]/90">For your security, please set a new password before continuing. This is required for your first sign-in.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5E9D9] mb-2">New Password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 8 characters"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F5E9D9]/60 hover:text-[#F5E9D9] transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5E9D9] mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                  />
                </div>
              </div>

              {resetError && <p className="text-sm text-[#F87171]">{resetError}</p>}

              <button
                type="submit"
                disabled={resetting}
                className="w-full rounded-full bg-[#E4A42A] px-6 py-3.5 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B] disabled:opacity-70 disabled:pointer-events-none"
              >
                {resetting ? 'Setting Password...' : 'Set New Password'}
              </button>

              <button
                type="button"
                onClick={() => { setResetFor(null); setNewPassword(''); setConfirmPassword(''); setResetError('') }}
                className="w-full text-center text-sm text-[#F5E9D9]/70 hover:text-[#F5E9D9] transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#F5E9D9] mb-2">Email or Phone</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5E9D9]/50" />
                  <input
                    id="emailOrPhone"
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    required
                    placeholder="Enter your email or phone"
                    className="w-full rounded-xl border border-white/20 bg-white/10 pl-12 pr-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5E9D9] mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F5E9D9]/50" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/20 bg-white/10 pl-12 pr-12 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5E9D9]/60 hover:text-[#F5E9D9] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-[#F7D674] hover:text-[#F8CE68] transition-colors">Forgot password?</Link>
              </div>

              {error && <p className="text-sm text-[#F87171]">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-full bg-[#E4A42A] px-6 py-3.5 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
              >
                Sign in
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#20120E] px-3 text-[#F5E9D9]/60">or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={GOOGLE_AUTH_URL}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-[#FFF9EF] hover:bg-white/10 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </a>

            <button
              disabled
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-[#F5E9D9]/50 cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Sign in with Apple
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[#F5E9D9]/70">
            No account? <Link to="/register" className="text-[#F7D674] hover:text-[#F8CE68] transition-colors">Register</Link>
          </p>

          <div className="mt-4 flex justify-center gap-6 text-xs text-[#F5E9D9]/50">
            <Link to="/terms" className="hover:text-[#F5E9D9] transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-[#F5E9D9] transition-colors">Privacy</Link>
            <Link to="/cookies" className="hover:text-[#F5E9D9] transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
        <DesignCredit onDark />
      </div>
    </div>
  )
}

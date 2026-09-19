import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, CheckCircle2, ShieldCheck } from 'lucide-react'
import { DesignCredit } from '../../components/layout/DesignCredit'
import { api } from '../../api/client'

export function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!emailOrPhone.trim()) {
      setError('Enter your email or phone number.')
      return
    }
    try {
      await api.post('/auth/forgot-password', { emailOrPhone: emailOrPhone.trim() })
      setSent(true)
    } catch {
      setError('Something went wrong. Try again.')
    }
  }

  if (sent) {
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-[#F7D674] bg-[#176B5B]/20">
                <CheckCircle2 size={32} />
              </div>
              <h1 className="mt-6 text-2xl font-black tracking-[-0.03em] text-[#FFF9EF]">Check your inbox</h1>
              <p className="mt-2 text-sm leading-relaxed text-[#F5E9D9]/80 text-center">
                If an account exists for <span className="text-[#F7D674] font-medium">{emailOrPhone}</span>, a reset code has been sent.
              </p>
            </div>

            <div className="rounded-xl bg-[#E4A42A]/10 border border-[#E4A42A]/30 px-4 py-3 mb-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#E4A42A] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#E4A42A]">Important</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#F5E9D9]/90">
                    The reset code expires in 15 minutes. For your security, we only send this to registered accounts.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/reset-password"
              className="block w-full rounded-full bg-[#E4A42A] px-6 py-3.5 text-center text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
            >
              Enter reset code
            </Link>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-[#F5E9D9]/70 hover:text-[#F7D674] transition-colors">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
          <DesignCredit onDark />
        </div>
      </div>
    )
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-[#F7D674] bg-[#E4A42A]/20">
              <Lock size={32} />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-[-0.03em] text-[#FFF9EF]">Reset Password</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#F5E9D9]/80 text-center">
              Enter your email or phone number and we'll send you a reset code.
            </p>
          </div>

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
                  autoComplete="email"
                  placeholder="Enter your email or phone"
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 pl-12 pr-4 py-3 text-sm text-[#FFF9EF] placeholder-[#F5E9D9]/50 focus:outline-none focus:ring-2 focus:ring-[#E4A42A] focus:border-transparent"
                />
              </div>
            </div>

            {error && <p className="text-sm text-[#F87171]">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-full bg-[#E4A42A] px-6 py-3.5 text-sm font-bold text-[#23150F] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F2B63B]"
            >
              Send reset code
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-[#F5E9D9]/70 hover:text-[#F7D674] transition-colors">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
        <DesignCredit onDark />
      </div>
    </div>
  )
}

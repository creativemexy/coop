import { useState, useEffect, type FormEvent, type ReactNode } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../stores/auth.store'
import {
  UserRound, ShieldCheck, Bell, KeyRound, CheckCircle2, XCircle, Lock,
  Mail, Phone, CalendarDays, Loader2, Save, BadgeCheck,
} from 'lucide-react'

interface MatchDetail {
  user: string
  korapay: string
  match: boolean
}

interface VerifiedIdentity {
  id?: string
  full_name?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  date_of_birth?: string
  phone_number?: string
  gender?: string
  email?: string
  nin?: string
  image?: string
  address?: { street?: string; town?: string; lga?: string; state?: string }
  match?: {
    firstName?: MatchDetail
    lastName?: MatchDetail
    email?: MatchDetail | null
    phone?: MatchDetail | null
  }
}

interface ProfileUser {
  kycImage?: string
}

const solidGreen =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20 bg-white disabled:cursor-not-allowed disabled:bg-[#FFF9EF] disabled:text-[#6B5245] disabled:border-[#EDE2D3]'

function Label({ children, locked }: { children: ReactNode; locked?: boolean }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B5245]">
      {children}
      {locked && <Lock size={11} className="text-[#B79B6B]" />}
    </label>
  )
}

function KycStatusBadge({ status }: { status?: string }) {
  const s = status
  if (s === 'approved') return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B]/10 px-2.5 py-1 text-xs font-semibold text-[#176B5B]"><BadgeCheck size={12} /> Verified</span>
  if (s === 'pending') return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4A42A]/15 px-2.5 py-1 text-xs font-semibold text-[#8A5A00]"><span className="h-1.5 w-1.5 rounded-full bg-[#E4A42A]" /> KYC Pending</span>
  if (s === 'rejected') return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B3261E]/10 px-2.5 py-1 text-xs font-semibold text-[#B3261E]"><XCircle size={12} /> KYC Rejected</span>
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE2D3] px-2.5 py-1 text-xs font-semibold text-[#6B5245]"><Lock size={12} /> KYC Not Started</span>
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-[#6B5245]">{label}</span>
      <span className="font-semibold text-[#2C1B13]">{children}</span>
    </div>
  )
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: () => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-[#2C1B13]">{label}</p>
        <p className="mt-0.5 text-xs text-[#6B5245]">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${on ? 'bg-[#176B5B]' : 'bg-[#DDD0BC]'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

export function Profile() {
  const { user, refreshUser } = useAuth()
  const [korayData, setKorayData] = useState<VerifiedIdentity | null>(null)
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [profileMsg, setProfileMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: false, inApp: true })

  useEffect(() => {
    if (user?.notificationPreferences) {
      setNotifPrefs({
        email: user.notificationPreferences.email ?? true,
        sms: user.notificationPreferences.sms ?? false,
        inApp: user.notificationPreferences.inApp ?? true,
      })
    }
    if (user?.kycStatus === 'approved') {
      api.get('/kyc/status').then((r) => {
        const data = r.data as { kycStatus: string; lastSubmission?: { providerResponse?: { korapayData?: VerifiedIdentity } } }
        setKorayData(data.lastSubmission?.providerResponse?.korapayData ?? null)
      }).catch(() => {})
    }
  }, [user])

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setProfileMsg('')
    try {
      await api.patch('/users/me', form)
      await refreshUser()
      setProfileMsg('Profile updated')
    } catch {
      setProfileMsg('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordMsg('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg('Passwords do not match')
      return
    }
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordMsg('Password changed')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPasswordMsg(msg || 'Failed to change password')
    }
  }

  const handleNotificationToggle = async (key: 'email' | 'sms' | 'inApp') => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(updated)
    try {
      await api.patch('/users/me', { notificationPreferences: updated })
    } catch {
      setNotifPrefs(notifPrefs)
    }
  }

  const profileUser = user as typeof user & ProfileUser

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <UserRound size={24} className="text-[#176B5B]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Your Account</p>
          <h1 className="mt-0.5 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Profile & Account Settings</h1>
          <p className="mt-0.5 text-sm leading-relaxed text-[#6B5245]">Manage your identity, security and preferences.</p>
        </div>
      </div>

      {/* Account status */}
      <div className="rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
            <UserRound size={16} className="text-[#176B5B]" />
          </div>
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Account Status</p>
        </div>
        <div className="px-6 py-5">
          {profileUser?.kycImage && (
            <div className="mb-5 flex justify-center">
              <img
                src={profileUser.kycImage}
                alt="Profile photo"
                className="h-24 w-24 rounded-full border-4 border-[#176B5B]/25 object-cover shadow-md"
              />
            </div>
          )}
          <div className="space-y-2.5">
            <DetailRow label="Account">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                user?.isActive !== false ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${user?.isActive !== false ? 'bg-[#176B5B]' : 'bg-[#B3261E]'}`} />
                {user?.isActive !== false ? 'Active' : 'Suspended'}
              </span>
            </DetailRow>
            <DetailRow label="KYC Status"><KycStatusBadge status={user?.kycStatus} /></DetailRow>
            <DetailRow label="Role"><span className="capitalize text-[#9D4824]">{user?.role ?? '—'}</span></DetailRow>
            <DetailRow label="Email"><span className="flex items-center gap-1.5"><Mail size={13} className="text-[#B79B6B]" /> {user?.email ?? '—'}</span></DetailRow>
            <DetailRow label="Member since">
              <span className="flex items-center gap-1.5"><CalendarDays size={13} className="text-[#B79B6B]" /> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
            </DetailRow>
          </div>
        </div>
      </div>

      {/* Verified identity */}
      {user?.kycStatus === 'approved' && (
        <div className="rounded-2xl border border-[#176B5B]/25 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <ShieldCheck size={16} className="text-[#176B5B]" />
            </div>
            <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Verified Identity</p>
          </div>
          <div className="px-6 py-5">
            {korayData?.image && (
              <div className="mb-5 flex justify-center">
                <img src={korayData.image} alt="ID photo" className="h-28 w-28 rounded-2xl border border-[#E7DCCB] object-cover shadow-sm" />
              </div>
            )}
            {korayData?.match && (
              <div className="mb-4 rounded-xl bg-[#F0DDAD]/40 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6B5245]">Identity match</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {korayData.match.firstName && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${korayData.match.firstName.match ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'}`}>
                      {korayData.match.firstName.match ? <CheckCircle2 size={12} /> : <XCircle size={12} />} First name
                    </span>
                  )}
                  {korayData.match.lastName && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${korayData.match.lastName.match ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'}`}>
                      {korayData.match.lastName.match ? <CheckCircle2 size={12} /> : <XCircle size={12} />} Last name
                    </span>
                  )}
                  {korayData.match.email && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${korayData.match.email.match ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'}`}>
                      {korayData.match.email.match ? <CheckCircle2 size={12} /> : <XCircle size={12} />} Email
                    </span>
                  )}
                  {korayData.match.phone && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${korayData.match.phone.match ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'}`}>
                      {korayData.match.phone.match ? <CheckCircle2 size={12} /> : <XCircle size={12} />} Phone
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2.5 rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF] p-4">
              <DetailRow label="Full name">
                <span className="capitalize">
                  {(korayData?.first_name || '—')} {(korayData?.middle_name || '')} {(korayData?.last_name || '')}
                </span>
              </DetailRow>
              <DetailRow label="Date of birth">{korayData?.date_of_birth || '—'}</DetailRow>
              <DetailRow label="Gender">{korayData?.gender || '—'}</DetailRow>
              <DetailRow label="Phone"><span className="flex items-center gap-1.5"><Phone size={12} className="text-[#B79B6B]" /> {korayData?.phone_number || '—'}</span></DetailRow>
              {korayData?.email && <DetailRow label="Email">{korayData.email}</DetailRow>}
              {korayData?.nin && <DetailRow label="NIN"><span className="font-mono text-xs text-[#9D4824]">{korayData.nin}</span></DetailRow>}
              {korayData?.address && (
                <DetailRow label="Address">
                  <span className="text-right">
                    {korayData.address.street}, {korayData.address.town}, {korayData.address.lga}, {korayData.address.state}
                  </span>
                </DetailRow>
              )}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#176B5B]">
              <CheckCircle2 size={13} /> Your identity has been verified against government records.
            </p>
          </div>
        </div>
      )}

      {/* Personal info */}
      <div className="rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9D4824]/10">
            <UserRound size={16} className="text-[#9D4824]" />
          </div>
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Personal Information</p>
        </div>
        <div className="px-6 py-5">
          {user?.kycStatus === 'approved' && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#E4A42A]/30 bg-[#E4A42A]/10 p-3 text-xs leading-relaxed text-[#8A5A00]">
              <Lock size={14} className="mt-px shrink-0" />
              Your identity details were verified against government records and are now locked. Contact support to change your name or phone.
            </div>
          )}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <Label>Email <Lock size={11} className="inline text-[#B79B6B]" /></Label>
              <input id="prof-email" value={user?.email ?? ''} disabled className={fieldCls} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label locked={user?.kycStatus === 'approved'}>First name</Label>
                <input id="prof-first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} disabled={user?.kycStatus === 'approved'} required className={fieldCls} />
              </div>
              <div>
                <Label locked={user?.kycStatus === 'approved'}>Last name</Label>
                <input id="prof-last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} disabled={user?.kycStatus === 'approved'} required className={fieldCls} />
              </div>
            </div>
            <div>
              <Label locked={user?.kycStatus === 'approved'}>Phone</Label>
              <input id="prof-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={user?.kycStatus === 'approved'} className={fieldCls} />
            </div>
            {profileMsg && (
              <p className={`flex items-center gap-1.5 text-sm font-semibold ${profileMsg === 'Profile updated' ? 'text-[#176B5B]' : 'text-[#B3261E]'}`}>
                {profileMsg === 'Profile updated' ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {profileMsg}
              </p>
            )}
            <button type="submit" disabled={saving || user?.kycStatus === 'approved'} className={`${solidGreen} w-full`}>
              {saving ? (<><Loader2 size={15} className="animate-spin" /> Saving...</>) : (<><Save size={15} /> Save Changes</>)}
            </button>
          </form>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
            <Bell size={16} className="text-[#176B5B]" />
          </div>
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Notification Preferences</p>
        </div>
        <div className="divide-y divide-[#EDE2D3] px-6 py-2">
          <Toggle on={notifPrefs.email} onChange={() => handleNotificationToggle('email')} label="Email notifications" hint="Payment confirmations, KYC updates, and account alerts" />
          <Toggle on={notifPrefs.sms} onChange={() => handleNotificationToggle('sms')} label="SMS notifications" hint="Payment due reminders and urgent alerts via SMS" />
          <Toggle on={notifPrefs.inApp} onChange={() => handleNotificationToggle('inApp')} label="In-app notifications" hint="Real-time updates within the dashboard" />
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4A42A]/15">
            <KeyRound size={16} className="text-[#8A5A00]" />
          </div>
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Change Password</p>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label>Current password</Label>
              <input id="pw-current" type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className={fieldCls} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>New password</Label>
                <input id="pw-new" type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required className={fieldCls} />
              </div>
              <div>
                <Label>Confirm new password</Label>
                <input id="pw-confirm" type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required className={fieldCls} />
              </div>
            </div>
            {passwordMsg && (
              <p className={`flex items-center gap-1.5 text-sm font-semibold ${passwordMsg === 'Password changed' ? 'text-[#176B5B]' : 'text-[#B3261E]'}`}>
                {passwordMsg === 'Password changed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {passwordMsg}
              </p>
            )}
            <button type="submit" className={`${solidGreen} w-full`}>
              <KeyRound size={15} /> Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

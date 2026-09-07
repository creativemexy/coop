import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../stores/auth.store'
import { Card, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
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

  const handlePasswordChange = async (e: React.FormEvent) => {
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

  const kycBadge = () => {
    const s = user?.kycStatus
    if (s === 'approved') return <Badge variant="success">Verified</Badge>
    if (s === 'pending') return <Badge variant="warning">KYC Pending</Badge>
    if (s === 'rejected') return <Badge variant="danger">KYC Rejected</Badge>
    return <Badge variant="default">KYC Not Started</Badge>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Profile & Account Settings</h2>

      <Card>
        <CardTitle>Account Status</CardTitle>
        <div className="mt-4 space-y-3">
          {(user as (typeof user & ProfileUser))?.kycImage && (
            <div className="flex justify-center mb-2">
              <img
                src={(user as (typeof user & ProfileUser)).kycImage}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500"
              />
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Account</span>
            <Badge variant={user?.isActive !== false ? 'success' : 'danger'}>
              {user?.isActive !== false ? 'Active' : 'Suspended'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">KYC Status</span>
            <div className="flex items-center gap-2">
              {kycBadge()}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <span className="font-medium capitalize">{user?.role ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{user?.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Member since</span>
            <span className="font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </Card>

      {user?.kycStatus === 'approved' && (
        <Card>
          <CardTitle>Verified Identity</CardTitle>
          <div className="mt-4 space-y-3">
            {korayData?.image && (
              <div className="flex justify-center">
                <img src={korayData.image} alt="ID photo" className="w-28 h-28 rounded-xl object-cover border dark:border-gray-700" />
              </div>
            )}
            {korayData?.match && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-xs space-y-2">
                <p className="font-medium text-sm">Identity match</p>
                <div className="flex flex-wrap gap-2">
                  {korayData.match.firstName && (
                    <span className={`px-2 py-0.5 rounded ${korayData.match.firstName.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      First name ✓
                    </span>
                  )}
                  {korayData.match.lastName && (
                    <span className={`px-2 py-0.5 rounded ${korayData.match.lastName.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Last name {korayData.match.lastName.match ? '✓' : '✗'}
                    </span>
                  )}
                  {korayData.match.email && (
                    <span className={`px-2 py-0.5 rounded ${korayData.match.email.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Email {korayData.match.email.match ? '✓' : '✗'}
                    </span>
                  )}
                  {korayData.match.phone && (
                    <span className={`px-2 py-0.5 rounded ${korayData.match.phone.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Phone {korayData.match.phone.match ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="rounded-lg border dark:border-gray-700 p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Full name</span>
                <span className="font-medium capitalize">
                  {(korayData?.first_name || '—')} {(korayData?.middle_name || '')} {(korayData?.last_name || '')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date of birth</span>
                <span className="font-medium">{korayData?.date_of_birth || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium">{korayData?.gender || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{korayData?.phone_number || '—'}</span>
              </div>
              {korayData?.email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium">{korayData.email}</span>
                </div>
              )}
              {korayData?.nin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">NIN</span>
                  <span className="font-mono text-xs">{korayData.nin}</span>
                </div>
              )}
              {korayData?.address && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Address</span>
                  <span className="font-medium text-right ml-4">
                    {korayData.address.street}, {korayData.address.town}, {korayData.address.lga}, {korayData.address.state}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-green-600 font-medium">
              ✓ Your identity has been verified against government records.
            </p>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Personal Information</CardTitle>
        {user?.kycStatus === 'approved' && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-300">
            Your identity details were verified against government records and are now locked.
            Contact support to change your name or phone.
          </div>
        )}
        <form onSubmit={handleProfileUpdate} className="mt-4 space-y-4">
          <Input id="prof-email" label="Email" value={user?.email ?? ''} disabled />
          <Input id="prof-first" label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} disabled={user?.kycStatus === 'approved'} required />
          <Input id="prof-last" label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} disabled={user?.kycStatus === 'approved'} required />
          <Input id="prof-phone" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={user?.kycStatus === 'approved'} />
          {profileMsg && <p className={`text-sm ${profileMsg === 'Profile updated' ? 'text-green-600' : 'text-red-600'}`}>{profileMsg}</p>}
          <Button type="submit" className="w-full" disabled={saving || user?.kycStatus === 'approved'}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Notification Preferences</CardTitle>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifPrefs.email} onChange={() => handleNotificationToggle('email')} className="w-4 h-4" />
            <div>
              <p className="font-medium text-sm">Email notifications</p>
              <p className="text-xs text-gray-500">Payment confirmations, KYC updates, and account alerts</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifPrefs.sms} onChange={() => handleNotificationToggle('sms')} className="w-4 h-4" />
            <div>
              <p className="font-medium text-sm">SMS notifications</p>
              <p className="text-xs text-gray-500">Payment due reminders and urgent alerts via SMS</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifPrefs.inApp} onChange={() => handleNotificationToggle('inApp')} className="w-4 h-4" />
            <div>
              <p className="font-medium text-sm">In-app notifications</p>
              <p className="text-xs text-gray-500">Real-time updates within the dashboard</p>
            </div>
          </label>
        </div>
      </Card>

      <Card>
        <CardTitle>Change Password</CardTitle>
        <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
          <Input id="pw-current" label="Current password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
          <Input id="pw-new" label="New password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
          <Input id="pw-confirm" label="Confirm new password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
          {passwordMsg && <p className={`text-sm ${passwordMsg === 'Password changed' ? 'text-green-600' : 'text-red-600'}`}>{passwordMsg}</p>}
          <Button type="submit" className="w-full">Change Password</Button>
        </form>
      </Card>
    </div>
  )
}

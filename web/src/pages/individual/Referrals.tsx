import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface Referral {
  id: string
  refereeEmail: string
  status: string
  rewardAmount: number
  rewardPaid: boolean
  createdAt: string
}

export function Referrals() {
  const [stats, setStats] = useState<{ referralCode: string; referralCount: number; referralEarnings: number } | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const load = () => {
    api.get('/users/me/referral-stats').then((r) => setStats(r.data))
    api.get('/users/me/referrals').then((r) => setReferrals(r.data.sent || []))
  }

  useEffect(load, [])

  const invite = async () => {
    if (!email) return
    setSending(true)
    try {
      await api.post('/users/me/referrals', { refereeEmail: email })
      setMessage('Invitation sent!')
      setEmail('')
      load()
    } catch {
      setMessage('Failed to send invitation')
    }
    setSending(false)
  }

  const copyCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Referral Program</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardTitle className="text-sm font-medium text-gray-500">Your Referral Code</CardTitle>
          {stats?.referralCode ? (
            <div className="mt-2">
              <p className="text-2xl font-mono font-bold text-blue-600">{stats.referralCode}</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={copyCode}>
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-gray-400">Loading...</p>
          )}
        </Card>
        <Card>
          <CardTitle className="text-sm font-medium text-gray-500">Friends Referred</CardTitle>
          <p className="mt-2 text-3xl font-bold">{stats?.referralCount ?? 0}</p>
        </Card>
        <Card>
          <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
          <p className="mt-2 text-3xl font-bold text-green-600">
            ₦{(stats?.referralEarnings ?? 0).toLocaleString()}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle className="text-sm font-medium text-gray-500">Invite a Friend</CardTitle>
        <div className="mt-3 flex gap-3">
          <div className="flex-1">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@email.com"
            />
          </div>
          <Button onClick={invite} disabled={sending || !email}>
            {sending ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
        {message && <p className="text-sm text-gray-500 mt-2">{message}</p>}
      </Card>

      <Card>
        <CardTitle className="text-sm font-medium text-gray-500 mb-4">Invitation History</CardTitle>
        {referrals.length === 0 ? (
          <p className="text-gray-400 text-sm">No invitations sent yet</p>
        ) : (
          <div className="space-y-3">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium">{r.refereeEmail}</p>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <Badge variant={r.status === 'completed' ? 'success' : r.status === 'expired' ? 'default' : 'warning'}>
                    {r.status}
                  </Badge>
                  {r.rewardAmount > 0 && (
                    <span className="text-sm font-medium text-green-600">+₦{r.rewardAmount.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

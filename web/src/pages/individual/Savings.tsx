import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

interface SavingsAccount {
  id: string
  balance: number
  goalBalance: number
  targetAmount: number
  status: string
  transactions: Transaction[]
  withdrawalsEnabled: boolean
}

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'goal_deposit' | 'goal_withdrawal' | 'interest'
  amount: number
  description: string
  createdAt: string
}

interface VirtualAccount {
  accountNumber: string
  accountName: string
  bankName: string
  status: string
  provider: string
}

interface DepositInstruction {
  id: string
  amount: number
  type: 'general' | 'goal'
  reference: string
  accountNumber: string
  accountName: string
  bankName: string
  status: string
  expiresAt: string | null
  creditedAt: string | null
}

export function Savings() {
  const [account, setAccount] = useState<SavingsAccount | null>(null)
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null)
  const [depositInstruction, setDepositInstruction] = useState<DepositInstruction | null>(null)
  const [generalAmount, setGeneralAmount] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [generalMode, setGeneralMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [goalMode, setGoalMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [loading, setLoading] = useState(false)
  const [target, setTarget] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetch = () =>
    api
      .get('/savings')
      .then((r) => setAccount(r.data))
      .catch(() => setAccount(null))

  const fetchVirtualAccount = async () => {
    try {
      const r = await api.get('/virtual-accounts/me')
      setVirtualAccount(r.data)
    } catch {
      setVirtualAccount(null)
    }
  }

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.post(`/virtual-accounts/deposits/${id}/verify`)
        const d = r.data
        if (!d || d.id !== id) return
        if (d.status === 'credited') {
          clearInterval(pollRef.current!)
          setDepositInstruction(null)
          setNotice(`₦${Number(d.amount).toLocaleString()} credited to ${d.type === 'goal' ? 'Goal' : 'General'} Savings`)
          setTimeout(() => setNotice(null), 6000)
          await fetch()
        } else if (d.status === 'expired') {
          clearInterval(pollRef.current!)
          setDepositInstruction(null)
          await fetch()
        } else {
          setDepositInstruction((prev) => (prev && prev.id === d.id ? d : prev))
        }
      } catch {
        /* ignore transient errors */
      }
    }, 5000)
  }

  useEffect(() => {
    fetch()
    fetchVirtualAccount()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const copyNumber = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number)
      setCopied(number)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const handleGeneralSubmit = async () => {
    if (generalMode === 'withdraw') {
      await runWithdrawal('general')
      return
    }
    await runDeposit('general')
  }

  const handleGoalSubmit = async () => {
    if (goalMode === 'withdraw') {
      await runWithdrawal('goal')
      return
    }
    await runDeposit('goal')
  }

  const runDeposit = async (type: 'general' | 'goal') => {
    const amount = Number(type === 'general' ? generalAmount : goalAmount)
    setLoading(true)
    try {
      const r = await api.post('/virtual-accounts/deposits/initiate', {
        amount,
        type,
      })
      const d: DepositInstruction = r.data
      setGeneralAmount('')
      setGoalAmount('')
      if (d.status === 'credited') {
        setDepositInstruction(null)
        setNotice(`₦${Number(d.amount).toLocaleString()} deposited to ${type === 'goal' ? 'Goal' : 'General'} Savings`)
        setTimeout(() => setNotice(null), 6000)
        await fetch()
      } else {
        setNotice(null)
        setDepositInstruction(d)
        await fetch()
        startPolling(d.id)
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Transaction failed')
    }
    setLoading(false)
  }

  const runWithdrawal = async (type: 'general' | 'goal') => {
    const amount = Number(type === 'general' ? generalAmount : goalAmount)
    setLoading(true)
    try {
      await api.post(`/savings/withdraw`, { amount, type })
      setGeneralAmount('')
      setGoalAmount('')
      await fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Transaction failed')
    }
    setLoading(false)
  }

  const refreshStatus = async () => {
    try {
      const latest = await api.get('/virtual-accounts/deposits/latest')
      const current = latest.data
      if (!current) {
        if (pollRef.current) clearInterval(pollRef.current)
        setDepositInstruction(null)
        return
      }
      const r = await api.post(`/virtual-accounts/deposits/${current.id}/verify`)
      const d = r.data
      if (!d || d.status === 'credited' || d.status === 'expired') {
        if (pollRef.current) clearInterval(pollRef.current)
        setDepositInstruction(null)
        if (d?.status === 'credited') {
          setNotice(`₦${Number(d.amount).toLocaleString()} credited to ${d.type === 'goal' ? 'Goal' : 'General'} Savings`)
          setTimeout(() => setNotice(null), 6000)
        }
        await fetch()
      } else if (depositInstruction && d.id === depositInstruction.id) {
        setDepositInstruction(d)
      }
    } catch {
      /* ignore */
    }
  }

  const handleSetTarget = async () => {
    try {
      await api.post('/savings/target', { targetAmount: Number(target) })
      setTarget('')
      await fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to set target')
    }
  }

  const balance = Number(account?.balance || 0)
  const goalBalance = Number(account?.goalBalance || 0)
  const targetAmount = Number(account?.targetAmount || 0)
  const goalProgress = targetAmount > 0 ? Math.round((goalBalance / targetAmount) * 100) : 0
  const withdrawalsEnabled = account?.withdrawalsEnabled ?? true

  const expiresText = (d: DepositInstruction) =>
    d.status === 'credited' ? 'Credited'
    : d.status === 'expired' ? 'Expired'
    : d.expiresAt
      ? `Transfers expire ${new Date(d.expiresAt).toLocaleTimeString()}`
      : ''

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Savings</h2>

      <Card className="border-blue-500 bg-blue-50/30 dark:bg-blue-950/10">
        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Fund via Bank Transfer · Virtual Account
        </CardTitle>
        {virtualAccount ? (
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-gray-500">Account Number</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold tracking-wider text-gray-800 dark:text-gray-100">
                  {virtualAccount.accountNumber}
                </p>
                <button
                  onClick={() => copyNumber(virtualAccount.accountNumber)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copied === virtualAccount.accountNumber ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Account Name</p>
              <p className="font-semibold text-gray-700 dark:text-gray-200">{virtualAccount.accountName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Bank</p>
              <p className="font-semibold text-gray-700 dark:text-gray-200">{virtualAccount.bankName}</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-400">
            Virtual account is being provisioned — it will appear here shortly.
          </p>
        )}
        <p className="mt-3 text-xs text-gray-500">
          Transfer any amount to this account and it will be credited to your savings automatically.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-500">
          <CardTitle className="text-sm font-medium text-gray-500">General Savings</CardTitle>
          <p className="mt-2 text-3xl font-bold text-green-600">₦{balance.toLocaleString()}</p>
        </Card>
        <Card className="border-blue-500">
          <CardTitle className="text-sm font-medium text-gray-500">Goal Savings</CardTitle>
          <p className="mt-2 text-3xl font-bold text-blue-600">₦{goalBalance.toLocaleString()}</p>
          {targetAmount > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Target: ₦{targetAmount.toLocaleString()}</span>
                <span>{goalProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.min(goalProgress, 100)}%` }} />
              </div>
            </div>
          )}
        </Card>
      </div>

      {notice && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{notice}</p>
      )}

      {depositInstruction && (
        <Card className="border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20">
          <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
            Complete your {depositInstruction.type === 'goal' ? 'Goal' : 'General'} Savings Deposit
          </CardTitle>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Transfer{' '}
            <span className="font-bold text-indigo-700 dark:text-indigo-300">
              exactly ₦{depositInstruction.amount.toLocaleString()}
            </span>{' '}
            to the account below. Your savings are credited only after the transfer is confirmed by the bank — hit "Check status" to confirm.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-gray-500">Account Number</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold tracking-wider text-gray-800 dark:text-gray-100">
                  {depositInstruction.accountNumber}
                </p>
                <button
                  onClick={() => copyNumber(depositInstruction.accountNumber)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copied === depositInstruction.accountNumber ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Account Name</p>
              <p className="font-semibold text-gray-700 dark:text-gray-200">{depositInstruction.accountName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Bank</p>
              <p className="font-semibold text-gray-700 dark:text-gray-200">{depositInstruction.bankName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Reference</p>
              <p className="font-mono text-sm text-gray-600 dark:text-gray-300">{depositInstruction.reference}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <p className="text-xs text-gray-500">{expiresText(depositInstruction)}</p>
            <Button variant="secondary" size="sm" onClick={refreshStatus}>
              Check status
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="text-sm font-medium text-gray-500 mb-4">General Savings</CardTitle>
          <div className="flex gap-2 mb-4">
            <Button
              variant={generalMode === 'deposit' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setGeneralMode('deposit')}
            >
              Deposit
            </Button>
            <Button
              variant={generalMode === 'withdraw' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setGeneralMode('withdraw')}
              disabled={!withdrawalsEnabled}
              title={!withdrawalsEnabled ? 'Withdrawals are currently disabled' : ''}
            >
              Withdraw
            </Button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={generalAmount}
              onChange={(e) => setGeneralAmount(e.target.value)}
              className="flex-1 rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
            <Button onClick={handleGeneralSubmit} disabled={loading || !generalAmount || (generalMode === 'withdraw' && !withdrawalsEnabled)}>
              {loading ? 'Processing...' : generalMode === 'deposit' ? 'Deposit' : 'Withdraw'}
            </Button>
          </div>
          {generalMode === 'withdraw' && !withdrawalsEnabled && (
            <p className="text-xs text-red-500 mt-1">Withdrawals are currently disabled by admin</p>
          )}
        </Card>

        <Card>
          <CardTitle className="text-sm font-medium text-gray-500 mb-4">Goal Savings</CardTitle>
          <div className="flex gap-2 mb-4">
            <Button
              variant={goalMode === 'deposit' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setGoalMode('deposit')}
            >
              Deposit
            </Button>
            <Button
              variant={goalMode === 'withdraw' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setGoalMode('withdraw')}
              disabled={!withdrawalsEnabled}
              title={!withdrawalsEnabled ? 'Withdrawals are currently disabled' : ''}
            >
              Withdraw
            </Button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              className="flex-1 rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
            <Button onClick={handleGoalSubmit} disabled={loading || !goalAmount || (goalMode === 'withdraw' && !withdrawalsEnabled)}>
              {loading ? 'Processing...' : goalMode === 'deposit' ? 'Deposit' : 'Withdraw'}
            </Button>
          </div>
          {goalMode === 'withdraw' && !withdrawalsEnabled && (
            <p className="text-xs text-red-500 mt-1">Withdrawals are currently disabled by admin</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="text-sm font-medium text-gray-500 mb-4">Savings Goal Target</CardTitle>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Target amount"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="flex-1 rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
            <Button onClick={handleSetTarget} disabled={!target}>Set Target</Button>
          </div>
        </Card>

        <Card>
          <CardTitle className="text-sm font-medium text-gray-500">Account Status</CardTitle>
          <div className="mt-2">
            <Badge variant={account?.status === 'active' ? 'success' : 'default'}>
              {account?.status ?? '—'}
            </Badge>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle className="text-sm font-medium text-gray-500 mb-4">Transaction History</CardTitle>
        <div className="space-y-3">
          {(account?.transactions ?? []).length === 0 && (
            <p className="text-gray-400 text-sm">No transactions yet</p>
          )}
          {(account?.transactions ?? []).slice(0, 20).map((tx, i) => (
            <div key={tx.id} className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 rounded-lg px-2 ${
              [
                'bg-sky-50/40 dark:bg-sky-950/10',
                'bg-emerald-50/40 dark:bg-emerald-950/10',
                'bg-amber-50/40 dark:bg-amber-950/10',
                'bg-fuchsia-50/40 dark:bg-fuchsia-950/10',
                'bg-violet-50/40 dark:bg-violet-950/10',
              ][i % 5]
            }`}>
              <div>
                <p className="font-medium capitalize text-gray-700 dark:text-gray-300">
                  {tx.type === 'goal_deposit' ? 'Goal Deposit' : tx.type === 'goal_withdrawal' ? 'Goal Withdrawal' : tx.type}
                </p>
                <p className="text-sm text-gray-500">{tx.description}</p>
                <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
              <p className={`font-bold ${tx.type.includes('deposit') || tx.type === 'interest' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type.includes('deposit') || tx.type === 'interest' ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
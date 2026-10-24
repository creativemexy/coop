import { useEffect, useRef, useState, type ReactNode } from 'react'
import { api } from '../../api/client'
import {
  PiggyBank, Wallet, Copy, Check, Landmark, Banknote, ArrowDownLeft, ArrowUpRight,
  Target, Sparkles, CheckCircle2, AlertTriangle, Loader2, Clock, RefreshCw, Hash,
} from 'lucide-react'

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

const ngn = (n: number) => `₦${n.toLocaleString()}`

const solidGreen =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidMaroon =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#9D4824] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#B85A38] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidGold =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2 text-sm font-semibold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const pillActive =
  'inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-1.5 text-sm font-semibold text-[#FFF9EF] transition cursor-pointer'
const pillGhost =
  'inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-1.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] cursor-pointer disabled:opacity-60 disabled:pointer-events-none'
const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

export function Savings() {
  const [account, setAccount] = useState<SavingsAccount | null>(null)
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
      const r = await api.post(`/virtual-accounts/deposits/${current.id}/verify`, { confirm: true })
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Co-op Savings</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Savings</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Grow your general and goal savings, funded by bank transfer.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <PiggyBank size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <Wallet size={16} className="text-[#176B5B]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">General Savings</p>
          </div>
          <p className="mt-4 break-words text-3xl font-black tracking-[-0.03em] text-[#176B5B]">{ngn(balance)}</p>
          <p className="mt-1 text-xs text-[#B79B6B]">Available to deposit or withdraw</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4A42A]/15">
                <PiggyBank size={16} className="text-[#8A5A00]" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Goal Savings</p>
            </div>
            {targetAmount > 0 && (
              <span className="rounded-full bg-[#E4A42A]/15 px-2.5 py-1 text-xs font-bold text-[#8A5A00]">{goalProgress}%</span>
            )}
          </div>
          <p className="mt-4 break-words text-3xl font-black tracking-[-0.03em] text-[#8A5A00]">{ngn(goalBalance)}</p>
          {targetAmount > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs font-medium text-[#6B5245]">
                <span>Target: {ngn(targetAmount)}</span>
                <span>{goalBalance >= targetAmount ? 'Goal reached' : `${ngn(Math.max(0, targetAmount - goalBalance))} to go`}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F0DDAD]/60">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(goalProgress, 100)}%`, background: 'linear-gradient(90deg, #E4A42A, #176B5B)' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#176B5B]/25 bg-[#176B5B]/10 px-4 py-3 text-sm font-semibold text-[#176B5B]">
          <CheckCircle2 size={16} className="shrink-0" /> {notice}
        </div>
      )}

      {/* Pending deposit instruction */}
      {depositInstruction && (
        <div className="rounded-2xl border border-[#9D4824]/30 bg-gradient-to-br from-[#9D4824]/10 to-[#FFF9EF] p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9D4824]/10">
              <Banknote size={16} className="text-[#9D4824]" />
            </div>
            <p className="font-bold text-[#2C1B13]">
              Complete your {depositInstruction.type === 'goal' ? 'Goal' : 'General'} Savings Deposit
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#6B5245]">
            Transfer{' '}
            <span className="font-black text-[#176B5B]">{ngn(depositInstruction.amount)}</span>{' '}
            to the account below. Your savings are credited only after the transfer is confirmed by the bank — once you have sent it, click "I have transferred the money".
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B5245]">Account Number</p>
              <div className="mt-1 flex items-center gap-1.5">
                <p className="text-2xl font-black tracking-[0.06em] text-[#2C1B13]">{depositInstruction.accountNumber}</p>
                <button
                  onClick={() => copyNumber(depositInstruction.accountNumber)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#E7DCCB] bg-white text-[#6B5245] transition hover:bg-[#9D4824] hover:text-[#FFF9EF]"
                  aria-label="Copy account number"
                >
                  {copied === depositInstruction.accountNumber ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              {copied === depositInstruction.accountNumber && <p className="mt-1 text-xs font-semibold text-[#9D4824]">Copied!</p>}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B5245]">Account Name</p>
              <p className="mt-1 font-semibold text-[#2C1B13]">{depositInstruction.accountName}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B5245]">Bank</p>
              <p className="mt-1 font-semibold text-[#2C1B13]">{depositInstruction.bankName}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B5245]">Reference</p>
              <p className="mt-1 flex items-center gap-1 font-mono text-sm text-[#9D4824]"><Hash size={12} /> {depositInstruction.reference}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B5245]">
              <Clock size={13} /> {expiresText(depositInstruction)}
            </span>
            <button type="button" onClick={refreshStatus} className="inline-flex items-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2 text-sm font-bold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F] cursor-pointer">
              <RefreshCw size={14} /> I have transferred the money
            </button>
          </div>
        </div>
      )}

      {/* Balance actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ActionCard
          title="General Savings"
          icon={<Wallet size={16} className="text-[#176B5B]" />}
          iconCls="bg-[#176B5B]/10"
          mode={generalMode}
          setMode={setGeneralMode}
          amount={generalAmount}
          setAmount={setGeneralAmount}
          loading={loading}
          withdrawalsEnabled={withdrawalsEnabled}
          onSubmit={handleGeneralSubmit}
        />
        <ActionCard
          title="Goal Savings"
          icon={<PiggyBank size={16} className="text-[#8A5A00]" />}
          iconCls="bg-[#E4A42A]/15"
          mode={goalMode}
          setMode={setGoalMode}
          amount={goalAmount}
          setAmount={setGoalAmount}
          loading={loading}
          withdrawalsEnabled={withdrawalsEnabled}
          onSubmit={handleGoalSubmit}
        />
      </div>

      {/* Target + status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4A42A]/15">
              <Target size={16} className="text-[#8A5A00]" />
            </div>
            <p className="text-sm font-bold text-[#2C1B13]">Savings Goal Target</p>
          </div>
          {targetAmount > 0 && <p className="mt-1 text-xs text-[#B79B6B]">Current target: {ngn(targetAmount)}</p>}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#B79B6B]">₦</span>
              <input
                type="number"
                placeholder="Target amount"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className={`${fieldCls} pl-9`}
              />
            </div>
            <button type="button" onClick={handleSetTarget} disabled={!target} className={solidGold}>
              Set Target
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
                <Landmark size={16} className="text-[#176B5B]" />
              </div>
              <p className="text-sm font-bold text-[#2C1B13]">Account Status</p>
            </div>
            <p className="mt-1 text-xs text-[#B79B6B]">Your savings account health</p>
          </div>
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
              account?.status === 'active' ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#EDE2D3] text-[#6B5245]'
            }`}>
              <span className={`h-2 w-2 rounded-full ${account?.status === 'active' ? 'bg-[#176B5B]' : 'bg-[#C9B89F]'}`} />
              {account?.status ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE2D3] px-5 py-4">
          <div>
            <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Transaction History</h2>
            <p className="text-xs text-[#6B5245]">Your recent savings movements.</p>
          </div>
          <span className="rounded-full bg-[#176B5B]/10 px-2.5 py-1 text-xs font-bold text-[#176B5B]">
            Interest accrues regularly
          </span>
        </div>
        <div className="divide-y divide-[#EDE2D3]">
          {(account?.transactions ?? []).length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-[#C9B89F]">No transactions yet</p>
          )}
          {(account?.transactions ?? []).slice(0, 20).map((tx, i) => {
            const up = tx.type.includes('deposit') || tx.type === 'interest'
            const label =
              tx.type === 'goal_deposit' ? 'Goal Deposit'
              : tx.type === 'goal_withdrawal' ? 'Goal Withdrawal'
              : tx.type === 'interest' ? 'Interest Earned'
              : tx.type === 'deposit' ? 'Savings Deposit'
              : 'Withdrawal'
            const icon =
              tx.type === 'interest' ? <Sparkles size={15} />
              : tx.type === 'goal_withdrawal' || tx.type === 'goal_deposit' ? <Target size={15} />
              : up ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />
            const tone =
              tx.type === 'interest' ? 'bg-[#E4A42A]/15 text-[#8A5A00]'
              : up ? 'bg-[#176B5B]/10 text-[#176B5B]'
              : 'bg-[#B3261E]/10 text-[#B3261E]'
            return (
              <div key={tx.id} className={`flex items-start justify-between gap-3 px-5 py-4 transition hover:bg-[#FFF9EF]/50 sm:items-center ${i === 0 ? 'bg-[#FFF9EF]/60' : ''}`}>
                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
                  <div className="min-w-0">
                    <p className="capitalize text-sm font-bold text-[#2C1B13]">{label}</p>
                    {tx.description && <p className="max-w-[55vw] truncate text-xs text-[#6B5245] sm:max-w-sm">{tx.description}</p>}
                    <p className="text-[11px] text-[#B79B6B]">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`shrink-0 text-right text-sm font-black ${up ? 'text-[#176B5B]' : 'text-[#B3261E]'}`}>
                  {up ? '+' : '-'}{ngn(Number(tx.amount))}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ActionCard({
  title,
  icon,
  iconCls,
  mode,
  setMode,
  amount,
  setAmount,
  loading,
  withdrawalsEnabled,
  onSubmit,
}: {
  title: string
  icon: ReactNode
  iconCls: string
  mode: 'deposit' | 'withdraw'
  setMode: (m: 'deposit' | 'withdraw') => void
  amount: string
  setAmount: (v: string) => void
  loading: boolean
  withdrawalsEnabled: boolean
  onSubmit: () => void
}) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconCls}`}>{icon}</div>
          <p className="text-sm font-bold text-[#2C1B13]">{title}</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" className={mode === 'deposit' ? pillActive : pillGhost} onClick={() => setMode('deposit')}>
            Deposit
          </button>
          <button
            type="button"
            className={`${mode === 'withdraw' ? 'inline-flex items-center gap-2 rounded-full bg-[#9D4824] px-4 py-1.5 text-sm font-semibold text-[#FFF9EF] transition cursor-pointer' : pillGhost}`}
            onClick={() => setMode('withdraw')}
            disabled={!withdrawalsEnabled}
            title={!withdrawalsEnabled ? 'Withdrawals are currently disabled' : ''}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#B79B6B]">₦</span>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${fieldCls} pl-9`}
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || !amount || (mode === 'withdraw' && !withdrawalsEnabled)}
          className={mode === 'withdraw' ? solidMaroon : solidGreen}
        >
          {loading ? (<><Loader2 size={15} className="animate-spin" /> Processing...</>) : mode === 'deposit' ? 'Deposit' : 'Withdraw'}
        </button>
      </div>
      {mode === 'withdraw' && !withdrawalsEnabled && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#B3261E]">
          <AlertTriangle size={13} /> Withdrawals are currently disabled by admin
        </p>
      )}
    </div>
  )
}

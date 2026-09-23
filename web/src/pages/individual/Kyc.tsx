import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { api } from '../../api/client'
import {
  ShieldCheck, BadgeCheck, Clock, XCircle, AlertTriangle, RefreshCw,
  Fingerprint, Loader2, History, CheckCircle2, Lock,
} from 'lucide-react'

interface KycSubmission {
  id: string
  provider: string
  reference: string
  status: string
  rejectionReason: string | null
  submittedAt: string
  processedAt: string | null
}

interface KycStatusData {
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected'
  lastSubmission: KycSubmission | null
}

interface MatchDetail {
  user: string
  korapay: string
  match: boolean
}

interface InitiateResult {
  status: string
  reference: string
  match?: {
    firstName: MatchDetail
    lastName: MatchDetail
    email?: MatchDetail | null
    phone: MatchDetail | null
  }
  korapayData?: {
    first_name: string
    last_name: string
    date_of_birth: string
    phone_number: string
    email?: string
    gender?: string
  }
}

const ID_TYPES = [
  { value: 'bvn', label: 'Bank Verification Number (BVN)' },
  { value: 'nin', label: 'National Identification Number (NIN)' },
]

const solidGreen =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidGold =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2.5 text-sm font-semibold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
      {children}
    </label>
  )
}

export function Kyc() {
  const [data, setData] = useState<KycStatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [idType, setIdType] = useState('bvn')
  const [idValue, setIdValue] = useState('')
  const [result, setResult] = useState<InitiateResult | null>(null)

  const fetchStatus = useCallback(() => {
    api.get('/kyc/status').then((r) => setData(r.data))
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const handleInitiate = async () => {
    if (!idValue.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post('/kyc/initiate', { id: idValue.trim(), type: idType })
      setResult(data)
      fetchStatus()
    } catch {
      setResult({ status: 'error', reference: '' })
    } finally {
      setLoading(false)
    }
  }

  const status = data?.kycStatus ?? 'none'
  const lastSub = data?.lastSubmission

  const statusStyle =
    status === 'approved'
      ? { cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]', icon: <BadgeCheck size={16} /> }
      : status === 'pending'
        ? { cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]', icon: <Clock size={16} /> }
        : status === 'rejected'
          ? { cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]', icon: <XCircle size={16} /> }
          : { cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]', icon: <Lock size={16} /> }

  const statusText =
    status === 'none' ? 'Not started'
    : status === 'pending' ? 'Pending review'
    : status === 'rejected' ? 'Rejected'
    : 'Approved'

  return (
    <div className="mx-auto max-w-lg space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <ShieldCheck size={24} className="text-[#176B5B]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Identity Verification</p>
          <h1 className="mt-0.5 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">KYC Verification</h1>
          <p className="mt-0.5 text-sm leading-relaxed text-[#6B5245]">Verify your identity to unlock BNPL features.</p>
        </div>
      </div>

      {/* Status hero */}
      <div
        className={`rounded-2xl border p-6 ${
          status === 'approved'
            ? 'border-[#176B5B]/25 bg-gradient-to-br from-[#176B5B]/10 to-[#FFF9EF]'
            : status === 'pending'
              ? 'border-[#E4A42A]/30 bg-gradient-to-br from-[#F7D674]/25 to-[#FFF9EF]'
              : status === 'rejected'
                ? 'border-[#B3261E]/30 bg-gradient-to-br from-[#B3261E]/10 to-[#FFF9EF]'
                : 'border-[#E7DCCB] bg-white'
        } shadow-sm`}
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusStyle.cls}`}>{statusStyle.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B5245]">Verification Status</p>
            <p className={`text-xl font-black tracking-[-0.02em] ${statusStyle.cls.split(' ')[0]} ${statusStyle.cls.split(' ')[1]}`}>{statusText}</p>
          </div>
        </div>

        {status === 'rejected' && lastSub?.rejectionReason && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#B3261E]/5 p-3 text-sm text-[#B3261E]">
            <AlertTriangle size={15} className="mt-px shrink-0" />
            <div>
              <p className="font-bold">Rejection reason:</p>
              <p className="mt-0.5">{lastSub.rejectionReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {(status === 'none' || status === 'rejected') && (
        <div className="space-y-4 rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
          <div>
            <p className="font-black tracking-[-0.02em] text-[#2C1B13]">{status === 'rejected' ? 'Resubmit your details' : 'Get verified'}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
              Verify your identity by providing your ID number below. Your details will be
              checked against government records and reviewed by our team.
            </p>
          </div>

          <div>
            <Label>ID type</Label>
            <select value={idType} onChange={(e) => setIdType(e.target.value)} className={`${fieldCls} appearance-none`}>
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>{idType === 'bvn' ? 'BVN' : 'NIN'}</Label>
            <div className="relative">
              <Fingerprint size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9B89F]" />
              <input
                type="text"
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                placeholder={idType === 'bvn' ? 'Enter 11-digit BVN' : 'Enter 11-digit NIN'}
                maxLength={11}
                className={`${fieldCls} pl-10`}
              />
            </div>
            <p className="mt-1.5 text-xs text-[#B79B6B]">11-digit {idType.toUpperCase()} as printed on your record</p>
          </div>

          <button type="button" onClick={handleInitiate} disabled={loading || !idValue.trim()} className={`${solidGreen} w-full`}>
            {loading ? (<><Loader2 size={15} className="animate-spin" /> Verifying...</>) : 'Submit for Review'}
          </button>

          {result?.match && (
            <div className="space-y-3 rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF] p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[#2C1B13]">
                <CheckCircle2 size={15} className="text-[#176B5B]" /> Identity Match Results
              </p>
              {result.korapayData && (
                <div className="space-y-0.5 rounded-xl bg-[#E7DCCB]/40 px-3 py-2 text-xs text-[#6B5245]">
                  <p className="font-semibold text-[#2C1B13]">Records show: {result.korapayData.first_name} {result.korapayData.last_name}</p>
                  <p>DOB: {result.korapayData.date_of_birth}</p>
                  <p>Phone: {result.korapayData.phone_number}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: 'First name', m: result.match.firstName },
                  { label: 'Last name', m: result.match.lastName },
                  result.match.phone ? { label: 'Phone', m: result.match.phone } : null,
                  result.match.email ? { label: 'Email', m: result.match.email } : null,
                ].filter((x): x is { label: string; m: MatchDetail } => !!x).map(({ label, m }) => (
                  <span key={label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold ${
                    m.match ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'
                  }`}>
                    {m.match ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {label} {m.match ? 'match' : 'no match'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'pending' && (
        <div className="space-y-4 rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-[#6B5245]">
            Your verification has been submitted for review. Our team will review your
            information and update your status.
          </p>
          <button type="button" onClick={fetchStatus} className={`${solidGold} w-full`}>
            <RefreshCw size={15} /> Refresh Status
          </button>
        </div>
      )}

      {status === 'approved' && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#176B5B]/25 bg-[#176B5B]/10 p-5">
          <BadgeCheck size={20} className="mt-0.5 shrink-0 text-[#176B5B]" />
          <p className="text-sm font-medium leading-relaxed text-[#2C1B13]">
            Your identity has been verified. You can now access all BNPL features.
          </p>
        </div>
      )}

      {/* Submission history */}
      {lastSub && (
        <div className="rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4A42A]/15">
              <History size={16} className="text-[#8A5A00]" />
            </div>
            <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Submission History</p>
          </div>
          <div className="space-y-2.5 px-5 py-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-[#6B5245]">Reference</span>
              <span className="font-mono text-xs font-semibold text-[#9D4824]">{lastSub.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B5245]">Provider</span>
              <span className="font-semibold capitalize text-[#2C1B13]">{lastSub.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B5245]">Submitted</span>
              <span className="font-semibold text-[#2C1B13]">{new Date(lastSub.submittedAt).toLocaleString()}</span>
            </div>
            {lastSub.processedAt && (
              <div className="flex justify-between">
                <span className="text-[#6B5245]">Processed</span>
                <span className="font-semibold text-[#2C1B13]">{new Date(lastSub.processedAt).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[#6B5245]">Status</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                lastSub.status === 'approved' ? 'bg-[#176B5B]/10 text-[#176B5B]'
                : lastSub.status === 'rejected' ? 'bg-[#B3261E]/10 text-[#B3261E]'
                : 'bg-[#E4A42A]/15 text-[#8A5A00]'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  lastSub.status === 'approved' ? 'bg-[#176B5B]'
                  : lastSub.status === 'rejected' ? 'bg-[#B3261E]'
                  : 'bg-[#E4A42A]'
                }`} />
                {lastSub.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

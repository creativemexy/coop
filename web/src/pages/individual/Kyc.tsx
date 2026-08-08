import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">KYC Verification</h2>

      <Card>
        <CardTitle>Verification Status</CardTitle>
        <div className="mt-4 space-y-4">
          <Badge
            variant={
              status === 'approved' ? 'success'
              : status === 'pending' ? 'warning'
              : status === 'rejected' ? 'danger'
              : 'default'
            }
            className="text-base px-4 py-1.5"
          >
            {status === 'none' ? 'Not started'
              : status === 'pending' ? 'Pending review'
              : status === 'rejected' ? 'Rejected'
              : 'Approved'}
          </Badge>

          {status === 'rejected' && lastSub?.rejectionReason && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm">
              <p className="font-medium text-red-700 dark:text-red-300">Rejection reason:</p>
              <p className="text-red-600 dark:text-red-400 mt-1">{lastSub.rejectionReason}</p>
            </div>
          )}

          {(status === 'none' || status === 'rejected') && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Verify your identity by providing your ID number below. Your details will be
                checked against government records and reviewed by our team.
              </p>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                {ID_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                placeholder={
                  idType === 'bvn' ? 'Enter 11-digit BVN'
                  : 'Enter 11-digit NIN'
                }
                className="w-full rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
              <Button onClick={handleInitiate} disabled={loading || !idValue.trim()} className="w-full">
                {loading ? 'Verifying...' : 'Submit for Review'}
              </Button>
            </div>
          )}

          {result?.match && (
            <div className="rounded-lg border p-3 text-sm space-y-2">
              <p className="font-medium">Identity Match Results</p>
              {result.korapayData && (
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Records show: {result.korapayData.first_name} {result.korapayData.last_name}</p>
                  <p>DOB: {result.korapayData.date_of_birth}</p>
                  <p>Phone: {result.korapayData.phone_number}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded ${result.match.firstName.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  First name {result.match.firstName.match ? '✓' : '✗'}
                </span>
                <span className={`px-1.5 py-0.5 rounded ${result.match.lastName.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Last name {result.match.lastName.match ? '✓' : '✗'}
                </span>
                {result.match.phone && (
                  <span className={`px-1.5 py-0.5 rounded ${result.match.phone.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Phone {result.match.phone.match ? '✓' : '✗'}
                  </span>
                )}
                {result.match.email && (
                  <span className={`px-1.5 py-0.5 rounded ${result.match.email.match ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Email {result.match.email.match ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Your verification has been submitted for review. Our team will review your
                information and update your status.
              </p>
              <Button variant="secondary" className="w-full" onClick={fetchStatus}>
                Refresh Status
              </Button>
            </div>
          )}

          {status === 'approved' && (
            <p className="text-sm text-green-600 font-medium">
              Your identity has been verified. You can now access all BNPL features.
            </p>
          )}
        </div>
      </Card>

      {lastSub && (
        <Card>
          <CardTitle>Submission History</CardTitle>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border dark:border-gray-700 p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-xs">{lastSub.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Provider</span>
                <span>{lastSub.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted</span>
                <span>{new Date(lastSub.submittedAt).toLocaleString()}</span>
              </div>
              {lastSub.processedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Processed</span>
                  <span>{new Date(lastSub.processedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <div>
                  <Badge variant={
                    lastSub.status === 'approved' ? 'success'
                    : lastSub.status === 'rejected' ? 'danger'
                    : 'warning'
                  }>
                    {lastSub.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'

interface KycSubmissionItem {
  id: string
  userId: string
  provider: string
  reference: string
  status: string
  rejectionReason?: string
  submittedAt: string
  processedAt?: string
  identityType?: string
  user?: { firstName: string; lastName: string; email: string }
  providerResponse?: {
    korapayData?: {
      id?: string
      first_name?: string
      last_name?: string
      middle_name?: string
      full_name?: string
      date_of_birth?: string
      phone_number?: string
      gender?: string
      email?: string
      nin?: string
      image?: string
      address?: { street?: string; town?: string; lga?: string; state?: string }
    }
    match?: {
      firstName?: { user: string; korapay: string; match: boolean }
      lastName?: { user: string; korapay: string; match: boolean }
      email?: { user: string; korapay: string; match: boolean } | null
      phone?: { user: string; korapay: string; match: boolean } | null
    }
  }
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
}

export function KycReview() {
  const [submissions, setSubmissions] = useState<KycSubmissionItem[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<KycSubmissionItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)

  const loadSubmissions = useCallback(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    api.get('/kyc/submissions', { params }).then((r) => setSubmissions(r.data))
  }, [statusFilter, search])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

  const handleReview = async (id: string, status: string) => {
    setSaving(true)
    try {
      await api.patch(`/kyc/submissions/${id}/review`, {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      })
      setSelected(null)
      setRejectionReason('')
      loadSubmissions()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to review KYC')
    }
    setSaving(false)
  }

  const handleExport = async () => {
    const token = localStorage.getItem('access_token')
    const res = await fetch('/api/v1/kyc/export', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kyc-submissions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">KYC Review</h2>
        <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search reference or user ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Reference</THeadCell>
            <THeadCell>Provider</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Submitted</THeadCell>
            <THeadCell>Processed</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {submissions.map((s) => (
            <TBodyRow key={s.id}>
              <TBodyCell className="font-mono text-xs">{s.reference}</TBodyCell>
              <TBodyCell className="capitalize">{s.provider}</TBodyCell>
              <TBodyCell>
                <Badge variant={statusColors[s.status] ?? 'default'}>{s.status}</Badge>
              </TBodyCell>
              <TBodyCell>{new Date(s.submittedAt).toLocaleDateString()}</TBodyCell>
              <TBodyCell>{s.processedAt ? new Date(s.processedAt).toLocaleDateString() : '—'}</TBodyCell>
              <TBodyCell>
                <Button variant="ghost" size="sm" onClick={() => { setSelected(s); setRejectionReason(s.rejectionReason || '') }}>
                  Review
                </Button>
              </TBodyCell>
            </TBodyRow>
          ))}
          {submissions.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={6} className="text-center text-gray-400 py-8">No submissions found</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">
              Review KYC — {selected.reference}
            </CardTitle>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Status</span>
                <span className="col-span-2">
                  <Badge variant={statusColors[selected.status] ?? 'default'}>{selected.status}</Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Provider</span>
                <span className="col-span-2 capitalize">{selected.provider}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">User ID</span>
                <span className="col-span-2 font-mono text-xs">{selected.userId}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Submitted</span>
                <span className="col-span-2">{new Date(selected.submittedAt).toLocaleString()}</span>
              </div>
              {selected.processedAt && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Processed</span>
                  <span className="col-span-2">{new Date(selected.processedAt).toLocaleString()}</span>
                </div>
              )}
              {selected.status === 'rejected' && selected.rejectionReason && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Reason</span>
                  <span className="col-span-2 text-red-600">{selected.rejectionReason}</span>
                </div>
              )}
            </div>

            {selected.providerResponse?.match && (
              <div className="mt-4 rounded-lg border dark:border-gray-600 p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold">Identity Match</p>
                  {selected.providerResponse.korapayData?.image && (
                    <img
                      src={selected.providerResponse.korapayData.image}
                      alt="ID photo"
                      className="w-20 h-20 rounded-lg object-cover border dark:border-gray-600"
                    />
                  )}
                </div>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">First name</span>
                    <span className={selected.providerResponse.match.firstName?.match ? 'text-green-600' : 'text-red-600'}>
                      {selected.providerResponse.match.firstName?.user} → {selected.providerResponse.match.firstName?.korapay}
                      {selected.providerResponse.match.firstName?.match ? ' ✓' : ' ✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last name</span>
                    <span className={selected.providerResponse.match.lastName?.match ? 'text-green-600' : 'text-red-600'}>
                      {selected.providerResponse.match.lastName?.user} → {selected.providerResponse.match.lastName?.korapay}
                      {selected.providerResponse.match.lastName?.match ? ' ✓' : ' ✗'}
                    </span>
                  </div>
                  {selected.providerResponse.match.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <span className={selected.providerResponse.match.email.match ? 'text-green-600' : 'text-red-600'}>
                        {selected.providerResponse.match.email.user} → {selected.providerResponse.match.email.korapay}
                        {selected.providerResponse.match.email.match ? ' ✓' : ' ✗'}
                      </span>
                    </div>
                  )}
                  {selected.providerResponse.match.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span className={selected.providerResponse.match.phone.match ? 'text-green-600' : 'text-red-600'}>
                        {selected.providerResponse.match.phone.user} → {selected.providerResponse.match.phone.korapay}
                        {selected.providerResponse.match.phone.match ? ' ✓' : ' ✗'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selected.providerResponse?.korapayData && (
              <div className="mt-4 rounded-lg border dark:border-gray-600 p-3">
                <p className="text-sm font-semibold mb-2">Government Records</p>
                <div className="text-xs space-y-1 text-gray-500">
                  <p>ID: <span className="font-mono">{selected.providerResponse.korapayData.id}</span></p>
                  <p>Full name: {selected.providerResponse.korapayData.first_name} {selected.providerResponse.korapayData.middle_name || ''} {selected.providerResponse.korapayData.last_name}</p>
                  {selected.providerResponse.korapayData.full_name && (
                    <p>Registered name: {selected.providerResponse.korapayData.full_name}</p>
                  )}
                  <p>DOB: {selected.providerResponse.korapayData.date_of_birth}</p>
                  {selected.providerResponse.korapayData.gender && (
                    <p>Gender: {selected.providerResponse.korapayData.gender}</p>
                  )}
                  <p>Phone: {selected.providerResponse.korapayData.phone_number}</p>
                  {selected.providerResponse.korapayData.email && (
                    <p>Email: {selected.providerResponse.korapayData.email}</p>
                  )}
                  {selected.providerResponse.korapayData.nin && (
                    <p>NIN: <span className="font-mono">{selected.providerResponse.korapayData.nin}</span></p>
                  )}
                  {selected.providerResponse.korapayData.address && (
                    <p>
                      Address: {selected.providerResponse.korapayData.address.street}, {selected.providerResponse.korapayData.address.town},
                      {selected.providerResponse.korapayData.address.lga}, {selected.providerResponse.korapayData.address.state}
                    </p>
                  )}
                </div>
              </div>
            )}

            {selected.status === 'pending' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rejection Reason (optional for rejection)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleReview(selected.id, 'approved')}
                    disabled={saving}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReview(selected.id, 'rejected')}
                    disabled={saving}
                  >
                    Reject
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {selected.status !== 'pending' && (
              <div className="mt-6">
                <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
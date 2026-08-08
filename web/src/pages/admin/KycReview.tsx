import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'

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
    userData?: {
      firstName?: string
      lastName?: string
      phone?: string
    }
    match?: {
      firstName?: { user: string; korapay: string; match: boolean }
      lastName?: { user: string; korapay: string; match: boolean }
      email?: { user: string; korapay: string; match: boolean } | null
      phone?: { user: string; korapay: string; match: boolean } | null
    }
  }
}

export function AdminKycReview() {
  const [submissions, setSubmissions] = useState<KycSubmissionItem[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<KycSubmissionItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    api.get('/kyc/submissions', { params }).then((r) => setSubmissions(r.data))
  }, [statusFilter, search])

  useEffect(() => { fetch() }, [fetch])

  const handleReview = async (id: string, status: string) => {
    setSaving(true)
    try {
      await api.patch(`/kyc/submissions/${id}/review`, {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      })
      setSelected(null)
      setRejectionReason('')
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to review KYC')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">KYC Review</h2>

      <div className="flex flex-wrap gap-2 items-center">
        <input type="text" placeholder="Search reference..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 w-64" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-left">
              <th className="p-3">Reference</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {submissions.map((s, i) => (
              <tr key={s.id} className={`border-b dark:border-gray-700 ${
                [
                  'bg-sky-50 dark:bg-sky-950/20',
                  'bg-emerald-50 dark:bg-emerald-950/20',
                  'bg-amber-50 dark:bg-amber-950/20',
                  'bg-fuchsia-50 dark:bg-fuchsia-950/20',
                  'bg-violet-50 dark:bg-violet-950/20',
                ][i % 5]
              }`}>
                <td className="p-3 font-mono text-xs">{s.reference}</td>
                <td className="p-3 text-xs uppercase">{s.identityType || s.provider}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    s.status === 'approved' ? 'bg-green-100 text-green-700' :
                    s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{s.status}</span>
                </td>
                <td className="p-3 text-gray-500">{new Date(s.submittedAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <button className="text-xs text-blue-600" onClick={() => { setSelected(s); setRejectionReason(s.rejectionReason || '') }}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Review KYC — {selected.reference}</h3>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex"><span className="w-24 text-gray-500">Status</span><span>{selected.status}</span></div>
              <div className="flex"><span className="w-24 text-gray-500">Type</span><span className="uppercase">{selected.identityType || selected.provider}</span></div>
              <div className="flex"><span className="w-24 text-gray-500">User ID</span><span className="font-mono text-xs">{selected.userId}</span></div>
              <div className="flex"><span className="w-24 text-gray-500">Submitted</span><span>{new Date(selected.submittedAt).toLocaleString()}</span></div>
            </div>

            {selected.providerResponse?.match && (
              <div className="rounded-lg border dark:border-gray-600 p-3 mb-4">
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
              <div className="rounded-lg border dark:border-gray-600 p-3 mb-4">
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
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rejection Reason</label>
                  <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" rows={3} />
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm" disabled={saving} onClick={() => handleReview(selected.id, 'approved')}>Approve</button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm" disabled={saving} onClick={() => handleReview(selected.id, 'rejected')}>Reject</button>
                  <button className="px-4 py-2 border rounded-lg text-sm" onClick={() => setSelected(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

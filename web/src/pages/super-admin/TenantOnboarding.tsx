import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface OnboardingRequest {
  id: string
  orgName: string
  orgCode: string
  apexOrgId: string
  status: string
  complianceDocs: Record<string, any> | null
  productConfig: Record<string, any> | null
  contactInfo: Record<string, any> | null
  rejectionReason: string | null
  reviewNotes: string | null
  submittedBy: string
  reviewedBy: string | null
  createdAt: string
}

export function TenantOnboarding() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ orgName: '', orgCode: '', apexOrgId: '', contactInfo: '{}', productConfig: '{}' })

  const load = () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    api.get(`/admin/super/onboarding?${params}`).then((r) => setRequests(r.data))
  }

  useEffect(() => { load() }, [filterStatus])

  const create = async () => {
    try {
      await api.post('/admin/super/onboarding', {
        ...form,
        contactInfo: JSON.parse(form.contactInfo),
        productConfig: JSON.parse(form.productConfig),
      })
      setShowNew(false)
      setForm({ orgName: '', orgCode: '', apexOrgId: '', contactInfo: '{}', productConfig: '{}' })
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create')
    }
  }

  const submit = async (id: string) => { await api.post(`/admin/super/onboarding/${id}/submit`); load() }
  const approve = async (id: string) => { await api.post(`/admin/super/onboarding/${id}/approve`); load() }
  const reject = async (id: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    await api.post(`/admin/super/onboarding/${id}/reject`, { reason })
    load()
  }
  const complete = async (id: string) => { await api.post(`/admin/super/onboarding/${id}/complete`); load() }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { draft: 'bg-gray-200 text-gray-700', submitted: 'bg-blue-100 text-blue-800', compliance_review: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', onboarded: 'bg-purple-100 text-purple-800' }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || 'bg-gray-100'}`}>{s}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Tenant Onboarding</h2>
        <Button onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancel' : 'New Request'}</Button>
      </div>

      {showNew && (
        <Card>
          <CardTitle>New Onboarding Request</CardTitle>
          <div className="mt-4 space-y-3 max-w-lg">
            <Input label="Organization Name" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
            <Input label="Organization Code" value={form.orgCode} onChange={(e) => setForm({ ...form, orgCode: e.target.value })} />
            <Input label="Apex Org ID" value={form.apexOrgId} onChange={(e) => setForm({ ...form, apexOrgId: e.target.value })} />
            <Input label="Contact Info (JSON)" value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} />
            <Input label="Product Config (JSON)" value={form.productConfig} onChange={(e) => setForm({ ...form, productConfig: e.target.value })} />
            <Button onClick={create}>Create Request</Button>
          </div>
        </Card>
      )}

      <div>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="compliance_review">Compliance Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="onboarded">Onboarded</option>
        </select>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold dark:text-gray-100">{r.orgName}</span>
                  {statusBadge(r.status)}
                  <span className="text-xs text-gray-400">{r.orgCode}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Apex: {r.apexOrgId}</p>
                {r.rejectionReason && <p className="text-xs text-red-500 mt-1">Reason: {r.rejectionReason}</p>}
                {r.reviewNotes && <p className="text-xs text-gray-400 mt-1">Notes: {r.reviewNotes}</p>}
              </div>
              <div className="flex gap-2">
                {r.status === 'draft' && <Button onClick={() => submit(r.id)}>Submit</Button>}
                {r.status === 'submitted' && (
                  <>
                    <Button onClick={() => approve(r.id)}>Approve</Button>
                    <Button variant="secondary" onClick={() => reject(r.id)}>Reject</Button>
                  </>
                )}
                {r.status === 'approved' && <Button onClick={() => complete(r.id)}>Complete Onboarding</Button>}
              </div>
            </div>
          </Card>
        ))}
        {requests.length === 0 && <p className="text-gray-500 text-sm">No onboarding requests found.</p>}
      </div>
    </div>
  )
}

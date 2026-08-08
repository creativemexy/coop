import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface PolicyTemplate {
  id: string
  name: string
  description: string
  templateType: string
  version: number
  status: string
  rules: Record<string, any>
  changeSummary: string
  createdAt: string
  approvedAt: string | null
}

const types = ['bnpl_product', 'kyc_requirement', 'manager_action', 'interest_rate', 'collection']

export function PolicyGovernance() {
  const [policies, setPolicies] = useState<PolicyTemplate[]>([])
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', templateType: 'bnpl_product', rules: '{}', metadata: '{}' })

  const load = () => {
    const params = new URLSearchParams()
    if (filterType) params.set('type', filterType)
    if (filterStatus) params.set('status', filterStatus)
    api.get(`/admin/super/policies?${params}`).then((r) => setPolicies(r.data))
  }

  useEffect(() => { load() }, [filterType, filterStatus])

  const create = async () => {
    try {
      await api.post('/admin/super/policies', {
        ...form,
        rules: JSON.parse(form.rules),
        metadata: JSON.parse(form.metadata),
      })
      setShowNew(false)
      setForm({ name: '', description: '', templateType: 'bnpl_product', rules: '{}', metadata: '{}' })
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create policy')
    }
  }

  const submit = async (id: string) => {
    await api.post(`/admin/super/policies/${id}/submit`)
    load()
  }

  const approve = async (id: string) => {
    await api.post(`/admin/super/policies/${id}/approve`)
    load()
  }

  const reject = async (id: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    await api.post(`/admin/super/policies/${id}/reject`, { reason })
    load()
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { draft: 'bg-gray-200 text-gray-700', pending_approval: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800', superseded: 'bg-blue-100 text-blue-800', rejected: 'bg-red-100 text-red-800' }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || 'bg-gray-100'}`}>{s}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Policy Governance</h2>
        <Button onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancel' : 'New Policy'}</Button>
      </div>

      {showNew && (
        <Card>
          <CardTitle>Create Policy Template</CardTitle>
          <div className="mt-4 space-y-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={form.templateType} onChange={(e) => setForm({ ...form, templateType: e.target.value })}>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Input label="Rules (JSON)" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
            <Input label="Metadata (JSON)" value={form.metadata} onChange={(e) => setForm({ ...form, metadata: e.target.value })} />
            <Button onClick={create}>Create</Button>
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="active">Active</option>
          <option value="superseded">Superseded</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {policies.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold dark:text-gray-100">{p.name}</span>
                  {statusBadge(p.status)}
                  <span className="text-xs text-gray-400">v{p.version}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                <p className="text-xs text-gray-400 mt-1">Type: {p.templateType}</p>
                {p.changeSummary && <p className="text-xs text-gray-400 mt-1">Summary: {p.changeSummary}</p>}
              </div>
              <div className="flex gap-2">
                {p.status === 'draft' && <Button onClick={() => submit(p.id)}>Submit</Button>}
                {p.status === 'pending_approval' && (
                  <>
                    <Button onClick={() => approve(p.id)}>Approve</Button>
                    <Button variant="secondary" onClick={() => reject(p.id)}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
        {policies.length === 0 && <p className="text-gray-500 text-sm">No policy templates found.</p>}
      </div>
    </div>
  )
}

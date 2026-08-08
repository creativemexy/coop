import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string | null
  status: string
  environments: Record<string, boolean>
  cohortRules: Record<string, any> | null
  rolloutPercentage: number
  isKillSwitch: boolean
  metadata: Record<string, any> | null
  createdAt: string
}

export function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ key: '', name: '', description: '', environments: '{"development":true,"staging":true,"production":false}' })

  const load = () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    api.get(`/admin/super/feature-flags?${params}`).then((r) => setFlags(r.data))
  }

  useEffect(() => { load() }, [filterStatus])

  const create = async () => {
    try {
      await api.post('/admin/super/feature-flags', { ...form, environments: JSON.parse(form.environments) })
      setShowNew(false)
      setForm({ key: '', name: '', description: '', environments: '{"development":true,"staging":true,"production":false}' })
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create')
    }
  }

  const toggle = async (id: string, enabled: boolean) => {
    await api.post(`/admin/super/feature-flags/${id}/toggle`, { enabled })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this feature flag?')) return
    await api.delete(`/admin/super/feature-flags/${id}`)
    load()
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { enabled: 'bg-green-100 text-green-800', disabled: 'bg-gray-200 text-gray-700', rolling_out: 'bg-blue-100 text-blue-800', deprecated: 'bg-red-100 text-red-800' }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || 'bg-gray-100'}`}>{s}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Feature Flags</h2>
        <Button onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancel' : 'New Flag'}</Button>
      </div>

      {showNew && (
        <Card>
          <CardTitle>Create Feature Flag</CardTitle>
          <div className="mt-4 space-y-3 max-w-lg">
            <Input label="Key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. new-checkout-flow" />
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input label="Environments (JSON)" value={form.environments} onChange={(e) => setForm({ ...form, environments: e.target.value })} />
            <Button onClick={create}>Create</Button>
          </div>
        </Card>
      )}

      <div>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
          <option value="rolling_out">Rolling Out</option>
          <option value="deprecated">Deprecated</option>
        </select>
      </div>

      <div className="space-y-3">
        {flags.map((f) => (
          <Card key={f.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold dark:text-gray-100">{f.name}</span>
                  {statusBadge(f.status)}
                  {f.isKillSwitch && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Kill Switch</span>}
                </div>
                <p className="text-xs text-gray-400 font-mono mt-1">{f.key}</p>
                {f.description && <p className="text-sm text-gray-500 mt-1">{f.description}</p>}
                <p className="text-xs text-gray-400 mt-1">Rollout: {f.rolloutPercentage}%</p>
                {f.environments && (
                  <div className="flex gap-2 mt-1">
                    {Object.entries(f.environments).map(([env, enabled]) => (
                      <span key={env} className={`px-1.5 py-0.5 rounded text-xs ${enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{env}: {enabled ? 'ON' : 'OFF'}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {f.status !== 'enabled' && <Button onClick={() => toggle(f.id, true)}>Enable</Button>}
                {f.status !== 'disabled' && <Button variant="secondary" onClick={() => toggle(f.id, false)}>Disable</Button>}
                <Button variant="secondary" onClick={() => remove(f.id)}>Delete</Button>
              </div>
            </div>
          </Card>
        ))}
        {flags.length === 0 && <p className="text-gray-500 text-sm">No feature flags found.</p>}
      </div>
    </div>
  )
}

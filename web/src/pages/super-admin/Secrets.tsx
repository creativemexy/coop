import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface Secret {
  id: string
  key: string
  category: string
  description: string | null
  tenantId: string | null
  isRotationEnabled: boolean
  lastRotatedAt: string | null
  rotationIntervalDays: number | null
  expiresAt: string | null
  createdAt: string
}

const categories = ['api_key', 'webhook_secret', 'encryption_key', 'database', 'smtp', 'payment_gateway', 'other']

export function Secrets() {
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [filterCat, setFilterCat] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ key: '', encryptedValue: '', category: 'api_key', description: '', tenantId: '' })

  const load = () => {
    const params = new URLSearchParams()
    if (filterCat) params.set('category', filterCat)
    api.get(`/admin/super/secrets?${params}`).then((r) => setSecrets(r.data))
  }

  useEffect(() => { load() }, [filterCat])

  const create = async () => {
    try {
      await api.post('/admin/super/secrets', { ...form, tenantId: form.tenantId || undefined })
      setShowNew(false)
      setForm({ key: '', encryptedValue: '', category: 'api_key', description: '', tenantId: '' })
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this secret?')) return
    await api.delete(`/admin/super/secrets/${id}`)
    load()
  }

  const rotate = async (id: string) => {
    const val = prompt('New encrypted value:')
    if (!val) return
    await api.post(`/admin/super/secrets/${id}/rotate`, { encryptedValue: val })
    load()
  }

  const categoryBadge = (c: string) => {
    const colors: Record<string, string> = { api_key: 'bg-blue-100 text-blue-800', webhook_secret: 'bg-purple-100 text-purple-800', encryption_key: 'bg-red-100 text-red-800', database: 'bg-green-100 text-green-800', smtp: 'bg-yellow-100 text-yellow-800', payment_gateway: 'bg-orange-100 text-orange-800' }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[c] || 'bg-gray-100'}`}>{c}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Secrets Management</h2>
        <Button onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancel' : 'New Secret'}</Button>
      </div>

      {showNew && (
        <Card>
          <CardTitle>Add Secret</CardTitle>
          <div className="mt-4 space-y-3 max-w-lg">
            <Input label="Key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. PAYSTACK_SECRET_KEY" />
            <Input label="Encrypted Value" value={form.encryptedValue} onChange={(e) => setForm({ ...form, encryptedValue: e.target.value })} type="password" />
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input label="Tenant ID (optional)" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} />
            <Button onClick={create}>Add Secret</Button>
          </div>
        </Card>
      )}

      <div>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {secrets.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold dark:text-gray-100">{s.key}</span>
                  {categoryBadge(s.category)}
                  {s.isRotationEnabled && <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">Auto-rotate</span>}
                </div>
                {s.description && <p className="text-xs text-gray-500 mt-1">{s.description}</p>}
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  {s.tenantId && <span>Tenant: {s.tenantId.slice(0, 8)}</span>}
                  {s.lastRotatedAt && <span>Last rotated: {new Date(s.lastRotatedAt).toLocaleDateString()}</span>}
                  {s.rotationIntervalDays && <span>Rotate every {s.rotationIntervalDays}d</span>}
                  {s.expiresAt && <span>Expires: {new Date(s.expiresAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => rotate(s.id)}>Rotate</Button>
                <Button variant="secondary" onClick={() => remove(s.id)}>Delete</Button>
              </div>
            </div>
          </Card>
        ))}
        {secrets.length === 0 && <p className="text-gray-500 text-sm">No secrets found.</p>}
      </div>
    </div>
  )
}

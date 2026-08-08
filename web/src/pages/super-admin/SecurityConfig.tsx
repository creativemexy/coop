import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

interface ConfigEntry {
  value: string
  description: string
  valueType: string
  updatedAt: string
}

export function SecurityConfig() {
  const [configs, setConfigs] = useState<Record<string, ConfigEntry>>({})
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState('')

  const load = () => {
    api.get('/admin/super/security').then((r) => setConfigs(r.data))
  }

  useEffect(() => { load() }, [])

  const setConfig = async (key: string, value: string) => {
    setSaving(key)
    try {
      await api.post('/admin/super/security', { key, value })
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save')
    } finally {
      setSaving('')
    }
  }

  const addConfig = async () => {
    if (!newKey) return
    await setConfig(newKey, newValue)
    setNewKey('')
    setNewValue('')
    setNewDesc('')
  }

  const remove = async (key: string) => {
    if (!confirm(`Delete ${key}?`)) return
    await api.delete(`/admin/super/security/${key}`)
    load()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Global Security Configuration</h2>

      <Card>
        <CardTitle>Add Setting</CardTitle>
        <div className="mt-4 flex gap-3 items-end">
          <div className="flex-1">
            <Input label="Key" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. mfa_enforced" />
          </div>
          <div className="flex-1">
            <Input label="Value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
          </div>
          <div className="flex-1">
            <Input label="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <Button onClick={addConfig}>Add</Button>
        </div>
      </Card>

      <div className="space-y-2">
        {Object.entries(configs).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => (
          <Card key={key}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold dark:text-gray-100">{key}</span>
                  <span className="text-xs text-gray-400">{entry.valueType}</span>
                </div>
                {entry.description && <p className="text-xs text-gray-500">{entry.description}</p>}
                <p className="text-xs text-gray-400">Updated: {new Date(entry.updatedAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={entry.value}
                  onChange={(e) => setConfigs({ ...configs, [key]: { ...entry, value: e.target.value } })}
                  className="w-48"
                />
                <Button onClick={() => setConfig(key, entry.value)} disabled={saving === key}>Save</Button>
                <Button variant="secondary" onClick={() => remove(key)}>Delete</Button>
              </div>
            </div>
          </Card>
        ))}
        {Object.keys(configs).length === 0 && <p className="text-gray-500 text-sm">No security settings configured.</p>}
      </div>
    </div>
  )
}

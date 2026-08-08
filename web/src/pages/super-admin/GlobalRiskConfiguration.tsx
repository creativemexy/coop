import { useEffect, useState } from 'react'
import { api } from '../../api/client'

interface RiskRule {
  id: string
  ruleKey: string
  description: string
  enabled: boolean
  config: Record<string, any>
}

export function GlobalRiskConfiguration() {
  const [rules, setRules] = useState<RiskRule[]>([])
  const [editRule, setEditRule] = useState<RiskRule | null>(null)

  useEffect(() => {
    api.get('/admin/super/risk-rules').then(r => setRules(r.data))
  }, [])

  const toggle = async (rule: RiskRule) => {
    await api.patch(`/admin/super/risk-rules/${rule.id}`, { enabled: !rule.enabled })
    setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
  }

  const updateConfig = async () => {
    if (!editRule) return
    await api.patch(`/admin/super/risk-rules/${editRule.id}`, { config: editRule.config, description: editRule.description })
    setRules(rules.map(r => r.id === editRule.id ? editRule : r))
    setEditRule(null)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Global Risk Configuration</h1>

      {editRule && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setEditRule(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Edit: {editRule.ruleKey}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={editRule.description} onChange={e => setEditRule({ ...editRule, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Config (JSON)</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm font-mono dark:bg-gray-700 dark:border-gray-600" rows={8} value={JSON.stringify(editRule.config, null, 2)} onChange={e => { try { setEditRule({ ...editRule, config: JSON.parse(e.target.value) }) } catch {} }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={updateConfig}>Save</button>
              <button className="px-4 py-2 border rounded-lg text-sm" onClick={() => setEditRule(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {rules.map(rule => (
          <div key={rule.id} className="rounded-xl border bg-white p-4 dark:bg-gray-800 dark:border-gray-700 flex items-center justify-between">
            <div className="flex-1">
              <div className="font-semibold">{rule.ruleKey}</div>
              <div className="text-sm text-gray-500">{rule.description}</div>
              <div className="text-xs text-gray-400 font-mono mt-1">{Object.keys(rule.config).join(', ')}</div>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-xs text-blue-600" onClick={() => setEditRule(rule)}>Edit</button>
              <button className={`px-3 py-1 rounded text-xs font-medium ${rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`} onClick={() => toggle(rule)}>
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

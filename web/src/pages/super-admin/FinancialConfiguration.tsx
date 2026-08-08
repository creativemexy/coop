import { useEffect, useState } from 'react'
import { api } from '../../api/client'

export function FinancialConfiguration() {
  const [config, setConfig] = useState<Record<string, string>>({})

  useEffect(() => {
    api.get('/admin/super/financial-config').then(r => setConfig(r.data))
  }, [])

  const save = async () => {
    await api.patch('/admin/super/financial-config', config)
  }

  const fields = [
    { key: 'interest_rate', label: 'Interest Rate (%)' },
    { key: 'late_payment_fee', label: 'Late Payment Fee (%)' },
    { key: 'tax_rate', label: 'Tax Rate (%)' },
    { key: 'withholding_tax', label: 'Withholding Tax (%)' },
    { key: 'processing_fee', label: 'Processing Fee (%)' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tax & Interest Rate Configuration</h1>

      <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-6 max-w-xl">
        <div className="space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" type="number" step="0.01"
                value={config[f.key] || ''}
                onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={save}>Save Changes</button>
      </div>
    </div>
  )
}

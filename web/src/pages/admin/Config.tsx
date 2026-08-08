import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle, CardHeader } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

interface Tenant {
  id: string
  name: string
  code: string
  status: string
  apexOrg: string | null
  supportedProducts: string[]
  bnplEnabled: boolean
  kycRequirementLevel: string
  notificationWebhookUrl: string | null
  notificationEmail: string | null
  repaymentRetryPolicy?: {
    maxAttempts: number
    cooldownHours: number
    autoRetryOnFailure: boolean
  } | null
  webhookProviders?: {
    paystack?: {
      enabled: boolean
      endpoint: string
      retryOnFailure: boolean
      retryMaxAttempts: number
    }
  } | null
  logRetentionDays?: number | null
  createdAt: string
}

export function AdminConfig() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/tenants').then(({ data }) => {
      setTenants(data)
      setLoading(false)
    })
  }, [])

  const selectTenant = async (t: Tenant) => {
    const { data } = await api.get(`/admin/tenants/${t.id}/config`)
    setSelectedTenant({ ...t, ...data })
    setForm({
      name: t.name,
      bnplEnabled: data.bnplEnabled,
      kycRequirementLevel: data.kycRequirementLevel,
      repaymentRetryPolicy: data.repaymentRetryPolicy,
      webhookProviders: data.webhookProviders,
      logRetentionDays: data.logRetentionDays,
      supportedProducts: t.supportedProducts,
      notificationWebhookUrl: t.notificationWebhookUrl,
      notificationEmail: t.notificationEmail,
    })
    setEditMode(false)
  }

  const save = async () => {
    if (!selectedTenant) return
    setSaving(true)
    try {
      await api.patch(`/admin/tenants/${selectedTenant.id}/config`, {
        bnplEnabled: form.bnplEnabled,
        kycRequirementLevel: form.kycRequirementLevel,
        repaymentRetryPolicy: form.repaymentRetryPolicy,
        webhookProviders: form.webhookProviders,
        logRetentionDays: Number(form.logRetentionDays),
        name: form.name,
      })
      if (form.supportedProducts || form.notificationWebhookUrl !== undefined || form.notificationEmail !== undefined) {
        await api.patch(`/admin/tenants/${selectedTenant.id}/settings`, {
          supportedProducts: form.supportedProducts,
          notificationWebhookUrl: form.notificationWebhookUrl,
          notificationEmail: form.notificationEmail,
        })
      }
      const { data } = await api.get(`/admin/tenants/${selectedTenant.id}/config`)
      setSelectedTenant(prev => prev ? { ...prev, ...data } : null)
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Loading tenants...</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Configuration & Feature Toggles</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Tenants</CardTitle></CardHeader>
            <div className="space-y-1">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTenant(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    selectedTenant?.id === t.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.code} · {t.apexOrg}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedTenant ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{selectedTenant.name}</CardTitle>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </CardHeader>

              <div className="space-y-6">
                {/* Profile */}
                <section>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Profile</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Code:</span> {selectedTenant.code}</div>
                    <div>
                      <span className="text-gray-500">Status:</span>{' '}
                      <Badge variant={selectedTenant.status === 'active' ? 'success' : 'danger'}>{selectedTenant.status}</Badge>
                    </div>
                    <div><span className="text-gray-500">Apex Org:</span> {selectedTenant.apexOrg}</div>
                    <div><span className="text-gray-500">Name:</span> {editMode ? (
                      <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                        className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600" />
                    ) : selectedTenant.name}</div>
                  </div>
                </section>

                {/* Feature Toggles */}
                <section>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Feature Toggles</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editMode ? form.bnplEnabled : selectedTenant.bnplEnabled}
                        disabled={!editMode}
                        onChange={e => setForm({ ...form, bnplEnabled: e.target.checked })}
                        className="rounded border-gray-300 dark:border-gray-600" />
                      BNPL Enabled
                    </label>
                    <div className="text-sm">
                      <span className="text-gray-500">KYC Requirement Level:</span>{' '}
                      {editMode ? (
                        <select value={form.kycRequirementLevel || 'basic'}
                          onChange={e => setForm({ ...form, kycRequirementLevel: e.target.value })}
                          className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600">
                          <option value="none">None</option>
                          <option value="basic">Basic</option>
                          <option value="full">Full</option>
                        </select>
                      ) : <Badge variant="info">{selectedTenant.kycRequirementLevel}</Badge>}
                    </div>
                  </div>
                </section>

                {/* Repayment Retry Policy */}
                <section>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Repayment Retry Policy</h4>
                  {selectedTenant.repaymentRetryPolicy ? (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {['maxAttempts', 'cooldownHours', 'autoRetryOnFailure'].map((field) => (
                        <div key={field}>
                          <span className="text-gray-500">{field}:</span>{' '}
                          {editMode ? (
                            field === 'autoRetryOnFailure' ? (
                              <input type="checkbox" checked={form.repaymentRetryPolicy?.autoRetryOnFailure ?? true}
                                onChange={e => setForm({ ...form, repaymentRetryPolicy: { ...form.repaymentRetryPolicy, autoRetryOnFailure: e.target.checked } })}
                                className="rounded border-gray-300 dark:border-gray-600" />
                            ) : (
                              <input type="number" value={form.repaymentRetryPolicy?.[field as 'maxAttempts' | 'cooldownHours'] || 0}
                                onChange={e => setForm({ ...form, repaymentRetryPolicy: { ...form.repaymentRetryPolicy, [field]: Number(e.target.value) } })}
                                className="border rounded px-2 py-1 w-20 text-sm dark:bg-gray-800 dark:border-gray-600" />
                            )
                          ) : String((selectedTenant.repaymentRetryPolicy as any)[field])}
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-sm text-gray-400">—</span>}
                </section>

                {/* Webhook Providers */}
                <section>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Webhook Providers</h4>
                  {selectedTenant.webhookProviders?.paystack ? (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      {['enabled', 'endpoint', 'retryOnFailure', 'retryMaxAttempts'].map((field) => (
                        <div key={field}>
                          <span className="text-gray-500">{field}:</span>{' '}
                          {editMode ? (
                            field === 'enabled' || field === 'retryOnFailure' ? (
                              <input type="checkbox" checked={form.webhookProviders?.paystack?.[field as 'enabled' | 'retryOnFailure'] ?? true}
                                onChange={e => setForm({ ...form, webhookProviders: { paystack: { ...form.webhookProviders?.paystack, [field]: e.target.checked } } })}
                                className="rounded border-gray-300 dark:border-gray-600" />
                            ) : (
                              <input type="text" value={form.webhookProviders?.paystack?.[field as 'endpoint' | 'retryMaxAttempts'] || ''}
                                onChange={e => setForm({ ...form, webhookProviders: { paystack: { ...form.webhookProviders?.paystack, [field]: e.target.value } } })}
                                className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600" />
                            )
                          ) : String((selectedTenant.webhookProviders?.paystack as any)[field])}
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-sm text-gray-400">—</span>}
                </section>

                {/* Logging / Retention */}
                <section>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Operational Defaults</h4>
                  <div className="text-sm">
                    <span className="text-gray-500">Log Retention (days):</span>{' '}
                    {editMode ? (
                      <input type="number" value={form.logRetentionDays || 90}
                        onChange={e => setForm({ ...form, logRetentionDays: Number(e.target.value) })}
                        className="border rounded px-2 py-1 w-20 text-sm dark:bg-gray-800 dark:border-gray-600" />
                    ) : `${selectedTenant.logRetentionDays ?? 90}d`}
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-gray-500">Notification Webhook URL:</span>{' '}
                    {editMode ? (
                      <input value={form.notificationWebhookUrl || ''}
                        onChange={e => setForm({ ...form, notificationWebhookUrl: e.target.value })}
                        className="border rounded px-2 py-1 text-sm w-full dark:bg-gray-800 dark:border-gray-600" />
                    ) : selectedTenant.notificationWebhookUrl || <span className="text-gray-400">—</span>}
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-gray-500">Notification Email:</span>{' '}
                    {editMode ? (
                      <input value={form.notificationEmail || ''}
                        onChange={e => setForm({ ...form, notificationEmail: e.target.value })}
                        className="border rounded px-2 py-1 text-sm w-full dark:bg-gray-800 dark:border-gray-600" />
                    ) : selectedTenant.notificationEmail || <span className="text-gray-400">—</span>}
                  </div>
                </section>

                {/* Products */}
                <section>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Supported Products</h4>
                  {editMode ? (
                    <input value={(form.supportedProducts || []).join(', ')}
                      onChange={e => setForm({ ...form, supportedProducts: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                      placeholder="bnpl, savings, loans (comma-separated)"
                      className="border rounded px-2 py-1 text-sm w-full dark:bg-gray-800 dark:border-gray-600" />
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {(selectedTenant.supportedProducts || []).map((p: string) => (
                        <Badge key={p} variant="info">{p}</Badge>
                      ))}
                      {(!selectedTenant.supportedProducts || selectedTenant.supportedProducts.length === 0) && (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  )}
                </section>

                {editMode && (
                  <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                    <button onClick={save} disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card><p className="text-gray-500">Select a tenant to view and edit configuration</p></Card>
          )}
        </div>
      </div>
    </div>
  )
}

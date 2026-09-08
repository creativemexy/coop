import { useEffect, useState } from 'react'
import { api } from '../../api/client'

interface Template {
  id: string
  key: string
  type: 'sms' | 'email'
  subject: string | null
  body: string
  variables: string[] | null
}

export function NotificationTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ key: '', type: 'sms' as 'sms' | 'email', subject: '', body: '', variables: '' })
  const [broadcast, setBroadcast] = useState({ title: '', message: '', type: 'info' })
  const [sending, setSending] = useState(false)
  const [sentResult, setSentResult] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/super/templates').then(r => setTemplates(r.data))
  }, [])

  const load = () => api.get('/admin/super/templates').then(r => setTemplates(r.data))

  const sendBroadcast = async () => {
    if (!broadcast.title.trim()) return
    setSending(true)
    setSentResult(null)
    try {
      const { data } = await api.post('/notifications/broadcast', broadcast)
      setSentResult(`Sent to ${data.sent} member${data.sent === 1 ? '' : 's'}`)
      setBroadcast({ title: '', message: '', type: 'info' })
    } catch (e: any) {
      setSentResult(`Failed: ${e?.response?.data?.message || e?.message || 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  const save = async () => {
    const payload = { ...form, variables: form.variables ? form.variables.split(',').map(v => v.trim()) : [] }
    if (editing) {
      await api.patch(`/admin/super/templates/${editing.id}`, payload)
    } else {
      await api.post('/admin/super/templates', payload)
    }
    setEditing(null); setCreating(false); load()
  }

  const remove = async (id: string) => {
    await api.delete(`/admin/super/templates/${id}`)
    load()
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setCreating(true)
    setForm({ key: t.key, type: t.type, subject: t.subject || '', body: t.body, variables: t.variables?.join(', ') || '' })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-xl border bg-white p-4 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="font-semibold mb-1">Broadcast to App Users</h2>
        <p className="text-xs text-gray-500 mb-3">Send an in-app notification to every app user (individual members).</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={broadcast.title} onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))} placeholder="e.g. New investment opportunity" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" rows={3} value={broadcast.message} onChange={e => setBroadcast(b => ({ ...b, message: e.target.value }))} placeholder="Optional message body" />
          </div>
          <div className="flex items-center gap-3">
            <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={broadcast.type} onChange={e => setBroadcast(b => ({ ...b, type: e.target.value }))}>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={sendBroadcast} disabled={sending || !broadcast.title.trim()}>
              {sending ? 'Sending…' : 'Send Broadcast'}
            </button>
          </div>
          {sentResult && <p className="text-xs text-gray-600 dark:text-gray-400">{sentResult}</p>}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notification Templates</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={() => { setEditing(null); setCreating(true); setForm({ key: '', type: 'sms', subject: '', body: '', variables: '' }) }}>+ New Template</button>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Create'} Template</h2>
            <div className="space-y-3">
              {!editing && (
                <div>
                  <label className="block text-sm font-medium mb-1">Key</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="e.g. welcome_sms" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'sms' | 'email' }))}>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>
              {form.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Body</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm font-mono dark:bg-gray-700 dark:border-gray-600" rows={6} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Variables (comma-separated)</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={form.variables} onChange={e => setForm(f => ({ ...f, variables: e.target.value }))} placeholder="{{name}}, {{amount}}" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={save}>Save</button>
              <button className="px-4 py-2 border rounded-lg text-sm" onClick={() => { setCreating(false); setEditing(null) }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {templates.map(t => (
          <div key={t.id} className="rounded-xl border bg-white p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{t.key}</div>
                <div className="text-xs text-gray-500 uppercase">{t.type}{t.subject ? ` — ${t.subject}` : ''}</div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-blue-600" onClick={() => openEdit(t)}>Edit</button>
                <button className="text-xs text-red-600" onClick={() => remove(t.id)}>Delete</button>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-2">{t.body}</div>
            {t.variables && t.variables.length > 0 && (
              <div className="mt-1 flex gap-1">
                {t.variables.map(v => <span key={v} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">{v}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

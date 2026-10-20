import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client'
import {
  BellRing, Megaphone, Plus, Pencil, Trash2, MessageSquare, Mail, Search, X, Send,
  Save, CheckCircle2, AlertTriangle, Info, XCircle, RefreshCw, Inbox,
} from 'lucide-react'

interface Template {
  id: string
  key: string
  type: 'sms' | 'email'
  subject: string | null
  body: string
  variables: string[] | null
}

type MessageType = 'info' | 'success' | 'warning' | 'error'
type TemplateType = 'sms' | 'email'

const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

const solidGreen =
  'inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghost =
  'inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'

const MESSAGE_META: Record<MessageType, { label: string; cls: string; Icon: typeof Info }> = {
  info: { label: 'Info', cls: 'bg-[#9D4824]/10 text-[#9D4824]', Icon: Info },
  success: { label: 'Success', cls: 'bg-[#176B5B]/10 text-[#176B5B]', Icon: CheckCircle2 },
  warning: { label: 'Warning', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', Icon: AlertTriangle },
  error: { label: 'Error', cls: 'bg-[#B3261E]/10 text-[#B3261E]', Icon: XCircle },
}

const CHANNEL_META: Record<TemplateType, { label: string; cls: string; Icon: typeof Mail }> = {
  sms: { label: 'SMS', cls: 'bg-[#9D4824]/10 text-[#9D4824]', Icon: MessageSquare },
  email: { label: 'Email', cls: 'bg-[#176B5B]/10 text-[#176B5B]', Icon: Mail },
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
      {children}
      {required && <span className="text-[#E4A42A]"> *</span>}
    </label>
  )
}

const emptyForm = { key: '', type: 'sms' as TemplateType, subject: '', body: '', variables: '' }

export function NotificationTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [broadcast, setBroadcast] = useState<{ title: string; message: string; type: MessageType }>({
    title: '',
    message: '',
    type: 'info',
  })
  const [sending, setSending] = useState(false)
  const [sentResult, setSentResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | TemplateType>('')

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/admin/super/templates')
      .then((r) => setTemplates(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const close = () => {
    setCreating(false)
    setEditing(null)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setCreating(true)
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setForm({ key: t.key, type: t.type, subject: t.subject || '', body: t.body, variables: t.variables?.join(', ') || '' })
    setCreating(true)
  }

  const sendBroadcast = async () => {
    if (!broadcast.title.trim()) return
    setSending(true)
    setSentResult(null)
    try {
      const { data } = await api.post('/notifications/broadcast', broadcast)
      setSentResult({ ok: true, text: `Sent to ${data.sent} member${data.sent === 1 ? '' : 's'}` })
      setBroadcast({ title: '', message: '', type: 'info' })
    } catch (e: any) {
      setSentResult({ ok: false, text: `Failed: ${e?.response?.data?.message || e?.message || 'Unknown error'}` })
    } finally {
      setSending(false)
    }
  }

  const save = async () => {
    const payload = {
      ...form,
      key: form.key.trim(),
      variables: form.variables ? form.variables.split(',').map((v) => v.trim()).filter(Boolean) : [],
    }
    if (editing) {
      await api.patch(`/admin/super/templates/${editing.id}`, payload)
    } else {
      await api.post('/admin/super/templates', payload)
    }
    close()
    load()
  }

  const remove = async (t: Template) => {
    if (!window.confirm(`Delete the "${t.key}" template? This cannot be undone.`)) return
    await api.delete(`/admin/super/templates/${t.id}`)
    load()
  }

  const q = query.trim().toLowerCase()
  const filtered = templates.filter((t) => {
    if (typeFilter && t.type !== typeFilter) return false
    if (!q) return true
    return t.key.toLowerCase().includes(q) || (t.subject ?? '').toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
            <BellRing size={22} className="text-[#176B5B]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Notification Templates</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
              Reusable SMS and email messages with dynamic variables.
            </p>
          </div>
        </div>
        <button onClick={openCreate} className={solidGreen}>
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Broadcast */}
      <section className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#F0DDAD] bg-[#FFF9EF]/60 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9D4824]/10">
            <Megaphone size={18} className="text-[#9D4824]" />
          </span>
          <div>
            <h2 className="text-sm font-black tracking-[-0.01em] text-[#2C1B13]">Broadcast to app users</h2>
            <p className="text-xs text-[#6B5245]">Send an in-app notification to every individual member.</p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <Label required>Title</Label>
            <input
              className={fieldCls}
              value={broadcast.title}
              onChange={(e) => setBroadcast((b) => ({ ...b, title: e.target.value }))}
              placeholder="e.g. New investment opportunity"
            />
          </div>
          <div>
            <Label>Message</Label>
            <textarea
              className={fieldCls}
              rows={3}
              value={broadcast.message}
              onChange={(e) => setBroadcast((b) => ({ ...b, message: e.target.value }))}
              placeholder="Optional message body"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MESSAGE_META) as MessageType[]).map((k) => {
                const m = MESSAGE_META[k]
                const active = broadcast.type === k
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setBroadcast((b) => ({ ...b, type: k }))}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      active ? `${m.cls} border border-transparent shadow-sm` : 'border border-[#E7DCCB] bg-white text-[#6B5245] hover:bg-[#FFF9EF]'
                    }`}
                  >
                    <m.Icon size={13} /> {m.label}
                  </button>
                )
              })}
            </div>
            <button className={solidGreen} onClick={sendBroadcast} disabled={sending || !broadcast.title.trim()}>
              <Send size={15} /> {sending ? 'Sending…' : 'Send broadcast'}
            </button>
          </div>

          {sentResult && (
            <p className={`flex items-center gap-1.5 text-xs font-semibold ${sentResult.ok ? 'text-[#176B5B]' : 'text-[#B3261E]'}`}>
              {sentResult.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {sentResult.text}
            </p>
          )}
        </div>
      </section>

      {/* Templates */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Templates</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF9EF] px-2.5 py-1 text-xs font-semibold text-[#6B5245] ring-1 ring-[#E7DCCB]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#176B5B]" /> {templates.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B79B6B]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                className="w-full rounded-full border border-[#E7DCCB] bg-white py-2 pl-9 pr-3 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20 sm:w-60"
              />
            </div>
            <div className="flex gap-2">
              {(['', 'sms', 'email'] as const).map((f) => (
                <button
                  key={f || 'all'}
                  onClick={() => setTypeFilter(f)}
                  className={
                    typeFilter === f
                      ? 'rounded-full bg-[#176B5B] px-4 py-2 text-xs font-bold text-[#FFF9EF] shadow-sm transition cursor-pointer'
                      : 'rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-xs font-semibold text-[#6B5245] transition hover:border-[#D8C9A9] hover:text-[#2C1B13] cursor-pointer'
                  }
                >
                  {f === '' ? 'All' : f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#E7DCCB] bg-white px-6 py-16 text-sm font-semibold text-[#6B5245]">
            <RefreshCw size={15} className="animate-spin text-[#176B5B]" /> Loading templates…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E7DCCB] bg-white/60 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#176B5B]/10">
              <Inbox size={26} className="text-[#176B5B]" />
            </div>
            <p className="font-bold text-[#2C1B13]">
              {templates.length === 0 ? 'No templates yet' : 'No templates match your search'}
            </p>
            <p className="max-w-sm text-sm text-[#6B5245]">
              {templates.length === 0
                ? 'Create your first SMS or email template to get started.'
                : 'Try a different keyword or clear the filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => {
              const cm = CHANNEL_META[t.type] ?? CHANNEL_META.sms
              const ChannelIcon = cm.Icon
              return (
                <article
                  key={t.id}
                  className="group rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm transition hover:border-[#D8C9A9] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cm.cls}`}>
                        <ChannelIcon size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-black tracking-[-0.01em] text-[#2C1B13]">{t.key}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cm.cls}`}>
                            {cm.label}
                          </span>
                          {t.subject && <span className="truncate text-xs font-medium text-[#6B5245]">{t.subject}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => openEdit(t)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7DCCB] bg-white px-3 py-1.5 text-xs font-bold text-[#176B5B] transition hover:bg-[#FFF9EF] cursor-pointer"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => remove(t)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7DCCB] bg-white px-3 py-1.5 text-xs font-bold text-[#B3261E] transition hover:bg-[#B3261E]/5 cursor-pointer"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-[#6B5245]">{t.body}</p>

                  {t.variables && t.variables.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.variables.map((v) => (
                        <span key={v} className="rounded-md bg-[#176B5B]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#176B5B]">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Create / Edit modal */}
      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#23150F]/50 p-4 backdrop-blur-[2px]"
          onClick={close}
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E7DCCB] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between rounded-t-2xl border-b border-[#F0DDAD] bg-[#FFF9EF] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
                  <BellRing size={20} className="text-[#176B5B]" />
                </span>
                <div>
                  <h3 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">
                    {editing ? 'Edit template' : 'New template'}
                  </h3>
                  <p className="text-xs text-[#6B5245]">{editing ? editing.key : 'Define a reusable message.'}</p>
                </div>
              </div>
              <button
                onClick={close}
                className="rounded-lg p-1.5 text-[#6B5245] transition hover:bg-[#EDE2D3] hover:text-[#2C1B13] cursor-pointer"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {!editing && (
                <div>
                  <Label required>Key</Label>
                  <input
                    className={fieldCls}
                    value={form.key}
                    onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                    placeholder="e.g. welcome_sms"
                  />
                  <p className="mt-1 text-xs text-[#B79B6B]">Unique identifier referenced in code. Cannot be changed later.</p>
                </div>
              )}

              <div>
                <Label required>Channel</Label>
                <div className="flex gap-2">
                  {(['sms', 'email'] as TemplateType[]).map((c) => {
                    const m = CHANNEL_META[c]
                    const active = form.type === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: c }))}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                          active ? `${m.cls} border border-transparent shadow-sm` : 'border border-[#E7DCCB] bg-white text-[#6B5245] hover:bg-[#FFF9EF]'
                        }`}
                      >
                        <m.Icon size={13} /> {m.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {form.type === 'email' && (
                <div>
                  <Label>Subject</Label>
                  <input
                    className={fieldCls}
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Your account statement"
                  />
                </div>
              )}

              <div>
                <Label required>Body</Label>
                <textarea
                  className={`${fieldCls} font-mono`}
                  rows={6}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Hi {{name}}, your contribution of {{amount}} was received."
                />
                <p className="mt-1 text-xs text-[#B79B6B]">Use {`{{variable}}`} placeholders for dynamic values.</p>
              </div>

              <div>
                <Label>Variables</Label>
                <input
                  className={fieldCls}
                  value={form.variables}
                  onChange={(e) => setForm((f) => ({ ...f, variables: e.target.value }))}
                  placeholder="{{name}}, {{amount}}"
                />
                <p className="mt-1 text-xs text-[#B79B6B]">Comma-separated list.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 rounded-b-2xl border-t border-[#F0DDAD] bg-[#FFF9EF]/60 px-6 py-4">
              <button className={ghost} onClick={close}>
                Cancel
              </button>
              <button className={solidGreen} onClick={save} disabled={!editing && !form.key.trim()}>
                <Save size={15} /> {editing ? 'Save changes' : 'Create template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

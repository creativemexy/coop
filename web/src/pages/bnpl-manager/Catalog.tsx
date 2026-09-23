import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import {
  ShoppingBag, Plus, Search, RefreshCw, Pencil, Globe2, ToggleLeft, ToggleRight,
  Upload, Trash2, AlertTriangle, CheckCircle2, X,
} from 'lucide-react'

interface CatalogImage {
  id: string
  url: string
  sortOrder: number
}

interface CatalogItem {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  images?: CatalogImage[]
  isGlobal: boolean
  status: string
  createdAt: string
}

interface OrgOption { id: string; name: string }

const PAGE_SIZE = 10

const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

const solidGreen =
  'inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidMaroon =
  'inline-flex items-center gap-2 rounded-full bg-[#9D4824] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#B85A38] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghost =
  'inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'

function ScopePill({ isGlobal }: { isGlobal: boolean }) {
  return isGlobal ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#176B5B]/10 px-2.5 py-1 text-xs font-semibold text-[#176B5B]">
      <Globe2 size={12} /> Global
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E4A42A]/15 px-2.5 py-1 text-xs font-semibold text-[#8A5A00]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#E4A42A]" /> Restricted
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  return status === 'active' ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#176B5B]/10 px-2.5 py-1 text-xs font-semibold text-[#176B5B]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#176B5B]" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#B3261E]/10 px-2.5 py-1 text-xs font-semibold text-[#B3261E]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#B3261E]" /> Inactive
    </span>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
      {children}
      {required && <span className="text-[#E4A42A]"> *</span>}
    </label>
  )
}

function BrandModal({
  open,
  onClose,
  icon,
  iconCls,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  icon: React.ReactNode
  iconCls: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#23150F]/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#EDE2D3] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>{icon}</div>
            <div>
              <h2 className="text-xl font-black tracking-[-0.02em] text-[#2C1B13]">{title}</h2>
              {subtitle && <p className="text-xs text-[#6B5245]">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6B5245] transition hover:bg-[#FFF9EF] hover:text-[#2C1B13] cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function PaginationBar({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
}) {
  if (total === 0) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const lo = Math.max(1, page - 2)
  const pages: number[] = []
  for (let p = lo; p <= lo + 4 && p <= totalPages; p++) pages.push(p)

  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE2D3] px-5 py-3.5">
      <p className="text-xs font-medium text-[#6B5245]">
        Showing <span className="font-bold text-[#2C1B13]">{start}–{end}</span> of{' '}
        <span className="font-bold text-[#2C1B13]">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`} aria-label="Previous page">‹</button>
        {pages.map((p) => (
          <button key={p} type="button" onClick={() => onPage(p)} className={`${btn} ${p === page ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'text-[#6B5245] hover:bg-[#F0DDAD]/50'}`}>{p}</button>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`} aria-label="Next page">›</button>
      </div>
    </div>
  )
}

export function Catalog() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [restrictOpen, setRestrictOpen] = useState(false)
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', description: '', price: 0, imageUrls: [''] })
  const [editForm, setEditForm] = useState({ name: '', description: '', price: 0, imageUrls: [''] })
  const [editError, setEditError] = useState('')
  const [createError, setCreateError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetch = useCallback(() => {
    api.get('/bnpl/catalog').then((r) => setItems(r.data)).catch(() => {}).finally(() => setLoading(false))
    api.get('/organizations').then((r) => setOrgs(r.data)).catch(() => {})
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const refresh = async () => {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 300))
    fetch()
    setRefreshing(false)
  }

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  )
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const globalCount = items.filter((i) => i.isGlobal).length
  const restrictedCount = items.length - globalCount

  const openCreate = () => {
    setForm({ name: '', description: '', price: 0, imageUrls: [''] })
    setCreateError('')
    setCreateOpen(true)
  }

  const openEdit = (item: CatalogItem) => {
    setSelected(item)
    setEditForm({ name: item.name, description: item.description || '', price: item.price, imageUrls: item.images?.map((i) => i.url) || [''] })
    setEditError('')
    setEditOpen(true)
  }

  const handleCreate = async () => {
    setCreateError('')
    try {
      const payload = { ...form, imageUrls: form.imageUrls.filter(Boolean) }
      await api.post('/bnpl/catalog', payload)
      setCreateOpen(false)
      setPage(1)
      fetch()
    } catch (e: any) {
      setCreateError(e?.response?.data?.message || 'Failed to create catalog item')
    }
  }

  const handleEdit = async () => {
    if (!selected) return
    setEditError('')
    const payload = { ...editForm, imageUrls: editForm.imageUrls.filter(Boolean) }
    try {
      await api.patch(`/bnpl/catalog/${selected.id}`, payload)
      setEditOpen(false)
      setSelected(null)
      setForm({ name: '', description: '', price: 0, imageUrls: [''] })
      setEditForm({ name: '', description: '', price: 0, imageUrls: [''] })
      fetch()
    } catch (e: any) {
      setEditError(e?.response?.data?.message || 'Failed to save catalog item')
    }
  }

  const handleRestrict = async () => {
    if (!selected) return
    try {
      await api.post(`/bnpl/catalog/${selected.id}/restrict`, { organizationIds: selectedOrgIds })
    } catch {
      // eligibility update failed
    }
    setRestrictOpen(false)
    setSelected(null)
    setSelectedOrgIds([])
    fetch()
  }

  const toggleStatus = async (item: CatalogItem) => {
    await api.patch(`/bnpl/catalog/${item.id}`, { status: item.status === 'active' ? 'inactive' : 'active' })
    fetch()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    setUploading(true)
    setEditError('')
    try {
      const fd = new FormData()
      fd.append('files', file)
      const { data } = await api.post(`/bnpl/catalog/${selected.id}/upload-images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const urls: string[] = (data?.images ?? []).map((img: { url: string }) => img.url)
      if (urls.length) {
        setEditForm((f) => ({ ...f, imageUrls: [...f.imageUrls.filter(Boolean), ...urls] }))
      }
      fetch()
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
            <ShoppingBag size={22} className="text-[#176B5B]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Catalog Items</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
              BNPL products, their pricing, imagery, and tenant eligibility.
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] cursor-pointer">
          <Plus size={16} /> Create
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <ShoppingBag size={16} className="text-[#176B5B]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Catalog items</p>
          </div>
          <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <Globe2 size={16} className="text-[#176B5B]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Global</p>
          </div>
          <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{globalCount}</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4A42A]/15">
              <span className="h-3 w-3 rounded-full bg-[#E4A42A]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Restricted</p>
          </div>
          <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{restrictedCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9B89F]">
          <Search size={16} />
        </span>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search items..."
          className={`${fieldCls} pl-10`}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#C9B89F] hover:text-[#2C1B13] cursor-pointer"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE2D3] px-5 py-4">
          <div>
            <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Items</h2>
            <p className="text-xs text-[#6B5245]">
              {filtered.length} of {items.length} {filtered.length === 1 ? 'result' : 'results'}{search ? ` for “${search}”` : ''}
            </p>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-3.5 py-2 text-xs font-semibold text-[#6B5245] transition hover:border-[#176B5B]/40 hover:text-[#176B5B] cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FFF9EF]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Price</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Scope</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Created</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE2D3]">
              {loading && items.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-6">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-[#F0DDAD]/40" />
                    </td>
                  </tr>
                ))
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-[#6B5245]">
                      <ShoppingBag size={22} className="text-[#C9B89F]" />
                      <p className="text-sm font-semibold text-[#2C1B13]">
                        {search ? 'No catalog items match your search' : 'No catalog items found'}
                      </p>
                      <p className="text-xs">
                        {search ? 'Try a different name.' : 'Create your first catalog item to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-[#FFF9EF]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg border border-[#E7DCCB] object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0DDAD]/40 text-[#B79B6B]">
                            <ShoppingBag size={16} />
                          </span>
                        )}
                        <div>
                          <p className="text-sm font-bold text-[#2C1B13]">{item.name}</p>
                          {item.description && <p className="max-w-[240px] truncate text-xs text-[#6B5245]">{item.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm font-bold text-[#2C1B13]">₦{item.price.toLocaleString()}</td>
                    <td className="px-5 py-3"><ScopePill isGlobal={item.isGlobal} /></td>
                    <td className="px-5 py-3"><StatusPill status={item.status} /></td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-[#6B5245]">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#F0DDAD]/50 hover:text-[#23150F] cursor-pointer">
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => { setSelected(item); setSelectedOrgIds([]); setRestrictOpen(true) }} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#F0DDAD]/50 hover:text-[#23150F] cursor-pointer">
                          <Globe2 size={13} /> Restrict
                        </button>
                        <button onClick={() => toggleStatus(item)} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#F0DDAD]/50 hover:text-[#23150F] cursor-pointer">
                          {item.status === 'active' ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                          {item.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
      </div>

      {/* Create modal */}
      <BrandModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        icon={<Plus size={20} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title="Create catalog item"
        subtitle="New items are global and active by default."
      >
        <div className="space-y-4">
          <div>
            <Label required>Name</Label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldCls} placeholder="e.g. Airtime & Data Bundle" />
          </div>
          <div>
            <Label>Description</Label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${fieldCls} min-h-[84px] resize-none`} placeholder="What the item covers, credit terms, etc." />
          </div>
          <div>
            <Label required>Price (₦)</Label>
            <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={fieldCls} placeholder="0.00" />
          </div>
          <div>
            <Label>Image URLs</Label>
            <div className="space-y-2">
              {form.imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={url}
                    onChange={(e) => {
                      const next = [...form.imageUrls]
                      next[i] = e.target.value
                      setForm({ ...form, imageUrls: next })
                    }}
                    placeholder={`Image URL ${i + 1}`}
                    className={fieldCls}
                  />
                  {form.imageUrls.length > 1 && (
                    <button onClick={() => setForm({ ...form, imageUrls: form.imageUrls.filter((_, j) => j !== i) })} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#E7DCCB] px-3 text-[#B3261E] transition hover:bg-[#B3261E]/5 cursor-pointer" aria-label="Remove image">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setForm({ ...form, imageUrls: [...form.imageUrls, ''] })}
              className={ghost.replace('px-4 py-2', 'mt-2 px-3.5 py-2')}
            >
              <Plus size={14} /> Add image
            </button>
          </div>
          {createError && (
            <p className="flex items-center gap-1.5 rounded-xl bg-[#B3261E]/5 px-3.5 py-2.5 text-xs font-semibold text-[#B3261E]" role="alert">
              <AlertTriangle size={13} /> {createError}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-[#EDE2D3] pt-4">
            <button onClick={() => setCreateOpen(false)} className={ghost}>Cancel</button>
            <button onClick={handleCreate} disabled={!form.name.trim() || form.price <= 0} className={solidGreen}>
              Create
            </button>
          </div>
        </div>
      </BrandModal>

      {/* Edit modal */}
      <BrandModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelected(null) }}
        icon={<Pencil size={20} className="text-[#9D4824]" />}
        iconCls="bg-[#9D4824]/10"
        title="Edit catalog item"
        subtitle={selected?.name ? `Currently editing ${selected.name}` : undefined}
      >
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={fieldCls} />
          </div>
          <div>
            <Label>Description</Label>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={`${fieldCls} min-h-[84px] resize-none`} />
          </div>
          <div>
            <Label>Price (₦)</Label>
            <input type="number" min={0} value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className={fieldCls} />
          </div>
          <div>
            <Label>Image URLs</Label>
            <div className="space-y-2">
              {editForm.imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={url}
                    onChange={(e) => {
                      const next = [...editForm.imageUrls]
                      next[i] = e.target.value
                      setEditForm({ ...editForm, imageUrls: next })
                    }}
                    placeholder={`Image URL ${i + 1}`}
                    className={fieldCls}
                  />
                  {editForm.imageUrls.length > 1 && (
                    <button onClick={() => setEditForm({ ...editForm, imageUrls: editForm.imageUrls.filter((_, j) => j !== i) })} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#E7DCCB] px-3 text-[#B3261E] transition hover:bg-[#B3261E]/5 cursor-pointer" aria-label="Remove image">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button onClick={() => setEditForm({ ...editForm, imageUrls: [...editForm.imageUrls, ''] })} className={ghost.replace('px-4 py-2', 'px-3.5 py-2')}>
                <Plus size={14} /> Add image
              </button>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleUpload}
                />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B]/10 px-3.5 py-2 text-xs font-semibold text-[#176B5B] transition hover:bg-[#176B5B]/20">
                  {uploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploading ? 'Uploading…' : 'Upload image'}
                </span>
              </label>
            </div>
          </div>
          {editError && (
            <p className="flex items-center gap-1.5 rounded-xl bg-[#B3261E]/5 px-3.5 py-2.5 text-xs font-semibold text-[#B3261E]" role="alert">
              <AlertTriangle size={13} /> {editError}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-[#EDE2D3] pt-4">
            <button onClick={() => { setEditOpen(false); setSelected(null) }} className={ghost}>Cancel</button>
            <button onClick={handleEdit} disabled={!editForm.name.trim() || editForm.price < 0} className={solidMaroon}>
              Save
            </button>
          </div>
        </div>
      </BrandModal>

      {/* Restrict modal */}
      <BrandModal
        open={restrictOpen}
        onClose={() => { setRestrictOpen(false); setSelected(null) }}
        icon={<Globe2 size={20} className="text-[#E4A42A]" />}
        iconCls="bg-[#E4A42A]/15"
        title={selected ? `Restrict: ${selected.name}` : 'Restrict'}
        subtitle="Choose which organizations can see this item."
      >
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-xl border border-[#E4A42A]/25 bg-[#E4A42A]/10 p-3.5 text-xs leading-relaxed text-[#7A5A00]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            Empty = global. Only the selected organizations below will be able to see this item once saved.
          </p>
          <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-[#E7DCCB] bg-[#FFF9EF]/40 p-2">
            {orgs.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-[#6B5245]">No organizations available.</p>
            )}
            {orgs.map((org) => (
              <label key={org.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#2C1B13] transition hover:bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrgIds.includes(org.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOrgIds([...selectedOrgIds, org.id])
                    } else {
                      setSelectedOrgIds(selectedOrgIds.filter((id) => id !== org.id))
                    }
                  }}
                  className="h-4 w-4 rounded border-[#C9B89F] accent-[#176B5B]"
                />
                <Building2Mini />
                {org.name}
              </label>
            ))}
          </div>
          {selectedOrgIds.length > 0 && (
            <p className="flex items-center gap-1.5 rounded-lg bg-[#176B5B]/5 px-3 py-2 text-xs font-semibold text-[#176B5B]">
              <CheckCircle2 size={13} /> Visible to {selectedOrgIds.length} organization{selectedOrgIds.length === 1 ? '' : 's'}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-[#EDE2D3] pt-4">
            <button onClick={() => { setRestrictOpen(false); setSelected(null); setSelectedOrgIds([]) }} className={ghost}>Cancel</button>
            <button onClick={handleRestrict} className={solidGreen}>Save Eligibility</button>
          </div>
        </div>
      </BrandModal>
    </div>
  )
}

function Building2Mini() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#176B5B]/10">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#176B5B]">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
      </svg>
    </span>
  )
}
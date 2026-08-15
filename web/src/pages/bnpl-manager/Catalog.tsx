import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Modal } from '../../components/ui/modal'

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

export function Catalog() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [restrictOpen, setRestrictOpen] = useState(false)
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', description: '', price: 0, imageUrls: [''] })
  const [editForm, setEditForm] = useState({ name: '', description: '', price: 0, imageUrls: [''] })
  const [editError, setEditError] = useState('')
  const [uploading, setUploading] = useState(false)

  const fetch = useCallback(() => {
    api.get('/bnpl/catalog').then((r) => setItems(r.data))
    api.get('/organizations').then((r) => setOrgs(r.data))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCreate = async () => {
    const payload = { ...form, imageUrls: form.imageUrls.filter(Boolean) }
    await api.post('/bnpl/catalog', payload)
    setCreateOpen(false)
    setForm({ name: '', description: '', price: 0, imageUrls: [''] })
    fetch()
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
    await api.post(`/bnpl/catalog/${selected.id}/restrict`, { organizationIds: selectedOrgIds })
    setRestrictOpen(false)
    setSelected(null)
    setSelectedOrgIds([])
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Catalog Items</h2>
        <Button onClick={() => { setForm({ name: '', description: '', price: 0, imageUrls: [''] }); setCreateOpen(true) }}>
          Create
        </Button>
      </div>

      <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Name</THeadCell>
            <THeadCell>Price</THeadCell>
            <THeadCell>Scope</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Created</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {filtered.map((item) => (
            <TBodyRow key={item.id}>
              <TBodyCell className="font-medium">{item.name}</TBodyCell>
              <TBodyCell>₦{item.price.toLocaleString()}</TBodyCell>
              <TBodyCell>
                <Badge variant={item.isGlobal ? 'info' : 'warning'}>
                  {item.isGlobal ? 'Global' : 'Restricted'}
                </Badge>
              </TBodyCell>
              <TBodyCell>
                <Badge variant={item.status === 'active' ? 'success' : 'danger'}>{item.status}</Badge>
              </TBodyCell>
              <TBodyCell>{new Date(item.createdAt).toLocaleDateString()}</TBodyCell>
              <TBodyCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelected(item)
                    setEditForm({ name: item.name, description: item.description || '', price: item.price, imageUrls: item.images?.map((i) => i.url) || [''] })
                    setEditOpen(true)
                  }}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setRestrictOpen(true) }}>Restrict</Button>
                  <Button variant="ghost" size="sm" onClick={async () => { await api.patch(`/bnpl/catalog/${item.id}`, { status: item.status === 'active' ? 'inactive' : 'active' }); fetch() }}>
                    {item.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </TBodyCell>
            </TBodyRow>
          ))}
          {filtered.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={6} className="text-center text-gray-400 py-8">No catalog items found</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Catalog Item">
        <div className="space-y-4">
          <Input id="cat-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="cat-desc" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input id="cat-price" label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
          <label className="block text-sm font-medium mb-1">Image URLs</label>
          {form.imageUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => {
                  const next = [...form.imageUrls]
                  next[i] = e.target.value
                  setForm({ ...form, imageUrls: next })
                }}
                placeholder={`Image URL ${i + 1}`}
              />
              {form.imageUrls.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, imageUrls: form.imageUrls.filter((_, j) => j !== i) })}>
                  ✕
                </Button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, imageUrls: [...form.imageUrls, ''] })}>
            + Add image
          </Button>
          <Button onClick={handleCreate} className="w-full">Create</Button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Catalog Item">
        <div className="space-y-4">
          <Input id="edit-cat-name" label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input id="edit-cat-desc" label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          <Input id="edit-cat-price" label="Price" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} />
          <label className="block text-sm font-medium mb-1">Image URLs</label>
          {editForm.imageUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => {
                  const next = [...editForm.imageUrls]
                  next[i] = e.target.value
                  setEditForm({ ...editForm, imageUrls: next })
                }}
                placeholder={`Image URL ${i + 1}`}
              />
              {editForm.imageUrls.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setEditForm({ ...editForm, imageUrls: editForm.imageUrls.filter((_, j) => j !== i) })}>
                  ✕
                </Button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditForm({ ...editForm, imageUrls: [...editForm.imageUrls, ''] })}>
              + Add image
            </Button>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleUpload}
              />
              <span className="text-sm text-blue-600 font-medium hover:underline">
                {uploading ? 'Uploading...' : 'Upload image'}
              </span>
            </label>
          </div>
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <Button onClick={handleEdit} className="w-full">Save</Button>
        </div>
      </Modal>

      <Modal open={restrictOpen} onClose={() => setRestrictOpen(false)} title={`Restrict: ${selected?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select which organizations can see this item (empty = global):</p>
          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2 dark:border-gray-700">
            {orgs.map((org) => (
              <label key={org.id} className="flex items-center gap-2 text-sm cursor-pointer">
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
                  className="rounded border-gray-300"
                />
                {org.name}
              </label>
            ))}
          </div>
          <Button onClick={handleRestrict} className="w-full">Save Eligibility</Button>
        </div>
      </Modal>
    </div>
  )
}

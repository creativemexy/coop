import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'

type Role = 'super_admin' | 'operational_admin' | 'accountant' | 'business_manager' | 'apex_business_manager' | 'bnpl_manager' | 'loan_manager' | 'investment_manager' | 'supervisor' | 'operations' | 'individual'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  isActive: boolean
  kycStatus: string
  kycImage?: string
  phone?: string
  organizationId?: string
  apexOrgId?: string
  createdAt: string
  registrationFeePaid?: boolean
}

interface OrgOption { id: string; name: string; code: string }

const roleColors: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  super_admin: 'danger',
  operational_admin: 'warning',
  accountant: 'info',
  business_manager: 'success',
  apex_business_manager: 'info',
  bnpl_manager: 'info',
  loan_manager: 'warning',
  investment_manager: 'info',
  supervisor: 'warning',
  operations: 'default',
  individual: 'default',
}

const CREATABLE_ROLES = [
  'operational_admin',
  'accountant',
  'bnpl_manager',
  'loan_manager',
  'investment_manager',
  'supervisor',
  'operations',
]

const COOP_ROLES = [
  'bnpl_manager',
  'accountant',
  'loan_manager',
  'investment_manager',
  'supervisor',
  'operations',
]

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  organizationId: '',
}

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formMsg, setFormMsg] = useState('')

  const fetch = useCallback(() => {
    const params = roleFilter ? { role: roleFilter } : {}
    api.get('/users', { params }).then((r) => setUsers(r.data))
  }, [roleFilter])

  useEffect(() => { fetch() }, [fetch])

  const openCreate = () => {
    setForm(emptyForm)
    setFormMsg('')
    setShowCreate(true)
    api.get('/organizations').then((r) => setOrgs(r.data)).catch(() => {})
  }

  const handleCreate = async () => {
    setSaving(true)
    setFormMsg('')
    try {
      await api.post('/admin/super/users', {
        ...form,
        email: form.email.trim(),
        role: form.role,
        organizationId: form.organizationId || undefined,
      })
      setShowCreate(false)
      fetch()
    } catch (e: any) {
      setFormMsg(e?.response?.data?.message || 'Failed to create user')
    }
    setSaving(false)
  }

  const needsScope = COOP_ROLES.includes(form.role)

  const set = (k: keyof typeof form) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Users</h2>
        <Button variant="primary" size="sm" onClick={openCreate}>Create User</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', ...CREATABLE_ROLES].map((r) => (
          <Button
            key={r}
            variant={roleFilter === r ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setRoleFilter(r)}
          >
            {r ? r.replace(/_/g, ' ') : 'All'}
          </Button>
        ))}
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Name</THeadCell>
            <THeadCell>Email</THeadCell>
            <THeadCell>Role</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>KYC</THeadCell>
            <THeadCell>Joined</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {users.map((u) => (
            <TBodyRow key={u.id}>
              <TBodyCell className="font-medium">{u.firstName} {u.lastName}</TBodyCell>
              <TBodyCell>{u.email}</TBodyCell>
              <TBodyCell><Badge variant={roleColors[u.role] ?? 'default'}>{u.role.replace(/_/g, ' ')}</Badge></TBodyCell>
              <TBodyCell>
                <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
              </TBodyCell>
              <TBodyCell>
                <Badge variant={u.kycStatus === 'approved' ? 'success' : u.kycStatus === 'pending' ? 'warning' : 'default'}>
                  {u.kycStatus}
                </Badge>
              </TBodyCell>
              <TBodyCell>{new Date(u.createdAt).toLocaleDateString()}</TBodyCell>
              <TBodyCell>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(u)}>View</Button>
              </TBodyCell>
            </TBodyRow>
          ))}
          {users.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={7} className="text-center text-gray-400 py-8">No users found</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">User Profile</CardTitle>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Name</span>
                <span className="col-span-2 font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Email</span>
                <span className="col-span-2">{selectedUser.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Phone</span>
                <span className="col-span-2">{selectedUser.phone || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Role</span>
                <span className="col-span-2 capitalize">{selectedUser.role.replace(/_/g, ' ')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">KYC</span>
                <span className="col-span-2">
                  <Badge variant={selectedUser.kycStatus === 'approved' ? 'success' : selectedUser.kycStatus === 'pending' ? 'warning' : 'default'}>
                    {selectedUser.kycStatus}
                  </Badge>
                  {selectedUser.kycImage && selectedUser.kycStatus === 'approved' && (
                    <img src={selectedUser.kycImage} alt="KYC" className="mt-2 w-24 h-24 rounded-lg object-cover border" />
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Joined</span>
                <span className="col-span-2">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <Card className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">Create User</CardTitle>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input className={inputCls} value={form.firstName} onChange={set('firstName')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input className={inputCls} value={form.lastName} onChange={set('lastName')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className={inputCls} value={form.email} onChange={set('email')} placeholder="name@coop.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select className={inputCls} value={form.role} onChange={set('role')}>
                  <option value="">Select role...</option>
                  {CREATABLE_ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              {needsScope && (
                <div>
                  <label className="block text-sm font-medium mb-1">Organization</label>
                  <select className={inputCls} value={form.organizationId} onChange={set('organizationId')}>
                    <option value="">Select organization...</option>
                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
                  </select>
                </div>
              )}
              {formMsg && <p className="text-sm text-red-600">{formMsg}</p>}
              <p className="text-xs text-gray-400">A temporary password will be generated and sent to the provided email.</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={saving || !form.email || !form.role || (needsScope && !form.organizationId)}>
                {saving ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

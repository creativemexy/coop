import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle, CardHeader } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

interface OrgUsers {
  id: string
  name: string
  code: string
  status: string
  users: Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isActive: boolean
    kycStatus: string
    createdAt: string
  }>
}

const ROLE_OPTIONS = [
  'business_manager',
  'bnpl_manager',
  'accountant',
  'loan_manager',
  'supervisor',
  'operations',
]

const cardBorders = [
  'border-indigo-500',
  'border-emerald-500',
  'border-blue-500',
  'border-amber-500',
  'border-fuchsia-500',
  'border-cyan-500',
]

export function AdminUsers() {
  const [orgUsers, setOrgUsers] = useState<OrgUsers[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/admin/users-by-org').then(({ data }) => {
      setOrgUsers(data)
      setLoading(false)
    })
  }, [])

  const handleAssignRole = async (userId: string) => {
    if (!selectedRole) return
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: selectedRole })
      setMessage('Role updated')
      const { data } = await api.get('/admin/users-by-org')
      setOrgUsers(data)
      setAssigning(null)
      setSelectedRole('')
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Error updating role')
    }
  }

  const handleToggleActive = async (userId: string, current: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: '' }) // We use the users endpoint via admin
      await api.patch(`/users/${userId}`, { isActive: !current })
      setMessage(current ? 'User suspended' : 'User activated')
      const { data } = await api.get('/admin/users-by-org')
      setOrgUsers(data)
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Error updating user')
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Loading users...</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Users & Roles</h2>
        {message && <span className="text-sm text-green-600">{message}</span>}
      </div>

      {orgUsers.map((org, idx) => (
        <Card key={org.id} className={cardBorders[idx % cardBorders.length]}>
          <CardHeader>
            <button
              onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
              className="flex items-center justify-between w-full cursor-pointer"
            >
              <div>
                <CardTitle>{org.name} ({org.code})</CardTitle>
                <p className="text-xs text-gray-400 mt-1">{org.users.length} users · <Badge variant={org.status === 'active' ? 'success' : 'default'}>{org.status}</Badge></p>
              </div>
              <span className="text-gray-400 text-lg">{expandedOrg === org.id ? '▼' : '▶'}</span>
            </button>
          </CardHeader>

          {expandedOrg === org.id && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Role</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">KYC</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {org.users.map((u) => (
                    <tr key={u.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-2 whitespace-nowrap">{u.firstName} {u.lastName}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{u.email}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {assigning === u.id ? (
                          <div className="flex gap-1">
                            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                              className="border rounded px-1 py-0.5 text-xs dark:bg-gray-800 dark:border-gray-600">
                              <option value="">Select...</option>
                              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                            </select>
                            <button onClick={() => handleAssignRole(u.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">Save</button>
                            <button onClick={() => setAssigning(null)}
                              className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer">X</button>
                          </div>
                        ) : (
                          <Badge variant="info">{u.role?.replace(/_/g, ' ') || '—'}</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'active' : 'suspended'}</Badge>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{u.kycStatus || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button onClick={() => { setAssigning(u.id); setSelectedRole(u.role || '') }}
                            className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">Change Role</button>
                          <button onClick={() => handleToggleActive(u.id, u.isActive)}
                            className="text-xs text-red-600 hover:text-red-700 cursor-pointer">{u.isActive ? 'Suspend' : 'Activate'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

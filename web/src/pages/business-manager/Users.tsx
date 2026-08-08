import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../stores/auth.store'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  kycStatus: string
  organizationId?: string
  registrationFeePaid: boolean
  phone?: string
  createdAt: string
}

const kycColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  none: 'default',
}

export function BusinessManagerUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [financials, setFinancials] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const openUser = (u: User) => {
    setSelectedUser(u)
    setFinancials(null)
    api.get(`/dashboard/business-manager/members/${u.id}/financials`).then((r) => setFinancials(r.data)).catch(() => setFinancials(null))
  }

  const fetch = useCallback(() => {
    const params: Record<string, string> = { role: 'individual' }
    if (user?.organizationId) params.organizationId = user.organizationId
    if (kycFilter) params.kycStatus = kycFilter
    if (activeFilter) params.isActive = activeFilter
    if (search) params.search = search
    api.get('/users', { params }).then((r) => setUsers(r.data))
  }, [kycFilter, activeFilter, search, user?.organizationId])

  useEffect(() => { fetch() }, [fetch])

  const handleToggleActive = async (user: User) => {
    setSaving(true)
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive })
      setSelectedUser(null)
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update user')
    }
    setSaving(false)
  }

  const handleKycStatus = async (userId: string, status: string) => {
    setSaving(true)
    try {
      await api.patch(`/users/${userId}`, { kycStatus: status })
      setSelectedUser(null)
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update KYC')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">User Management</h2>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 w-64"
        />

        <select
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All KYC</option>
          <option value="none">None</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Name</THeadCell>
            <THeadCell>Email</THeadCell>
            <THeadCell>Role</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>KYC</THeadCell>
            <THeadCell>Fee</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {users.map((u) => (
            <TBodyRow key={u.id}>
              <TBodyCell className="font-medium">{u.firstName} {u.lastName}</TBodyCell>
              <TBodyCell>{u.email}</TBodyCell>
              <TBodyCell className="capitalize text-xs text-gray-500">{u.role.replace('_', ' ')}</TBodyCell>
              <TBodyCell>
                <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Suspended'}</Badge>
              </TBodyCell>
              <TBodyCell>
                <Badge variant={kycColors[u.kycStatus] ?? 'default'}>{u.kycStatus}</Badge>
              </TBodyCell>
              <TBodyCell>
                <Badge variant={u.registrationFeePaid ? 'success' : 'warning'}>
                  {u.registrationFeePaid ? 'Paid' : 'Unpaid'}
                </Badge>
              </TBodyCell>
              <TBodyCell>
                <Button variant="ghost" size="sm" onClick={() => openUser(u)}>
                  View
                </Button>
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
                <span className="col-span-2 capitalize">{selectedUser.role.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Status</span>
                <span className="col-span-2">
                  <Badge variant={selectedUser.isActive ? 'success' : 'danger'}>
                    {selectedUser.isActive ? 'Active' : 'Suspended'}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">KYC</span>
                <span className="col-span-2">
                  <Badge variant={kycColors[selectedUser.kycStatus] ?? 'default'}>{selectedUser.kycStatus}</Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Fee</span>
                <span className="col-span-2">
                  <Badge variant={selectedUser.registrationFeePaid ? 'success' : 'warning'}>
                    {selectedUser.registrationFeePaid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Joined</span>
                <span className="col-span-2">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {financials && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-semibold mb-3 dark:text-gray-100">Financial Overview</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                    <div className="text-gray-500 text-xs">Savings</div>
                    <div className="font-bold">₦{financials.accountSummary.savingsBalance.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                    <div className="text-gray-500 text-xs">BNPL Balance</div>
                    <div className="font-bold">₦{financials.accountSummary.bnplBalance.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                    <div className="text-gray-500 text-xs">Loan Balance</div>
                    <div className="font-bold">₦{financials.accountSummary.loanBalance.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  <div>Subscriptions: {financials.subscriptions.length}</div>
                  <div>Upcoming payments: {financials.upcomingPayments.length}</div>
                  <div>Loans: {financials.loans.length}</div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {selectedUser.kycStatus === 'pending' && (
                <>
                  <Button size="sm" variant="primary" onClick={() => handleKycStatus(selectedUser.id, 'approved')} disabled={saving}>
                    Approve KYC
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleKycStatus(selectedUser.id, 'rejected')} disabled={saving}>
                    Reject KYC
                  </Button>
                </>
              )}
              {selectedUser.kycStatus === 'none' && (
                <Button size="sm" variant="primary" onClick={() => handleKycStatus(selectedUser.id, 'pending')} disabled={saving}>
                  Mark KYC Pending
                </Button>
              )}
              <Button
                size="sm"
                variant={selectedUser.isActive ? 'secondary' : 'primary'}
                onClick={() => handleToggleActive(selectedUser)}
                disabled={saving}
              >
                {selectedUser.isActive ? 'Suspend User' : 'Activate User'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

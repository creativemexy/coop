import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'

interface Organization {
  id: string
  name: string
  code: string
  status: string
  memberCount: number
}

interface Individual {
  id: string
  email: string
  firstName: string
  lastName: string
  kycStatus: string
  registrationFeePaid: boolean
  isActive: boolean
  organizationId?: string
}

const kycColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  none: 'default',
}

export function ApexBusinessManagerUsers() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [individuals, setIndividuals] = useState<Individual[]>([])
  const [search, setSearch] = useState('')

  const fetch = useCallback(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    api.get('/apex-bm/users', { params }).then((r) => {
      setOrganizations(r.data.organizations ?? [])
      setIndividuals(r.data.individuals ?? [])
    })
  }, [search])

  useEffect(() => { fetch() }, [fetch])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">All Users — Apex</h2>
      </div>

      <input
        type="text"
        placeholder="Search member name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 w-64"
      />

      <div>
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Organizations</h3>
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>Name</THeadCell>
              <THeadCell>Code</THeadCell>
              <THeadCell>Members</THeadCell>
              <THeadCell>Status</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {organizations.map((o) => (
              <TBodyRow key={o.id}>
                <TBodyCell className="font-medium">{o.name}</TBodyCell>
                <TBodyCell>{o.code}</TBodyCell>
                <TBodyCell>{o.memberCount}</TBodyCell>
                <TBodyCell>
                  <Badge variant={o.status === 'active' ? 'success' : 'default'}>{o.status}</Badge>
                </TBodyCell>
              </TBodyRow>
            ))}
            {organizations.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={4} className="text-center text-gray-400 py-8">No organizations under this apex</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Individual Members</h3>
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>Name</THeadCell>
              <THeadCell>Email</THeadCell>
              <THeadCell>KYC</THeadCell>
              <THeadCell>Fee</THeadCell>
              <THeadCell>Status</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {individuals.map((u) => (
              <TBodyRow key={u.id}>
                <TBodyCell className="font-medium">{u.firstName} {u.lastName}</TBodyCell>
                <TBodyCell>{u.email}</TBodyCell>
                <TBodyCell>
                  <Badge variant={kycColors[u.kycStatus] ?? 'default'}>{u.kycStatus}</Badge>
                </TBodyCell>
                <TBodyCell>
                  <Badge variant={u.registrationFeePaid ? 'success' : 'warning'}>
                    {u.registrationFeePaid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </TBodyCell>
                <TBodyCell>
                  <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Suspended'}</Badge>
                </TBodyCell>
              </TBodyRow>
            ))}
            {individuals.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={5} className="text-center text-gray-400 py-8">No members found</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import {
  Badge,
  Btn,
  EmptyRow,
  PageHeader,
  Panel,
  StatCard,
  Table,
  TBody,
  TBodyCell,
  TBodyRow,
  THead,
  THeadCell,
  THeadRow,
  TextInput,
} from '../../components/ui/warm'

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

function Pager({ total, page, pageSize, onChange }: { total: number; page: number; pageSize: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE2D3] px-5 py-3">
      <span className="text-sm text-[#6B5245]">
        {total === 0 ? '0 results' : `${from} - ${to} of ${total}`}
      </span>
      <div className="flex items-center gap-2">
        <Btn variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Btn>
        <span className="text-sm font-semibold text-[#2C1B13]">
          Page {page} of {pages}
        </span>
        <Btn variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </Btn>
      </div>
    </div>
  )
}

const PAGE_SIZE = 10

export function ApexBusinessManagerUsers() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [individuals, setIndividuals] = useState<Individual[]>([])
  const [search, setSearch] = useState('')
  const [orgPage, setOrgPage] = useState(1)
  const [indPage, setIndPage] = useState(1)

  const fetch = useCallback(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    api.get('/apex-bm/users', { params }).then((r) => {
      setOrganizations(r.data.organizations ?? [])
      setIndividuals(r.data.individuals ?? [])
    })
  }, [search])

  useEffect(() => { fetch() }, [fetch])

  const totalMembers = organizations.reduce((s, o) => s + (o.memberCount || 0), 0)
  const activeOrgs = organizations.filter((o) => o.status === 'active').length
  const approvedKycs = individuals.filter((u) => u.kycStatus === 'approved').length
  const paidFees = individuals.filter((u) => u.registrationFeePaid).length
  const suspended = individuals.filter((u) => !u.isActive).length

  const orgPages = Math.max(1, Math.ceil(organizations.length / PAGE_SIZE))
  const indPages = Math.max(1, Math.ceil(individuals.length / PAGE_SIZE))
  const visibleOrgs = organizations.slice((orgPage - 1) * PAGE_SIZE, orgPage * PAGE_SIZE)
  const visibleIndividuals = individuals.slice((indPage - 1) * PAGE_SIZE, indPage * PAGE_SIZE)

  const handleSearch = (value: string) => {
    setSearch(value)
    setOrgPage(1)
    setIndPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Apex Overview"
        title="All Users"
        subtitle="Every organization and individual member under this apex group."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Organizations" value={organizations.length} sub={`${activeOrgs} active`} icon="🏢" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
        <StatCard label="Members (orgs)" value={totalMembers} sub="heads inside organizations" icon="👥" iconCls="bg-[#E4A42A]/15 text-[#8A5A00]" />
        <StatCard label="Individual Members" value={individuals.length} sub={`${approvedKycs} KYC approved`} icon="🧑" iconCls="bg-[#9D4824]/10 text-[#9D4824]" />
        <StatCard label="Registration Fees" value={`${paidFees}`} sub={`${suspended} suspended`} icon="✅" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
      </div>

      <div>
        <TextInput
          placeholder="Search member name or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <Panel title="Organizations" subtitle="Affiliate cooperatives under this apex">
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
            {visibleOrgs.map((o) => (
              <TBodyRow key={o.id}>
                <TBodyCell className="font-semibold text-[#2C1B13]">{o.name}</TBodyCell>
                <TBodyCell>
                  <code className="rounded-md bg-[#FFF9EF] px-1.5 py-0.5 text-xs font-semibold text-[#6B5245]">{o.code}</code>
                </TBodyCell>
                <TBodyCell>{o.memberCount}</TBodyCell>
                <TBodyCell>
                  <Badge variant={o.status === 'active' ? 'success' : 'default'} dot>{o.status}</Badge>
                </TBodyCell>
              </TBodyRow>
            ))}
            {organizations.length === 0 && (
              <EmptyRow colSpan={4}>No organizations under this apex</EmptyRow>
            )}
          </TBody>
        </Table>
        <Pager total={organizations.length} page={orgPage} pageSize={PAGE_SIZE} onChange={(p) => setOrgPage(Math.min(p, orgPages))} />
      </Panel>

      <Panel title="Individual Members" subtitle="Direct members registered on the platform">
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
            {visibleIndividuals.map((u) => (
              <TBodyRow key={u.id}>
                <TBodyCell className="font-semibold text-[#2C1B13]">{u.firstName} {u.lastName}</TBodyCell>
                <TBodyCell>{u.email}</TBodyCell>
                <TBodyCell>
                  <Badge variant={kycColors[u.kycStatus] ?? 'default'} dot>{u.kycStatus}</Badge>
                </TBodyCell>
                <TBodyCell>
                  <Badge variant={u.registrationFeePaid ? 'success' : 'warning'}>
                    {u.registrationFeePaid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </TBodyCell>
                <TBodyCell>
                  <Badge variant={u.isActive ? 'success' : 'danger'} dot>{u.isActive ? 'Active' : 'Suspended'}</Badge>
                </TBodyCell>
              </TBodyRow>
            ))}
            {individuals.length === 0 && (
              <EmptyRow colSpan={5}>No members found</EmptyRow>
            )}
          </TBody>
        </Table>
        <Pager total={individuals.length} page={indPage} pageSize={PAGE_SIZE} onChange={(p) => setIndPage(Math.min(p, indPages))} />
      </Panel>
    </div>
  )
}
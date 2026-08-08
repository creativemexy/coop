import { useEffect, useState, useCallback, useRef } from 'react'
import { Building2, Mail, User, Landmark } from 'lucide-react'
import { NUBAN_BANKS, parseAddress, composeAddress } from '../../lib/banks'
import { api } from '../../api/client'
import { Card } from '../../components/ui/card'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Modal } from '../../components/ui/modal'

interface ApexOrg {
  id: string
  name: string
  code: string
  status: string
  createdAt: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  contactPersonName?: string
  contactPersonPhone?: string
  contactPersonEmail?: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  sortCode?: string
  bankCode?: string
  organizations?: { id: string; name: string }[]
}

interface OrgForm {
  name: string
  houseNumber: string
  streetName: string
  city: string
  state: string
  contactEmail: string
  contactPhone: string
  contactPersonName: string
  contactPersonPhone: string
  contactPersonEmail: string
  bankName: string
  accountName: string
  accountNumber: string
  sortCode: string
  bankCode: string
}

const emptyForm = (): OrgForm => ({
  name: '',
  houseNumber: '', streetName: '', city: '', state: '',
  contactEmail: '', contactPhone: '',
  contactPersonName: '', contactPersonPhone: '', contactPersonEmail: '',
  bankName: '', accountName: '', accountNumber: '', sortCode: '', bankCode: '',
})

export function ApexOrganizations() {
  const [orgs, setOrgs] = useState<ApexOrg[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ApexOrg | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState<OrgForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [step, setStep] = useState(1)
  const [stepError, setStepError] = useState('')
  const [createdResult, setCreatedResult] = useState<{ email: string; password: string; code: string } | null>(null)
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetch = useCallback(() => {
    api.get('/apex-organizations').then((r) => setOrgs(r.data))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.code.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCreate = async () => {
    setSaving(true)
    try {
      const { data } = await api.post('/apex-organizations', { ...form, address: composeAddress(form) })
      setCreatedResult({
        email: data.generatedEmail || '',
        password: data.generatedPassword || '',
        code: data.code || '',
      })
      setCreateOpen(false)
      setForm(emptyForm())
      fetch()
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.patch(`/apex-organizations/${selected.id}`, { ...form, address: composeAddress(form) })
      setEditOpen(false)
      setSelected(null)
      setForm(emptyForm())
      fetch()
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => { setForm(emptyForm()); setStep(1); setStepError(''); setCreateOpen(true) }
  const openEdit = (o: ApexOrg) => {
    setSelected(o)
    const addr = parseAddress(o.address)
    setForm({
      name: o.name,
      houseNumber: addr.houseNumber, streetName: addr.streetName, city: addr.city, state: addr.state,
      contactEmail: o.contactEmail || '', contactPhone: o.contactPhone || '',
      contactPersonName: o.contactPersonName || '', contactPersonPhone: o.contactPersonPhone || '',
      contactPersonEmail: o.contactPersonEmail || '',
      bankName: o.bankName || '', accountName: o.accountName || '',
      accountNumber: o.accountNumber || '', sortCode: o.sortCode || '',
      bankCode: o.bankCode || '',
    })
    setEditOpen(true)
  }

  const resolveAccountName = async (accountNumber: string, bankCode: string) => {
    if (accountNumber.length !== 10 || !bankCode) return
    setResolving(true)
    try {
      const { data } = await api.get('/apex-organizations/bank/resolve', {
        params: { accountNumber, bankCode },
      })
      if (data?.resolved && data.accountName) {
        setForm((f) => ({ ...f, accountName: f.accountName || data.accountName }))
      }
    } catch {
      // name enquiry unavailable — user can type the account name manually
    } finally {
      setResolving(false)
    }
  }

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm((f) => ({ ...f, accountNumber: digits }))

    if (resolveTimer.current) clearTimeout(resolveTimer.current)

    if (digits.length === 10) {
      const bank = NUBAN_BANKS[digits.slice(0, 3)]
      if (bank) {
        setForm((f) => ({
          ...f,
          bankName: f.bankName || bank.name,
          bankCode: f.bankCode || digits.slice(0, 3),
          sortCode: f.sortCode || bank.sortCode,
        }))
      }
      resolveTimer.current = setTimeout(() => {
        const code = bank ? digits.slice(0, 3) : ''
        resolveAccountName(digits, code)
      }, 400)
    }
  }

  const normalize = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim()

  const requiredFields: (keyof OrgForm)[] = [
    'name', 'houseNumber', 'streetName', 'city', 'state',
    'contactEmail', 'contactPhone',
    'contactPersonName', 'contactPersonPhone', 'contactPersonEmail',
    'bankName', 'accountName', 'accountNumber', 'sortCode', 'bankCode',
  ]
  const allRequiredFilled = requiredFields.every((k) => (form[k] ?? '').toString().trim() !== '')
  const accountNameMatchesOrg = normalize(form.accountName) === normalize(form.name)
  const canCreate = allRequiredFilled && accountNameMatchesOrg

  const stepTitles = ['Organization', 'Contact Details', 'Contact Person', 'Bank Details']
  const stepIcons = [Building2, Mail, User, Landmark]
  const stepFields: (keyof OrgForm)[][] = [
    ['name', 'houseNumber', 'streetName', 'city', 'state'],
    ['contactEmail', 'contactPhone'],
    ['contactPersonName', 'contactPersonPhone', 'contactPersonEmail'],
    ['bankName', 'accountName', 'accountNumber', 'sortCode', 'bankCode'],
  ]
  const currentStepComplete = stepFields[step - 1].every((k) => (form[k] ?? '').toString().trim() !== '')
  const isLastStep = step === stepTitles.length

  const nextStep = () => {
    if (!currentStepComplete) {
      setStepError(`Please complete all fields in the "${stepTitles[step - 1]}" step.`)
      return
    }
    setStepError('')
    setStep((s) => Math.min(s + 1, stepTitles.length))
  }
  const backStep = () => {
    setStepError('')
    setStep((s) => Math.max(s - 1, 1))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Apex Organizations</h2>
        <Button onClick={openCreate}>Create</Button>
      </div>

      <Input
        placeholder="Search by name or code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Card className="border-sky-500 p-0 overflow-hidden">
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>Name</THeadCell>
              <THeadCell>Code</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Orgs</THeadCell>
              <THeadCell>Bank</THeadCell>
              <THeadCell>Created</THeadCell>
              <THeadCell />
            </THeadRow>
          </THead>
          <TBody>
            {filtered.map((o) => (
              <TBodyRow key={o.id}>
                <TBodyCell className="font-medium">{o.name}</TBodyCell>
                <TBodyCell><code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{o.code}</code></TBodyCell>
                <TBodyCell><Badge variant={o.status === 'active' ? 'success' : 'danger'}>{o.status}</Badge></TBodyCell>
                <TBodyCell>{o.organizations?.length ?? 0}</TBodyCell>
                <TBodyCell>
                  {o.accountNumber ? (
                    <span className="text-xs">{o.bankName} ••••{o.accountNumber.slice(-4)}</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </TBodyCell>
                <TBodyCell>{new Date(o.createdAt).toLocaleDateString()}</TBodyCell>
                <TBodyCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(o)}>View</Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(o)}>Edit</Button>
                  </div>
                </TBodyCell>
              </TBodyRow>
            ))}
            {filtered.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={7} className="text-center text-gray-400 py-8">No apex organizations found</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Apex Organization">
        <div className="space-y-4">
          <div className="flex items-center gap-1">
            {stepTitles.map((t, i) => {
              const n = i + 1
              const active = n === step
              const done = n < step
              const Icon = stepIcons[i]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { if (done || stepFields[i].every((k) => (form[k] ?? '').toString().trim() !== '')) { setStep(n); setStepError('') } }}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs ${active ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : done ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'border-gray-200 text-gray-400 dark:border-gray-700'}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? 'bg-blue-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400 dark:bg-gray-700'}`}>
                    <Icon size={16} strokeWidth={2.5} />
                  </span>
                  <span className="text-center">{t}</span>
                </button>
              )
            })}
          </div>

          <div className="space-y-4 max-h-[55vh] overflow-y-auto">
            {step === 1 && (
              <>
                <Input id="create-name" label="Organization Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <p className="text-xs text-gray-400">Code will be auto-generated from the name.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input id="create-house-num" label="House Number" value={form.houseNumber} onChange={(e) => setForm({ ...form, houseNumber: e.target.value })} required />
                  <Input id="create-street" label="Street Name" value={form.streetName} onChange={(e) => setForm({ ...form, streetName: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input id="create-city" label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                  <Input id="create-state" label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Input id="create-email" label="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
                <Input id="create-phone" label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} required />
              </>
            )}

            {step === 3 && (
              <>
                <Input id="create-cp-name" label="Name" value={form.contactPersonName} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} required />
                <Input id="create-cp-phone" label="Phone" value={form.contactPersonPhone} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} required />
                <Input id="create-cp-email" label="Email" value={form.contactPersonEmail} onChange={(e) => setForm({ ...form, contactPersonEmail: e.target.value })} required />
              </>
            )}

            {step === 4 && (
              <>
                <p className="text-sm font-medium text-gray-500">Bank Details (for fee withdrawals)</p>
                <Input id="create-acct-num" label="Account Number" value={form.accountNumber} onChange={handleAccountNumberChange} placeholder="10-digit account number" required />
                {form.accountNumber && !NUBAN_BANKS[form.accountNumber.slice(0, 3)] && (
                  <p className="text-xs text-amber-600">Unknown bank code — fields stay locked until a known bank is entered.</p>
                )}
                <Input id="create-bank" label="Bank Name" value={form.bankName} readOnly placeholder="Auto-filled from account number" required />
                <div>
                  <Input id="create-acct-name" label="Account Name" value={form.accountName} readOnly placeholder={resolving ? 'Resolving…' : 'Auto-filled from bank enquiry'} required />
                  {resolving && <p className="text-xs text-blue-500 mt-1">Resolving account name…</p>}
                </div>
                <Input id="create-sort" label="Sort Code" value={form.sortCode} readOnly placeholder="Auto-filled" required />
                <Input id="create-bank-code" label="Bank Code" value={form.bankCode} readOnly placeholder="Auto-filled" required />
              </>
            )}
          </div>

          {stepError && <p className="text-xs text-red-500">{stepError}</p>}
          {isLastStep && !allRequiredFilled && <p className="text-xs text-red-500">All fields are required before creating.</p>}
          {isLastStep && allRequiredFilled && !accountNameMatchesOrg && (
            <p className="text-xs text-red-500">Account name must match the organization name.</p>
          )}

          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="secondary" onClick={backStep} className="w-1/3">Back</Button>
            )}
            {!isLastStep ? (
              <Button onClick={nextStep} className="flex-1">Next</Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving || !canCreate} className="flex-1">{saving ? 'Creating...' : 'Create'}</Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Apex Organization">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input id="edit-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <hr className="dark:border-gray-700" />
          <p className="text-sm font-medium text-gray-500">Address</p>
          <div className="grid grid-cols-2 gap-3">
            <Input id="edit-house-num" label="House Number" value={form.houseNumber} onChange={(e) => setForm({ ...form, houseNumber: e.target.value })} />
            <Input id="edit-street" label="Street Name" value={form.streetName} onChange={(e) => setForm({ ...form, streetName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="edit-city" label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input id="edit-state" label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <hr className="dark:border-gray-700" />
          <p className="text-sm font-medium text-gray-500">Contact Details</p>
          <Input id="edit-email" label="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          <Input id="edit-phone" label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          <hr className="dark:border-gray-700" />
          <p className="text-sm font-medium text-gray-500">Contact Person</p>
          <Input id="edit-cp-name" label="Name" value={form.contactPersonName} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} />
          <Input id="edit-cp-phone" label="Phone" value={form.contactPersonPhone} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} />
          <Input id="edit-cp-email" label="Email" value={form.contactPersonEmail} onChange={(e) => setForm({ ...form, contactPersonEmail: e.target.value })} />
          <hr className="dark:border-gray-700" />
          <p className="text-sm font-medium text-gray-500">Bank Details (for fee withdrawals)</p>
          <Input id="edit-acct-num" label="Account Number" value={form.accountNumber} onChange={handleAccountNumberChange} placeholder="10-digit account number" required />
          <Input id="edit-bank" label="Bank Name" value={form.bankName} readOnly placeholder="Auto-filled from account number" required />
          <div>
            <Input id="edit-acct-name" label="Account Name" value={form.accountName} readOnly placeholder={resolving ? 'Resolving…' : 'Auto-filled from bank enquiry'} required />
            {resolving && <p className="text-xs text-blue-500 mt-1">Resolving account name…</p>}
          </div>
          <Input id="edit-sort" label="Sort Code" value={form.sortCode} readOnly placeholder="Auto-filled" required />
          <Input id="edit-bank-code" label="Bank Code" value={form.bankCode} readOnly placeholder="Auto-filled" required />
          <Button onClick={handleUpdate} disabled={saving} className="w-full">{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>

      <Modal open={!!selected && !editOpen} onClose={() => setSelected(null)} title={selected?.name ?? ''}>
        {selected && (
          <div className="space-y-4">
            <div><span className="text-sm text-gray-500">Code:</span><p className="font-medium">{selected.code}</p></div>
            <div><span className="text-sm text-gray-500">Status:</span><div className="mt-1"><Badge variant={selected.status === 'active' ? 'success' : 'danger'}>{selected.status}</Badge></div></div>
            {(selected.address || selected.contactEmail || selected.contactPhone) && (
              <div>
                <span className="text-sm text-gray-500">Contact:</span>
                <div className="mt-1 space-y-1 text-sm">
                  {selected.address && <p>{selected.address}</p>}
                  {selected.contactEmail && <p>Email: {selected.contactEmail}</p>}
                  {selected.contactPhone && <p>Phone: {selected.contactPhone}</p>}
                </div>
              </div>
            )}
            {(selected.contactPersonName || selected.contactPersonEmail) && (
              <div>
                <span className="text-sm text-gray-500">Contact Person:</span>
                <div className="mt-1 space-y-1 text-sm">
                  <p>{selected.contactPersonName}</p>
                  {selected.contactPersonEmail && <p>Email: {selected.contactPersonEmail}</p>}
                  {selected.contactPersonPhone && <p>Phone: {selected.contactPersonPhone}</p>}
                </div>
              </div>
            )}
            {selected.bankName && (
              <div>
                <span className="text-sm text-gray-500">Bank Details:</span>
                <div className="mt-1 space-y-1 text-sm">
                  <p>Bank: {selected.bankName}</p>
                  <p>Account: {selected.accountName}</p>
                  <p>Number: {selected.accountNumber}</p>
                  <p>Sort Code: {selected.sortCode}{selected.bankCode ? ` / Bank Code: ${selected.bankCode}` : ''}</p>
                </div>
              </div>
            )}
            <div><span className="text-sm text-gray-500">Organizations:</span>
              <ul className="mt-1 space-y-1">
                {selected.organizations?.length ? selected.organizations.map((org) => (
                  <li key={org.id} className="text-sm text-gray-700 dark:text-gray-300">• {org.name}</li>
                )) : <p className="text-sm text-gray-400">None</p>}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!createdResult} onClose={() => setCreatedResult(null)} title="Organization Created">
        {createdResult && (
          <div className="space-y-4">
            <p className="text-sm text-green-600 font-medium">Apex organization created successfully!</p>
            <p className="text-sm text-gray-500">An email and SMS have been sent with the login details below. The password is temporary — the user must change it on first login.</p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
              <p><span className="text-gray-500">Org Code:</span> <strong>{createdResult.code}</strong></p>
              <p><span className="text-gray-500">BM Email:</span> <strong>{createdResult.email}</strong></p>
              <p><span className="text-gray-500">BM Password:</span> <strong>{createdResult.password}</strong></p>
            </div>
            <Button onClick={() => setCreatedResult(null)} className="w-full">Done</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

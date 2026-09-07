import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Modal } from '../../components/ui/modal'

interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  provider: string
  last4: string | null
  cardBrand: string | null
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
  isDefault: boolean
  createdAt: string
}

const cardBorders = [
  'border-indigo-500',
  'border-emerald-500',
  'border-blue-500',
  'border-amber-500',
  'border-fuchsia-500',
  'border-cyan-500',
]

export function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    type: 'card' as 'card' | 'bank',
    last4: '',
    cardBrand: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  })

  const load = () => api.get('/payment-methods').then((r) => setMethods(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const addMethod = async () => {
    try {
      await api.post('/payment-methods', {
        ...form,
        provider: form.type === 'card' ? 'paystack' : 'bank_transfer',
      })
      setShowModal(false)
      setForm({ type: 'card', last4: '', cardBrand: '', bankName: '', accountNumber: '', accountName: '' })
      load()
    } catch {}
  }

  const setDefault = async (id: string) => {
    try {
      await api.patch(`/payment-methods/${id}`, { isDefault: true })
      load()
    } catch {}
  }

  const remove = async (id: string) => {
    try {
      await api.delete(`/payment-methods/${id}`)
      load()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Payment Methods</h2>
        <Button onClick={() => setShowModal(true)}>Add Method</Button>
      </div>

      {methods.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">No payment methods saved</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m, idx) => (
            <Card key={m.id} className={cardBorders[idx % cardBorders.length]}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {m.type === 'card' ? `${m.cardBrand || 'Card'} ending in ${m.last4}` : m.bankName || 'Bank Account'}
                    </span>
                    {m.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  {m.type === 'bank' && m.accountName && (
                    <p className="text-sm text-gray-500 mt-1">
                      {m.accountName} · {m.accountNumber}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Added {new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!m.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => setDefault(m.id)}>Set Default</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => remove(m.id)}>Remove</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Payment Method">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'card' | 'bank' })}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="card">Card</option>
              <option value="bank">Bank Account</option>
            </select>
          </div>

          {form.type === 'card' ? (
            <>
              <Input label="Last 4 digits" maxLength={4} value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value })} />
              <Input label="Card Brand (e.g., Visa, Mastercard)" value={form.cardBrand} onChange={(e) => setForm({ ...form, cardBrand: e.target.value })} />
            </>
          ) : (
            <>
              <Input label="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
              <Input label="Account Number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
              <Input label="Account Name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
            </>
          )}

          <Button className="w-full" onClick={addMethod}>Save Method</Button>
        </div>
      </Modal>
    </div>
  )
}

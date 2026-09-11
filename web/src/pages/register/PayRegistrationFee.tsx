import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'
import { DesignCredit } from '../../components/layout/DesignCredit'

export function PayRegistrationFee() {
  const location = useLocation()
  const navigate = useNavigate()
  const [fee, setFee] = useState(location.state?.feeAmount as number | null)
  const [pendingUserId] = useState(location.state?.pendingUserId as string | undefined)
  const [loading, setLoading] = useState(false)
  const [paid] = useState(false)

  useEffect(() => {
    if (!fee) {
      api.get('/settings/registration_fee').then((r) => setFee(r.data.value ? Number(r.data.value) : 0))
    }
  }, [fee])

  const handlePay = async () => {
    setLoading(true)
    try {
      const payload = pendingUserId
        ? { userId: pendingUserId, amount: fee, callbackUrl: `${window.location.origin}/register/payment-callback` }
        : { amount: fee, purpose: 'registration', callbackUrl: `${window.location.origin}/register/payment-callback` }
      const endpoint = pendingUserId ? '/payments/initiate-registration' : '/payments/initiate'
      const { data } = await api.post(endpoint, payload)
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      }
    } catch {
      alert('Failed to initiate payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (paid) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="w-full max-w-sm text-center">
          <CardTitle className="text-green-600">Fee Paid</CardTitle>
          <p className="mt-4 text-gray-500">Your registration fee has been paid. You can now log in.</p>
          <Button className="mt-6" onClick={() => navigate('/login', { replace: true })}>
            Go to Login
          </Button>
        </Card>
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
          <DesignCredit />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-center dark:text-gray-100">Registration Fee</h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Pay your one-time membership fee to activate your account and access BNPL services
        </p>

        <div className="text-center mb-6">
          <span className="text-4xl font-bold text-blue-600">
            ₦{(fee ?? 0).toLocaleString()}
          </span>
        </div>

        <div className="space-y-3">
          <Button onClick={handlePay} disabled={loading || !fee} className="w-full">
            {loading ? 'Redirecting to payment...' : `Pay ₦${(fee ?? 0).toLocaleString()}`}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/login', { replace: true })} className="w-full">
            Cancel Registration
          </Button>
        </div>
      </Card>
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
        <DesignCredit />
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'paid' | 'failed'>('verifying')

  useEffect(() => {
    const ref = searchParams.get('reference')
    if (!ref) {
      setStatus('failed')
      return
    }

    api.get(`/payments/verify/${ref}`)
      .then(() => setStatus('paid'))
      .catch(() => {
        const trxref = searchParams.get('trxref')
        if (trxref) {
          api.get(`/payments/verify/${trxref}`)
            .then(() => setStatus('paid'))
            .catch(() => setStatus('failed'))
        } else {
          setStatus('failed')
        }
      })
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-sm text-center">
        {status === 'verifying' && (
          <>
            <CardTitle>Verifying payment...</CardTitle>
            <p className="mt-4 text-gray-500">Please wait while we confirm your payment with Paystack.</p>
          </>
        )}
        {status === 'paid' && (
          <>
            <CardTitle className="text-green-600">Payment Successful</CardTitle>
            <p className="mt-4 text-gray-500">Your registration fee has been paid. You can now log in.</p>
            <Button className="mt-6" onClick={() => navigate('/login', { replace: true })}>
              Go to Login
            </Button>
          </>
        )}
        {status === 'failed' && (
          <>
            <CardTitle className="text-red-600">Payment Failed</CardTitle>
            <p className="mt-4 text-gray-500">Something went wrong. Please try again.</p>
            <Button className="mt-6" onClick={() => navigate('/register/pay-fee', { replace: true })}>
              Try Again
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DesignCredit } from '../../components/layout/DesignCredit'
import { api } from '../../api/client'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Something went wrong. Try again.')
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="w-full max-w-sm text-center">
          <h1 className="mb-4 text-2xl font-bold dark:text-gray-100">Check your email</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            If an account exists for {email}, a reset code has been sent.
          </p>
          <Link to="/reset-password" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            Enter reset code
          </Link>
          <p className="mt-4 text-sm">
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to sign in</Link>
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-center dark:text-gray-100">Forgot password</h1>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Enter your email and we'll send you a reset code.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">Send reset code</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to sign in</Link>
        </p>
      </Card>
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
        <DesignCredit />
      </div>
    </div>
  )
}

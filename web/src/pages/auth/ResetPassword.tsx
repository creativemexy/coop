import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DesignCredit } from '../../components/layout/DesignCredit'
import { api } from '../../api/client'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'

export function ResetPassword() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/reset-password', { email, token, newPassword })
      setDone(true)
    } catch {
      setError('Invalid or expired reset code')
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="w-full max-w-sm text-center">
          <h1 className="mb-4 text-2xl font-bold dark:text-gray-100 text-green-600">Password reset</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Your password has been changed successfully.</p>
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Sign in with new password</Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold text-center dark:text-gray-100">Reset password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input id="token" label="Reset code" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="e.g. A1B2C3" />
          <div className="relative">
            <Input id="newPassword" label="New password" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer text-sm">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">Reset password</Button>
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

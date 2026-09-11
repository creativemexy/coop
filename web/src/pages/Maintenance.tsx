import { Link } from 'react-router-dom'
import { useAuth } from '../stores/auth.store'
import { DesignCredit } from '../components/layout/DesignCredit'

export function Maintenance() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <svg className="w-16 h-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-7.5-7.5a2.25 2.25 0 0 1 0-3.18l1.06-1.06a2.25 2.25 0 0 1 3.18 0l7.5 7.5m-4.24 4.24l-4.24 4.24m2.12-8.48l4.24 4.24m-4.24-4.24l1.06-1.06a2.25 2.25 0 0 1 3.18 0l1.06 1.06" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">Under Maintenance</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          The platform is currently undergoing scheduled maintenance.
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          Your savings and investments remain secure and protected. We are working to restore full access as soon as possible.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Return to Login
          </Link>
          {user?.role === 'super_admin' && <Link
            to="/super-admin"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Super Admin Dashboard
          </Link>}
        </div>
        <DesignCredit className="mt-10 text-center" />
      </div>
    </div>
  )
}

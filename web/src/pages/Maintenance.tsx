export function Maintenance() {
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
          Your savings balance and deposits are still available. Other services will be back shortly.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/individual/savings"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Savings
          </a>
        </div>
      </div>
    </div>
  )
}

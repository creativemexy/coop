import { useState } from 'react'
import { FeatureFlags } from './FeatureFlags'

const tabs = ['Feature Flags', 'Release History']

type Tab = (typeof tabs)[number]

export function Releases() {
  const [activeTab, setActiveTab] = useState<Tab>('Feature Flags')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Releases</h2>
      <div className="flex gap-1 border-b dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 'Feature Flags' && <FeatureFlags />}
      {activeTab === 'Release History' && <ReleaseHistory />}
    </div>
  )
}

function ReleaseHistory() {
  const releases = [
    { version: 'v2.4.0', date: '2026-07-20', status: 'live' as const, features: ['New checkout flow', 'KYC v2', 'Risk engine upgrade'], author: 'platform-team' },
    { version: 'v2.3.1', date: '2026-07-15', status: 'live' as const, features: ['Bug fix: repayment retry', 'Performance improvements'], author: 'platform-team' },
    { version: 'v2.3.0', date: '2026-07-10', status: 'rolled_back' as const, features: ['Scheduling engine v2'], author: 'platform-team', rollbackReason: 'Payment reconciliation mismatch' },
    { version: 'v2.2.0', date: '2026-07-01', status: 'live' as const, features: ['Multi-tenant webhooks', 'Audit log v2'], author: 'platform-team' },
  ]

  return (
    <div className="space-y-4">
      {releases.map((r) => (
        <div key={r.version} className="border rounded-lg p-4 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold dark:text-gray-100">{r.version}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                r.status === 'live' ? 'bg-green-100 text-green-700' :
                r.status === 'rolled_back' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>{r.status.replace('_', ' ')}</span>
              <span className="text-xs text-gray-400">{r.date}</span>
            </div>
            <span className="text-xs text-gray-400">{r.author}</span>
          </div>
          <ul className="mt-2 space-y-1">
            {r.features.map((f, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {f}
              </li>
            ))}
          </ul>
          {r.rollbackReason && (
            <p className="mt-2 text-xs text-red-500">Rollback reason: {r.rollbackReason}</p>
          )}
          <div className="mt-3 flex gap-2">
            {r.status === 'live' && (
              <button className="text-xs text-red-600 hover:underline cursor-pointer">Rollback</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

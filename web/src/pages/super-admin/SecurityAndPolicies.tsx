import { useState } from 'react'
import { PolicyGovernance } from './PolicyGovernance'
import { SecurityConfig } from './SecurityConfig'
import { Secrets } from './Secrets'

const tabs = ['Policy Governance', 'Security Config', 'Secrets']

type Tab = (typeof tabs)[number]

export function SecurityAndPolicies() {
  const [activeTab, setActiveTab] = useState<Tab>('Policy Governance')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Security & Policies</h2>
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
      {activeTab === 'Policy Governance' && <PolicyGovernance />}
      {activeTab === 'Security Config' && <SecurityConfig />}
      {activeTab === 'Secrets' && <Secrets />}
    </div>
  )
}

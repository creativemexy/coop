import { useState } from 'react'
import { Building2, ListChecks } from 'lucide-react'
import { Organizations } from './Organizations'
import { TenantOnboarding } from './TenantOnboarding'

const tabs = [
  { key: 'list', label: 'Tenant List', icon: Building2 },
  { key: 'onboarding', label: 'Onboarding Requests', icon: ListChecks },
] as const

type TabKey = (typeof tabs)[number]['key']

export function Tenants() {
  const [activeTab, setActiveTab] = useState<TabKey>('list')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <Building2 size={22} className="text-[#176B5B]" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Tenants</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Manage member organizations and their onboarding lifecycle.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#EDE2D3] pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm'
                  : 'text-[#6B5245] hover:bg-[#EDE2D3]'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'list' && <Organizations />}
      {activeTab === 'onboarding' && <TenantOnboarding />}
    </div>
  )
}
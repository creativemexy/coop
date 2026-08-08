import { useState, useRef, useEffect } from 'react'
import { useBranding } from '../../stores/branding.store'
import { Card, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

const PRESETS = [
  { label: 'Blue (default)', primary: '#2563eb', accent: '#7c3aed' },
  { label: 'Emerald', primary: '#059669', accent: '#d97706' },
  { label: 'Indigo', primary: '#4f46e5', accent: '#db2777' },
  { label: 'Orange', primary: '#ea580c', accent: '#0284c7' },
  { label: 'Teal', primary: '#0d9488', accent: '#9333ea' },
  { label: 'Rose', primary: '#e11d48', accent: '#0891b2' },
]

export function Branding() {
  const { branding, setName, uploadLogo, setColors } = useBranding()
  const [name, setName_] = useState(branding.organizationName)
  const [primary, setPrimary] = useState(branding.primaryColor)
  const [accent, setAccent] = useState(branding.accentColor)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName_(branding.organizationName)
    setPrimary(branding.primaryColor)
    setAccent(branding.accentColor)
  }, [branding.organizationName, branding.primaryColor, branding.accentColor])

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    try {
      await uploadLogo(file)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to upload logo')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Branding</h2>

      <Card className="max-w-lg">
        <CardTitle>Organization Name</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          This name appears in the sidebar and throughout the platform.
        </p>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <Input label="Platform Name" value={name} onChange={(e) => setName_(e.target.value)} />
          </div>
          <Button onClick={async () => { await setName(name) }}>Save</Button>
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardTitle>Logo</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          Upload a logo (PNG, JPG, SVG, WebP, max 2MB). It will replace the initial in the sidebar.
        </p>
        <div className="mt-4 space-y-4">
          {branding.logoUrl && (
            <div className="flex items-center gap-3">
              <img src={branding.logoUrl} alt="Current logo" className="h-16 w-16 rounded-lg object-contain border" />
              <span className="text-sm text-gray-500">Current logo</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="block text-sm" />
          <Button onClick={handleUpload} disabled={!fileRef.current?.files?.[0]}>Upload Logo</Button>
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardTitle>Brand Colors</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          Choose a primary color (sidebar, buttons, links) and an accent color (highlights, badges).
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => { setPrimary(p.primary); setAccent(p.accent) }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium hover:shadow transition-shadow"
              style={{ borderColor: p.primary, color: p.primary }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primary }} />
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Primary</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border" />
              <input type="text" value={primary} onChange={(e) => setPrimary(e.target.value)}
                className="flex-1 border rounded px-2 py-1.5 text-sm font-mono dark:bg-gray-800 dark:border-gray-700" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Accent</label>
            <div className="flex items-center gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border" />
              <input type="text" value={accent} onChange={(e) => setAccent(e.target.value)}
                className="flex-1 border rounded px-2 py-1.5 text-sm font-mono dark:bg-gray-800 dark:border-gray-700" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button onClick={async () => { await setColors(primary, accent) }}>
            Save Colors
          </Button>
          <Button variant="ghost" onClick={() => { setPrimary(branding.primaryColor); setAccent(branding.accentColor) }}>
            Reset
          </Button>
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardTitle>Preview</CardTitle>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.organizationName} className="h-10 w-10 rounded object-contain" />
            ) : (
              <div className="h-10 w-10 rounded flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: primary }}>
                {branding.organizationName.charAt(0)}
              </div>
            )}
            <span className="font-bold text-lg" style={{ color: primary }}>{branding.organizationName}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: primary }}>Primary Button</button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: primary, color: primary }}>Outline</button>
            <span className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: accent }}>Badge</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

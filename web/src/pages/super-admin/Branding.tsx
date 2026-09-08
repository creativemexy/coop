import { useState, useRef, useEffect } from 'react'
import { useBranding } from '../../stores/branding.store'
import { Card, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Palette,
  Type,
  Image as ImageIcon,
  Eye,
  Save,
  CheckCircle2,
  RotateCcw,
  Upload,
  Building2,
  Paintbrush,
  Sparkles,
} from 'lucide-react'

const PRESETS = [
  { label: 'Blue', primary: '#2563eb', accent: '#7c3aed' },
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
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName_(branding.organizationName)
    setPrimary(branding.primaryColor)
    setAccent(branding.accentColor)
  }, [branding.organizationName, branding.primaryColor, branding.accentColor])

  const flashSaved = (key: string) => {
    setSavedKey(key)
    setTimeout(() => setSavedKey((prev) => (prev === key ? null : prev)), 2000)
  }

  const handleUpload = async () => {
    const file = selectedFile
    if (!file) return
    setUploading(true)
    try {
      await uploadLogo(file)
      flashSaved('logo')
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const SaveButton = ({ onClick, section }: { onClick: () => void; section: string }) => (
    <Button onClick={onClick} disabled={uploading}>
      {uploading && section === 'logo' ? (
        'Uploading...'
      ) : savedKey === section ? (
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 size={16} /> Saved
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Save size={16} /> Save
        </span>
      )}
    </Button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-gray-100">Branding</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Customize the platform identity — name, logo, and colors shown across the entire app.
          </p>
        </div>
        <span className="hidden sm:flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
          <Sparkles size={14} /> Live Preview
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/40">
                <Type size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Organization Name</CardTitle>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Appears in the sidebar and throughout the platform.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Platform Name"
                  value={name}
                  onChange={(e) => setName_(e.target.value)}
                  placeholder="e.g. Coop BNPL"
                />
              </div>
              <SaveButton
                section="name"
                onClick={async () => {
                  await setName(name)
                  flashSaved('name')
                }}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/40">
                <ImageIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>Logo</CardTitle>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Upload a logo (PNG, JPG, SVG, WebP, max 2MB).
                </p>
              </div>
            </div>

            <div className="mt-5">
              {branding.logoUrl && (
                <div className="mb-4 flex items-center gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                  <img
                    src={branding.logoUrl}
                    alt="Current logo"
                    className="h-16 w-16 rounded-lg border bg-white object-contain dark:border-gray-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Current logo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Used in the sidebar, login, and landing pages.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 p-4 transition-colors hover:border-emerald-500 dark:border-gray-600">
                  <Upload size={18} className="shrink-0 text-gray-400" />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                  <span className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {selectedFile?.name || 'Choose an image or drag it here'}
                  </span>
                </label>
                <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                  <span className="inline-flex items-center gap-1.5">
                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
                  </span>
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/40">
                <Palette size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Brand Colors</CardTitle>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Primary color drives the sidebar, buttons, and links; accent colors highlights and badges.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active = primary === p.primary
                return (
                  <button
                    key={p.label}
                    onClick={() => { setPrimary(p.primary); setAccent(p.accent) }}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800 shadow-sm'
                        : 'hover:shadow'
                    }`}
                    style={{ borderColor: p.primary, color: p.primary, ['--tw-ring-color' as string]: p.primary }}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.primary }} />
                    {p.label}
                    {active && <CheckCircle2 size={13} />}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border dark:border-gray-600" />
                  <input type="text" value={primary} onChange={(e) => setPrimary(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 font-mono text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Accent</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border dark:border-gray-600" />
                  <input type="text" value={accent} onChange={(e) => setAccent(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 font-mono text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <SaveButton
                section="colors"
                onClick={async () => {
                  await setColors(primary, accent)
                  flashSaved('colors')
                }}
              />
              <Button
                variant="ghost"
                onClick={() => { setPrimary(branding.primaryColor); setAccent(branding.accentColor) }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <RotateCcw size={15} /> Reset
                </span>
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/40">
                <Eye size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle>Preview</CardTitle>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  See how your branding looks across the platform.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border p-4 dark:border-gray-700">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt={branding.organizationName} className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: primary }}>
                      {branding.organizationName.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-lg font-bold dark:text-gray-100" style={{ color: primary }}>
                  {name || branding.organizationName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: primary }}>
                  Primary Button
                </button>
                <button className="rounded-lg border px-4 py-2 text-sm font-medium"
                  style={{ borderColor: primary, color: primary }}>
                  Outline
                </button>
                <span className="rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: accent }}>
                  Badge
                </span>
              </div>

              <div className="rounded-xl border p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {name || branding.organizationName}
                    </span>
                  </div>
                  <Badge>Member Portal</Badge>
                </div>
                <div className="mt-4 h-24 rounded-lg bg-gradient-to-br"
                  style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }} />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-2" style={{ backgroundColor: `${primary}18` }}>
                    <p className="text-xs font-medium" style={{ color: primary }}>Savings</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ backgroundColor: `${accent}18` }}>
                    <p className="text-xs font-medium" style={{ color: accent }}>Loans</p>
                  </div>
                  <div className="rounded-lg p-2 bg-gray-100 dark:bg-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Invest</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <Paintbrush size={15} className="text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Colors apply instantly to the sidebar, buttons, and links after saving.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

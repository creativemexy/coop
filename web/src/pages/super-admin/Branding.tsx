import { useState, useRef, useEffect } from 'react'
import { useBranding } from '../../stores/branding.store'
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

  const SaveButton = ({ onClick, section, uploadingSection }: { onClick: () => void; section: string; uploadingSection?: string }) => (
    <button
      onClick={onClick}
      disabled={uploading && uploadingSection === section}
      className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
    >
      {uploading && uploadingSection === section ? (
        'Uploading...'
      ) : savedKey === section ? (
        <>
          <CheckCircle2 size={16} /> Saved
        </>
      ) : (
        <>
          <Save size={16} /> Save
        </>
      )}
    </button>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Branding</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5245]">
            Customize the platform identity — name, logo, and colors shown across the entire app.
          </p>
        </div>
        <span className="hidden sm:flex items-center gap-2 rounded-full border border-[#E4A42A] bg-[#E4A42A]/10 px-4 py-2 text-xs font-semibold text-[#E4A42A]">
          <Sparkles size={14} /> Live Preview
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Organization Name */}
          <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#176B5B]/10">
                <Type size={22} className="text-[#176B5B]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2C1B13]">Organization Name</h2>
                <p className="mt-1 text-sm text-[#6B5245]">
                  Appears in the sidebar and throughout the platform.
                </p>
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">Platform Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName_(e.target.value)}
                  placeholder="e.g. Coop BNPL"
                  className="w-full rounded-xl border border-[#D8C9A9] bg-white px-4 py-2.5 text-sm text-[#2C1B13] placeholder-[#6B5245]/50 focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
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
          </div>

          {/* Logo */}
          <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#176B5B]/10">
                <ImageIcon size={22} className="text-[#176B5B]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2C1B13]">Logo</h2>
                <p className="mt-1 text-sm text-[#6B5245]">
                  Upload a logo (PNG, JPG, SVG, WebP, max 2MB).
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {branding.logoUrl && (
                <div className="flex items-center gap-4 rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                  <img
                    src={branding.logoUrl}
                    alt="Current logo"
                    className="h-16 w-16 rounded-xl border border-[#D8C9A9] bg-white object-contain"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#2C1B13]">Current logo</p>
                    <p className="text-xs text-[#6B5245]">
                      Used in the sidebar, login, and landing pages.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#D8C9A9] p-4 transition-colors hover:border-[#176B5B] hover:bg-[#FFF9EF]/50">
                  <Upload size={18} className="shrink-0 text-[#6B5245]" />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                  <span className="truncate text-sm text-[#6B5245]">
                    {selectedFile?.name || 'Choose an image or drag it here'}
                  </span>
                </label>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
                >
                  <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E4A42A]/10">
                <Palette size={22} className="text-[#E4A42A]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2C1B13]">Brand Colors</h2>
                <p className="mt-1 text-sm text-[#6B5245]">
                  Primary color drives the sidebar, buttons, and links; accent colors highlights and badges.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {PRESETS.map((p) => {
                const active = primary === p.primary
                return (
                  <button
                    key={p.label}
                    onClick={() => { setPrimary(p.primary); setAccent(p.accent) }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? 'ring-2 ring-offset-1 shadow-sm'
                        : 'hover:shadow-sm'
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">Primary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-xl border border-[#D8C9A9]"
                  />
                  <input
                    type="text"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="flex-1 rounded-xl border border-[#D8C9A9] bg-white px-3 py-2 font-mono text-sm text-[#2C1B13] focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-xl border border-[#D8C9A9]"
                  />
                  <input
                    type="text"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="flex-1 rounded-xl border border-[#D8C9A9] bg-white px-3 py-2 font-mono text-sm text-[#2C1B13] focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <SaveButton
                section="colors"
                uploadingSection="colors"
                onClick={async () => {
                  await setColors(primary, accent)
                  flashSaved('colors')
                }}
              />
              <button
                onClick={() => { setPrimary(branding.primaryColor); setAccent(branding.accentColor) }}
                className="inline-flex items-center gap-2 rounded-full border border-[#D8C9A9] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition-colors hover:bg-[#EDE2D3]"
              >
                <RotateCcw size={15} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E4A42A]/10">
                <Eye size={22} className="text-[#E4A42A]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2C1B13]">Preview</h2>
                <p className="mt-1 text-sm text-[#6B5245]">
                  See how your branding looks across the platform.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Sidebar Preview */}
              <div className="flex items-center gap-3 rounded-xl border border-[#EDE2D3] p-4">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt={branding.organizationName} className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: primary }}>
                      {branding.organizationName.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-lg font-bold" style={{ color: primary }}>
                  {name || branding.organizationName}
                </span>
              </div>

              {/* Buttons Preview */}
              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: primary }}>
                  Primary Button
                </button>
                <button className="rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: primary, color: primary }}>
                  Outline
                </button>
                <span className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: accent }}>
                  Badge
                </span>
              </div>

              {/* Card Preview */}
              <div className="rounded-xl border border-[#EDE2D3] p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-[#6B5245]" />
                    <span className="text-sm font-semibold text-[#2C1B13]">
                      {name || branding.organizationName}
                    </span>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>
                    Member Portal
                  </span>
                </div>
                <div className="h-24 rounded-xl bg-gradient-to-br"
                  style={{ background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)` }} />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl p-2" style={{ backgroundColor: `${primary}18` }}>
                    <p className="text-xs font-semibold" style={{ color: primary }}>Savings</p>
                  </div>
                  <div className="rounded-xl p-2" style={{ backgroundColor: `${accent}18` }}>
                    <p className="text-xs font-semibold" style={{ color: accent }}>Loans</p>
                  </div>
                  <div className="rounded-xl p-2 bg-[#EDE2D3]">
                    <p className="text-xs font-semibold text-[#6B5245]">Invest</p>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="flex items-center gap-2 rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                <Paintbrush size={15} className="text-[#6B5245]" />
                <p className="text-xs text-[#6B5245]">
                  Colors apply instantly to the sidebar, buttons, and links after saving.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

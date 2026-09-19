import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import {
  Database, HardDrive, Download, Trash2, RefreshCw, Upload, Save,
  Settings2, AlertTriangle, CheckCircle2, Shield
} from 'lucide-react'

interface Backup {
  filename: string
  size: number
  createdAt: string
}

export function SystemConfiguration() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [backupMsg, setBackupMsg] = useState('')
  const [backups, setBackups] = useState<Backup[]>([])
  const [restoring, setRestoring] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [savedKey, setSavedKey] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/super/system-config').then(r => setConfig(r.data))
  }, [])

  const loadBackups = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/super/backups')
      setBackups(data)
    } catch { setBackups([]) }
  }, [])

  useEffect(() => { loadBackups() }, [loadBackups])

  const flashSaved = (key: string) => {
    setSavedKey(key)
    setTimeout(() => setSavedKey((prev) => (prev === key ? null : prev)), 2000)
  }

  const save = async () => {
    await api.patch('/admin/super/system-config', config)
    flashSaved('settings')
  }

  const triggerBackup = async () => {
    const { data } = await api.post('/admin/super/backup')
    setBackupMsg(data.message + ' (' + formatSize(data.size) + ')')
    loadBackups()
  }

  const handleRestore = async (filename: string) => {
    if (!window.confirm(`Restore database from ${filename}?\nThis will overwrite all current data.`)) return
    setRestoring(filename)
    try {
      const { data } = await api.post(`/admin/super/backups/${filename}/restore`)
      alert(data.message)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Restore failed')
    }
    setRestoring(null)
  }

  const handleUpload = async (restoreAfter = false) => {
    if (!uploadFile) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', uploadFile)
      const { data } = await api.post('/admin/super/backups/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadFile(null)
      loadBackups()
      if (restoreAfter) {
        if (!window.confirm(`Restore database from uploaded file?\nThis will overwrite all current data.`)) return
        setRestoring(data.filename)
        await api.post(`/admin/super/backups/${data.filename}/restore`)
        alert('Restore completed')
        setRestoring(null)
      }
      setBackupMsg('Uploaded: ' + data.filename)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Upload failed')
    }
    setUploading(false)
  }

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Delete backup ${filename}?`)) return
    try {
      await api.delete(`/admin/super/backups/${filename}`)
      loadBackups()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Delete failed')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  const fields = [
    { key: 'platform_name', label: 'Platform Name' },
    { key: 'support_email', label: 'Support Email' },
    { key: 'support_phone', label: 'Support Phone' },
    { key: 'backup_enabled', label: 'Backup Enabled (true/false)' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">System Configuration</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5245]">
            Configure platform settings and manage database backups.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Settings */}
        <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#176B5B]/10">
              <Settings2 size={22} className="text-[#176B5B]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2C1B13]">Platform Settings</h2>
              <p className="mt-1 text-sm text-[#6B5245]">
                Configure basic platform information and maintenance mode.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">{f.label}</label>
                <input
                  className="w-full rounded-xl border border-[#D8C9A9] bg-white px-4 py-2.5 text-sm text-[#2C1B13] placeholder-[#6B5245]/50 focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
                  value={config[f.key] || ''}
                  onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[#EDE2D3] pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only peer"
                  checked={config['maintenance_mode'] === 'true'}
                  onChange={(e) => setConfig(c => ({ ...c, maintenance_mode: e.target.checked ? 'true' : 'false' }))}
                />
                <div className="w-11 h-6 bg-[#D8C9A9] rounded-full peer-checked:bg-[#C85B23] transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
              </div>
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#6B5245]" />
                <span className="text-sm font-medium text-[#2C1B13]">Maintenance Mode</span>
              </div>
            </label>
            <p className="ml-14 text-xs text-[#6B5245] mt-1">
              Blocks all non-admin access except savings
            </p>
          </div>

          <button
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a]"
            onClick={save}
          >
            {savedKey === 'settings' ? (
              <>
                <CheckCircle2 size={16} /> Saved
              </>
            ) : (
              <>
                <Save size={16} /> Save Settings
              </>
            )}
          </button>
        </div>

        {/* Database Backup */}
        <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E4A42A]/10">
              <Database size={22} className="text-[#E4A42A]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2C1B13]">Database Backup</h2>
              <p className="mt-1 text-sm text-[#6B5245]">
                Trigger on-demand backups or upload existing backup files.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={triggerBackup}
              className="inline-flex items-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2 text-sm font-semibold text-[#23150F] transition duration-200 hover:bg-[#F2B63B]"
            >
              <RefreshCw size={16} /> Trigger Backup
            </button>
            {backupMsg && (
              <span className="inline-flex items-center gap-1.5 text-sm text-[#176B5B]">
                <CheckCircle2 size={16} /> {backupMsg}
              </span>
            )}
          </div>

          <div className="border-t border-[#EDE2D3] pt-6">
            <h3 className="text-sm font-bold text-[#2C1B13] mb-4">Upload Backup File</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-xl border-2 border-dashed border-[#D8C9A9] p-4 transition-colors hover:border-[#176B5B] hover:bg-[#FFF9EF]/50 cursor-pointer">
                <Upload size={18} className="shrink-0 text-[#6B5245]" />
                <input
                  type="file"
                  accept=".sql,.sql.gz"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <span className="text-sm text-[#6B5245]">
                  {uploadFile?.name || 'Choose a .sql or .sql.gz file'}
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpload()}
                  disabled={!uploadFile || uploading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
                >
                  <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => handleUpload(true)}
                  disabled={!uploadFile || uploading}
                  className="inline-flex items-center gap-2 rounded-full border border-[#C85B23] bg-[#C85B23]/10 px-4 py-2 text-sm font-semibold text-[#C85B23] transition-colors hover:bg-[#C85B23]/20 disabled:opacity-70 disabled:pointer-events-none"
                >
                  <RefreshCw size={16} /> Upload & Restore
                </button>
              </div>
            </div>
          </div>

          {backups.length > 0 && (
            <div className="mt-6 border-t border-[#EDE2D3] pt-6">
              <h3 className="text-sm font-bold text-[#2C1B13] mb-4">Available Backups</h3>
              <div className="space-y-2">
                {backups.map(b => (
                  <div key={b.filename} className="flex items-center justify-between rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <HardDrive size={18} className="text-[#6B5245] shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs text-[#2C1B13]">{b.filename}</p>
                        <p className="text-xs text-[#6B5245] mt-0.5">{formatSize(b.size)} · {new Date(b.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-2">
                      <a
                        href={`/api/v1/admin/super/backups/${b.filename}/download`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B]/10 px-3 py-1.5 text-xs font-semibold text-[#176B5B] hover:bg-[#176B5B]/20 transition-colors"
                        download
                      >
                        <Download size={14} /> Download
                      </a>
                      <button
                        onClick={() => handleDelete(b.filename)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#C85B23]/10 px-3 py-1.5 text-xs font-semibold text-[#C85B23] hover:bg-[#C85B23]/20 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                      <button
                        onClick={() => handleRestore(b.filename)}
                        disabled={restoring === b.filename}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B] px-3 py-1.5 text-xs font-semibold text-[#FFF9EF] hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
                      >
                        <RefreshCw size={14} /> {restoring === b.filename ? 'Restoring...' : 'Restore'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {backups.length === 0 && (
            <div className="mt-6 border-t border-[#EDE2D3] pt-6">
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-[#D8C9A9] bg-[#FFF9EF]/50">
                <Database size={32} className="text-[#6B5245] mb-3" />
                <p className="text-sm text-[#6B5245]">No backups available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      <div className="rounded-2xl border border-[#C85B23]/30 bg-[#C85B23]/10 p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-[#C85B23] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#C85B23]">Important Safety Notice</p>
          <p className="text-xs text-[#C85B23]/80 mt-1">
            Database restore operations will overwrite all current data. Always create a backup before restoring from an external file.
          </p>
        </div>
      </div>
    </div>
  )
}

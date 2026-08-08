import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'

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

  const save = async () => {
    await api.patch('/admin/super/system-config', config)
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Backup & System Configuration</h1>

      <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-6 max-w-xl">
        <h2 className="font-semibold mb-4">Platform Settings</h2>
        <div className="space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                value={config[f.key] || ''}
                onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 border-t dark:border-gray-700 pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only peer"
                checked={config['maintenance_mode'] === 'true'}
                onChange={(e) => setConfig(c => ({ ...c, maintenance_mode: e.target.checked ? 'true' : 'false' }))}
              />
              <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-red-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
            </div>
            <span className="text-sm font-medium dark:text-gray-200">Maintenance Mode (blocks all non-admin access except savings)</span>
          </label>
        </div>

        <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={save}>Save Settings</button>
      </div>

      <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-6 max-w-xl">
        <h2 className="font-semibold mb-4">Database Backup</h2>
        <p className="text-sm text-gray-500 mb-4">Trigger an on-demand database backup or upload a .sql.gz file.</p>
        <div className="flex gap-2 items-center">
          <button className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm" onClick={triggerBackup}>Trigger Backup</button>
          {backupMsg && <span className="text-sm text-green-600">{backupMsg}</span>}
        </div>

        <div className="mt-4 border-t dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold mb-2 dark:text-gray-200">Upload Backup File</h3>
          <div className="flex gap-2 items-center">
            <input type="file" accept=".sql,.sql.gz"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white dark:file:bg-blue-500"
            />
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              onClick={() => handleUpload()} disabled={!uploadFile || uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-sm disabled:opacity-50"
              onClick={() => handleUpload(true)} disabled={!uploadFile || uploading}>
              Upload &amp; Restore
            </button>
          </div>
        </div>

        {backups.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Available Backups</h3>
            <div className="space-y-2">
              {backups.map(b => (
                <div key={b.filename} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-mono text-xs">{b.filename}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatSize(b.size)} &middot; {new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <a href={`/api/v1/admin/super/backups/${b.filename}/download`}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                      download>Download</a>
                    <button className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                      onClick={() => handleDelete(b.filename)}>Delete</button>
                    <button className="px-2 py-1 bg-green-700 text-white rounded text-xs"
                      onClick={() => handleRestore(b.filename)} disabled={restoring === b.filename}>
                      {restoring === b.filename ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

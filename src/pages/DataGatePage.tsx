import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  api,
  ApiError,
  type DatagateImportResponse,
  type DatagateIntegration,
  type DatagatePreview,
  type Project,
} from '../api/client'
import { canManageCatalog } from '../auth/roles'
import { useAuth } from '../auth/useAuth'
import { AdminLayout } from '../components/AdminLayout'
import './admin.css'

type Step = 'credentials' | 'preview' | 'result'

const defaultCreds = {
  base_url: 'https://api.datagateapp.com',
  client_id: '',
  client_secret: '',
  monitor_cn_prefix: 'statusgate',
  is_enabled: true,
}

export function DataGatePage() {
  const { account } = useAuth()
  const canEdit = canManageCatalog(account)

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState('')
  const [step, setStep] = useState<Step>('credentials')
  const [form, setForm] = useState(defaultCreds)
  const [secretSet, setSecretSet] = useState(false)
  const [preview, setPreview] = useState<DatagatePreview | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [syncNames, setSyncNames] = useState(true)
  const [refreshConfigs, setRefreshConfigs] = useState(true)
  const [importNew, setImportNew] = useState(true)
  const [result, setResult] = useState<DatagateImportResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api.listProjects().then((r) => {
      setProjects(r.items)
      if (r.items[0] && !projectId) setProjectId(r.items[0].id)
    })
  }, [])

  useEffect(() => {
    if (!projectId) return
    setError(null)
    setMessage(null)
    setPreview(null)
    setResult(null)
    setStep('credentials')
    void api
      .getDatagateIntegration(projectId)
      .then((integration) => {
        if (!integration) {
          setForm(defaultCreds)
          setSecretSet(false)
          return
        }
        applyIntegration(integration)
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load integration')
      })
  }, [projectId])

  const applyIntegration = (integration: DatagateIntegration) => {
    setForm({
      base_url: integration.base_url,
      client_id: integration.client_id,
      client_secret: '',
      monitor_cn_prefix: integration.monitor_cn_prefix,
      is_enabled: integration.is_enabled,
    })
    setSecretSet(integration.client_secret_set)
  }

  const allPreviewServerIds = useMemo(() => {
    if (!preview) return [] as number[]
    return [
      ...preview.matched.map((m) => m.server.id),
      ...preview.new_servers.map((s) => s.id),
    ]
  }, [preview])

  const onSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!projectId || !canEdit) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await api.upsertDatagateIntegration(projectId, {
        base_url: form.base_url,
        client_id: form.client_id,
        client_secret: form.client_secret || null,
        monitor_cn_prefix: form.monitor_cn_prefix,
        is_enabled: form.is_enabled,
      })
      applyIntegration(saved)
      setMessage('Integration saved.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const onTest = async () => {
    if (!projectId || !canEdit) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await api.testDatagateConnection(projectId)
      setMessage(res.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connection test failed')
    } finally {
      setBusy(false)
    }
  }

  const onPreview = async () => {
    if (!projectId) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await api.previewDatagateImport(projectId)
      setPreview(res)
      setSelectedIds(new Set([...res.matched.map((m) => m.server.id), ...res.new_servers.map((s) => s.id)]))
      setSyncNames(Boolean(res.matched.some((m) => m.name_differs)))
      setStep('preview')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Preview failed')
    } finally {
      setBusy(false)
    }
  }

  const toggleServer = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onImport = async () => {
    if (!projectId || !canEdit) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await api.importDatagateServers(projectId, {
        sync_names: syncNames,
        refresh_configs: refreshConfigs,
        import_new: importNew,
        server_ids: [...selectedIds],
      })
      setResult(res)
      setStep('result')
      setMessage(`Import finished: ${res.created} created, ${res.updated} updated, ${res.errors} errors.`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout
      title="DataGate"
      subtitle="Import VPN servers from DataGate Monitor into StatusGate services"
    >
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="panel">
        <h2>Project</h2>
        <label>
          Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
            <option value="" disabled>
              Select project…
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {step === 'credentials' && (
        <section className="panel">
          <h2>1. Credentials</h2>
          <p className="muted">
            Register an Application in{' '}
            <a href="https://dash.datagateapp.com/" target="_blank" rel="noreferrer">
              DataGate Monitor
            </a>{' '}
            and paste clientId / clientSecret. API base is usually{' '}
            <code>https://api.datagateapp.com</code>.
          </p>
          <form className="stack-form" onSubmit={onSave}>
            <label>
              Base URL
              <input
                value={form.base_url}
                onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                required
                disabled={!canEdit}
              />
            </label>
            <label>
              Client ID
              <input
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                required
                disabled={!canEdit}
              />
            </label>
            <label>
              Client secret {secretSet ? '(leave blank to keep current)' : ''}
              <input
                type="password"
                value={form.client_secret}
                onChange={(e) => setForm({ ...form, client_secret: e.target.value })}
                required={!secretSet}
                disabled={!canEdit}
                autoComplete="off"
              />
            </label>
            <label>
              Monitor CN prefix
              <input
                value={form.monitor_cn_prefix}
                onChange={(e) => setForm({ ...form, monitor_cn_prefix: e.target.value })}
                required
                disabled={!canEdit}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.is_enabled}
                onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                disabled={!canEdit}
              />
              Enabled
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {canEdit && (
                <button type="submit" className="btn btn-primary" disabled={busy || !projectId}>
                  Save
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void onTest()}
                  disabled={busy || !projectId}
                >
                  Test connection
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void onPreview()}
                disabled={busy || !projectId || !secretSet}
              >
                Preview import
              </button>
            </div>
          </form>
        </section>
      )}

      {step === 'preview' && preview && (
        <section className="panel">
          <h2>2. Preview</h2>
          {preview.sync_names_question && <p>{preview.sync_names_question}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep('credentials')} disabled={busy}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedIds(new Set(allPreviewServerIds))}
              disabled={busy}
            >
              Select all
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedIds(new Set())}
              disabled={busy}
            >
              Clear
            </button>
          </div>

          <h3>Matched ({preview.matched.length})</h3>
          {preview.matched.length === 0 ? (
            <p className="muted">No existing StatusGate VPN services matched.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th />
                  <th>DataGate server</th>
                  <th>Local service</th>
                  <th>Type</th>
                  <th>Proto / host</th>
                  <th>Name diff</th>
                </tr>
              </thead>
              <tbody>
                {preview.matched.map((row) => (
                  <tr key={row.server.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.server.id)}
                        onChange={() => toggleServer(row.server.id)}
                      />
                    </td>
                    <td>
                      {row.server.server_name} <span className="muted">#{row.server.id}</span>
                    </td>
                    <td>
                      {row.component.name} <span className="muted">({row.component.slug})</span>
                    </td>
                    <td>{row.server.check_type}</td>
                    <td>
                      {[row.proto, row.server.host, row.server.port].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td>{row.name_differs ? `→ ${row.suggested_name}` : 'same'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>New servers ({preview.new_servers.length})</h3>
          {preview.new_servers.length === 0 ? (
            <p className="muted">No new servers to import.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th />
                  <th>Server</th>
                  <th>Type</th>
                  <th>Proto / host</th>
                  <th>Online</th>
                </tr>
              </thead>
              <tbody>
                {preview.new_servers.map((server) => (
                  <tr key={server.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(server.id)}
                        onChange={() => toggleServer(server.id)}
                      />
                    </td>
                    <td>
                      {server.server_name} <span className="muted">#{server.id}</span>
                    </td>
                    <td>{server.check_type}</td>
                    <td>
                      {[server.proto, server.host, server.port].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td>{server.is_online ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {preview.unmatched_local.length > 0 && (
            <>
              <h3>Unmatched local VPN services ({preview.unmatched_local.length})</h3>
              <ul className="muted">
                {preview.unmatched_local.map((c) => (
                  <li key={c.id}>
                    {c.name} ({c.check_type})
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="stack-form" style={{ marginTop: '1.25rem' }}>
            <label className="checkbox-row">
              <input type="checkbox" checked={syncNames} onChange={(e) => setSyncNames(e.target.checked)} />
              Синхронизировать имена сервисов и серверов
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={refreshConfigs}
                onChange={(e) => setRefreshConfigs(e.target.checked)}
              />
              Обновить / выпустить OVPN и Xray конфиги (CN)
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={importNew} onChange={(e) => setImportNew(e.target.checked)} />
              Импортировать новые серверы
            </label>
            {canEdit && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void onImport()}
                disabled={busy || selectedIds.size === 0}
              >
                Import selected ({selectedIds.size})
              </button>
            )}
          </div>
        </section>
      )}

      {step === 'result' && result && (
        <section className="panel">
          <h2>3. Result</h2>
          <p>
            Created {result.created}, updated {result.updated}, skipped {result.skipped}, errors{' '}
            {result.errors}.
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Server</th>
                <th>Action</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={`${item.server_id}-${item.action}`}>
                  <td>
                    {item.server_name} <span className="muted">#{item.server_id}</span>
                  </td>
                  <td>{item.action}</td>
                  <td>{item.message ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep('credentials')}>
              Back to credentials
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void onPreview()} disabled={busy}>
              Preview again
            </button>
          </div>
        </section>
      )}
    </AdminLayout>
  )
}

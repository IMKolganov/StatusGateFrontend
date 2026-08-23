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
type BusyAction = 'save' | 'test' | 'preview' | 'import' | null

const defaultCreds = {
  base_url: 'https://api.datagateapp.com',
  client_id: '',
  client_secret: '',
  monitor_cn_prefix: 'statusgate',
  is_enabled: true,
}

function actionTone(action: string): 'ok' | 'warn' | 'error' | 'muted' {
  if (action === 'error' || action.startsWith('error')) return 'error'
  if (action === 'skipped_new' || action.includes('skipped')) return 'warn'
  if (action === 'created' || action.includes('synced') || action.includes('refreshed') || action === 'linked') {
    return 'ok'
  }
  return 'muted'
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
  const [importNew, setImportNew] = useState(false)
  const [result, setResult] = useState<DatagateImportResponse | null>(null)
  const [busy, setBusy] = useState<BusyAction>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  const busyLabel =
    busy === 'save'
      ? 'Saving credentials…'
      : busy === 'test'
        ? 'Testing DataGate connection…'
        : busy === 'preview'
          ? 'Loading servers and matching local services…'
          : busy === 'import'
            ? 'Importing selected servers (issuing CN / downloading configs)…'
            : null

  useEffect(() => {
    void api.listProjects().then((r) => {
      setProjects(r.items)
      if (r.items[0] && !projectId) setProjectId(r.items[0].id)
    })
  }, [])

  useEffect(() => {
    if (!projectId) return
    setError(null)
    setErrorDetail(null)
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
        setErrorDetail(err instanceof ApiError ? err.detail ?? null : null)
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
    return [...preview.matched.map((m) => m.server.id), ...preview.new_servers.map((s) => s.id)]
  }, [preview])

  const selectedMatched = useMemo(
    () => (preview ? preview.matched.filter((m) => selectedIds.has(m.server.id)).length : 0),
    [preview, selectedIds],
  )
  const selectedNew = useMemo(
    () => (preview ? preview.new_servers.filter((s) => selectedIds.has(s.id)).length : 0),
    [preview, selectedIds],
  )

  const captureError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      setError(err.message || fallback)
      setErrorDetail(err.detail ?? null)
      return
    }
    setError(fallback)
    setErrorDetail(null)
  }

  const onSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!projectId || !canEdit) return
    setBusy('save')
    setError(null)
    setErrorDetail(null)
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
      setMessage('Credentials saved. You can test the connection or open Preview.')
    } catch (err) {
      captureError(err, 'Save failed')
    } finally {
      setBusy(null)
    }
  }

  const onTest = async () => {
    if (!projectId || !canEdit) return
    setBusy('test')
    setError(null)
    setErrorDetail(null)
    setMessage(null)
    try {
      const res = await api.testDatagateConnection(projectId)
      setMessage(res.ok ? res.message : `Test failed: ${res.message}`)
    } catch (err) {
      captureError(err, 'Connection test failed')
    } finally {
      setBusy(null)
    }
  }

  const onPreview = async () => {
    if (!projectId) return
    setBusy('preview')
    setError(null)
    setErrorDetail(null)
    setMessage(null)
    try {
      const res = await api.previewDatagateImport(projectId)
      setPreview(res)
      setSelectedIds(new Set([...res.matched.map((m) => m.server.id), ...res.new_servers.map((s) => s.id)]))
      setSyncNames(Boolean(res.matched.some((m) => m.name_differs)))
      setStep('preview')
      setMessage(
        `Preview ready: ${res.matched.length} matched, ${res.new_servers.length} new` +
          (res.unmatched_local.length ? `, ${res.unmatched_local.length} unmatched local` : '') +
          '.',
      )
    } catch (err) {
      captureError(err, 'Preview failed')
    } finally {
      setBusy(null)
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
    setBusy('import')
    setError(null)
    setErrorDetail(null)
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
      const summary = `Import finished: ${res.created} created, ${res.updated} updated, ${res.skipped} skipped, ${res.errors} errors.`
      if (res.errors > 0) {
        setError(summary)
        setMessage(null)
      } else {
        setMessage(summary)
      }
    } catch (err) {
      captureError(err, 'Import failed')
      // Stay on preview so the user can retry without losing selection.
    } finally {
      setBusy(null)
    }
  }

  return (
    <AdminLayout
      title="DataGate"
      subtitle="Import VPN servers from DataGate Monitor into StatusGate services"
    >
      <nav className="datagate-steps" aria-label="Import steps">
        <span className={step === 'credentials' ? 'is-active' : ''}>1. Credentials</span>
        <span className={step === 'preview' ? 'is-active' : ''}>2. Preview</span>
        <span className={step === 'result' ? 'is-active' : ''}>3. Result</span>
      </nav>

      {busyLabel && (
        <div className="alert warning" role="status" aria-live="polite">
          {busyLabel}
        </div>
      )}
      {error && (
        <div className="alert error" role="alert">
          <div>{error}</div>
          {errorDetail && <pre className="datagate-error-detail">{errorDetail}</pre>}
        </div>
      )}
      {message && (
        <div className="alert success" role="status" aria-live="polite">
          {message}
        </div>
      )}

      <section className="panel">
        <h2>Project</h2>
        <label>
          Project
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            disabled={busy !== null}
          >
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
                disabled={!canEdit || busy !== null}
              />
            </label>
            <label>
              Client ID
              <input
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                required
                disabled={!canEdit || busy !== null}
              />
            </label>
            <label>
              Client secret {secretSet ? '(leave blank to keep current)' : ''}
              <input
                type="password"
                value={form.client_secret}
                onChange={(e) => setForm({ ...form, client_secret: e.target.value })}
                required={!secretSet}
                disabled={!canEdit || busy !== null}
                autoComplete="off"
              />
            </label>
            <label>
              Monitor CN prefix
              <input
                value={form.monitor_cn_prefix}
                onChange={(e) => setForm({ ...form, monitor_cn_prefix: e.target.value })}
                required
                disabled={!canEdit || busy !== null}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.is_enabled}
                onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                disabled={!canEdit || busy !== null}
              />
              Enabled
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {canEdit && (
                <button type="submit" className="btn btn-primary" disabled={busy !== null || !projectId}>
                  {busy === 'save' ? 'Saving…' : 'Save'}
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void onTest()}
                  disabled={busy !== null || !projectId || !secretSet}
                >
                  {busy === 'test' ? 'Testing…' : 'Test connection'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void onPreview()}
                disabled={busy !== null || !projectId || !secretSet}
              >
                {busy === 'preview' ? 'Loading preview…' : 'Preview import'}
              </button>
            </div>
          </form>
        </section>
      )}

      {step === 'preview' && preview && (
        <section className="panel">
          <h2>2. Preview</h2>
          {preview.sync_names_question && <p>{preview.sync_names_question}</p>}
          <p className="muted">
            Selected: {selectedIds.size} ({selectedMatched} matched, {selectedNew} new)
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep('credentials')}
              disabled={busy !== null}
            >
              Back
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedIds(new Set(allPreviewServerIds))}
              disabled={busy !== null}
            >
              Select all
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedIds(new Set())}
              disabled={busy !== null}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void onPreview()}
              disabled={busy !== null}
            >
              Refresh preview
            </button>
          </div>

          <h3>Matched — will update ({preview.matched.length})</h3>
          {preview.matched.length === 0 ? (
            <p className="muted">No existing StatusGate VPN services matched.</p>
          ) : (
            <p className="muted">
              These keep history: import updates name/config/link on the existing service, does not create a
              duplicate.
            </p>
          )}
          {preview.matched.length > 0 && (
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
                        disabled={busy !== null}
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

          <h3>New servers — create only if checked below ({preview.new_servers.length})</h3>
          {preview.new_servers.length === 0 ? (
            <p className="muted">Nothing new to create.</p>
          ) : (
            <>
              <p className="muted">
                Only enable «Import new servers» if these are truly missing. Otherwise leave it off and fix
                matching / local services first — creating here starts a new service with empty history.
              </p>
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
                          disabled={busy !== null}
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
            </>
          )}

          {preview.unmatched_local.length > 0 && (
            <>
              <h3>Unmatched local VPN services ({preview.unmatched_local.length})</h3>
              <ul className="muted">
                {preview.unmatched_local.map((c) => (
                  <li key={c.id}>
                    {c.name} <code>{c.slug}</code> ({c.check_type}
                    {c.datagate_server_id != null ? `, linked #${c.datagate_server_id}` : ''})
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="stack-form" style={{ marginTop: '1.25rem' }}>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={syncNames}
                onChange={(e) => setSyncNames(e.target.checked)}
                disabled={busy !== null}
              />
              Синхронизировать имена сервисов и серверов
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={refreshConfigs}
                onChange={(e) => setRefreshConfigs(e.target.checked)}
                disabled={busy !== null}
              />
              Обновить / выпустить OVPN и Xray конфиги (CN)
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={importNew}
                onChange={(e) => setImportNew(e.target.checked)}
                disabled={busy !== null}
              />
              Импортировать новые серверы (создаёт сервисы без истории — только если их ещё нет)
            </label>
            {canEdit && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void onImport()}
                disabled={busy !== null || selectedIds.size === 0}
              >
                {busy === 'import'
                  ? 'Importing…'
                  : `Import selected (${selectedIds.size})`}
              </button>
            )}
          </div>
        </section>
      )}

      {step === 'result' && result && (
        <section className="panel">
          <h2>3. Result</h2>
          <div className="datagate-result-summary">
            <span className="datagate-pill is-ok">created {result.created}</span>
            <span className="datagate-pill is-ok">updated {result.updated}</span>
            <span className="datagate-pill is-warn">skipped {result.skipped}</span>
            <span className={`datagate-pill ${result.errors ? 'is-error' : 'is-muted'}`}>
              errors {result.errors}
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Server</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => {
                const tone = actionTone(item.action)
                return (
                  <tr key={`${item.server_id}-${item.action}-${item.component_id ?? ''}`} className={`datagate-row-${tone}`}>
                    <td>
                      {item.server_name} <span className="muted">#{item.server_id}</span>
                    </td>
                    <td>
                      <span className={`datagate-pill is-${tone}`}>{item.action}</span>
                    </td>
                    <td>{item.message ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep('credentials')}>
              Back to credentials
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void onPreview()}
              disabled={busy !== null}
            >
              Preview again
            </button>
          </div>
        </section>
      )}
    </AdminLayout>
  )
}

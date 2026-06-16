import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type CheckResult, type ComponentKind, type MonitoredComponent, type Project } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { formatApiError } from '../utils/apiError'
import { slugFromName } from '../utils/slug'
import './admin.css'

const CHECK_TYPES = [
  { value: 'http_status', label: 'HTTP status code' },
  { value: 'json', label: 'JSON response (HTTP 200 + valid JSON)' },
  { value: 'xml', label: 'XML response (HTTP 200 + valid XML)' },
] as const

const emptyForm = {
  component_kind_id: '',
  name: '',
  description: '',
  environment: '',
  check_url: '',
  check_method: 'GET',
  check_type: 'http_status',
  expected_status_code: 200,
  timeout_seconds: 10,
  poll_interval_seconds: '' as number | '',
  is_active: true,
}

function statusClass(outcome: string | null | undefined): string {
  if (!outcome) return 'status-unknown'
  if (outcome === 'up') return 'status-up'
  if (outcome === 'degraded') return 'status-degraded'
  return 'status-down'
}

export function ComponentsPage() {
  const [items, setItems] = useState<MonitoredComponent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [kinds, setKinds] = useState<ComponentKind[]>([])
  const [projectId, setProjectId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [lastManualResult, setLastManualResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    if (!projectId) {
      void api.listMonitoredComponents().then((r) => setItems(r.items))
      return
    }
    void api.listMonitoredComponents(projectId).then((r) => setItems(r.items))
  }

  useEffect(() => {
    void Promise.all([api.listProjects(), api.listComponentKinds()]).then(([p, k]) => {
      setProjects(p.items)
      setKinds(k.items)
      if (p.items.length > 0) {
        setProjectId((current) => current || p.items[0].id)
      }
    })
  }, [])

  useEffect(() => {
    load()
  }, [projectId])

  const projectNameById = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  )

  const kindNameById = useMemo(
    () => new Map(kinds.map((k) => [k.id, k.name])),
    [kinds],
  )

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setEditingSlug(null)
    setLastManualResult(null)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!projectId) {
      setError('Choose a project first.')
      return
    }
    setError(null)
    const slug = editingId ? (editingSlug ?? slugFromName(form.name, 'service')) : slugFromName(form.name, 'service')
    const payload = {
      project_id: projectId,
      component_kind_id: form.component_kind_id,
      name: form.name,
      slug,
      description: form.description || null,
      environment: form.environment || null,
      check_url: form.check_url,
      check_method: form.check_method,
      check_type: form.check_type,
      expected_status_code: form.expected_status_code,
      timeout_seconds: form.timeout_seconds,
      poll_interval_seconds: form.poll_interval_seconds === '' ? null : Number(form.poll_interval_seconds),
      is_active: form.is_active,
    }
    try {
      if (editingId) {
        await api.updateMonitoredComponent(editingId, payload)
      } else {
        await api.createMonitoredComponent(payload)
      }
      resetForm()
      load()
    } catch (err) {
      setError(formatApiError(err, 'Save failed'))
    }
  }

  const onManualCheck = async (componentId: string) => {
    setCheckingId(componentId)
    setError(null)
    try {
      const result = await api.runManualCheck(componentId)
      setLastManualResult(result)
      load()
    } catch (err) {
      setError(formatApiError(err, 'Check failed'))
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <AdminLayout title="Services" subtitle="Health checks per project — background worker polls active services automatically">
      {error && <div className="alert error">{error}</div>}
      {lastManualResult && (
        <div className={`alert ${lastManualResult.outcome === 'up' ? 'success' : 'error'}`}>
          Last check: <strong>{lastManualResult.outcome}</strong>
          {lastManualResult.latency_ms != null && ` · ${lastManualResult.latency_ms} ms`}
          {lastManualResult.error_message && ` · ${lastManualResult.error_message}`}
        </div>
      )}

      <section className="panel project-picker">
        <label>
          Project
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value)
              if (editingId) resetForm()
            }}
            required
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        {projects.length === 0 && (
          <p className="muted catalog-hint">
            No projects yet. <Link to="/admin/projects">Create a project</Link> first.
          </p>
        )}
      </section>

      {projectId && (
        <section className="panel">
          <h2>{editingId ? 'Edit service' : 'Add service'}</h2>
          <form className="stack-form grid-form" onSubmit={onSubmit}>
            <label>
              Type
              <select
                value={form.component_kind_id}
                onChange={(e) => setForm({ ...form, component_kind_id: e.target.value })}
                required
              >
                <option value="">Select type…</option>
                {kinds.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </label>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dashboard API" required /></label>
            <label>
              Check type
              <select value={form.check_type} onChange={(e) => setForm({ ...form, check_type: e.target.value })}>
                {CHECK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label>Environment<input value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} placeholder="production" /></label>
            <label>Check URL<input value={form.check_url} onChange={(e) => setForm({ ...form, check_url: e.target.value })} placeholder="https://example.com/health" required /></label>
            <label>Method<input value={form.check_method} onChange={(e) => setForm({ ...form, check_method: e.target.value })} /></label>
            <label>Expected HTTP status<input type="number" value={form.expected_status_code} onChange={(e) => setForm({ ...form, expected_status_code: Number(e.target.value) })} /></label>
            <label>Timeout (sec)<input type="number" value={form.timeout_seconds} onChange={(e) => setForm({ ...form, timeout_seconds: Number(e.target.value) })} /></label>
            <label>
              Poll every (sec)
              <input
                type="number"
                min={10}
                value={form.poll_interval_seconds}
                onChange={(e) => setForm({ ...form, poll_interval_seconds: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="default from settings"
              />
              <span className="field-hint">Leave empty to use the global default. <Link to="/admin/monitoring">Monitoring settings</Link></span>
            </label>
            <label className="checkbox-row"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active (background checks)</label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add service'}</button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <h2>{projectId ? `Services in ${projectNameById.get(projectId) ?? 'project'}` : 'All services'}</h2>
        <table className="data-table">
          <thead>
            <tr>
              {!projectId && <th>Project</th>}
              <th>Name</th>
              <th>Type</th>
              <th>Check</th>
              <th>Status</th>
              <th>URL</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {!projectId && <td>{projectNameById.get(item.project_id) ?? '—'}</td>}
                <td>{item.name}</td>
                <td>{kindNameById.get(item.component_kind_id) ?? '—'}</td>
                <td>{CHECK_TYPES.find((t) => t.value === item.check_type)?.label ?? item.check_type}</td>
                <td>
                  <span className={`status-pill ${statusClass(item.latest_outcome)}`}>
                    {item.latest_outcome ?? 'unknown'}
                  </span>
                  {item.latest_latency_ms != null && <span className="muted"> {item.latest_latency_ms}ms</span>}
                </td>
                <td className="mono wrap">{item.check_url}</td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={checkingId === item.id}
                    onClick={() => void onManualCheck(item.id)}
                  >
                    {checkingId === item.id ? 'Checking…' : 'Check now'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setProjectId(item.project_id)
                      setEditingId(item.id)
                      setEditingSlug(item.slug)
                      setForm({
                        component_kind_id: item.component_kind_id,
                        name: item.name,
                        description: item.description ?? '',
                        environment: item.environment ?? '',
                        check_url: item.check_url,
                        check_method: item.check_method,
                        check_type: item.check_type ?? 'http_status',
                        expected_status_code: item.expected_status_code,
                        timeout_seconds: item.timeout_seconds,
                        poll_interval_seconds: item.poll_interval_seconds ?? '',
                        is_active: item.is_active,
                      })
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => void api.deleteMonitoredComponent(item.id).then(load)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projectId && items.length === 0 && (
          <p className="muted">No services in this project yet.</p>
        )}
      </section>
    </AdminLayout>
  )
}

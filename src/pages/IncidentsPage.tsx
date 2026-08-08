import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Incident, type MonitoredComponent, type Project } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { formatApiError } from '../utils/apiError'
import './admin.css'

const STATUSES = [
  { value: 'investigating', label: 'Investigating' },
  { value: 'identified', label: 'Identified' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'update', label: 'Update' },
] as const

const emptyIncidentForm = {
  title: '',
  message: '',
  status: 'investigating',
  posted_at: '',
  monitored_component_id: '',
  starts_at: '',
  ends_at: '',
}

const emptyUpdateForm = {
  message: '',
  status: 'update',
  posted_at: '',
}

type EditUpdateForm = {
  message: string
  status: string
  posted_at: string
}

type EditIncidentMetaForm = {
  title: string
  monitored_component_id: string
  starts_at: string
  ends_at: string
}

function fromLocalInputValue(value: string): string | undefined {
  if (!value) return undefined
  return new Date(value).toISOString()
}

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatRangeLabel(startsAt?: string | null, endsAt?: string | null): string {
  if (!startsAt) return '—'
  const start = new Date(startsAt).toLocaleString()
  if (!endsAt) return `${start} → open`
  return `${start} → ${new Date(endsAt).toLocaleString()}`
}

export function IncidentsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [services, setServices] = useState<MonitoredComponent[]>([])
  const [projectId, setProjectId] = useState('')
  const [trackedProjectId, setTrackedProjectId] = useState(projectId)
  const [items, setItems] = useState<Incident[]>([])
  const [incidentForm, setIncidentForm] = useState(emptyIncidentForm)
  const [updateForms, setUpdateForms] = useState<Record<string, typeof emptyUpdateForm>>({})
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null)
  const [editIncidentForm, setEditIncidentForm] = useState<EditIncidentMetaForm>({
    title: '',
    monitored_component_id: '',
    starts_at: '',
    ends_at: '',
  })
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null)
  const [editUpdateForm, setEditUpdateForm] = useState<EditUpdateForm>(emptyUpdateForm)
  const [error, setError] = useState<string | null>(null)

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId)
    setItems([])
    setServices([])
    setEditingIncidentId(null)
    setEditingUpdateId(null)
    setIncidentForm(emptyIncidentForm)
  }

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const selectedProject = projectId ? projectById.get(projectId) : undefined

  const load = () => {
    if (!projectId) {
      setItems([])
      return
    }
    void api.listProjectIncidents(projectId).then(setItems)
  }

  useEffect(() => {
    void api.listProjects().then((r) => {
      setProjects(r.items)
      if (r.items.length > 0) {
        setProjectId((current) => current || r.items[0]!.id)
      }
    })
  }, [])

  useEffect(() => {
    if (!projectId) return
    void api.listProjectIncidents(projectId).then(setItems)
    void api.listMonitoredComponents(projectId, 0, 200).then((r) => setServices(r.items))
  }, [projectId])

  const onCreateIncident = async (event: FormEvent) => {
    event.preventDefault()
    if (!projectId) return
    setError(null)
    try {
      const startsAt = fromLocalInputValue(incidentForm.starts_at) ?? fromLocalInputValue(incidentForm.posted_at)
      await api.createProjectIncident(projectId, {
        title: incidentForm.title,
        message: incidentForm.message,
        status: incidentForm.status,
        posted_at: fromLocalInputValue(incidentForm.posted_at),
        monitored_component_id: incidentForm.monitored_component_id || null,
        starts_at: startsAt,
        ends_at: fromLocalInputValue(incidentForm.ends_at) ?? null,
      })
      setIncidentForm(emptyIncidentForm)
      load()
    } catch (err) {
      setError(formatApiError(err, 'Save failed'))
    }
  }

  const startEditIncident = (incident: Incident) => {
    setEditingIncidentId(incident.id)
    setEditIncidentForm({
      title: incident.title,
      monitored_component_id: incident.monitored_component_id ?? '',
      starts_at: toLocalInputValue(incident.starts_at),
      ends_at: toLocalInputValue(incident.ends_at),
    })
  }

  const onSaveIncidentMeta = async (incidentId: string, event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      const clearComponent = !editIncidentForm.monitored_component_id
      await api.updateIncident(incidentId, {
        title: editIncidentForm.title.trim(),
        monitored_component_id: clearComponent ? null : editIncidentForm.monitored_component_id,
        clear_monitored_component: clearComponent,
        starts_at: fromLocalInputValue(editIncidentForm.starts_at),
        ends_at: fromLocalInputValue(editIncidentForm.ends_at) ?? null,
        clear_ends_at: !editIncidentForm.ends_at,
      })
      setEditingIncidentId(null)
      load()
    } catch (err) {
      setError(formatApiError(err, 'Save failed'))
    }
  }

  const onAddUpdate = async (incidentId: string, event: FormEvent) => {
    event.preventDefault()
    const form = updateForms[incidentId] ?? emptyUpdateForm
    setError(null)
    try {
      await api.addIncidentUpdate(incidentId, {
        message: form.message,
        status: form.status,
        posted_at: fromLocalInputValue(form.posted_at),
      })
      setUpdateForms((prev) => ({ ...prev, [incidentId]: emptyUpdateForm }))
      load()
    } catch (err) {
      setError(formatApiError(err, 'Save failed'))
    }
  }

  const startEditUpdate = (update: NonNullable<Incident['updates']>[number]) => {
    setEditingUpdateId(update.id)
    setEditUpdateForm({
      message: update.message,
      status: update.status,
      posted_at: toLocalInputValue(update.posted_at),
    })
  }

  const onSaveUpdate = async (updateId: string, event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await api.updateIncidentUpdate(updateId, {
        message: editUpdateForm.message,
        status: editUpdateForm.status,
        posted_at: fromLocalInputValue(editUpdateForm.posted_at),
      })
      setEditingUpdateId(null)
      load()
    } catch (err) {
      setError(formatApiError(err, 'Save failed'))
    }
  }

  return (
    <AdminLayout title="Incident history" subtitle="Record what happened and when — shown on the public history page">
      {error && <div className="alert error">{error}</div>}

      <section className="panel project-picker">
        <label>
          Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        {selectedProject && (
          <p className="muted catalog-hint">
            Public page:{' '}
            <Link to={`/projects/${selectedProject.slug}/history`} target="_blank" rel="noreferrer">
              /projects/{selectedProject.slug}/history
            </Link>
          </p>
        )}
      </section>

      {projectId && (
        <section className="panel">
          <h2>New incident</h2>
          <form className="stack-form" onSubmit={onCreateIncident}>
            <label>Title<input value={incidentForm.title} onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })} required placeholder='Helsinki OpenVPN unavailable in Russia' /></label>
            <label>Message<textarea value={incidentForm.message} onChange={(e) => setIncidentForm({ ...incidentForm, message: e.target.value })} required rows={3} placeholder="We are investigating the issue for the listed services." /></label>
            <label>Service
              <select value={incidentForm.monitored_component_id} onChange={(e) => setIncidentForm({ ...incidentForm, monitored_component_id: e.target.value })}>
                <option value="">All services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </label>
            <label>From<input type="datetime-local" value={incidentForm.starts_at} onChange={(e) => setIncidentForm({ ...incidentForm, starts_at: e.target.value })} /></label>
            <label>To (optional)<input type="datetime-local" value={incidentForm.ends_at} onChange={(e) => setIncidentForm({ ...incidentForm, ends_at: e.target.value })} /></label>
            <label>Status
              <select value={incidentForm.status} onChange={(e) => setIncidentForm({ ...incidentForm, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label>First update when (optional)<input type="datetime-local" value={incidentForm.posted_at} onChange={(e) => setIncidentForm({ ...incidentForm, posted_at: e.target.value })} /></label>
            <button type="submit" className="btn btn-primary">Publish incident</button>
          </form>
        </section>
      )}

      {projectId && items.map((incident) => {
        const updateForm = updateForms[incident.id] ?? emptyUpdateForm
        const editingMeta = editingIncidentId === incident.id
        return (
          <section key={incident.id} className="panel incident-panel">
            <div className="incident-panel-header">
              {editingMeta ? (
                <form className="stack-form incident-meta-edit" onSubmit={(e) => void onSaveIncidentMeta(incident.id, e)}>
                  <label>Title<input value={editIncidentForm.title} onChange={(e) => setEditIncidentForm({ ...editIncidentForm, title: e.target.value })} required /></label>
                  <label>Service
                    <select value={editIncidentForm.monitored_component_id} onChange={(e) => setEditIncidentForm({ ...editIncidentForm, monitored_component_id: e.target.value })}>
                      <option value="">All services</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>From<input type="datetime-local" value={editIncidentForm.starts_at} onChange={(e) => setEditIncidentForm({ ...editIncidentForm, starts_at: e.target.value })} required /></label>
                  <label>To (optional)<input type="datetime-local" value={editIncidentForm.ends_at} onChange={(e) => setEditIncidentForm({ ...editIncidentForm, ends_at: e.target.value })} /></label>
                  <div className="incident-panel-actions">
                    <button type="submit" className="btn btn-primary btn-sm">Save</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingIncidentId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <h2>{incident.title}</h2>
                    <p className="muted incident-meta-line">
                      {incident.service_name ? incident.service_name : 'All services'}
                      {' · '}
                      {formatRangeLabel(incident.starts_at, incident.ends_at)}
                    </p>
                  </div>
                  <div className="incident-panel-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEditIncident(incident)}>Edit</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => void api.deleteIncident(incident.id).then(load)}>Delete</button>
                  </div>
                </>
              )}
            </div>
            <ul className="incident-updates">
              {(incident.updates ?? []).map((update) => (
                <li key={update.id} className="incident-update-row">
                  {editingUpdateId === update.id ? (
                    <form className="stack-form incident-update-edit" onSubmit={(e) => void onSaveUpdate(update.id, e)}>
                      <label>Message<textarea value={editUpdateForm.message} onChange={(e) => setEditUpdateForm({ ...editUpdateForm, message: e.target.value })} required rows={3} /></label>
                      <label>Status
                        <select value={editUpdateForm.status} onChange={(e) => setEditUpdateForm({ ...editUpdateForm, status: e.target.value })}>
                          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </label>
                      <label>When<input type="datetime-local" value={editUpdateForm.posted_at} onChange={(e) => setEditUpdateForm({ ...editUpdateForm, posted_at: e.target.value })} required /></label>
                      <div className="incident-panel-actions">
                        <button type="submit" className="btn btn-primary btn-sm">Save</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingUpdateId(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="incident-update-meta">
                        <time>{new Date(update.posted_at).toLocaleString()}</time>
                        <span className={`history-status history-status-${update.status}`}>{update.status}</span>
                      </div>
                      <p>{update.message}</p>
                      <div className="incident-panel-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEditUpdate(update)}>Edit</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void api.deleteIncidentUpdate(update.id).then(load)}>Remove</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <form className="stack-form incident-update-form" onSubmit={(e) => void onAddUpdate(incident.id, e)}>
              <h3>Add update</h3>
              <label>Message<textarea value={updateForm.message} onChange={(e) => setUpdateForms((prev) => ({ ...prev, [incident.id]: { ...updateForm, message: e.target.value } }))} required rows={2} placeholder="All impacted services have now fully recovered." /></label>
              <label>Status
                <select value={updateForm.status} onChange={(e) => setUpdateForms((prev) => ({ ...prev, [incident.id]: { ...updateForm, status: e.target.value } }))}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label>When (optional)<input type="datetime-local" value={updateForm.posted_at} onChange={(e) => setUpdateForms((prev) => ({ ...prev, [incident.id]: { ...updateForm, posted_at: e.target.value } }))} /></label>
              <button type="submit" className="btn btn-secondary btn-sm">Add update</button>
            </form>
          </section>
        )
      })}
    </AdminLayout>
  )
}

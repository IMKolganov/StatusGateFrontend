import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Incident, type Project } from '../api/client'
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
}

const emptyUpdateForm = {
  message: '',
  status: 'update',
  posted_at: '',
}


function fromLocalInputValue(value: string): string | undefined {
  if (!value) return undefined
  return new Date(value).toISOString()
}

export function IncidentsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState('')
  const [trackedProjectId, setTrackedProjectId] = useState(projectId)
  const [items, setItems] = useState<Incident[]>([])
  const [incidentForm, setIncidentForm] = useState(emptyIncidentForm)
  const [updateForms, setUpdateForms] = useState<Record<string, typeof emptyUpdateForm>>({})
  const [error, setError] = useState<string | null>(null)

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId)
    setItems([])
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
  }, [projectId])

  const onCreateIncident = async (event: FormEvent) => {
    event.preventDefault()
    if (!projectId) return
    setError(null)
    try {
      await api.createProjectIncident(projectId, {
        title: incidentForm.title,
        message: incidentForm.message,
        status: incidentForm.status,
        posted_at: fromLocalInputValue(incidentForm.posted_at),
      })
      setIncidentForm(emptyIncidentForm)
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
            <label>Title<input value={incidentForm.title} onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })} required placeholder='Codex "Selected Model is at Capacity" Error' /></label>
            <label>Message<textarea value={incidentForm.message} onChange={(e) => setIncidentForm({ ...incidentForm, message: e.target.value })} required rows={3} placeholder="We are investigating the issue for the listed services." /></label>
            <label>Status
              <select value={incidentForm.status} onChange={(e) => setIncidentForm({ ...incidentForm, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label>When (optional)<input type="datetime-local" value={incidentForm.posted_at} onChange={(e) => setIncidentForm({ ...incidentForm, posted_at: e.target.value })} /></label>
            <button type="submit" className="btn btn-primary">Publish incident</button>
          </form>
        </section>
      )}

      {projectId && items.map((incident) => {
        const updateForm = updateForms[incident.id] ?? emptyUpdateForm
        return (
          <section key={incident.id} className="panel incident-panel">
            <div className="incident-panel-header">
              <h2>{incident.title}</h2>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => void api.deleteIncident(incident.id).then(load)}>Delete</button>
            </div>
            <ul className="incident-updates">
              {(incident.updates ?? []).map((update) => (
                <li key={update.id} className="incident-update-row">
                  <div className="incident-update-meta">
                    <time>{new Date(update.posted_at).toLocaleString()}</time>
                    <span className={`history-status history-status-${update.status}`}>{update.status}</span>
                  </div>
                  <p>{update.message}</p>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void api.deleteIncidentUpdate(update.id).then(load)}>Remove</button>
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

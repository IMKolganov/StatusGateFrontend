import { type FormEvent, useEffect, useState } from 'react'
import { api, type ComponentGroup, type Project } from '../api/client'
import { isAdmin } from '../auth/roles'
import { useAuth } from '../auth/useAuth'
import { AdminLayout } from '../components/AdminLayout'
import { formatApiError } from '../utils/apiError'
import { slugFromName } from '../utils/slug'
import './admin.css'

const emptyForm = { name: '', description: '', sort_order: 0, is_active: true }

export function ComponentGroupsPage() {
  const { account } = useAuth()
  const canDelete = isAdmin(account)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState('')
  const [items, setItems] = useState<ComponentGroup[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api.listProjects().then((r) => {
      setProjects(r.items)
      setProjectId((current) => current || r.items[0]?.id || '')
    })
  }, [])

  const load = () => {
    if (!projectId) {
      setItems([])
      return
    }
    void api.listComponentGroups(projectId).then((r) => setItems(r.items)).catch((err) => {
      setError(formatApiError(err, 'Failed to load groups'))
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setEditingSlug(null)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!projectId) {
      setError('Choose a project first.')
      return
    }
    setError(null)
    try {
      if (editingId) {
        await api.updateComponentGroup(editingId, {
          name: form.name,
          slug: editingSlug ?? slugFromName(form.name, 'group'),
          description: form.description || null,
          sort_order: form.sort_order,
          is_active: form.is_active,
        })
      } else {
        await api.createComponentGroup({
          project_id: projectId,
          name: form.name,
          slug: slugFromName(form.name, 'group'),
          description: form.description || null,
          sort_order: form.sort_order,
          is_active: form.is_active,
        })
      }
      resetForm()
      load()
    } catch (err) {
      setError(formatApiError(err, 'Save failed'))
    }
  }

  const onDelete = async (item: ComponentGroup) => {
    if (!window.confirm(`Delete group "${item.name}"? Services stay ungrouped.`)) return
    setError(null)
    try {
      await api.deleteComponentGroup(item.id)
      if (editingId === item.id) resetForm()
      load()
    } catch (err) {
      setError(formatApiError(err, 'Delete failed'))
    }
  }

  const projectName = projects.find((p) => p.id === projectId)?.name ?? 'project'

  return (
    <AdminLayout
      title="Service groups"
      subtitle="Group services inside a project (e.g. Server 1, Server 2) for admin and public status pages"
    >
      {error && <div className="alert error">{error}</div>}
      <section className="panel">
        <label>
          Project
          <select value={projectId} onChange={(e) => { setProjectId(e.target.value); resetForm() }} required>
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      </section>
      <section className="panel">
        <h2>{editingId ? 'Edit group' : 'New group'}</h2>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Description
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label>
            Sort order
            <input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={!projectId}>
              {editingId ? 'Save changes' : 'Create group'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>Groups in {projectName}</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.sort_order}</td>
                <td>{item.name}</td>
                <td>{item.is_active ? 'yes' : 'no'}</td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditingSlug(item.slug)
                      setForm({
                        name: item.name,
                        description: item.description ?? '',
                        sort_order: item.sort_order,
                        is_active: item.is_active,
                      })
                    }}
                  >
                    Edit
                  </button>
                  {canDelete && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => void onDelete(item)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="muted">No groups in this project yet.</p>}
      </section>
    </AdminLayout>
  )
}

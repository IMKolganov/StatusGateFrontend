import { type FormEvent, useEffect, useState } from 'react'
import { api, ApiError, type Project } from '../api/client'
import { isAdmin } from '../auth/roles'
import { useAuth } from '../auth/useAuth'
import { AdminLayout } from '../components/AdminLayout'
import { slugFromName } from '../utils/slug'
import './admin.css'

const emptyForm = { name: '', description: '', is_active: true }

export function ProjectsPage() {
  const { account } = useAuth()
  const canDelete = isAdmin(account)
  const [items, setItems] = useState<Project[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => void api.listProjects().then((r) => setItems(r.items))

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      if (editingId) {
        await api.updateProject(editingId, {
          name: form.name,
          slug: editingSlug ?? slugFromName(form.name, 'project'),
          description: form.description || null,
          is_active: form.is_active,
        })
      } else {
        await api.createProject({
          name: form.name,
          slug: slugFromName(form.name, 'project'),
          description: form.description || null,
          is_active: form.is_active,
        })
      }
      resetForm()
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
    }
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setEditingSlug(null)
  }

  const onDelete = async (item: Project) => {
    if (!window.confirm(`Delete project "${item.name}"? This cannot be undone.`)) return
    setError(null)
    try {
      await api.deleteProject(item.id)
      if (editingId === item.id) resetForm()
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed')
    }
  }

  return (
    <AdminLayout title="Projects" subtitle="Products or environments — pick one when adding services to monitor">
      {error && <div className="alert error">{error}</div>}
      <section className="panel">
        <h2>{editingId ? 'Edit project' : 'New project'}</h2>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Create project'}</button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>All projects</h2>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Active</th><th /></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
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
      </section>
    </AdminLayout>
  )
}

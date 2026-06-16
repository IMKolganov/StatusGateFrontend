import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type ComponentKind } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { formatApiError } from '../utils/apiError'
import { slugFromName } from '../utils/slug'
import './admin.css'

const emptyForm = { name: '', description: '' }

export function ComponentKindsPage() {
  const [items, setItems] = useState<ComponentKind[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => void api.listComponentKinds().then((r) => setItems(r.items))

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const slug = editingId ? (editingSlug ?? slugFromName(form.name, 'kind')) : slugFromName(form.name, 'kind')
    const payload = { name: form.name, slug, description: form.description || null }
    try {
      if (editingId) {
        await api.updateComponentKind(editingId, payload)
      } else {
        await api.createComponentKind(payload)
      }
      setForm(emptyForm)
      setEditingId(null)
      setEditingSlug(null)
      load()
    } catch (err) {
      setError(formatApiError(err, 'Save failed'))
    }
  }

  return (
    <AdminLayout
      title="Service types"
      subtitle="Reference catalog — shared across all projects"
    >
      <p className="muted catalog-hint">
        Part of <Link to="/admin/reference">Reference</Link>.
        To attach a service to a project, go to{' '}
        <Link to="/admin/components">Services</Link>.
      </p>
      {error && <div className="alert error">{error}</div>}
      <section className="panel">
        <h2>{editingId ? 'Edit type' : 'New type'}</h2>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="API"
              required
            />
          </label>
          <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
        </form>
      </section>
      <section className="panel">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Description</th><th /></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.description ?? '—'}</td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditingSlug(item.slug)
                      setForm({ name: item.name, description: item.description ?? '' })
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => void api.deleteComponentKind(item.id).then(load)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminLayout>
  )
}

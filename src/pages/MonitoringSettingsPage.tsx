import { type FormEvent, useEffect, useState } from 'react'
import { api, type MonitoringSettings } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { formatApiError } from '../utils/apiError'
import './admin.css'

export function MonitoringSettingsPage() {
  const [settings, setSettings] = useState<MonitoringSettings | null>(null)
  const [form, setForm] = useState({ default_poll_interval_seconds: 60, scheduler_interval_seconds: 30 })
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = () => void api.getMonitoringSettings().then((data) => {
    setSettings(data)
    setForm({
      default_poll_interval_seconds: data.default_poll_interval_seconds,
      scheduler_interval_seconds: data.scheduler_interval_seconds,
    })
  })

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaved(false)
    try {
      const updated = await api.updateMonitoringSettings(form)
      setSettings(updated)
      setSaved(true)
    } catch (err) {
      setError(formatApiError(err, 'Save failed'))
    }
  }

  return (
    <AdminLayout
      title="Monitoring"
      subtitle="How often the background worker polls services"
    >
      {error && <div className="alert error">{error}</div>}
      {saved && <div className="alert success">Settings saved. Worker picks up changes on the next cycle.</div>}

      <section className="panel">
        <h2>Polling intervals</h2>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Default service poll interval (seconds)
            <input
              type="number"
              min={10}
              value={form.default_poll_interval_seconds}
              onChange={(e) => setForm({ ...form, default_poll_interval_seconds: Number(e.target.value) })}
              required
            />
            <span className="field-hint">Used when a service has no custom interval.</span>
          </label>
          <label>
            Worker wake-up interval (seconds)
            <input
              type="number"
              min={5}
              value={form.scheduler_interval_seconds}
              onChange={(e) => setForm({ ...form, scheduler_interval_seconds: Number(e.target.value) })}
              required
            />
            <span className="field-hint">How often the background worker looks for services due for a check.</span>
          </label>
          <button type="submit" className="btn btn-primary">Save settings</button>
        </form>
        {settings && (
          <p className="muted field-hint">Last updated: {new Date(settings.updated_at).toLocaleString()}</p>
        )}
      </section>

      <section className="panel">
        <h2>How it works</h2>
        <ul className="muted catalog-hint">
          <li>Active services with check types <strong>HTTP status</strong>, <strong>JSON</strong>, or <strong>XML</strong> are polled automatically.</li>
          <li>JSON checks require HTTP 200 and a valid JSON body (not XML).</li>
          <li>XML checks require HTTP 200 and XML content.</li>
          <li>Use <strong>Check now</strong> on the Services page for an immediate manual run.</li>
        </ul>
      </section>
    </AdminLayout>
  )
}

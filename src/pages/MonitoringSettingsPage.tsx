import { type FormEvent, useEffect, useState } from 'react'
import { api, type MonitoringSettings, type SpeedTestAdvisory } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { formatApiError } from '../utils/apiError'
import {
  DEFAULT_SPEED_TEST_URL_TEMPLATE,
  validateSpeedTestUrlTemplate,
} from '../utils/speedTestConfig'
import './admin.css'

export function MonitoringSettingsPage() {
  const [settings, setSettings] = useState<MonitoringSettings | null>(null)
  const [speedTestAdvisory, setSpeedTestAdvisory] = useState<SpeedTestAdvisory | null>(null)
  const [form, setForm] = useState({
    default_poll_interval_seconds: 60,
    scheduler_interval_seconds: 30,
    default_speed_test_url_template: DEFAULT_SPEED_TEST_URL_TEMPLATE,
    default_speed_test_interval_seconds: 3600,
  })
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = () => {
    void Promise.all([api.getMonitoringSettings(), api.getSpeedTestAdvisory()])
      .then(([data, advisory]) => {
        setSettings(data)
        setSpeedTestAdvisory(advisory)
        setForm({
          default_poll_interval_seconds: data.default_poll_interval_seconds,
          scheduler_interval_seconds: data.scheduler_interval_seconds,
          default_speed_test_url_template:
            data.default_speed_test_url_template ?? DEFAULT_SPEED_TEST_URL_TEMPLATE,
          default_speed_test_interval_seconds: data.default_speed_test_interval_seconds ?? 3600,
        })
      })
      .catch((err) => setError(formatApiError(err, 'Failed to load settings')))
  }

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const urlError = validateSpeedTestUrlTemplate(form.default_speed_test_url_template)
    if (urlError) {
      setError(urlError)
      return
    }
    setError(null)
    setSaved(false)
    try {
      const updated = await api.updateMonitoringSettings({
        default_poll_interval_seconds: form.default_poll_interval_seconds,
        scheduler_interval_seconds: form.scheduler_interval_seconds,
        default_speed_test_url_template: form.default_speed_test_url_template.trim(),
        default_speed_test_interval_seconds: form.default_speed_test_interval_seconds,
      })
      setSettings(updated)
      const advisory = await api.getSpeedTestAdvisory()
      setSpeedTestAdvisory(advisory)
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
      {speedTestAdvisory?.warning && (
        <div className="alert warning">{speedTestAdvisory.warning}</div>
      )}

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
        <h2>VPN speed test defaults</h2>
        <form className="stack-form" onSubmit={onSubmit}>
          <label className="full-width">
            Default speed test URL template
            <input
              value={form.default_speed_test_url_template}
              onChange={(e) => setForm({ ...form, default_speed_test_url_template: e.target.value })}
              spellCheck={false}
              required
            />
            <span className="field-hint">
              HTTPS URL with a {'{bytes}'} placeholder. Default matches Cloudflare&apos;s public speed test endpoint;
              use your own server if many VPN services share one monitoring IP.
            </span>
          </label>
          <label>
            Default speed test interval (seconds)
            <input
              type="number"
              min={0}
              value={form.default_speed_test_interval_seconds}
              onChange={(e) => setForm({ ...form, default_speed_test_interval_seconds: Number(e.target.value) })}
              required
            />
            <span className="field-hint">
              How often to re-run throughput tests per VPN service. 0 = every health check; higher values reuse the last result.
            </span>
          </label>
          {speedTestAdvisory && speedTestAdvisory.active_vpn_service_count > 0 && (
            <p className="field-hint muted">
              {speedTestAdvisory.active_vpn_service_count} active VPN service(s) — estimated{' '}
              {speedTestAdvisory.estimated_speed_tests_per_minute.toFixed(1)} speed test(s)/min with current settings.
            </p>
          )}
          <button type="submit" className="btn btn-primary">Save settings</button>
        </form>
      </section>

      <section className="panel">
        <h2>How it works</h2>
        <ul className="muted catalog-hint">
          <li>Active services with check types <strong>HTTP status</strong>, <strong>JSON</strong>, or <strong>XML</strong> are polled automatically.</li>
          <li>JSON checks require HTTP 200 and a valid JSON body (not XML).</li>
          <li>XML checks require HTTP 200 and XML content.</li>
          <li>OpenVPN and Xray checks can run an optional download speed test through the tunnel using the URL template above.</li>
          <li>Use <strong>Check now</strong> on the Services page for an immediate manual run.</li>
        </ul>
      </section>
    </AdminLayout>
  )
}

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type CheckResult, type ComponentKind, type MonitoredComponent, type MonitoringSettings, type NetworkSummary, type Project } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { CheckDiagnostics, logTailFromDetails, networkSummaryFromRecord } from '../components/CheckDiagnostics'
import { formatApiError } from '../utils/apiError'
import {
  DEFAULT_SPEED_TEST_MIB,
  speedTestBytesFromMibInput,
  speedTestMibStringFromBytes,
  validateSpeedTestMibInput,
} from '../utils/speedTest'
import {
  buildLocalSpeedTestWarning,
  DEFAULT_SPEED_TEST_URL_TEMPLATE,
  validateSpeedTestUrlTemplate,
} from '../utils/speedTestConfig'
import { slugFromName } from '../utils/slug'
import './admin.css'

const CHECK_TYPES = [
  { value: 'http_status', label: 'HTTP status code' },
  { value: 'json', label: 'JSON response (HTTP 200 + valid JSON)' },
  { value: 'xml', label: 'XML response (HTTP 200 + valid XML)' },
  { value: 'openvpn', label: 'OpenVPN connection' },
  { value: 'xray', label: 'Xray connection' },
] as const

const VPN_KIND_SLUGS = new Set(['openvpn', 'xray'])

const emptyForm = {
  component_kind_id: '',
  name: '',
  description: '',
  environment: '',
  check_url: '',
  check_method: 'GET',
  check_type: 'http_status',
  vpn_config_text: '',
  speed_test_mib: '',
  speed_test_url_template: '',
  speed_test_interval_seconds: '' as number | '',
  speed_test_enabled: true,
  expected_status_code: 200,
  timeout_seconds: 10,
  poll_interval_seconds: '' as number | '',
  connection_mode: 'ephemeral' as 'ephemeral' | 'persistent',
  is_active: true,
}

function statusClass(outcome: string | null | undefined): string {
  if (!outcome) return 'status-unknown'
  if (outcome === 'up') return 'status-up'
  if (outcome === 'degraded') return 'status-degraded'
  return 'status-down'
}

function checkTypeLabel(value: string): string {
  return CHECK_TYPES.find((t) => t.value === value)?.label ?? value
}

function networkSummaryFromDetails(details: Record<string, unknown> | null | undefined): NetworkSummary | null {
  if (!details || typeof details.network !== 'object' || details.network === null) return null
  const network = details.network as Record<string, unknown>
  const probe = typeof network.probe === 'object' && network.probe !== null ? (network.probe as Record<string, unknown>) : {}
  const gatewayPing = typeof network.gateway_ping === 'object' && network.gateway_ping !== null
    ? (network.gateway_ping as Record<string, unknown>)
    : {}
  const speedTest = typeof network.speed_test === 'object' && network.speed_test !== null
    ? (network.speed_test as Record<string, unknown>)
    : {}

  return networkSummaryFromRecord({
    interface: network.interface,
    ipv4_address: network.ipv4_address,
    gateway: network.gateway,
    dns_servers: network.dns_servers,
    mtu: network.mtu,
    connect_time_ms: network.connect_time_ms,
    proxy_url: network.proxy_url,
    inbound_protocol: network.inbound_protocol,
    probe_url: probe.url,
    exit_ip: probe.exit_ip,
    probe_latency_ms: probe.latency_ms,
    gateway_ping_avg_ms: gatewayPing.avg_ms,
    gateway_ping_loss_percent: gatewayPing.loss_percent,
    gateway_ping_jitter_ms: gatewayPing.jitter_ms,
    download_mbps: speedTest.mbps,
    download_bytes: speedTest.bytes,
    download_duration_ms: speedTest.duration_ms,
    speed_test_ok: typeof speedTest.ok === 'boolean' ? speedTest.ok : undefined,
    speed_test_error: typeof speedTest.error === 'string' ? speedTest.error : undefined,
  })
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
  const [purgingId, setPurgingId] = useState<string | null>(null)
  const [lastManualResult, setLastManualResult] = useState<CheckResult | null>(null)
  const [monitoringSettings, setMonitoringSettings] = useState<MonitoringSettings | null>(null)
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
    void api.getMonitoringSettings().then(setMonitoringSettings).catch(() => setMonitoringSettings(null))
  }, [])

  useEffect(() => {
    load()
  }, [projectId])

  const kindById = useMemo(() => new Map(kinds.map((k) => [k.id, k])), [kinds])

  const projectNameById = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  )

  const kindNameById = useMemo(
    () => new Map(kinds.map((k) => [k.id, k.name])),
    [kinds],
  )

  const selectedKindSlug = kindById.get(form.component_kind_id)?.slug
  const isVpnKind = selectedKindSlug ? VPN_KIND_SLUGS.has(selectedKindSlug) : false
  const isOpenVpn = selectedKindSlug === 'openvpn'

  const speedTestWarning = useMemo(() => {
    if (!isVpnKind || !form.speed_test_enabled || !monitoringSettings) return null

    const defaultTemplate =
      monitoringSettings.default_speed_test_url_template ?? DEFAULT_SPEED_TEST_URL_TEMPLATE
    const defaultSpeedInterval = monitoringSettings.default_speed_test_interval_seconds ?? 3600
    const defaultPoll = monitoringSettings.default_poll_interval_seconds ?? 60
    const usesCloudflare = (form.speed_test_url_template.trim() || defaultTemplate).startsWith(
      'https://speed.cloudflare.com/',
    )

    const projectedItems = items.map((item) => {
      if (item.id !== editingId) return item
      return {
        ...item,
        is_active: form.is_active,
        check_type: form.check_type,
        poll_interval_seconds: form.poll_interval_seconds === '' ? null : Number(form.poll_interval_seconds),
        speed_test_url_template: form.speed_test_url_template.trim() || null,
        speed_test_interval_seconds:
          form.speed_test_interval_seconds === '' ? null : Number(form.speed_test_interval_seconds),
        speed_test_enabled: form.speed_test_enabled,
      }
    })

    return buildLocalSpeedTestWarning(projectedItems, defaultPoll, defaultSpeedInterval, usesCloudflare)
  }, [
    editingId,
    form.check_type,
    form.is_active,
    form.poll_interval_seconds,
    form.speed_test_enabled,
    form.speed_test_interval_seconds,
    form.speed_test_url_template,
    isVpnKind,
    items,
    monitoringSettings,
  ])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setEditingSlug(null)
    setLastManualResult(null)
  }

  const onKindChange = (componentKindId: string) => {
    const slug = kindById.get(componentKindId)?.slug
    if (slug === 'openvpn') {
      setForm((current) => ({
        ...current,
        component_kind_id: componentKindId,
        check_type: 'openvpn',
        check_url: current.check_url || 'https://ifconfig.me/ip',
        timeout_seconds: Math.max(current.timeout_seconds, 60),
      }))
      return
    }
    if (slug === 'xray') {
      setForm((current) => ({
        ...current,
        component_kind_id: componentKindId,
        check_type: 'xray',
        check_url: current.check_url || 'https://ifconfig.me/ip',
        timeout_seconds: Math.max(current.timeout_seconds, 60),
      }))
      return
    }
    setForm((current) => ({
      ...current,
      component_kind_id: componentKindId,
      check_type: current.check_type === 'openvpn' || current.check_type === 'xray' ? 'http_status' : current.check_type,
    }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!projectId) {
      setError('Choose a project first.')
      return
    }
    if (isVpnKind && !form.vpn_config_text.trim()) {
      setError(isOpenVpn ? 'Paste an OpenVPN .ovpn config.' : 'Paste a vless:// share link or Xray JSON config.')
      return
    }
    if (isVpnKind) {
      const speedTestError = validateSpeedTestMibInput(form.speed_test_mib)
      if (speedTestError) {
        setError(speedTestError)
        return
      }
      if (form.speed_test_enabled && form.speed_test_url_template.trim()) {
        const urlError = validateSpeedTestUrlTemplate(form.speed_test_url_template)
        if (urlError) {
          setError(urlError)
          return
        }
      }
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
      check_url: form.check_url || (isVpnKind ? 'https://ifconfig.me/ip' : ''),
      check_method: form.check_method,
      check_type: form.check_type,
      check_config: isVpnKind ? { config_text: form.vpn_config_text.trim() } : null,
      speed_test_bytes: isVpnKind ? speedTestBytesFromMibInput(form.speed_test_mib) : null,
      speed_test_url_template:
        isVpnKind && form.speed_test_enabled ? form.speed_test_url_template.trim() || null : null,
      speed_test_interval_seconds:
        isVpnKind && form.speed_test_enabled
          ? form.speed_test_interval_seconds === ''
            ? null
            : Number(form.speed_test_interval_seconds)
          : null,
      speed_test_enabled: isVpnKind ? form.speed_test_enabled : null,
      expected_status_code: form.expected_status_code,
      timeout_seconds: form.timeout_seconds,
      poll_interval_seconds: form.poll_interval_seconds === '' ? null : Number(form.poll_interval_seconds),
      connection_mode: isOpenVpn ? form.connection_mode : undefined,
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

  const onClearHistory = async (item: MonitoredComponent) => {
    const confirmed = window.confirm(
      `Delete all check history for "${item.name}"?\n\nThis removes stored check results and timelines for this service. It cannot be undone.`,
    )
    if (!confirmed) return

    setPurgingId(item.id)
    setError(null)
    try {
      const result = await api.purgeCheckHistory(item.id)
      if (lastManualResult?.monitored_component_id === item.id) {
        setLastManualResult(null)
      }
      load()
      window.alert(`Deleted ${result.deleted_count} check result(s).`)
    } catch (err) {
      setError(formatApiError(err, 'Failed to clear history'))
    } finally {
      setPurgingId(null)
    }
  }

  const lastNetworkSummary = networkSummaryFromDetails(lastManualResult?.details as Record<string, unknown> | undefined)
  const lastLogTail = logTailFromDetails(lastManualResult?.details as Record<string, unknown> | undefined)

  return (
    <AdminLayout title="Services" subtitle="Health checks per project — background worker polls active services automatically">
      {error && <div className="alert error">{error}</div>}
      {lastManualResult && (
        <div className={`alert ${lastManualResult.outcome === 'up' ? 'success' : 'error'}`}>
          <div>
            Last check: <strong>{lastManualResult.outcome}</strong>
            {lastManualResult.latency_ms != null && ` · ${lastManualResult.latency_ms} ms`}
          </div>
          <CheckDiagnostics
            outcome={lastManualResult.outcome}
            errorMessage={lastManualResult.error_message}
            logTail={lastLogTail}
            networkSummary={lastNetworkSummary}
            collapsible
          />
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
                onChange={(e) => onKindChange(e.target.value)}
                required
              >
                <option value="">Select type…</option>
                {kinds.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </label>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Norway OpenVPN" required /></label>

            {!isVpnKind && (
              <label>
                Check type
                <select value={form.check_type} onChange={(e) => setForm({ ...form, check_type: e.target.value })}>
                  {CHECK_TYPES.filter((t) => t.value !== 'openvpn' && t.value !== 'xray').map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
            )}

            <label>Environment<input value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} placeholder="production" /></label>

            {isVpnKind && (
              <label className="full-width">
                {isOpenVpn ? 'OpenVPN config (.ovpn)' : 'Xray config (vless:// or JSON)'}
                <textarea
                  value={form.vpn_config_text}
                  onChange={(e) => setForm({ ...form, vpn_config_text: e.target.value })}
                  rows={12}
                  spellCheck={false}
                  placeholder={
                    isOpenVpn
                      ? 'client\ndev tun\nproto udp\n...'
                      : 'vless://uuid@host:port?encryption=none&security=tls&sni=host&type=tcp#name'
                  }
                  required
                />
                <span className="field-hint">
                  {isOpenVpn
                    ? 'StatusGate connects using this config, collects network parameters, then probes the URL below through the tunnel/proxy.'
                    : 'Paste a vless:// share link (like .ovpn for OpenVPN) or full Xray JSON. StatusGate starts a local proxy and probes the URL below through it.'}
                </span>
              </label>
            )}

            <label className={isVpnKind ? 'full-width' : undefined}>
              {isVpnKind ? 'Probe URL (through VPN)' : 'Check URL'}
              <input
                value={form.check_url}
                onChange={(e) => setForm({ ...form, check_url: e.target.value })}
                placeholder={isVpnKind ? 'https://ifconfig.me/ip' : 'https://example.com/health'}
                required={!isVpnKind}
              />
            </label>

            {isOpenVpn && (
              <label className="checkbox-row full-width">
                <input
                  type="checkbox"
                  checked={form.connection_mode === 'persistent'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      connection_mode: e.target.checked ? 'persistent' : 'ephemeral',
                    })
                  }
                />
                Keep VPN session alive (persistent monitoring)
                <span className="field-hint">
                  OpenVPN stays connected; probes and speed tests run on the interval below instead of reconnecting each cycle.
                </span>
              </label>
            )}

            {isVpnKind && (
              <>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={form.speed_test_enabled}
                    onChange={(e) => setForm({ ...form, speed_test_enabled: e.target.checked })}
                  />
                  Run download speed test through VPN
                </label>

                {form.speed_test_enabled && (
                  <>
                    {speedTestWarning && <div className="alert warning full-width">{speedTestWarning}</div>}

                    <label className="full-width">
                      Speed test URL template
                      <input
                        value={form.speed_test_url_template}
                        onChange={(e) => setForm({ ...form, speed_test_url_template: e.target.value })}
                        spellCheck={false}
                        placeholder={
                          monitoringSettings?.default_speed_test_url_template ?? DEFAULT_SPEED_TEST_URL_TEMPLATE
                        }
                      />
                      <span className="field-hint">
                        Leave empty to use the global default from{' '}
                        <Link to="/admin/monitoring">Monitoring settings</Link>. Must include {'{bytes}'}.
                      </span>
                    </label>

                    <label>
                      Speed test interval (seconds)
                      <input
                        type="number"
                        min={0}
                        value={form.speed_test_interval_seconds}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            speed_test_interval_seconds: e.target.value === '' ? '' : Number(e.target.value),
                          })
                        }
                        placeholder={String(monitoringSettings?.default_speed_test_interval_seconds ?? 3600)}
                      />
                      <span className="field-hint">
                        Leave empty for the global default. 0 = run on every check; higher values reuse the last result.
                      </span>
                    </label>

                    <label>
                      Speed test size (MiB)
                      <input
                        type="text"
                        inputMode="decimal"
                        value={form.speed_test_mib}
                        onChange={(e) => setForm({
                          ...form,
                          speed_test_mib: e.target.value,
                        })}
                        placeholder={String(DEFAULT_SPEED_TEST_MIB)}
                      />
                      <span className="field-hint">
                        Download size for throughput measurement through the tunnel. Leave empty for {DEFAULT_SPEED_TEST_MIB} MiB (512 KiB). Use a higher timeout for larger tests.
                      </span>
                    </label>
                  </>
                )}
              </>
            )}

            {!isVpnKind && (
              <>
                <label>Method<input value={form.check_method} onChange={(e) => setForm({ ...form, check_method: e.target.value })} /></label>
                <label>Expected HTTP status<input type="number" value={form.expected_status_code} onChange={(e) => setForm({ ...form, expected_status_code: Number(e.target.value) })} /></label>
              </>
            )}

            <label>Timeout (sec)<input type="number" min={isVpnKind ? 30 : 1} value={form.timeout_seconds} onChange={(e) => setForm({ ...form, timeout_seconds: Number(e.target.value) })} /></label>
            <label>
              {isVpnKind && form.connection_mode === 'persistent' ? 'Probe every (sec)' : 'Poll every (sec)'}
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
              <th>Target</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {!projectId && <td>{projectNameById.get(item.project_id) ?? '—'}</td>}
                <td>{item.name}</td>
                <td>{kindNameById.get(item.component_kind_id) ?? '—'}</td>
                <td>{checkTypeLabel(item.check_type ?? 'http_status')}</td>
                <td className="status-cell">
                  <span className={`status-pill ${statusClass(item.latest_outcome)}`}>
                    {item.latest_outcome ?? 'unknown'}
                  </span>
                  {item.latest_latency_ms != null && <span className="muted"> {item.latest_latency_ms}ms</span>}
                  <CheckDiagnostics
                    outcome={item.latest_outcome}
                    errorMessage={item.latest_error_message}
                    logTail={item.latest_log_tail}
                    networkSummary={item.latest_network_summary ?? undefined}
                    collapsible
                  />
                </td>
                <td className="mono wrap">{item.check_url}</td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={purgingId === item.id}
                    onClick={() => void onClearHistory(item)}
                  >
                    {purgingId === item.id ? 'Clearing…' : 'Clear history'}
                  </button>
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
                        vpn_config_text: item.check_config?.config_text ?? '',
                        speed_test_mib: speedTestMibStringFromBytes(item.speed_test_bytes),
                        speed_test_url_template: item.speed_test_url_template ?? '',
                        speed_test_interval_seconds: item.speed_test_interval_seconds ?? '',
                        speed_test_enabled: item.speed_test_enabled ?? true,
                        expected_status_code: item.expected_status_code,
                        timeout_seconds: item.timeout_seconds,
                        poll_interval_seconds: item.poll_interval_seconds ?? '',
                        connection_mode: (item.connection_mode === 'persistent' ? 'persistent' : 'ephemeral'),
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

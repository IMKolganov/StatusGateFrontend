import { vi } from 'vitest'
import type { api as ApiClient } from '../api/client'

export class ApiError extends Error {
  status: number
  detail?: string
  traceId?: string

  constructor(message: string, status = 500, detail?: string, traceId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.traceId = traceId
  }
}

type Api = typeof ApiClient
type ApiOverrides = Partial<{ [K in keyof Api]: Api[K] }>

/** Builds a partial `api` object with vitest mocks for every method. */
export function createApiMock(overrides: ApiOverrides = {}): Api {
  const methods = [
    'registrationStatus',
    'googleLogin',
    'register',
    'login',
    'login2fa',
    'logout',
    'me',
    'dashboard',
    'linkPassword',
    'setup2fa',
    'enable2fa',
    'disable2fa',
    'listProjects',
    'createProject',
    'updateProject',
    'deleteProject',
    'listComponentKinds',
    'createComponentKind',
    'updateComponentKind',
    'deleteComponentKind',
    'listMonitoredComponents',
    'createMonitoredComponent',
    'updateMonitoredComponent',
    'deleteMonitoredComponent',
    'getMonitoringSettings',
    'updateMonitoringSettings',
    'getSpeedTestAdvisory',
    'runManualCheck',
    'listCheckResults',
    'purgeCheckHistory',
    'listConnectionEvents',
    'listProjectIncidents',
    'createProjectIncident',
    'updateIncident',
    'deleteIncident',
    'addIncidentUpdate',
    'updateIncidentUpdate',
    'deleteIncidentUpdate',
    'listAccounts',
    'updateAccountRoles',
    'listPublicProjects',
    'getPublicProjectStatus',
    'getPublicProjectHistory',
    'getPublicSystemStatus',
    'getPublicTunnelMetrics',
  ] as const satisfies ReadonlyArray<keyof Api>

  const mock = {} as Api
  for (const key of methods) {
    mock[key] = vi.fn() as Api[typeof key]
  }
  return { ...mock, ...overrides }
}

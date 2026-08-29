import { adminDashboardApiAdminDashboardGet } from './generated/admin/admin'
import {
  listAccountsApiAdminAccountsGet,
  updateAccountRolesApiAdminAccountsAccountIdRolesPut,
} from './generated/admin-accounts/admin-accounts'
import {
  createComponentKindApiAdminComponentKindsPost,
  createMonitoredComponentApiAdminMonitoredComponentsPost,
  createProjectApiAdminProjectsPost,
  deleteComponentKindApiAdminComponentKindsKindIdDelete,
  deleteMonitoredComponentApiAdminMonitoredComponentsComponentIdDelete,
  deleteProjectApiAdminProjectsProjectIdDelete,
  listComponentKindsApiAdminComponentKindsGet,
  listMonitoredComponentsApiAdminMonitoredComponentsGet,
  listProjectsApiAdminProjectsGet,
  updateComponentKindApiAdminComponentKindsKindIdPatch,
  updateMonitoredComponentApiAdminMonitoredComponentsComponentIdPatch,
  updateProjectApiAdminProjectsProjectIdPatch,
} from './generated/admin-catalog/admin-catalog'
import {
  addIncidentUpdateApiAdminIncidentsIncidentIdUpdatesPost,
  createProjectIncidentApiAdminProjectsProjectIdIncidentsPost,
  deleteIncidentApiAdminIncidentsIncidentIdDelete,
  deleteIncidentEntryApiAdminIncidentUpdatesUpdateIdDelete,
  listProjectIncidentsApiAdminProjectsProjectIdIncidentsGet,
  updateIncidentApiAdminIncidentsIncidentIdPatch,
  updateIncidentEntryApiAdminIncidentUpdatesUpdateIdPatch,
} from './generated/admin-incidents/admin-incidents'
import {
  getMonitoringSettingsApiAdminMonitoringSettingsGet,
  getSpeedTestAdvisoryApiAdminMonitoringSpeedTestAdvisoryGet,
  listCheckResultsApiAdminMonitoringMonitoredComponentsComponentIdCheckResultsGet,
  listConnectionEventsApiAdminMonitoringMonitoredComponentsComponentIdConnectionEventsGet,
  purgeCheckHistoryApiAdminMonitoringMonitoredComponentsComponentIdCheckResultsDelete,
  runManualCheckApiAdminMonitoringMonitoredComponentsComponentIdCheckPost,
  updateMonitoringSettingsApiAdminMonitoringSettingsPatch,
} from './generated/admin-monitoring/admin-monitoring'
import {
  disable2faApiAuth2faDisablePost,
  enable2faApiAuth2faEnablePost,
  googleLoginApiAuthGoogleLoginPost,
  linkPasswordApiAuthPasswordLinkPost,
  login2faApiAuthLogin2faPost,
  loginApiAuthLoginPost,
  logoutApiAuthLogoutPost,
  meApiAuthMeGet,
  registerApiAuthRegisterPost,
  registrationStatusApiAuthRegistrationStatusGet,
  setup2faApiAuth2faSetupPost,
} from './generated/auth/auth'
import type { AccountAdminResponse } from './generated/models/accountAdminResponse'
import type { AccountResponse } from './generated/models/accountResponse'
import type { AdminDashboardResponse } from './generated/models/adminDashboardResponse'
import type { CheckResultResponse } from './generated/models/checkResultResponse'
import type { MfaRequiredResponse } from './generated/models/mfaRequiredResponse'
import type { ComponentKindCreate } from './generated/models/componentKindCreate'
import type { ComponentKindResponse } from './generated/models/componentKindResponse'
import type { ComponentKindUpdate } from './generated/models/componentKindUpdate'
import type { IncidentCreate } from './generated/models/incidentCreate'
import type { IncidentResponse } from './generated/models/incidentResponse'
import type { IncidentUpdateCreate } from './generated/models/incidentUpdateCreate'
import type { IncidentUpdatePayload } from './generated/models/incidentUpdatePayload'
import type { IncidentUpdateResponse } from './generated/models/incidentUpdateResponse'
import type { IncidentUpdateUpdate } from './generated/models/incidentUpdateUpdate'
import type { MonitoredComponentCreate } from './generated/models/monitoredComponentCreate'
import type { MonitoredComponentResponse } from './generated/models/monitoredComponentResponse'
import type { MonitoredComponentUpdate } from './generated/models/monitoredComponentUpdate'
import type { MonitoringSettingsResponse } from './generated/models/monitoringSettingsResponse'
import type { MonitoringSettingsUpdate } from './generated/models/monitoringSettingsUpdate'
import type { NetworkSummary } from './generated/models/networkSummary'
import type { PaginatedAccountAdminResponse } from './generated/models/paginatedAccountAdminResponse'
import type { ConnectionEventResponse } from './generated/models/connectionEventResponse'
import type { PaginatedConnectionEventResponse } from './generated/models/paginatedConnectionEventResponse'
import type { PaginatedCheckResultResponse } from './generated/models/paginatedCheckResultResponse'
import type { PaginatedComponentKindResponse } from './generated/models/paginatedComponentKindResponse'
import type { PaginatedMonitoredComponentResponse } from './generated/models/paginatedMonitoredComponentResponse'
import type { PaginatedProjectResponse } from './generated/models/paginatedProjectResponse'
import type { ProjectCreate } from './generated/models/projectCreate'
import type { ProjectResponse } from './generated/models/projectResponse'
import type { ProjectUpdate } from './generated/models/projectUpdate'
import type { PublicDayBar } from './generated/models/publicDayBar'
import type { PublicProjectHistory } from './generated/models/publicProjectHistory'
import type { PublicProjectStatus } from './generated/models/publicProjectStatus'
import type { PublicProjectSummary } from './generated/models/publicProjectSummary'
import type { PublicSystemStatus } from './generated/models/publicSystemStatus'
import type { PurgeCheckHistoryResponse } from './generated/models/purgeCheckHistoryResponse'
import type { RegistrationStatusResponse } from './generated/models/registrationStatusResponse'
import type { RegisterRequest } from './generated/models/registerRequest'
import type { SpeedTestAdvisoryResponse } from './generated/models/speedTestAdvisoryResponse'
import type { TwoFactorSetupResponse } from './generated/models/twoFactorSetupResponse'
import type { VpnCheckConfig } from './generated/models/vpnCheckConfig'
import type { PublicTunnelMetrics } from './tunnelMetrics'
import {
  getPublicProjectHistoryApiStatusProjectsSlugHistoryGet,
  getPublicProjectStatusApiStatusProjectsSlugGet,
  getPublicSystemStatusApiStatusProjectsSlugSystemStatusGet,
  listPublicProjectsApiStatusProjectsGet,
} from './generated/public-status/public-status'
import { ApiError, customFetch } from './mutator'
import { DEFAULT_SPEED_TEST_URL_TEMPLATE } from '../utils/speedTestConfig'
import type {
  ComponentGroupCreate,
  ComponentGroupResponse,
  ComponentGroupUpdate,
  PaginatedComponentGroupResponse,
} from './componentGroups'

export type {
  ComponentGroupCreate,
  ComponentGroupResponse,
  ComponentGroupUpdate,
  PaginatedComponentGroupResponse,
  PublicServiceGroupStatus,
} from './componentGroups'

export type Account = AccountResponse
export type Project = ProjectResponse
export type ComponentKind = ComponentKindResponse
export type ComponentGroup = ComponentGroupResponse
export type MonitoredComponent = MonitoredComponentResponse
export type CheckResult = CheckResultResponse
export type MonitoringSettings = MonitoringSettingsResponse
export type SpeedTestAdvisory = SpeedTestAdvisoryResponse
export type Incident = IncidentResponse

export type ConnectionEvent = ConnectionEventResponse

/** Login/Google login payload: account session or MFA challenge. */
export type ApiResponseLoginResultData = AccountResponse | MfaRequiredResponse

export type {
  AccountAdminResponse,
  AdminDashboardResponse,
  CheckResultResponse,
  ConnectionEventResponse,
  ComponentKindCreate,
  ComponentKindUpdate,
  IncidentCreate,
  IncidentResponse,
  IncidentUpdateCreate,
  MonitoredComponentCreate,
  MonitoredComponentUpdate,
  MonitoringSettingsUpdate,
  NetworkSummary,
  PaginatedAccountAdminResponse,
  PaginatedCheckResultResponse,
  PaginatedConnectionEventResponse,
  PaginatedComponentKindResponse,
  PaginatedMonitoredComponentResponse,
  PaginatedProjectResponse,
  ProjectCreate,
  ProjectUpdate,
  PublicDayBar,
  PublicProjectHistory,
  PublicProjectStatus,
  PublicProjectSummary,
  PublicSystemStatus,
  PublicTunnelMetrics,
  PurgeCheckHistoryResponse,
  RegistrationStatusResponse,
  RegisterRequest,
  SpeedTestAdvisoryResponse,
  TwoFactorSetupResponse,
  VpnCheckConfig,
}

export type {
  PublicTunnelConnectionEvent,
  PublicTunnelLatestDiagnostics,
  PublicTunnelMetricPoint,
} from './tunnelMetrics'

export type DatagateIntegration = {
  project_id: string
  base_url: string
  client_id: string
  client_secret_set: boolean
  monitor_cn_prefix: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export type DatagateServerSummary = {
  id: number
  server_type: number
  check_type: string
  server_name: string
  api_url?: string | null
  is_online: boolean
  is_disabled: boolean
  tags: string[]
  host?: string | null
  port?: number | null
  proto?: string | null
}

export type DatagateLocalComponent = {
  id: string
  name: string
  slug: string
  check_type: string
  datagate_server_id?: number | null
  datagate_common_name?: string | null
}

export type DatagateMatchedPair = {
  server: DatagateServerSummary
  component: DatagateLocalComponent
  name_differs: boolean
  suggested_name: string
  endpoint_match: boolean
  proto?: string | null
  already_linked: boolean
  score: number
}

export type DatagatePreview = {
  matched: DatagateMatchedPair[]
  new_servers: DatagateServerSummary[]
  unmatched_local: DatagateLocalComponent[]
  removed_local: DatagateLocalComponent[]
  sync_names_question?: string | null
}

export type DatagateImportResponse = {
  items: Array<{
    server_id: number
    server_name: string
    action: string
    component_id?: string | null
    message?: string | null
  }>
  created: number
  updated: number
  skipped: number
  deactivated: number
  deleted: number
  errors: number
}

export { DEFAULT_SPEED_TEST_URL_TEMPLATE }

export { ApiError }

export const api = {
  registrationStatus: (): Promise<RegistrationStatusResponse> => registrationStatusApiAuthRegistrationStatusGet(),

  googleLogin: (idToken: string): Promise<ApiResponseLoginResultData> =>
    googleLoginApiAuthGoogleLoginPost({ idToken }),

  register: (payload: RegisterRequest): Promise<AccountResponse> => registerApiAuthRegisterPost(payload),

  login: (payload: { email: string; password: string }): Promise<ApiResponseLoginResultData> =>
    loginApiAuthLoginPost(payload),

  login2fa: (payload: { mfa_token: string; code: string }): Promise<AccountResponse> =>
    login2faApiAuthLogin2faPost(payload),

  logout: async (): Promise<void> => {
    await logoutApiAuthLogoutPost()
  },

  me: (): Promise<AccountResponse | undefined> => meApiAuthMeGet(),

  dashboard: (): Promise<AdminDashboardResponse> => adminDashboardApiAdminDashboardGet(),

  linkPassword: (password: string): Promise<AccountResponse> => linkPasswordApiAuthPasswordLinkPost({ password }),

  setup2fa: (): Promise<TwoFactorSetupResponse> => setup2faApiAuth2faSetupPost(),

  enable2fa: (code: string): Promise<AccountResponse> => enable2faApiAuth2faEnablePost({ code }),

  disable2fa: (payload: { password: string; code: string }): Promise<AccountResponse> =>
    disable2faApiAuth2faDisablePost(payload),

  listProjects: (offset = 0, limit = 100): Promise<PaginatedProjectResponse> =>
    listProjectsApiAdminProjectsGet({ offset, limit }),

  createProject: (payload: ProjectCreate): Promise<ProjectResponse> => createProjectApiAdminProjectsPost(payload),

  updateProject: (id: string, payload: ProjectUpdate): Promise<ProjectResponse> =>
    updateProjectApiAdminProjectsProjectIdPatch(id, payload),

  deleteProject: async (id: string): Promise<void> => {
    await deleteProjectApiAdminProjectsProjectIdDelete(id)
  },

  listComponentKinds: (offset = 0, limit = 100): Promise<PaginatedComponentKindResponse> =>
    listComponentKindsApiAdminComponentKindsGet({ offset, limit }),

  createComponentKind: (payload: ComponentKindCreate): Promise<ComponentKindResponse> =>
    createComponentKindApiAdminComponentKindsPost(payload),

  updateComponentKind: (id: string, payload: ComponentKindUpdate): Promise<ComponentKindResponse> =>
    updateComponentKindApiAdminComponentKindsKindIdPatch(id, payload),

  deleteComponentKind: async (id: string): Promise<void> => {
    await deleteComponentKindApiAdminComponentKindsKindIdDelete(id)
  },

  listComponentGroups: (
    projectId: string,
    offset = 0,
    limit = 100,
  ): Promise<PaginatedComponentGroupResponse> =>
    customFetch<PaginatedComponentGroupResponse>(
      `/api/admin/component-groups?project_id=${encodeURIComponent(projectId)}&offset=${offset}&limit=${limit}`,
      { method: 'GET' },
    ),

  createComponentGroup: (payload: ComponentGroupCreate): Promise<ComponentGroupResponse> =>
    customFetch<ComponentGroupResponse>('/api/admin/component-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  updateComponentGroup: (id: string, payload: ComponentGroupUpdate): Promise<ComponentGroupResponse> =>
    customFetch<ComponentGroupResponse>(`/api/admin/component-groups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  deleteComponentGroup: async (id: string): Promise<void> => {
    await customFetch(`/api/admin/component-groups/${id}`, { method: 'DELETE' })
  },

  listMonitoredComponents: (
    projectId?: string,
    offset = 0,
    limit = 100,
  ): Promise<PaginatedMonitoredComponentResponse> =>
    listMonitoredComponentsApiAdminMonitoredComponentsGet({
      project_id: projectId,
      offset,
      limit,
    }),

  createMonitoredComponent: (payload: MonitoredComponentCreate): Promise<MonitoredComponentResponse> =>
    createMonitoredComponentApiAdminMonitoredComponentsPost(payload),

  updateMonitoredComponent: (id: string, payload: MonitoredComponentUpdate): Promise<MonitoredComponentResponse> =>
    updateMonitoredComponentApiAdminMonitoredComponentsComponentIdPatch(id, payload),

  deleteMonitoredComponent: async (id: string): Promise<void> => {
    await deleteMonitoredComponentApiAdminMonitoredComponentsComponentIdDelete(id)
  },

  getMonitoringSettings: (): Promise<MonitoringSettingsResponse> =>
    getMonitoringSettingsApiAdminMonitoringSettingsGet(),

  updateMonitoringSettings: (payload: MonitoringSettingsUpdate): Promise<MonitoringSettingsResponse> =>
    updateMonitoringSettingsApiAdminMonitoringSettingsPatch(payload),

  getSpeedTestAdvisory: (projectId?: string): Promise<SpeedTestAdvisoryResponse> =>
    getSpeedTestAdvisoryApiAdminMonitoringSpeedTestAdvisoryGet(
      projectId ? { project_id: projectId } : undefined,
    ),

  runManualCheck: (componentId: string): Promise<CheckResultResponse> =>
    runManualCheckApiAdminMonitoringMonitoredComponentsComponentIdCheckPost(componentId),

  listCheckResults: (componentId: string, limit = 20): Promise<PaginatedCheckResultResponse> =>
    listCheckResultsApiAdminMonitoringMonitoredComponentsComponentIdCheckResultsGet(componentId, {
      limit,
    }),

  purgeCheckHistory: (componentId: string, keep = 0): Promise<PurgeCheckHistoryResponse> =>
    purgeCheckHistoryApiAdminMonitoringMonitoredComponentsComponentIdCheckResultsDelete(componentId, { keep }),

  listConnectionEvents: (componentId: string, limit = 50): Promise<PaginatedConnectionEventResponse> =>
    listConnectionEventsApiAdminMonitoringMonitoredComponentsComponentIdConnectionEventsGet(componentId, {
      limit,
    }),

  listProjectIncidents: (projectId: string): Promise<IncidentResponse[]> =>
    listProjectIncidentsApiAdminProjectsProjectIdIncidentsGet(projectId),

  createProjectIncident: (projectId: string, payload: IncidentCreate): Promise<IncidentResponse> =>
    createProjectIncidentApiAdminProjectsProjectIdIncidentsPost(projectId, payload),

  updateIncident: (incidentId: string, payload: IncidentUpdatePayload): Promise<IncidentResponse> =>
    updateIncidentApiAdminIncidentsIncidentIdPatch(incidentId, payload),

  deleteIncident: async (incidentId: string): Promise<void> => {
    await deleteIncidentApiAdminIncidentsIncidentIdDelete(incidentId)
  },

  addIncidentUpdate: (incidentId: string, payload: IncidentUpdateCreate) =>
    addIncidentUpdateApiAdminIncidentsIncidentIdUpdatesPost(incidentId, payload),

  updateIncidentUpdate: (updateId: string, payload: IncidentUpdateUpdate): Promise<IncidentUpdateResponse> =>
    updateIncidentEntryApiAdminIncidentUpdatesUpdateIdPatch(updateId, payload),

  deleteIncidentUpdate: async (updateId: string): Promise<void> => {
    await deleteIncidentEntryApiAdminIncidentUpdatesUpdateIdDelete(updateId)
  },

  listAccounts: (offset = 0, limit = 100): Promise<PaginatedAccountAdminResponse> =>
    listAccountsApiAdminAccountsGet({ offset, limit }),

  updateAccountRoles: (id: string, access_roles: string[]): Promise<AccountAdminResponse> =>
    updateAccountRolesApiAdminAccountsAccountIdRolesPut(id, { access_roles }),

  getDatagateIntegration: (projectId: string): Promise<DatagateIntegration | null> =>
    customFetch<DatagateIntegration | null>(`/api/admin/projects/${encodeURIComponent(projectId)}/datagate`, {
      method: 'GET',
    }),

  upsertDatagateIntegration: (
    projectId: string,
    payload: {
      base_url: string
      client_id: string
      client_secret?: string | null
      monitor_cn_prefix: string
      is_enabled: boolean
    },
  ): Promise<DatagateIntegration> =>
    customFetch<DatagateIntegration>(`/api/admin/projects/${encodeURIComponent(projectId)}/datagate`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  testDatagateConnection: (projectId: string): Promise<{ ok: boolean; server_count: number; message: string }> =>
    customFetch(`/api/admin/projects/${encodeURIComponent(projectId)}/datagate/test`, { method: 'POST' }),

  listDatagateServers: (projectId: string): Promise<DatagateServerSummary[]> =>
    customFetch(`/api/admin/projects/${encodeURIComponent(projectId)}/datagate/servers`, { method: 'GET' }),

  previewDatagateImport: (projectId: string): Promise<DatagatePreview> =>
    customFetch(`/api/admin/projects/${encodeURIComponent(projectId)}/datagate/preview`, { method: 'POST' }),

  importDatagateServers: (
    projectId: string,
    payload: {
      sync_names: boolean
      refresh_configs: boolean
      import_new: boolean
      deactivate_removed?: boolean
      delete_removed?: boolean
      server_ids?: number[] | null
    },
  ): Promise<DatagateImportResponse> =>
    customFetch(`/api/admin/projects/${encodeURIComponent(projectId)}/datagate/import`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listPublicProjects: (): Promise<PublicProjectSummary[]> => listPublicProjectsApiStatusProjectsGet(),

  getPublicProjectStatus: (slug: string): Promise<PublicProjectStatus> =>
    getPublicProjectStatusApiStatusProjectsSlugGet(slug),

  getPublicProjectHistory: (slug: string): Promise<PublicProjectHistory> =>
    getPublicProjectHistoryApiStatusProjectsSlugHistoryGet(slug),

  getPublicSystemStatus: (
    slug: string,
    params?: { end?: string; days?: number },
  ): Promise<PublicSystemStatus> => getPublicSystemStatusApiStatusProjectsSlugSystemStatusGet(slug, params),

  getPublicTunnelMetrics: (
    projectSlug: string,
    serviceSlug: string,
    params?: { hours?: number },
  ): Promise<PublicTunnelMetrics> => {
    const search = new URLSearchParams()
    if (params?.hours != null) search.set('hours', String(params.hours))
    const query = search.toString()
    const path = `/api/status/projects/${encodeURIComponent(projectSlug)}/services/${encodeURIComponent(serviceSlug)}/tunnel-metrics`
    return customFetch<PublicTunnelMetrics>(query ? `${path}?${query}` : path)
  },
}

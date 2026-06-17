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
} from './generated/admin-incidents/admin-incidents'
import {
  getMonitoringSettingsApiAdminMonitoringSettingsGet,
  listCheckResultsApiAdminMonitoringMonitoredComponentsComponentIdCheckResultsGet,
  runManualCheckApiAdminMonitoringMonitoredComponentsComponentIdCheckPost,
  updateMonitoringSettingsApiAdminMonitoringSettingsPatch,
} from './generated/admin-monitoring/admin-monitoring'
import {
  disable2faApiAuth2faDisablePost,
  enable2faApiAuth2faEnablePost,
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
import type { ApiResponseLoginResultData } from './generated/models/apiResponseLoginResultData'
import type { CheckResultResponse } from './generated/models/checkResultResponse'
import type { ComponentKindCreate } from './generated/models/componentKindCreate'
import type { ComponentKindResponse } from './generated/models/componentKindResponse'
import type { ComponentKindUpdate } from './generated/models/componentKindUpdate'
import type { IncidentCreate } from './generated/models/incidentCreate'
import type { IncidentResponse } from './generated/models/incidentResponse'
import type { IncidentUpdateCreate } from './generated/models/incidentUpdateCreate'
import type { MonitoredComponentCreate } from './generated/models/monitoredComponentCreate'
import type { MonitoredComponentResponse } from './generated/models/monitoredComponentResponse'
import type { MonitoredComponentUpdate } from './generated/models/monitoredComponentUpdate'
import type { MonitoringSettingsResponse } from './generated/models/monitoringSettingsResponse'
import type { MonitoringSettingsUpdate } from './generated/models/monitoringSettingsUpdate'
import type { PaginatedAccountAdminResponse } from './generated/models/paginatedAccountAdminResponse'
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
import type { PublicServiceStatus } from './generated/models/publicServiceStatus'
import type { PublicSystemStatus } from './generated/models/publicSystemStatus'
import type { RegistrationStatusResponse as GeneratedRegistrationStatusResponse } from './generated/models/registrationStatusResponse'
import type { TwoFactorSetupResponse } from './generated/models/twoFactorSetupResponse'
import {
  getPublicProjectHistoryApiStatusProjectsSlugHistoryGet,
  getPublicProjectStatusApiStatusProjectsSlugGet,
  getPublicSystemStatusApiStatusProjectsSlugSystemStatusGet,
  listPublicProjectsApiStatusProjectsGet,
} from './generated/public-status/public-status'
import customFetch, { ApiError } from './mutator'

export type Account = AccountResponse
export type Project = ProjectResponse
export type ComponentKind = ComponentKindResponse
export type MonitoredComponent = MonitoredComponentResponse
export type CheckResult = CheckResultResponse
export type MonitoringSettings = MonitoringSettingsResponse
export type Incident = IncidentResponse
export type Paginated<T> = {
  items: T[]
  total: number
  offset: number
  limit: number
  has_next: boolean
  has_previous: boolean
}

export type RegistrationStatusResponse = GeneratedRegistrationStatusResponse & {
  require_email_verification: boolean
}

export type {
  AccountAdminResponse,
  AdminDashboardResponse,
  ApiResponseLoginResultData,
  CheckResultResponse,
  ComponentKindCreate,
  ComponentKindUpdate,
  IncidentCreate,
  IncidentResponse,
  IncidentUpdateCreate,
  MonitoredComponentCreate,
  MonitoredComponentUpdate,
  MonitoringSettingsUpdate,
  PaginatedAccountAdminResponse,
  PaginatedCheckResultResponse,
  PaginatedComponentKindResponse,
  PaginatedMonitoredComponentResponse,
  PaginatedProjectResponse,
  ProjectCreate,
  ProjectUpdate,
  PublicProjectHistory,
  PublicProjectStatus,
  PublicProjectSummary,
  PublicDayBar,
  PublicServiceStatus,
  PublicSystemStatus,
  TwoFactorSetupResponse,
}

export { ApiError }

async function call<T>(request: () => Promise<unknown>): Promise<T> {
  return request() as Promise<T>
}

export const api = {
  registrationStatus: (): Promise<RegistrationStatusResponse> =>
    call(() => registrationStatusApiAuthRegistrationStatusGet()),

  googleLogin: (idToken: string): Promise<ApiResponseLoginResultData> =>
    call(() =>
      customFetch<ApiResponseLoginResultData>('/api/auth/google-login', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),
    ),

  register: (payload: { email: string; password: string; full_name?: string }) =>
    call<AccountResponse>(() => registerApiAuthRegisterPost(payload)),

  login: (payload: { email: string; password: string }): Promise<ApiResponseLoginResultData> =>
    call(() => loginApiAuthLoginPost(payload)),

  login2fa: (payload: { mfa_token: string; code: string }): Promise<AccountResponse> =>
    call(() => login2faApiAuthLogin2faPost(payload)),

  logout: (): Promise<void> => call(() => logoutApiAuthLogoutPost()),

  me: (): Promise<AccountResponse> => call(() => meApiAuthMeGet()),

  dashboard: (): Promise<AdminDashboardResponse> => call(() => adminDashboardApiAdminDashboardGet()),

  linkPassword: (password: string): Promise<AccountResponse> =>
    call(() => linkPasswordApiAuthPasswordLinkPost({ password })),

  setup2fa: (): Promise<TwoFactorSetupResponse> => call(() => setup2faApiAuth2faSetupPost()),

  enable2fa: (code: string): Promise<AccountResponse> =>
    call(() => enable2faApiAuth2faEnablePost({ code })),

  disable2fa: (payload: { password: string; code: string }): Promise<AccountResponse> =>
    call(() => disable2faApiAuth2faDisablePost(payload)),

  listProjects: (offset = 0, limit = 100): Promise<PaginatedProjectResponse> =>
    call(() => listProjectsApiAdminProjectsGet({ offset, limit })),

  createProject: (payload: ProjectCreate): Promise<ProjectResponse> =>
    call(() => createProjectApiAdminProjectsPost(payload)),

  updateProject: (id: string, payload: ProjectUpdate): Promise<ProjectResponse> =>
    call(() => updateProjectApiAdminProjectsProjectIdPatch(id, payload)),

  deleteProject: (id: string): Promise<void> =>
    call(() => deleteProjectApiAdminProjectsProjectIdDelete(id)),

  listComponentKinds: (offset = 0, limit = 100): Promise<PaginatedComponentKindResponse> =>
    call(() => listComponentKindsApiAdminComponentKindsGet({ offset, limit })),

  createComponentKind: (payload: ComponentKindCreate): Promise<ComponentKindResponse> =>
    call(() => createComponentKindApiAdminComponentKindsPost(payload)),

  updateComponentKind: (id: string, payload: ComponentKindUpdate): Promise<ComponentKindResponse> =>
    call(() => updateComponentKindApiAdminComponentKindsKindIdPatch(id, payload)),

  deleteComponentKind: (id: string): Promise<void> =>
    call(() => deleteComponentKindApiAdminComponentKindsKindIdDelete(id)),

  listMonitoredComponents: (
    projectId?: string,
    offset = 0,
    limit = 100,
  ): Promise<PaginatedMonitoredComponentResponse> =>
    call(() =>
      listMonitoredComponentsApiAdminMonitoredComponentsGet({
        project_id: projectId,
        offset,
        limit,
      }),
    ),

  createMonitoredComponent: (payload: MonitoredComponentCreate): Promise<MonitoredComponentResponse> =>
    call(() => createMonitoredComponentApiAdminMonitoredComponentsPost(payload)),

  updateMonitoredComponent: (
    id: string,
    payload: MonitoredComponentUpdate,
  ): Promise<MonitoredComponentResponse> =>
    call(() => updateMonitoredComponentApiAdminMonitoredComponentsComponentIdPatch(id, payload)),

  deleteMonitoredComponent: (id: string): Promise<void> =>
    call(() => deleteMonitoredComponentApiAdminMonitoredComponentsComponentIdDelete(id)),

  getMonitoringSettings: (): Promise<MonitoringSettingsResponse> =>
    call(() => getMonitoringSettingsApiAdminMonitoringSettingsGet()),

  updateMonitoringSettings: (payload: MonitoringSettingsUpdate): Promise<MonitoringSettingsResponse> =>
    call(() => updateMonitoringSettingsApiAdminMonitoringSettingsPatch(payload)),

  runManualCheck: (componentId: string): Promise<CheckResultResponse> =>
    call(() => runManualCheckApiAdminMonitoringMonitoredComponentsComponentIdCheckPost(componentId)),

  listCheckResults: (componentId: string, limit = 20): Promise<PaginatedCheckResultResponse> =>
    call(() =>
      listCheckResultsApiAdminMonitoringMonitoredComponentsComponentIdCheckResultsGet(componentId, {
        limit,
      }),
    ),

  listProjectIncidents: (projectId: string): Promise<IncidentResponse[]> =>
    call(() => listProjectIncidentsApiAdminProjectsProjectIdIncidentsGet(projectId)),

  createProjectIncident: (projectId: string, payload: IncidentCreate): Promise<IncidentResponse> =>
    call(() => createProjectIncidentApiAdminProjectsProjectIdIncidentsPost(projectId, payload)),

  deleteIncident: (incidentId: string): Promise<void> =>
    call(() => deleteIncidentApiAdminIncidentsIncidentIdDelete(incidentId)),

  addIncidentUpdate: (incidentId: string, payload: IncidentUpdateCreate) =>
    call(() => addIncidentUpdateApiAdminIncidentsIncidentIdUpdatesPost(incidentId, payload)),

  deleteIncidentUpdate: (updateId: string): Promise<void> =>
    call(() => deleteIncidentEntryApiAdminIncidentUpdatesUpdateIdDelete(updateId)),

  listAccounts: (offset = 0, limit = 100): Promise<PaginatedAccountAdminResponse> =>
    call(() => listAccountsApiAdminAccountsGet({ offset, limit })),

  updateAccountRoles: (id: string, access_roles: string[]): Promise<AccountAdminResponse> =>
    call(() => updateAccountRolesApiAdminAccountsAccountIdRolesPut(id, { access_roles })),

  listPublicProjects: (): Promise<PublicProjectSummary[]> =>
    call(() => listPublicProjectsApiStatusProjectsGet()),

  getPublicProjectStatus: (slug: string): Promise<PublicProjectStatus> =>
    call(() => getPublicProjectStatusApiStatusProjectsSlugGet(slug)),

  getPublicProjectHistory: (slug: string): Promise<PublicProjectHistory> =>
    call(() => getPublicProjectHistoryApiStatusProjectsSlugHistoryGet(slug)),

  getPublicSystemStatus: (
    slug: string,
    params?: { end?: string; days?: number },
  ): Promise<PublicSystemStatus> =>
    call(() => getPublicSystemStatusApiStatusProjectsSlugSystemStatusGet(slug, params)),
}

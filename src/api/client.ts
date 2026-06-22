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
  getSpeedTestAdvisoryApiAdminMonitoringSpeedTestAdvisoryGet,
  listCheckResultsApiAdminMonitoringMonitoredComponentsComponentIdCheckResultsGet,
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
import type { NetworkSummary } from './generated/models/networkSummary'
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
import type { PublicSystemStatus } from './generated/models/publicSystemStatus'
import type { PurgeCheckHistoryResponse } from './generated/models/purgeCheckHistoryResponse'
import type { RegistrationStatusResponse } from './generated/models/registrationStatusResponse'
import type { RegisterRequest } from './generated/models/registerRequest'
import type { SpeedTestAdvisoryResponse } from './generated/models/speedTestAdvisoryResponse'
import type { TwoFactorSetupResponse } from './generated/models/twoFactorSetupResponse'
import type { VpnCheckConfig } from './generated/models/vpnCheckConfig'
import {
  getPublicProjectHistoryApiStatusProjectsSlugHistoryGet,
  getPublicProjectStatusApiStatusProjectsSlugGet,
  getPublicSystemStatusApiStatusProjectsSlugSystemStatusGet,
  listPublicProjectsApiStatusProjectsGet,
} from './generated/public-status/public-status'
import { ApiError } from './mutator'
import { DEFAULT_SPEED_TEST_URL_TEMPLATE } from '../utils/speedTestConfig'

export type Account = AccountResponse
export type Project = ProjectResponse
export type ComponentKind = ComponentKindResponse
export type MonitoredComponent = MonitoredComponentResponse
export type CheckResult = CheckResultResponse
export type MonitoringSettings = MonitoringSettingsResponse
export type SpeedTestAdvisory = SpeedTestAdvisoryResponse
export type Incident = IncidentResponse

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
  NetworkSummary,
  PaginatedAccountAdminResponse,
  PaginatedCheckResultResponse,
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
  PurgeCheckHistoryResponse,
  RegistrationStatusResponse,
  RegisterRequest,
  SpeedTestAdvisoryResponse,
  TwoFactorSetupResponse,
  VpnCheckConfig,
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

  me: (): Promise<AccountResponse> => meApiAuthMeGet(),

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

  listProjectIncidents: (projectId: string): Promise<IncidentResponse[]> =>
    listProjectIncidentsApiAdminProjectsProjectIdIncidentsGet(projectId),

  createProjectIncident: (projectId: string, payload: IncidentCreate): Promise<IncidentResponse> =>
    createProjectIncidentApiAdminProjectsProjectIdIncidentsPost(projectId, payload),

  deleteIncident: async (incidentId: string): Promise<void> => {
    await deleteIncidentApiAdminIncidentsIncidentIdDelete(incidentId)
  },

  addIncidentUpdate: (incidentId: string, payload: IncidentUpdateCreate) =>
    addIncidentUpdateApiAdminIncidentsIncidentIdUpdatesPost(incidentId, payload),

  deleteIncidentUpdate: async (updateId: string): Promise<void> => {
    await deleteIncidentEntryApiAdminIncidentUpdatesUpdateIdDelete(updateId)
  },

  listAccounts: (offset = 0, limit = 100): Promise<PaginatedAccountAdminResponse> =>
    listAccountsApiAdminAccountsGet({ offset, limit }),

  updateAccountRoles: (id: string, access_roles: string[]): Promise<AccountAdminResponse> =>
    updateAccountRolesApiAdminAccountsAccountIdRolesPut(id, { access_roles }),

  listPublicProjects: (): Promise<PublicProjectSummary[]> => listPublicProjectsApiStatusProjectsGet(),

  getPublicProjectStatus: (slug: string): Promise<PublicProjectStatus> =>
    getPublicProjectStatusApiStatusProjectsSlugGet(slug),

  getPublicProjectHistory: (slug: string): Promise<PublicProjectHistory> =>
    getPublicProjectHistoryApiStatusProjectsSlugHistoryGet(slug),

  getPublicSystemStatus: (
    slug: string,
    params?: { end?: string; days?: number },
  ): Promise<PublicSystemStatus> => getPublicSystemStatusApiStatusProjectsSlugSystemStatusGet(slug, params),
}

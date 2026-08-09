import { beforeEach, describe, expect, it, vi } from 'vitest'

const registrationStatus = vi.fn()
const googleLogin = vi.fn()
const register = vi.fn()
const login = vi.fn()
const login2fa = vi.fn()
const logout = vi.fn()
const me = vi.fn()
const dashboard = vi.fn()
const linkPassword = vi.fn()
const setup2fa = vi.fn()
const enable2fa = vi.fn()
const disable2fa = vi.fn()
const listProjects = vi.fn()
const createProject = vi.fn()
const updateProject = vi.fn()
const deleteProject = vi.fn()
const listComponentKinds = vi.fn()
const createComponentKind = vi.fn()
const updateComponentKind = vi.fn()
const deleteComponentKind = vi.fn()
const listMonitoredComponents = vi.fn()
const createMonitoredComponent = vi.fn()
const updateMonitoredComponent = vi.fn()
const deleteMonitoredComponent = vi.fn()
const getMonitoringSettings = vi.fn()
const updateMonitoringSettings = vi.fn()
const getSpeedTestAdvisory = vi.fn()
const runManualCheck = vi.fn()
const listCheckResults = vi.fn()
const purgeCheckHistory = vi.fn()
const listConnectionEvents = vi.fn()
const listProjectIncidents = vi.fn()
const createProjectIncident = vi.fn()
const updateIncident = vi.fn()
const deleteIncident = vi.fn()
const addIncidentUpdate = vi.fn()
const updateIncidentUpdate = vi.fn()
const deleteIncidentUpdate = vi.fn()
const listAccounts = vi.fn()
const updateAccountRoles = vi.fn()
const listPublicProjects = vi.fn()
const getPublicProjectStatus = vi.fn()
const getPublicProjectHistory = vi.fn()
const getPublicSystemStatus = vi.fn()
const customFetch = vi.fn()

vi.mock('./generated/admin/admin', () => ({
  adminDashboardApiAdminDashboardGet: (...args: unknown[]) => dashboard(...args),
}))

vi.mock('./generated/admin-accounts/admin-accounts', () => ({
  listAccountsApiAdminAccountsGet: (...args: unknown[]) => listAccounts(...args),
  updateAccountRolesApiAdminAccountsAccountIdRolesPut: (...args: unknown[]) => updateAccountRoles(...args),
}))

vi.mock('./generated/admin-catalog/admin-catalog', () => ({
  listProjectsApiAdminProjectsGet: (...args: unknown[]) => listProjects(...args),
  createProjectApiAdminProjectsPost: (...args: unknown[]) => createProject(...args),
  updateProjectApiAdminProjectsProjectIdPatch: (...args: unknown[]) => updateProject(...args),
  deleteProjectApiAdminProjectsProjectIdDelete: (...args: unknown[]) => deleteProject(...args),
  listComponentKindsApiAdminComponentKindsGet: (...args: unknown[]) => listComponentKinds(...args),
  createComponentKindApiAdminComponentKindsPost: (...args: unknown[]) => createComponentKind(...args),
  updateComponentKindApiAdminComponentKindsKindIdPatch: (...args: unknown[]) => updateComponentKind(...args),
  deleteComponentKindApiAdminComponentKindsKindIdDelete: (...args: unknown[]) => deleteComponentKind(...args),
  listMonitoredComponentsApiAdminMonitoredComponentsGet: (...args: unknown[]) => listMonitoredComponents(...args),
  createMonitoredComponentApiAdminMonitoredComponentsPost: (...args: unknown[]) => createMonitoredComponent(...args),
  updateMonitoredComponentApiAdminMonitoredComponentsComponentIdPatch: (...args: unknown[]) =>
    updateMonitoredComponent(...args),
  deleteMonitoredComponentApiAdminMonitoredComponentsComponentIdDelete: (...args: unknown[]) =>
    deleteMonitoredComponent(...args),
}))

vi.mock('./generated/admin-incidents/admin-incidents', () => ({
  listProjectIncidentsApiAdminProjectsProjectIdIncidentsGet: (...args: unknown[]) => listProjectIncidents(...args),
  createProjectIncidentApiAdminProjectsProjectIdIncidentsPost: (...args: unknown[]) =>
    createProjectIncident(...args),
  updateIncidentApiAdminIncidentsIncidentIdPatch: (...args: unknown[]) => updateIncident(...args),
  deleteIncidentApiAdminIncidentsIncidentIdDelete: (...args: unknown[]) => deleteIncident(...args),
  addIncidentUpdateApiAdminIncidentsIncidentIdUpdatesPost: (...args: unknown[]) => addIncidentUpdate(...args),
  updateIncidentEntryApiAdminIncidentUpdatesUpdateIdPatch: (...args: unknown[]) =>
    updateIncidentUpdate(...args),
  deleteIncidentEntryApiAdminIncidentUpdatesUpdateIdDelete: (...args: unknown[]) =>
    deleteIncidentUpdate(...args),
}))

vi.mock('./generated/admin-monitoring/admin-monitoring', () => ({
  getMonitoringSettingsApiAdminMonitoringSettingsGet: (...args: unknown[]) => getMonitoringSettings(...args),
  updateMonitoringSettingsApiAdminMonitoringSettingsPatch: (...args: unknown[]) =>
    updateMonitoringSettings(...args),
  getSpeedTestAdvisoryApiAdminMonitoringSpeedTestAdvisoryGet: (...args: unknown[]) =>
    getSpeedTestAdvisory(...args),
  runManualCheckApiAdminMonitoringMonitoredComponentsComponentIdCheckPost: (...args: unknown[]) =>
    runManualCheck(...args),
  listCheckResultsApiAdminMonitoringMonitoredComponentsComponentIdCheckResultsGet: (...args: unknown[]) =>
    listCheckResults(...args),
  purgeCheckHistoryApiAdminMonitoringMonitoredComponentsComponentIdCheckResultsDelete: (...args: unknown[]) =>
    purgeCheckHistory(...args),
  listConnectionEventsApiAdminMonitoringMonitoredComponentsComponentIdConnectionEventsGet: (...args: unknown[]) =>
    listConnectionEvents(...args),
}))

vi.mock('./generated/auth/auth', () => ({
  registrationStatusApiAuthRegistrationStatusGet: (...args: unknown[]) => registrationStatus(...args),
  googleLoginApiAuthGoogleLoginPost: (...args: unknown[]) => googleLogin(...args),
  registerApiAuthRegisterPost: (...args: unknown[]) => register(...args),
  loginApiAuthLoginPost: (...args: unknown[]) => login(...args),
  login2faApiAuthLogin2faPost: (...args: unknown[]) => login2fa(...args),
  logoutApiAuthLogoutPost: (...args: unknown[]) => logout(...args),
  meApiAuthMeGet: (...args: unknown[]) => me(...args),
  linkPasswordApiAuthPasswordLinkPost: (...args: unknown[]) => linkPassword(...args),
  setup2faApiAuth2faSetupPost: (...args: unknown[]) => setup2fa(...args),
  enable2faApiAuth2faEnablePost: (...args: unknown[]) => enable2fa(...args),
  disable2faApiAuth2faDisablePost: (...args: unknown[]) => disable2fa(...args),
}))

vi.mock('./generated/public-status/public-status', () => ({
  listPublicProjectsApiStatusProjectsGet: (...args: unknown[]) => listPublicProjects(...args),
  getPublicProjectStatusApiStatusProjectsSlugGet: (...args: unknown[]) => getPublicProjectStatus(...args),
  getPublicProjectHistoryApiStatusProjectsSlugHistoryGet: (...args: unknown[]) =>
    getPublicProjectHistory(...args),
  getPublicSystemStatusApiStatusProjectsSlugSystemStatusGet: (...args: unknown[]) =>
    getPublicSystemStatus(...args),
}))

vi.mock('./mutator', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status = 500) {
      super(message)
      this.status = status
    }
  },
  customFetch: (...args: unknown[]) => customFetch(...args),
}))

const { api } = await import('./client')

beforeEach(() => {
  vi.clearAllMocks()
  for (const fn of [
    registrationStatus,
    googleLogin,
    register,
    login,
    login2fa,
    logout,
    me,
    dashboard,
    linkPassword,
    setup2fa,
    enable2fa,
    disable2fa,
    listProjects,
    createProject,
    updateProject,
    deleteProject,
    listComponentKinds,
    createComponentKind,
    updateComponentKind,
    deleteComponentKind,
    listMonitoredComponents,
    createMonitoredComponent,
    updateMonitoredComponent,
    deleteMonitoredComponent,
    getMonitoringSettings,
    updateMonitoringSettings,
    getSpeedTestAdvisory,
    runManualCheck,
    listCheckResults,
    purgeCheckHistory,
    listConnectionEvents,
    listProjectIncidents,
    createProjectIncident,
    updateIncident,
    deleteIncident,
    addIncidentUpdate,
    updateIncidentUpdate,
    deleteIncidentUpdate,
    listAccounts,
    updateAccountRoles,
    listPublicProjects,
    getPublicProjectStatus,
    getPublicProjectHistory,
    getPublicSystemStatus,
    customFetch,
  ]) {
    fn.mockResolvedValue({})
  }
})

describe('api client wrappers', () => {
  it('delegates auth and account methods', async () => {
    await api.registrationStatus()
    await api.googleLogin('tok')
    await api.register({ email: 'a@b.c', password: 'x', full_name: null })
    await api.login({ email: 'a@b.c', password: 'x' })
    await api.login2fa({ mfa_token: 'm', code: '123456' })
    await api.logout()
    await api.me()
    await api.dashboard()
    await api.linkPassword('secret12')
    await api.setup2fa()
    await api.enable2fa('123456')
    await api.disable2fa({ password: 'p', code: '123456' })

    expect(registrationStatus).toHaveBeenCalled()
    expect(googleLogin).toHaveBeenCalledWith({ idToken: 'tok' })
    expect(register).toHaveBeenCalled()
    expect(login).toHaveBeenCalledWith({ email: 'a@b.c', password: 'x' })
    expect(login2fa).toHaveBeenCalled()
    expect(logout).toHaveBeenCalled()
    expect(me).toHaveBeenCalled()
    expect(dashboard).toHaveBeenCalled()
    expect(linkPassword).toHaveBeenCalledWith({ password: 'secret12' })
    expect(setup2fa).toHaveBeenCalled()
    expect(enable2fa).toHaveBeenCalledWith({ code: '123456' })
    expect(disable2fa).toHaveBeenCalledWith({ password: 'p', code: '123456' })
  })

  it('delegates catalog and monitoring methods', async () => {
    await api.listProjects()
    await api.listProjects(10, 20)
    await api.createProject({ name: 'P', slug: 'p', description: null, is_active: true })
    await api.updateProject('id', { name: 'P2' })
    await api.deleteProject('id')
    await api.listComponentKinds(1, 2)
    await api.createComponentKind({ name: 'K', slug: 'k', description: null })
    await api.updateComponentKind('kid', { name: 'K2' })
    await api.deleteComponentKind('kid')
    await api.listMonitoredComponents()
    await api.listMonitoredComponents('pid', 5, 10)
    await api.createMonitoredComponent({} as never)
    await api.updateMonitoredComponent('cid', {} as never)
    await api.deleteMonitoredComponent('cid')
    await api.getMonitoringSettings()
    await api.updateMonitoringSettings({} as never)
    await api.getSpeedTestAdvisory()
    await api.getSpeedTestAdvisory('pid')
    await api.runManualCheck('cid')
    await api.listCheckResults('cid')
    await api.listCheckResults('cid', 5)
    await api.purgeCheckHistory('cid')
    await api.purgeCheckHistory('cid', 2)
    await api.listConnectionEvents('cid')
    await api.listConnectionEvents('cid', 25)

    expect(listProjects).toHaveBeenCalledWith({ offset: 0, limit: 100 })
    expect(listProjects).toHaveBeenCalledWith({ offset: 10, limit: 20 })
    expect(createProject).toHaveBeenCalled()
    expect(updateProject).toHaveBeenCalledWith('id', { name: 'P2' })
    expect(deleteProject).toHaveBeenCalledWith('id')
    expect(listMonitoredComponents).toHaveBeenCalledWith({
      project_id: undefined,
      offset: 0,
      limit: 100,
    })
    expect(listMonitoredComponents).toHaveBeenCalledWith({
      project_id: 'pid',
      offset: 5,
      limit: 10,
    })
    expect(getSpeedTestAdvisory).toHaveBeenCalledWith(undefined)
    expect(getSpeedTestAdvisory).toHaveBeenCalledWith({ project_id: 'pid' })
    expect(listCheckResults).toHaveBeenCalledWith('cid', { limit: 20 })
    expect(listCheckResults).toHaveBeenCalledWith('cid', { limit: 5 })
    expect(purgeCheckHistory).toHaveBeenCalledWith('cid', { keep: 0 })
    expect(purgeCheckHistory).toHaveBeenCalledWith('cid', { keep: 2 })
    expect(listConnectionEvents).toHaveBeenCalledWith('cid', { limit: 50 })
    expect(listConnectionEvents).toHaveBeenCalledWith('cid', { limit: 25 })
  })

  it('delegates incident and public status methods', async () => {
    await api.listProjectIncidents('pid')
    await api.createProjectIncident('pid', {} as never)
    await api.updateIncident('iid', {} as never)
    await api.deleteIncident('iid')
    await api.addIncidentUpdate('iid', {} as never)
    await api.updateIncidentUpdate('uid', {} as never)
    await api.deleteIncidentUpdate('uid')
    await api.listAccounts()
    await api.listAccounts(2, 3)
    await api.updateAccountRoles('aid', ['admin'])
    await api.listPublicProjects()
    await api.getPublicProjectStatus('demo')
    await api.getPublicProjectHistory('demo')
    await api.getPublicSystemStatus('demo')
    await api.getPublicSystemStatus('demo', { end: '2026-08-01', days: 30 })
    await api.getPublicTunnelMetrics('demo', 'svc')
    await api.getPublicTunnelMetrics('demo', 'svc', { hours: 6 })

    expect(listProjectIncidents).toHaveBeenCalledWith('pid')
    expect(deleteIncident).toHaveBeenCalledWith('iid')
    expect(deleteIncidentUpdate).toHaveBeenCalledWith('uid')
    expect(listAccounts).toHaveBeenCalledWith({ offset: 0, limit: 100 })
    expect(listAccounts).toHaveBeenCalledWith({ offset: 2, limit: 3 })
    expect(updateAccountRoles).toHaveBeenCalledWith('aid', { access_roles: ['admin'] })
    expect(getPublicSystemStatus).toHaveBeenCalledWith('demo', undefined)
    expect(getPublicSystemStatus).toHaveBeenCalledWith('demo', { end: '2026-08-01', days: 30 })
    expect(customFetch).toHaveBeenCalledWith(
      '/api/status/projects/demo/services/svc/tunnel-metrics',
    )
    expect(customFetch).toHaveBeenCalledWith(
      '/api/status/projects/demo/services/svc/tunnel-metrics?hours=6',
    )
  })
})

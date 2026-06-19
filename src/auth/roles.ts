import type { Account } from '../api/client'

export const PANEL_ROLES = ['admin', 'operator', 'viewer'] as const

export function hasAdminPanelAccess(account: Account | null | undefined): boolean {
  if (!account) return false
  return account.access_roles.some((role) => (PANEL_ROLES as readonly string[]).includes(role))
}

export function isAdmin(account: Account | null | undefined): boolean {
  return account?.access_roles.includes('admin') ?? false
}

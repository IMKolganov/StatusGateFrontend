import type { Account } from '../api/client'

export function getAccountDisplayName(account: Account): string {
  const fullName = account.full_name?.trim()
  if (fullName) {
    return fullName
  }

  const localPart = account.email.split('@')[0]?.trim()
  if (localPart) {
    return localPart
  }

  return account.email
}

export function getAccountAvatarUrl(account: Account): string | null {
  if (!account.has_google) {
    return null
  }

  const avatarUrl = account.avatar_url?.trim()
  return avatarUrl || null
}

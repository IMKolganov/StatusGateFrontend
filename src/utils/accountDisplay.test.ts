import { describe, expect, it } from 'vitest'
import type { Account } from '../api/client'
import { getAccountAvatarUrl, getAccountDisplayName } from './accountDisplay'

function account(partial: Partial<Account> & Pick<Account, 'email'>): Account {
  return {
    id: 'acc-1',
    full_name: null,
    access_roles: ['user'],
    is_totp_enabled: false,
    has_password: true,
    has_google: false,
    ...partial,
  }
}

describe('getAccountDisplayName', () => {
  it('prefers trimmed full name', () => {
    expect(getAccountDisplayName(account({ email: 'a@b.c', full_name: '  Ada  ' }))).toBe('Ada')
  })

  it('falls back to email local part', () => {
    expect(getAccountDisplayName(account({ email: 'ada@example.com', full_name: null }))).toBe('ada')
  })

  it('falls back to full email when local part is empty', () => {
    expect(getAccountDisplayName(account({ email: '@example.com', full_name: '  ' }))).toBe('@example.com')
  })
})

describe('getAccountAvatarUrl', () => {
  it('returns null without Google link', () => {
    expect(getAccountAvatarUrl(account({ email: 'a@b.c', has_google: false, avatar_url: 'https://x' }))).toBeNull()
  })

  it('returns trimmed avatar URL for Google accounts', () => {
    expect(
      getAccountAvatarUrl(account({ email: 'a@b.c', has_google: true, avatar_url: '  https://img  ' })),
    ).toBe('https://img')
  })

  it('returns null when Google account has blank avatar', () => {
    expect(getAccountAvatarUrl(account({ email: 'a@b.c', has_google: true, avatar_url: '   ' }))).toBeNull()
  })
})

import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from './context'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('throws outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/useAuth must be used within AuthProvider/)
  })

  it('returns context when provided', () => {
    const value: AuthContextValue = {
      account: null,
      loading: false,
      login: async () => '',
      verifyMfa: async () => {},
      logout: () => {},
      refreshAccount: async () => {},
      completeLogin: async () => {},
    }
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current).toBe(value)
  })
})

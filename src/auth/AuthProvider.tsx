import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type Account } from '../api/client'
import { AuthContext } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshAccount = useCallback(async () => {
    try {
      const current = await api.me()
      setAccount(current)
    } catch {
      setAccount(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    api
      .me()
      .then((current) => {
        if (!cancelled) setAccount(current)
      })
      .catch(() => {
        if (!cancelled) setAccount(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const completeLogin = useCallback(async () => {
    await refreshAccount()
  }, [refreshAccount])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password })
    if ('mfa_required' in result) {
      return result.mfa_token
    }
    await completeLogin()
    return 'ok'
  }, [completeLogin])

  const verifyMfa = useCallback(async (mfaToken: string, code: string) => {
    await api.login2fa({ mfa_token: mfaToken, code })
    await completeLogin()
  }, [completeLogin])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setAccount(null)
    }
  }, [])

  const value = useMemo(
    () => ({ account, loading, login, verifyMfa, logout, refreshAccount, completeLogin }),
    [account, loading, login, verifyMfa, logout, refreshAccount, completeLogin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

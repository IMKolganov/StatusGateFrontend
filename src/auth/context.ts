import { createContext } from 'react'
import type { Account } from '../api/client'

export type AuthContextValue = {
  account: Account | null
  loading: boolean
  login: (email: string, password: string) => Promise<string>
  verifyMfa: (mfaToken: string, code: string) => Promise<void>
  logout: () => void
  refreshAccount: () => Promise<void>
  completeLogin: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

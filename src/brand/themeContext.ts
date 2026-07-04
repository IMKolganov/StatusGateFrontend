import { createContext } from 'react'
import type { ThemeMode } from './themeUtils'

export type ThemeContextValue = {
  theme: ThemeMode
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

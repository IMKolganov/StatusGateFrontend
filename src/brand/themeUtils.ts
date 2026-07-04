export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'sg-theme'

function readStoredTheme(): ThemeMode | null {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

export function resolveInitialTheme(): ThemeMode {
  const stored = readStoredTheme()
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function persistTheme(theme: ThemeMode) {
  localStorage.setItem(STORAGE_KEY, theme)
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme, resolveInitialTheme } from './brand/themeUtils'
import { brandConfig } from './brand/config'
import './index.css'
import App from './App.tsx'

applyTheme(resolveInitialTheme())
document.title = brandConfig.name

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

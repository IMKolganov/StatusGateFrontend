import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme, resolveInitialTheme } from './brand/themeUtils'
import './index.css'
import App from './App.tsx'

applyTheme(resolveInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

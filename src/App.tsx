import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ThemeProvider } from './brand/theme'
import { AccountPage } from './pages/AccountPage'
import { AdminRoute } from './components/AdminRoute'
import { AuthRoute } from './components/AuthRoute'
import { AccountsPage } from './pages/AccountsPage'
import { AdminPage } from './pages/AdminPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { ComponentKindsPage } from './pages/ComponentKindsPage'
import { ComponentsPage } from './pages/ComponentsPage'
import { IncidentsPage } from './pages/IncidentsPage'
import { LoginPage } from './pages/LoginPage'
import { MonitoringSettingsPage } from './pages/MonitoringSettingsPage'
import { ReferencePage } from './pages/ReferencePage'
import { RegisterCompletePage } from './pages/RegisterCompletePage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import PublicHome from './pages/PublicHome'
import { ProjectHistoryPage } from './pages/ProjectHistoryPage'
import { ProjectStatusPage } from './pages/ProjectStatusPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SecurityPage } from './pages/SecurityPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/projects/:slug" element={<ProjectStatusPage />} />
          <Route path="/projects/:slug/history" element={<ProjectHistoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/complete" element={<RegisterCompletePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/account" element={<AuthRoute><AccountPage /></AuthRoute>} />
          <Route path="/account/security" element={<AuthRoute><SecurityPage /></AuthRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin/projects" element={<AdminRoute><ProjectsPage /></AdminRoute>} />
          <Route path="/admin/reference" element={<AdminRoute><ReferencePage /></AdminRoute>} />
          <Route path="/admin/component-kinds" element={<AdminRoute><ComponentKindsPage /></AdminRoute>} />
          <Route path="/admin/components" element={<AdminRoute><ComponentsPage /></AdminRoute>} />
          <Route path="/admin/monitoring" element={<AdminRoute><MonitoringSettingsPage /></AdminRoute>} />
          <Route path="/admin/incidents" element={<AdminRoute><IncidentsPage /></AdminRoute>} />
          <Route path="/admin/accounts" element={<AdminRoute><AccountsPage /></AdminRoute>} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin/callback" element={<Navigate to="/auth/callback" replace />} />
          <Route path="/admin/security" element={<Navigate to="/account/security" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

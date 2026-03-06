import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { ProjectView } from './pages/ProjectView'
import { Settings } from './pages/Settings'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAutoAuth } from './hooks/useAutoAuth'
import DevForgeNew from './pages/DevForgeNew'
import './styles/devforge-new.css'

function App() {
  // Inicializar autenticação automática
  const { user } = useAutoAuth()

  // Mostrar loading enquanto inicializa auth
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        color: '#666',
        background: '#07070E',
      }}>
        A inicializar DevForge V2...
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects/:id" element={<ProjectView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

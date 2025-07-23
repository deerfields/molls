import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthProvider } from '@/contexts/AuthContext'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Tenants from '@/pages/Tenants'
import Users from '@/pages/Users'
import Malls from '@/pages/Malls'
import IoTDashboard from '@/pages/IoTDashboard'
import AIAnalyticsDashboard from '@/pages/AIAnalyticsDashboard'
import ComputerVisionDashboard from '@/pages/ComputerVisionDashboard'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="users" element={<Users />} />
        <Route path="malls" element={<Malls />} />
        <Route path="iot" element={<IoTDashboard />} />
        <Route path="ai" element={<AIAnalyticsDashboard />} />
        <Route path="computer-vision" element={<ComputerVisionDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App 
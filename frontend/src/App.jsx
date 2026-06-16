import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home         from './pages/Home'
import Login        from './pages/Login'
import Register     from './pages/Register'
import ClientDashboard from './pages/client/ClientDashboard'
import AdminDashboard  from './pages/admin/AdminDashboard'
import DriverDashboard from './pages/driver/DriverDashboard'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="centered-loader"><i className="fas fa-spinner fa-spin" /></div>
  if (!user)   return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/client/*" element={
            <ProtectedRoute role="CLIENT"><ClientDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/driver/*" element={
            <ProtectedRoute role="DRIVER"><DriverDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

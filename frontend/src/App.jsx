import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CustomerProvider, useCustomer } from './context/CustomerContext'
import { ToastProvider } from './context/ToastContext'
import Home         from './pages/Home'
import Login        from './pages/Login'
import Register     from './pages/Register'
import ClientDashboard from './pages/client/ClientDashboard'
import AdminDashboard  from './pages/admin/AdminDashboard'
import DriverDashboard from './pages/driver/DriverDashboard'
import GuestBooking from './pages/customer/GuestBooking'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import FloatingContact from './components/FloatingContact'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="centered-loader"><i className="fas fa-spinner fa-spin" /></div>
  if (!user)   return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

function CustomerProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useCustomer()
  if (loading) return <div className="centered-loader"><i className="fas fa-spinner fa-spin" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CustomerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Customer Routes */}
            <Route path="/book" element={<GuestBooking />} />
            <Route path="/customer/login" element={<Navigate to="/login" replace />} />
            <Route path="/customer/dashboard/*" element={
              <CustomerProtectedRoute><CustomerDashboard /></CustomerProtectedRoute>
            } />
            
            {/* Staff Routes */}
            <Route path="/client/*" element={
              <ProtectedRoute role="CLIENT"><ClientDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/driver/*" element={
              <ProtectedRoute role="DRIVER"><DriverDashboard /></ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <FloatingContact />
        </BrowserRouter>
      </CustomerProvider>
    </AuthProvider>
    </ToastProvider>
  )
}

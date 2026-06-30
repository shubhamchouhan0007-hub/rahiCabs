import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CustomerProvider, useCustomer } from './context/CustomerContext'
import { ToastProvider } from './context/ToastContext'
import FloatingContact from './components/FloatingContact'

// Code-split every page so first paint only ships what's needed
const Home              = lazy(() => import('./pages/Home'))
const Login             = lazy(() => import('./pages/Login'))
const Register          = lazy(() => import('./pages/Register'))
const ClientDashboard   = lazy(() => import('./pages/client/ClientDashboard'))
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'))
const DriverDashboard   = lazy(() => import('./pages/driver/DriverDashboard'))
const GuestBooking      = lazy(() => import('./pages/customer/GuestBooking'))
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'))

function PageLoader() {
  return <div className="centered-loader"><i className="fas fa-spinner fa-spin" /></div>
}

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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
          <FloatingContact />
        </BrowserRouter>
      </CustomerProvider>
    </AuthProvider>
    </ToastProvider>
  )
}

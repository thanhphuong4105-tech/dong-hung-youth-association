import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export function PublicOnlyRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (session) return <Navigate to="/dashboard" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF7F3' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-transparent mx-auto mb-4 animate-spin"
          style={{ borderColor: '#F1745E', borderTopColor: 'transparent' }} />
        <p style={{ color: '#7A5550', fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem' }}>Loading…</p>
      </div>
    </div>
  )
}

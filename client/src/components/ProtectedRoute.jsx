import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ roles, requireMainAdmin, redirectTo = '/' }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.status)) return <Navigate to={redirectTo} replace />
  if (requireMainAdmin && !user.isMainAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../../data/session'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

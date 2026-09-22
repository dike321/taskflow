import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../../data/session'
import { hasModuleAccess } from '../../utils/permissions'
import type { User } from '../../data/users'

interface RequireModuleProps {
  children: ReactNode
  /** Module key (lihat MODULES di data/roles.ts) yang wajib punya akses (`hasModuleAccess`) untuk masuk ke route ini. */
  module?: string
  /** Untuk kasus yang lebih spesifik dari sekadar module access (mis. Approvals butuh permission `approve`, bukan cuma `view`). */
  check?: (user: User) => boolean
}

/**
 * Menegakkan otorisasi per-module di level route, bukan cuma menyembunyikan link sidebar.
 * Tanpa ini, siapapun yang sudah login bisa mengakses modul manapun langsung lewat URL
 * terlepas dari permission role-nya (RequireAuth cuma cek isAuthenticated).
 */
export default function RequireModule({ children, module, check }: RequireModuleProps) {
  const { currentUser } = useSession()
  const allowed = check ? check(currentUser) : module ? hasModuleAccess(currentUser, module) : true

  if (!allowed) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

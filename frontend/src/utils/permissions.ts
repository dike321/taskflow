import type { PermissionAction, Role } from '../data/roles'
import { mockRoles } from '../data/roles'
import type { User } from '../data/users'

export function getRoleForUser(user: User): Role | undefined {
  return mockRoles.find((role) => role.id === user.roleId)
}

/** Apakah `user` boleh melakukan `action` tertentu pada `module` (mis. 'inventory.stockOut', 'approve'). */
export function hasPermission(user: User, module: string, action: PermissionAction): boolean {
  const role = getRoleForUser(user)
  return role?.permissions[module]?.includes(action) ?? false
}

/** Apakah `user` punya akses apapun (aksi apa saja) ke `module` — dipakai untuk sembunyikan/tampilkan menu. */
export function hasModuleAccess(user: User, module: string): boolean {
  const role = getRoleForUser(user)
  return (role?.permissions[module]?.length ?? 0) > 0
}

/** Level approval role user (lihat Role.approvalLevel) — 0 kalau tidak diset. */
export function getApprovalLevel(user: User): number {
  return getRoleForUser(user)?.approvalLevel ?? 0
}

/** Untuk approval berjenjang: apakah `user` boleh approve di `level` tertentu pada `module` (butuh permission `approve` DAN approvalLevel role >= level yang diminta). */
export function canApproveAtLevel(user: User, module: string, level: number): boolean {
  return hasPermission(user, module, 'approve') && getApprovalLevel(user) >= level
}

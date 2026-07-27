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

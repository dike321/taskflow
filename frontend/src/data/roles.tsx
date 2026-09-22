import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'

export interface Role {
  id: number
  name: string
  description: string
  permissions: Record<string, PermissionAction[]>
  /**
   * Untuk approval berjenjang: transaksi di atas escalation threshold butuh approve dari role
   * ber-approvalLevel makin tinggi secara berurutan (level 1 dulu, baru level 2, dst).
   * Role tanpa field ini / undefined dianggap level 0 — tidak bisa approve final sekalipun
   * punya permission `approve` di module tersebut.
   */
  approvalLevel?: number
}

export interface ModuleDef {
  key: string
  label: string
  actions: PermissionAction[]
}

export const MODULES: ModuleDef[] = [
  { key: 'dashboard', label: 'Dashboard', actions: ['view'] },
  { key: 'users', label: 'Users', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'roles', label: 'Roles', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'inventory.items', label: 'Inventory - Items', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'inventory.stockIn', label: 'Inventory - Stock In', actions: ['view', 'create', 'edit', 'approve'] },
  { key: 'inventory.stockOut', label: 'Inventory - Stock Out', actions: ['view', 'create', 'edit', 'approve'] },
  { key: 'inventory.history', label: 'Inventory - History', actions: ['view', 'export'] },
  { key: 'inventory.transfer', label: 'Inventory - Transfer', actions: ['view', 'create', 'approve'] },
  { key: 'inventory.opname', label: 'Inventory - Stock Opname', actions: ['view', 'create', 'edit', 'approve'] },
  { key: 'inventory.batches', label: 'Inventory - Batches', actions: ['view'] },
  { key: 'suppliers', label: 'Suppliers', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'warehouses', label: 'Warehouses', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'companies', label: 'Companies', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'tickets', label: 'Tickets', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'settings', label: 'Settings', actions: ['view', 'edit'] },
  { key: 'activityLog', label: 'Activity Log', actions: ['view'] },
  { key: 'reports', label: 'Reports', actions: ['view', 'export'] },
  { key: 'supplierPortal', label: 'Supplier Portal', actions: ['view'] },
]

export const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'export']

/**
 * Sumber data role. `utils/permissions.ts` (dan beberapa halaman lain seperti UsersPage untuk
 * dropdown Role) mengimpor array ini LANGSUNG, bukan lewat context — supaya fungsi-fungsi
 * permission itu tetap plain function yang bisa dipanggil dari mana saja tanpa harus jadi hook.
 * Konsekuensinya: `RolesProvider.setRoles` WAJIB memutasi array ini in-place (bukan mengganti
 * bindingnya dengan array baru) supaya `mockRoles` yang dipegang oleh importer lain selalu
 * melihat data terbaru. Lihat RolesProvider di bawah.
 */
export const mockRoles: Role[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'Akses penuh ke seluruh sistem',
    approvalLevel: 2,
    permissions: {
      dashboard: ['view'],
      users: ['view', 'create', 'edit', 'delete'],
      roles: ['view', 'create', 'edit', 'delete'],
      'inventory.items': ['view', 'create', 'edit', 'delete'],
      'inventory.stockIn': ['view', 'create', 'edit', 'approve'],
      'inventory.stockOut': ['view', 'create', 'edit', 'approve'],
      'inventory.history': ['view', 'export'],
      'inventory.transfer': ['view', 'create', 'approve'],
      'inventory.opname': ['view', 'create', 'edit', 'approve'],
      'inventory.batches': ['view'],
      suppliers: ['view', 'create', 'edit', 'delete'],
      warehouses: ['view', 'create', 'edit', 'delete'],
      companies: ['view', 'create', 'edit', 'delete'],
      tickets: ['view', 'create', 'edit', 'delete'],
      settings: ['view', 'edit'],
      activityLog: ['view'],
      reports: ['view', 'export'],
      supplierPortal: ['view'],
    },
  },
  {
    id: 2,
    name: 'Warehouse Staff',
    description: 'Input barang masuk/keluar, tidak bisa approve',
    permissions: {
      dashboard: ['view'],
      'inventory.items': ['view'],
      'inventory.stockIn': ['view', 'create'],
      'inventory.stockOut': ['view', 'create'],
      'inventory.history': ['view'],
      'inventory.transfer': ['view', 'create'],
      'inventory.opname': ['view', 'create'],
      'inventory.batches': ['view'],
      suppliers: ['view'],
      warehouses: ['view'],
      companies: ['view'],
      tickets: ['view', 'create'],
    },
  },
  {
    id: 3,
    name: 'Warehouse Supervisor',
    description: 'Approve transaksi, kelola master barang',
    approvalLevel: 1,
    permissions: {
      dashboard: ['view'],
      'inventory.items': ['view', 'create', 'edit'],
      'inventory.stockIn': ['view', 'create', 'approve'],
      'inventory.stockOut': ['view', 'create', 'approve'],
      'inventory.history': ['view', 'export'],
      'inventory.transfer': ['view', 'create', 'approve'],
      'inventory.opname': ['view', 'create', 'approve'],
      'inventory.batches': ['view'],
      suppliers: ['view', 'create', 'edit'],
      warehouses: ['view', 'create', 'edit'],
      companies: ['view', 'create', 'edit'],
      tickets: ['view', 'create', 'edit'],
      reports: ['view', 'export'],
    },
  },
  {
    id: 4,
    name: 'Supplier',
    description: 'User dari perusahaan supplier — cuma lihat profil company & riwayat pengiriman sendiri',
    permissions: {
      dashboard: ['view'],
      supplierPortal: ['view'],
    },
  },
]

interface RolesContextValue {
  roles: Role[]
  setRoles: (updater: Role[] | ((prev: Role[]) => Role[])) => void
}

const RolesContext = createContext<RolesContextValue | undefined>(undefined)

export function RolesProvider({ children }: { children: ReactNode }) {
  const [roles, setRolesState] = useState<Role[]>(mockRoles)

  const setRoles = (updater: Role[] | ((prev: Role[]) => Role[])) => {
    setRolesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      // Mutasi mockRoles in-place (bukan reassign) supaya utils/permissions.ts dan importer
      // langsung lainnya (mis. UsersPage untuk dropdown Role) selalu baca data role terkini —
      // tanpa itu, perubahan approvalLevel/permission lewat halaman ini cuma kosmetik di tabel
      // dan tidak pernah benar-benar mengubah otorisasi nyata di aplikasi.
      mockRoles.length = 0
      mockRoles.push(...next)
      return next
    })
  }

  return <RolesContext.Provider value={{ roles, setRoles }}>{children}</RolesContext.Provider>
}

export function useRoles() {
  const context = useContext(RolesContext)
  if (!context) throw new Error('useRoles must be used within a RolesProvider')
  return context
}

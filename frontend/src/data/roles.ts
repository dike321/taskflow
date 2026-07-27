export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'

export interface Role {
  id: number
  name: string
  description: string
  permissions: Record<string, PermissionAction[]>
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
  { key: 'suppliers', label: 'Suppliers', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'tickets', label: 'Tickets', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'settings', label: 'Settings', actions: ['view', 'edit'] },
  { key: 'activityLog', label: 'Activity Log', actions: ['view'] },
]

export const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'export']

export const mockRoles: Role[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'Akses penuh ke seluruh sistem',
    permissions: {
      dashboard: ['view'],
      users: ['view', 'create', 'edit', 'delete'],
      roles: ['view', 'create', 'edit', 'delete'],
      'inventory.items': ['view', 'create', 'edit', 'delete'],
      'inventory.stockIn': ['view', 'create', 'edit', 'approve'],
      'inventory.stockOut': ['view', 'create', 'edit', 'approve'],
      'inventory.history': ['view', 'export'],
      suppliers: ['view', 'create', 'edit', 'delete'],
      tickets: ['view', 'create', 'edit', 'delete'],
      settings: ['view', 'edit'],
      activityLog: ['view'],
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
      suppliers: ['view'],
    },
  },
  {
    id: 3,
    name: 'Warehouse Supervisor',
    description: 'Approve transaksi, kelola master barang',
    permissions: {
      dashboard: ['view'],
      'inventory.items': ['view', 'create', 'edit'],
      'inventory.stockIn': ['view', 'create', 'approve'],
      'inventory.stockOut': ['view', 'create', 'approve'],
      'inventory.history': ['view', 'export'],
      suppliers: ['view', 'create', 'edit'],
    },
  },
]

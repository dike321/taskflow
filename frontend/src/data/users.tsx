import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface User {
  id: number
  name: string
  email: string
  phone: string
  department: string
  /** Company.id di data/companies.tsx — wajib diisi, "organisasi induk" user ini (internal atau supplier). */
  companyId: number
  roleId: number
  status: 'active' | 'inactive'
  createdAt: string
  /** Kalau diisi, user cuma boleh pilih warehouse ini saat bikin transaksi (Stock In/Out/Transfer/Opname). Warehouse.id di data/warehouses.tsx. Biasanya cuma dipakai untuk Warehouse Staff — Admin/Supervisor kosongkan supaya bisa akses semua warehouse. */
  warehouseId?: number
}

export const DEPARTMENTS = ['Management', 'Warehouse', 'Finance', 'IT', 'Operations', 'Vendor']

/**
 * Sumber data user. `data/session.tsx` (login/switchUser) dan banyak halaman lain
 * (Approvals, Tickets, Stock In/Out/Transfer/Opname PIC dropdown, Header, dst.) mengimpor
 * array ini LANGSUNG, bukan lewat context. `UsersProvider.setUsers` WAJIB memutasi array ini
 * in-place (bukan mengganti bindingnya) supaya semua importer itu selalu melihat data terbaru —
 * sama seperti pola yang dipakai `RolesProvider` di data/roles.tsx.
 */
export const mockUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+6281234567890',
    department: 'Management',
    companyId: 1,
    roleId: 1,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+6281323456789',
    department: 'Warehouse',
    companyId: 1,
    roleId: 3,
    status: 'active',
    createdAt: '2024-01-20',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+6281434567891',
    department: 'Warehouse',
    companyId: 1,
    roleId: 2,
    status: 'inactive',
    createdAt: '2024-02-01',
    warehouseId: 2,
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    phone: '+6281545678912',
    department: 'Finance',
    companyId: 1,
    roleId: 2,
    status: 'active',
    createdAt: '2024-02-10',
    warehouseId: 1,
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    phone: '+6281656789123',
    department: 'Warehouse',
    companyId: 1,
    roleId: 3,
    status: 'active',
    createdAt: '2024-02-15',
  },
  {
    id: 6,
    name: 'Budi Santoso',
    email: 'budi@alattulisejahtera.co.id',
    phone: '+622155512001',
    department: 'Vendor',
    companyId: 2,
    roleId: 4,
    status: 'active',
    createdAt: '2024-03-01',
  },
]

interface UsersContextValue {
  users: User[]
  setUsers: (updater: User[] | ((prev: User[]) => User[])) => void
}

const UsersContext = createContext<UsersContextValue | undefined>(undefined)

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsersState] = useState<User[]>(mockUsers)

  const setUsers = (updater: User[] | ((prev: User[]) => User[])) => {
    setUsersState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      // Mutasi mockUsers in-place (bukan reassign) supaya session.tsx (login/switchUser) dan
      // importer langsung lainnya selalu baca data user terkini — tanpa itu, user baru dari
      // UsersPage tidak bisa login, dan edit role/warehouse tidak berlaku saat user itu login.
      mockUsers.length = 0
      mockUsers.push(...next)
      return next
    })
  }

  return <UsersContext.Provider value={{ users, setUsers }}>{children}</UsersContext.Provider>
}

export function useUsers() {
  const context = useContext(UsersContext)
  if (!context) throw new Error('useUsers must be used within a UsersProvider')
  return context
}

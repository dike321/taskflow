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

export interface User {
  id: number
  name: string
  email: string
  phone: string
  department: string
  roleId: number
  status: 'active' | 'inactive'
  createdAt: string
}

export const DEPARTMENTS = ['Management', 'Warehouse', 'Finance', 'IT', 'Operations']

export const mockUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+6281234567890',
    department: 'Management',
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
    roleId: 2,
    status: 'inactive',
    createdAt: '2024-02-01',
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    phone: '+6281545678912',
    department: 'Finance',
    roleId: 2,
    status: 'active',
    createdAt: '2024-02-10',
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    phone: '+6281656789123',
    department: 'Warehouse',
    roleId: 3,
    status: 'active',
    createdAt: '2024-02-15',
  },
]

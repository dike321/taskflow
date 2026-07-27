export interface Item {
  id: number
  sku: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
}

export const CATEGORIES = ['ATK', 'Elektronik', 'Consumable']
export const UNITS = ['pcs', 'unit', 'box', 'rim', 'botol', 'kg']

export const mockItems: Item[] = [
  { id: 1, sku: 'ATK-001', name: 'Kertas A4 80gsm', category: 'ATK', unit: 'rim', stock: 120, minStock: 50 },
  { id: 2, sku: 'ATK-002', name: 'Pulpen Hitam', category: 'ATK', unit: 'pcs', stock: 300, minStock: 100 },
  { id: 3, sku: 'ELK-001', name: 'Laptop Dell Latitude', category: 'Elektronik', unit: 'unit', stock: 8, minStock: 5 },
  { id: 4, sku: 'ELK-002', name: 'Monitor LED 24"', category: 'Elektronik', unit: 'unit', stock: 3, minStock: 5 },
  { id: 5, sku: 'CON-001', name: 'Tinta Printer Hitam', category: 'Consumable', unit: 'botol', stock: 15, minStock: 20 },
  { id: 6, sku: 'CON-002', name: 'Hand Sanitizer 500ml', category: 'Consumable', unit: 'botol', stock: 45, minStock: 30 },
]

export interface StockTransaction {
  id: number
  itemId: number
  type: 'in' | 'out'
  quantity: number
  date: string
  picId: number
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: number
  approvedAt?: string
  reference?: string
  note?: string
}

export const mockStockTransactions: StockTransaction[] = [
  {
    id: 1,
    itemId: 1,
    type: 'in',
    quantity: 50,
    date: '2024-03-01',
    picId: 4,
    status: 'approved',
    approvedBy: 2,
    approvedAt: '2024-03-01',
    reference: 'PO-2024-001',
  },
  {
    id: 2,
    itemId: 3,
    type: 'in',
    quantity: 5,
    date: '2024-03-05',
    picId: 4,
    status: 'approved',
    approvedBy: 5,
    approvedAt: '2024-03-05',
    reference: 'PO-2024-002',
  },
  {
    id: 3,
    itemId: 4,
    type: 'out',
    quantity: 2,
    date: '2024-03-10',
    picId: 4,
    status: 'approved',
    approvedBy: 2,
    approvedAt: '2024-03-10',
    reference: 'IT Department',
  },
  {
    id: 4,
    itemId: 5,
    type: 'out',
    quantity: 3,
    date: '2024-03-12',
    picId: 4,
    status: 'pending',
    reference: 'Finance Department',
  },
]

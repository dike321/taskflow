import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

export interface Item {
  id: number
  sku: string
  name: string
  category: string
  unit: string
  minStock: number
}

export const CATEGORIES = ['ATK', 'Elektronik', 'Consumable']
export const UNITS = ['pcs', 'unit', 'box', 'rim', 'botol', 'kg']

export const mockItems: Item[] = [
  { id: 1, sku: 'ATK-001', name: 'Kertas A4 80gsm', category: 'ATK', unit: 'rim', minStock: 50 },
  { id: 2, sku: 'ATK-002', name: 'Pulpen Hitam', category: 'ATK', unit: 'pcs', minStock: 100 },
  { id: 3, sku: 'ELK-001', name: 'Laptop Dell Latitude', category: 'Elektronik', unit: 'unit', minStock: 5 },
  { id: 4, sku: 'ELK-002', name: 'Monitor LED 24"', category: 'Elektronik', unit: 'unit', minStock: 5 },
  { id: 5, sku: 'CON-001', name: 'Tinta Printer Hitam', category: 'Consumable', unit: 'botol', minStock: 20 },
  { id: 6, sku: 'CON-002', name: 'Hand Sanitizer 500ml', category: 'Consumable', unit: 'botol', minStock: 30 },
]

export interface WarehouseStock {
  itemId: number
  warehouseId: number
  quantity: number
}

export const mockWarehouseStock: WarehouseStock[] = [
  { itemId: 1, warehouseId: 1, quantity: 70 },
  { itemId: 1, warehouseId: 2, quantity: 30 },
  { itemId: 1, warehouseId: 3, quantity: 20 },
  { itemId: 2, warehouseId: 1, quantity: 150 },
  { itemId: 2, warehouseId: 2, quantity: 100 },
  { itemId: 2, warehouseId: 3, quantity: 50 },
  { itemId: 3, warehouseId: 1, quantity: 5 },
  { itemId: 3, warehouseId: 2, quantity: 2 },
  { itemId: 3, warehouseId: 3, quantity: 1 },
  { itemId: 4, warehouseId: 1, quantity: 2 },
  { itemId: 4, warehouseId: 2, quantity: 1 },
  { itemId: 5, warehouseId: 1, quantity: 10 },
  { itemId: 5, warehouseId: 2, quantity: 5 },
  { itemId: 6, warehouseId: 1, quantity: 20 },
  { itemId: 6, warehouseId: 2, quantity: 15 },
  { itemId: 6, warehouseId: 3, quantity: 10 },
]

/** Total stok item, atau stok di satu gudang tertentu kalau `warehouseId` diisi. */
export function getStockQuantity(warehouseStock: WarehouseStock[], itemId: number, warehouseId?: number): number {
  return warehouseStock
    .filter((w) => w.itemId === itemId && (warehouseId === undefined || w.warehouseId === warehouseId))
    .reduce((sum, w) => sum + w.quantity, 0)
}

/** Tambah/kurangi stok item di satu gudang (upsert), mengembalikan array baru. */
export function adjustWarehouseStock(
  warehouseStock: WarehouseStock[],
  itemId: number,
  warehouseId: number,
  delta: number,
): WarehouseStock[] {
  const exists = warehouseStock.some((w) => w.itemId === itemId && w.warehouseId === warehouseId)

  if (!exists) {
    return [...warehouseStock, { itemId, warehouseId, quantity: delta }]
  }

  return warehouseStock.map((w) =>
    w.itemId === itemId && w.warehouseId === warehouseId ? { ...w, quantity: w.quantity + delta } : w,
  )
}

export type StockTransactionType = 'in' | 'out' | 'transfer'

export interface Attachment {
  id: number
  name: string
  size: number
  url: string
}

export interface StockTransaction {
  id: number
  itemId: number
  type: StockTransactionType
  quantity: number
  date: string
  picId: number
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: number
  approvedAt?: string
  reference?: string
  supplierId?: number
  note?: string
  /** Gudang tujuan (in) / gudang asal (out). Tidak dipakai untuk transfer. */
  warehouseId?: number
  /** Khusus type 'transfer' */
  fromWarehouseId?: number
  toWarehouseId?: number
  /** Scan/upload dokumen resmi: PO, Surat Jalan, Invoice, BAST, dst */
  attachments?: Attachment[]
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
    supplierId: 1,
    warehouseId: 1,
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
    supplierId: 2,
    warehouseId: 1,
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
    warehouseId: 1,
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
    warehouseId: 1,
  },
  {
    id: 5,
    itemId: 2,
    type: 'transfer',
    quantity: 20,
    date: '2024-03-08',
    picId: 2,
    status: 'approved',
    approvedBy: 2,
    approvedAt: '2024-03-08',
    note: 'Restock cabang Surabaya',
    fromWarehouseId: 1,
    toWarehouseId: 2,
  },
  {
    id: 6,
    itemId: 6,
    type: 'transfer',
    quantity: 5,
    date: '2024-03-14',
    picId: 4,
    status: 'pending',
    fromWarehouseId: 1,
    toWarehouseId: 3,
  },
  // Opening stock (saldo awal migrasi sistem) — melengkapi riwayat transaksi di atas
  // supaya setiap angka di `mockWarehouseStock` bisa ditelusuri dari sini.
  { id: 7, itemId: 1, type: 'in', quantity: 30, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 2 },
  { id: 8, itemId: 1, type: 'in', quantity: 20, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 3 },
  { id: 9, itemId: 2, type: 'in', quantity: 170, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 1 },
  { id: 10, itemId: 2, type: 'in', quantity: 80, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 2 },
  { id: 11, itemId: 2, type: 'in', quantity: 50, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 3 },
  { id: 12, itemId: 3, type: 'in', quantity: 2, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 2 },
  { id: 13, itemId: 3, type: 'in', quantity: 1, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 3 },
  { id: 14, itemId: 4, type: 'in', quantity: 4, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 1 },
  { id: 15, itemId: 4, type: 'in', quantity: 1, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 2 },
  { id: 16, itemId: 5, type: 'in', quantity: 10, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 1 },
  { id: 17, itemId: 5, type: 'in', quantity: 5, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 2 },
  { id: 18, itemId: 6, type: 'in', quantity: 20, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 1 },
  { id: 19, itemId: 6, type: 'in', quantity: 15, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 2 },
  { id: 20, itemId: 6, type: 'in', quantity: 10, date: '2024-01-05', picId: 4, status: 'approved', approvedBy: 2, approvedAt: '2024-01-05', reference: 'Opening Stock', warehouseId: 3 },
]

/** Sesi pencocokan stok sistem vs stok fisik gudang (cycle count / stock opname). */
export interface StockOpname {
  id: number
  itemId: number
  warehouseId: number
  systemQty: number
  physicalQty: number
  /** physicalQty - systemQty. Positif = surplus, negatif = selisih kurang. */
  difference: number
  date: string
  picId: number
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: number
  approvedAt?: string
  note?: string
}

export const mockStockOpnames: StockOpname[] = [
  {
    id: 1,
    itemId: 1,
    warehouseId: 1,
    systemQty: 70,
    physicalQty: 65,
    difference: -5,
    date: '2024-03-20',
    picId: 5,
    status: 'pending',
    note: 'Ditemukan 5 rim rusak kena air saat stock opname bulanan',
  },
  {
    id: 2,
    itemId: 6,
    warehouseId: 2,
    systemQty: 15,
    physicalQty: 18,
    difference: 3,
    date: '2024-03-21',
    picId: 4,
    status: 'pending',
    note: 'Selisih lebih, kemungkinan salah catat stock in sebelumnya',
  },
]

interface InventoryDataContextValue {
  items: Item[]
  setItems: Dispatch<SetStateAction<Item[]>>
  transactions: StockTransaction[]
  setTransactions: Dispatch<SetStateAction<StockTransaction[]>>
  warehouseStock: WarehouseStock[]
  setWarehouseStock: Dispatch<SetStateAction<WarehouseStock[]>>
  stockOpnames: StockOpname[]
  setStockOpnames: Dispatch<SetStateAction<StockOpname[]>>
}

const InventoryDataContext = createContext<InventoryDataContextValue | undefined>(undefined)

export function InventoryDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(mockItems)
  const [transactions, setTransactions] = useState<StockTransaction[]>(mockStockTransactions)
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>(mockWarehouseStock)
  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>(mockStockOpnames)

  return (
    <InventoryDataContext.Provider
      value={{
        items,
        setItems,
        transactions,
        setTransactions,
        warehouseStock,
        setWarehouseStock,
        stockOpnames,
        setStockOpnames,
      }}
    >
      {children}
    </InventoryDataContext.Provider>
  )
}

export function useInventoryData() {
  const context = useContext(InventoryDataContext)
  if (!context) throw new Error('useInventoryData must be used within an InventoryDataProvider')
  return context
}

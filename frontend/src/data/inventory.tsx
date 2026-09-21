import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { Attachment } from '../utils/attachments'

export type { Attachment } from '../utils/attachments'

export interface Item {
  id: number
  sku: string
  name: string
  category: string
  /** Unit dasar — stok selalu dilacak & ditampilkan dalam unit ini. */
  unit: string
  minStock: number
  /** Unit pembelian dari supplier (mis. "box"), kalau beda dari unit dasar (mis. "pcs"). */
  purchaseUnit?: string
  /** 1 purchaseUnit = sekian unit dasar. Mis. 1 box = 12 pcs. */
  purchaseConversionFactor?: number
  /** Kode barcode/QR untuk scan cepat saat Stock In/Out (scanner USB = keyboard input + Enter). */
  barcode?: string
}

export const CATEGORIES = ['ATK', 'Elektronik', 'Consumable']
export const UNITS = ['pcs', 'unit', 'box', 'karton', 'rim', 'botol', 'kg']

export const mockItems: Item[] = [
  { id: 1, sku: 'ATK-001', name: 'Kertas A4 80gsm', category: 'ATK', unit: 'rim', minStock: 50, purchaseUnit: 'karton', purchaseConversionFactor: 5, barcode: '8991000000013' },
  { id: 2, sku: 'ATK-002', name: 'Pulpen Hitam', category: 'ATK', unit: 'pcs', minStock: 100, purchaseUnit: 'box', purchaseConversionFactor: 12, barcode: '8991000000020' },
  { id: 3, sku: 'ELK-001', name: 'Laptop Dell Latitude', category: 'Elektronik', unit: 'unit', minStock: 5, barcode: '8991000000037' },
  { id: 4, sku: 'ELK-002', name: 'Monitor LED 24"', category: 'Elektronik', unit: 'unit', minStock: 5, barcode: '8991000000044' },
  { id: 5, sku: 'CON-001', name: 'Tinta Printer Hitam', category: 'Consumable', unit: 'botol', minStock: 20, purchaseUnit: 'box', purchaseConversionFactor: 6, barcode: '8991000000051' },
  { id: 6, sku: 'CON-002', name: 'Hand Sanitizer 500ml', category: 'Consumable', unit: 'botol', minStock: 30, purchaseUnit: 'box', purchaseConversionFactor: 12, barcode: '8991000000068' },
]

/** Item punya konversi satuan pembelian (mis. beli per box, stok dilacak per pcs)? */
export function hasUnitConversion(item: Pick<Item, 'purchaseUnit' | 'purchaseConversionFactor'>): boolean {
  return !!item.purchaseUnit && !!item.purchaseConversionFactor && item.purchaseConversionFactor > 1
}

/** Cari item berdasarkan kode barcode/QR hasil scan (exact match, trimmed). */
export function findItemByBarcode(items: Item[], code: string): Item | undefined {
  const trimmed = code.trim()
  if (!trimmed) return undefined
  return items.find((item) => item.barcode === trimmed)
}

export interface WarehouseStock {
  itemId: number
  warehouseId: number
  quantity: number
}

export const mockWarehouseStock: WarehouseStock[] = [
  { itemId: 1, warehouseId: 1, quantity: 70 },
  { itemId: 1, warehouseId: 2, quantity: 30 },
  { itemId: 1, warehouseId: 3, quantity: 20 },
  { itemId: 2, warehouseId: 1, quantity: 174 },
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

/**
 * Approval berjenjang: transaksi di atas escalation threshold lewat 'pending' -> 'pending_level2' -> 'approved',
 * butuh approve dari role approvalLevel 1 dulu baru approvalLevel 2 (lihat utils/permissions.ts). Transaksi di
 * bawah threshold lewati 'pending_level2', langsung 'pending' -> 'approved' dengan 1x approve seperti sebelumnya.
 */
export type ApprovalStatus = 'pending' | 'pending_level2' | 'approved' | 'rejected'

export interface StockTransaction {
  id: number
  itemId: number
  type: StockTransactionType
  quantity: number
  date: string
  picId: number
  status: ApprovalStatus
  /** Ditentukan sekali saat transaksi dibuat (quantity > escalationThreshold saat itu) — tidak berubah retroaktif kalau threshold di-update belakangan. */
  requiresSecondApproval?: boolean
  /** Approval level 1 (Supervisor). Kalau requiresSecondApproval false, transaksi langsung ke approvedBy/approvedAt tanpa lewat field ini. */
  level1ApprovedBy?: number
  level1ApprovedAt?: string
  /** Approval final — level 1 (transaksi biasa) atau level 2 (transaksi ter-eskalasi). */
  approvedBy?: number
  approvedAt?: string
  reference?: string
  supplierId?: number
  note?: string
  /** Cost center: departemen pemakai barang keluar. Khusus type 'out'. */
  department?: string
  /** Batch/lot & expiry untuk barang consumable. Khusus type 'in'. */
  batchNumber?: string
  expiryDate?: string
  /**
   * Qty & unit seperti yang dientry user saat barang dibeli per unit pembelian (mis. "2 box").
   * `quantity` di atas selalu dalam unit dasar item (hasil konversi). Khusus type 'in'.
   */
  purchaseQuantity?: number
  purchaseUnit?: string
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
    department: 'IT',
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
    department: 'Finance',
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
  // Contoh Stock In dengan konversi satuan: dibeli per box, stok tercatat per pcs.
  {
    id: 21,
    itemId: 2,
    type: 'in',
    quantity: 24,
    purchaseQuantity: 2,
    purchaseUnit: 'box',
    date: '2024-03-15',
    picId: 4,
    status: 'approved',
    approvedBy: 2,
    approvedAt: '2024-03-15',
    reference: 'PO-2024-010',
    supplierId: 1,
    warehouseId: 1,
  },
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
  status: ApprovalStatus
  requiresSecondApproval?: boolean
  level1ApprovedBy?: number
  level1ApprovedAt?: string
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

/** Barang consumable/perishable dilacak per batch/lot + tanggal kadaluarsa (FEFO). */
export function isBatchTracked(item: Pick<Item, 'category'>): boolean {
  return item.category === 'Consumable'
}

export interface Batch {
  id: number
  itemId: number
  warehouseId: number
  batchNumber: string
  expiryDate: string
  /** Sisa quantity di batch ini (berkurang saat stock out FEFO). */
  quantity: number
  receivedDate: string
}

export type BatchStatus = 'expired' | 'expiring' | 'ok'

const EXPIRING_SOON_DAYS = 30

/** Status kadaluarsa relatif ke `referenceDate` (default: hari ini). */
export function getBatchStatus(expiryDate: string, referenceDate: Date = new Date()): BatchStatus {
  const daysLeft = (new Date(expiryDate).getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= EXPIRING_SOON_DAYS) return 'expiring'
  return 'ok'
}

/**
 * Kurangi stok item/gudang tertentu dari batch dengan expiry paling dekat lebih dulu (FEFO).
 * Tidak memvalidasi kecukupan stok — pemanggil harus memastikan quantity tersedia sebelumnya.
 */
export function consumeFefo(batches: Batch[], itemId: number, warehouseId: number, quantity: number): Batch[] {
  let remaining = quantity
  const order = batches
    .filter((b) => b.itemId === itemId && b.warehouseId === warehouseId && b.quantity > 0)
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1))
    .map((b) => b.id)

  const consumption = new Map<number, number>()
  for (const batchId of order) {
    if (remaining <= 0) break
    const batch = batches.find((b) => b.id === batchId)!
    const take = Math.min(batch.quantity, remaining)
    consumption.set(batchId, take)
    remaining -= take
  }

  return batches.map((b) => (consumption.has(b.id) ? { ...b, quantity: b.quantity - consumption.get(b.id)! } : b))
}

export const mockBatches: Batch[] = [
  { id: 1, itemId: 5, warehouseId: 1, batchNumber: 'TP-2026-A', expiryDate: '2026-08-20', quantity: 10, receivedDate: '2024-01-05' },
  { id: 2, itemId: 5, warehouseId: 2, batchNumber: 'TP-2027-B', expiryDate: '2027-01-15', quantity: 5, receivedDate: '2024-01-05' },
  { id: 3, itemId: 6, warehouseId: 1, batchNumber: 'HS-2026-A', expiryDate: '2026-08-10', quantity: 12, receivedDate: '2024-01-05' },
  { id: 4, itemId: 6, warehouseId: 1, batchNumber: 'HS-2026-B', expiryDate: '2026-12-01', quantity: 8, receivedDate: '2024-01-05' },
  { id: 5, itemId: 6, warehouseId: 2, batchNumber: 'HS-2025-C', expiryDate: '2025-11-01', quantity: 15, receivedDate: '2024-01-05' },
  { id: 6, itemId: 6, warehouseId: 3, batchNumber: 'HS-2027-D', expiryDate: '2027-03-01', quantity: 10, receivedDate: '2024-01-05' },
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
  batches: Batch[]
  setBatches: Dispatch<SetStateAction<Batch[]>>
}

const InventoryDataContext = createContext<InventoryDataContextValue | undefined>(undefined)

export function InventoryDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(mockItems)
  const [transactions, setTransactions] = useState<StockTransaction[]>(mockStockTransactions)
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>(mockWarehouseStock)
  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>(mockStockOpnames)
  const [batches, setBatches] = useState<Batch[]>(mockBatches)

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
        batches,
        setBatches,
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

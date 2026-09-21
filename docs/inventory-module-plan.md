# Rencana Modul Inventory

## Context

TaskFlow akan digunakan untuk **administrasi barang masuk & keluar di perusahaan besar** (bukan pencatatan sederhana skala toko kecil). Ini memengaruhi kebutuhan fitur: perlu approval workflow, multi-gudang, audit trail, dan dokumentasi resmi — bukan sekadar CRUD barang.

Menu sidebar "Projects" sudah diganti menjadi **"Inventory"** (`/inventory`). Modul ini sudah berkembang jadi 7 bagian: **Items** (master data barang), **Stock In**, **Stock Out**, **Transfer** (antar gudang), **Stock Opname** (rekonsiliasi fisik), **Batches** (lot/expiry), **History** (riwayat mutasi gabungan). Navigasi antar bagian memakai tab di dalam satu menu sidebar, masing-masing tetap punya URL sendiri agar bisa di-bookmark/refresh.

Status: **[Selesai]** — Items, Stock In/Out, History, Transfer, Stock Opname, Batches semua sudah dibangun dan terhubung ke Warehouses (multi-gudang), bukan cuma Phase 1 dasar lagi. Hampir seluruh "Roadmap Fitur Enterprise" di bagian bawah dokumen ini **sudah diimplementasikan** — lihat status terbaru per item di bagian itu; dokumen ini sempat tertinggal dari kode sebelum disinkronkan ulang 2026-09-21.

Role & Permission (lihat `docs/role-permission-plan.md`) sudah terpasang sejak awal di semua halaman Inventory: tombol aksi digating pakai `hasPermission(currentUser, module, action)`, dan tab di `InventoryLayout.tsx` cuma muncul kalau `currentUser` punya akses ke module tersebut (pola sama seperti `Sidebar.tsx`).

### Perubahan arsitektur: shared state lewat Outlet context

Stock In/Out perlu mengubah `item.stock` yang juga ditampilkan di halaman Items — tapi tiap halaman sebelumnya punya `useState` lokal sendiri (tidak ter-share). Untuk mengatasi ini, state `items` dan `transactions` **diangkat ke `InventoryLayout.tsx`** dan di-share ke semua halaman anak lewat `<Outlet context={...} />` + `useOutletContext<InventoryContext>()` (fitur bawaan React Router untuk kasus persis seperti ini — tidak perlu Context Provider terpisah). `ItemsPage.tsx` sudah disesuaikan untuk konsumsi context ini alih-alih state lokal. Sudah diverifikasi: approve transaksi Stock Out langsung mengurangi angka stok yang terlihat di tab Items, tanpa reload halaman.

### Approval workflow (lihat detail lengkap di roadmap #2 di bawah) [Selesai]

- User dengan permission `approve` yang input di bawah `approvalThreshold` → transaksi langsung `approved`, stok langsung ter-update.
- User tanpa `approve`, atau di atas `approvalThreshold` walau punya `approve` → transaksi `pending`, stok **belum** berubah, menunggu approve/reject inline di tabel atau lewat `ApprovalsPage.tsx` (transaksi rejected tidak mengubah stok).
- Validasi: quantity harus > 0; untuk Stock Out, quantity tidak boleh melebihi stok tersedia saat ini di gudang itu.

---

## Phase 1 — Struktur Dasar (disepakati, dan sudah berkembang jauh lebih lengkap dari rencana awal)

### Data Model — `src/data/inventory.tsx` [Selesai]

`stock: number` tunggal di rencana awal **diganti jadi stok per-gudang** (`warehouseStock`, lihat bawah) begitu multi-gudang diimplementasikan — `Item` sendiri tidak lagi menyimpan angka stok:

```ts
export interface Item {
  id: number
  sku: string
  name: string
  category: string
  unit: string                        // unit dasar — stok selalu dilacak dalam unit ini
  minStock: number
  purchaseUnit?: string                // unit pembelian dari supplier kalau beda dari unit dasar (mis. "box")
  purchaseConversionFactor?: number    // 1 purchaseUnit = sekian unit dasar (mis. 1 box = 12 pcs)
  barcode?: string                     // untuk scan cepat saat Stock In/Out
}

export const CATEGORIES = ['ATK', 'Elektronik', 'Consumable']
export const UNITS = ['pcs', 'unit', 'box', 'karton', 'rim', 'botol', 'kg']
```

`StockTransaction` — jauh lebih kaya dari rencana awal (transfer antar-gudang, batch/lot & expiry, cost center, attachment, unit pembelian):

```ts
export type StockTransactionType = 'in' | 'out' | 'transfer'

export interface StockTransaction {
  id: number
  itemId: number
  type: StockTransactionType
  quantity: number                    // selalu dalam unit dasar (hasil konversi)
  date: string
  picId: number                       // User.id
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: number
  approvedAt?: string
  reference?: string
  supplierId?: number                 // khusus 'in'
  note?: string
  department?: string                 // cost center, khusus 'out'
  batchNumber?: string                // khusus 'in', item batch-tracked
  expiryDate?: string
  purchaseQuantity?: number           // qty seperti dientry user (mis. "2 box"), khusus 'in'
  purchaseUnit?: string
  warehouseId?: number                // gudang tujuan (in) / asal (out)
  fromWarehouseId?: number            // khusus 'transfer'
  toWarehouseId?: number
  attachments?: Attachment[]          // scan PO/Surat Jalan/Invoice/BAST
}
```

Stok per gudang disimpan terpisah: `interface WarehouseStock { itemId, warehouseId, quantity }`, diakses lewat `getStockQuantity(warehouseStock, itemId, warehouseId?)` (total semua gudang kalau `warehouseId` diomit).

### Struktur Folder & Routing [Selesai, lebih besar dari rencana awal]

```
src/pages/inventory/
├── InventoryLayout.tsx          # PageToolbar + tab nav + <Outlet context={...}/>
├── ItemsPage.tsx                 # master data barang
├── StockTransactionPage.tsx      # komponen bersama, diparameterisasi via prop `type: 'in' | 'out'`
├── StockInPage.tsx               # wrapper tipis: <StockTransactionPage type="in" />
├── StockOutPage.tsx              # wrapper tipis: <StockTransactionPage type="out" />
├── StockTransferPage.tsx         # transfer antar gudang
├── StockOpnamePage.tsx           # rekonsiliasi stok sistem vs fisik
├── StockHistoryPage.tsx          # riwayat gabungan in/out/transfer/opname, read-only
└── BatchesPage.tsx               # daftar batch/lot + status expired/expiring
```

Stock In dan Stock Out ~90% identik (form & tabel sama, cuma beda tipe dan matematika stok), jadi ditulis sebagai **satu komponen bersama** (`StockTransactionPage`) dipakai oleh dua wrapper tipis — bukan 2 file terduplikasi.

`AppRouter.tsx` — route `inventory` nested dengan index redirect ke `items`, plus route untuk `stock-in`/`stock-out`/`transfer`/`stock-opname`/`history`/`batches`, semua anak dari `InventoryLayout`.

`InventoryLayout.tsx` — reuse `PageToolbar`, `react-bootstrap` `Nav variant="tabs"` dengan `Nav.Link as={NavLink}`, diikuti `<Outlet context={...}/>`. Tab difilter pakai `hasModuleAccess(currentUser, tab.module)` — pola sama seperti filtering menu di `Sidebar.tsx`.

### Tiap halaman [Selesai]

- **ItemsPage** — pola identik `UsersPage.tsx`: search/filter per field (SKU, Name, Category, Stock status) + `Table` (kolom stok = total semua gudang, `Badge` merah "Low Stock" kalau ≤ `minStock`, klik jumlah stok untuk lihat rincian per gudang) + `Modal` Add/Edit + `Modal` konfirmasi hapus.
- **StockInPage / StockOutPage** — form: pilih gudang, item (hint stok tersedia di gudang itu), scan barcode/QR (input scanner USB = keyboard + Enter) untuk auto-pilih item, qty (dengan toggle unit dasar vs unit pembelian kalau item punya konversi), batch number + expiry date (kalau item batch-tracked), supplier (khusus in) / department cost center (khusus out), reference, note, upload attachment (PO/Surat Jalan/Invoice/BAST). Approval mengikuti `approvalThreshold` (lihat bagian Approval Workflow).
- **StockTransferPage** — sama seperti Stock In/Out tapi pilih gudang asal & tujuan sekaligus.
- **StockOpnamePage** — input stok fisik hasil hitung manual per gudang, sistem hitung selisih (`difference = physicalQty - systemQty`) dan generate transaksi adjustment setelah di-approve.
- **StockHistoryPage** — tabel gabungan in/out/transfer/opname (read-only), `Badge` warna per tipe, filter item/tipe/gudang/status/departemen/tanggal, kolom Documents (link attachment), export CSV.
- **BatchesPage** — daftar semua batch/lot per item+gudang, status "Expired"/"Expiring soon" (≤30 hari) dihitung dari `expiryDate`.

Semua komponen yang dipakai (`Table`, `Modal`, `Input`, `Select`, `Badge`, `Button`, `Card`, `PageToolbar`) ada di `components/ui/` dan `components/common/`.

### Keterkaitan dengan Users Module

Hasil review `src/data/users.ts` dan `src/pages/UsersPage.tsx` terhadap kebutuhan Inventory di atas:

- **`StockTransaction.picId` merujuk ke `User.id`** — **[Selesai]**. Form Stock In/Out pakai `Select` berisi daftar user `status: 'active'`, default ke `currentUser`.
- **Konsep "user yang sedang login"** — **[Selesai]**, lihat `docs/role-permission-plan.md` (`src/data/session.tsx`). `Header.tsx` juga sudah ditarik dari `currentUser` yang sebenarnya, bukan teks statis lagi.
- **`User` field tambahan untuk cost tracking**:
  - `department: string` — **[Selesai]** (`DEPARTMENTS` const di `data/users.ts`, kolom + filter + form di `UsersPage.tsx`). Beda dari `StockTransaction.department` (cost center tujuan barang keluar) — keduanya bisa berbeda, `department` di `User` cuma departemen home-base PIC.
  - `warehouseId?: number` di `User` — **[Selesai]**, lihat detail di roadmap #1 di bawah.
- **Role granular** — **[Selesai]**, lihat `docs/role-permission-plan.md`. Role adalah entitas dinamis (dikelola lewat halaman "Roles" di Settings), permission per-module dan per-aksi (`view`/`create`/`edit`/`delete`/`approve`/`export`).

---

## Roadmap Fitur Enterprise (perusahaan besar)

Disusun sebagai arah pengembangan supaya data model tidak perlu dibongkar ulang — **hampir semua item sudah diimplementasikan**, disinkronkan 2026-09-21. Sisa gap ditandai eksplisit per item.

### 1. Multi-gudang / Multi-lokasi — [Selesai]
`data/warehouses.tsx` (`WarehousesProvider`, halaman `WarehousesPage.tsx` sendiri di sidebar) + `WarehouseStock { itemId, warehouseId, quantity }` (stok dipecah per lokasi, bukan 1 angka global) + `StockTransferPage.tsx` untuk transfer antar gudang.

**Pembatasan staff ke gudang tertentu — [Selesai]**: `User.warehouseId?: number` (optional, cuma di-set untuk Warehouse Staff lewat form Add/Edit di `UsersPage.tsx` — Admin/Supervisor dibiarkan kosong = akses semua gudang, sesuai keputusan scope). Diterapkan di form create transaksi saja (bukan halaman view/report, sesuai keputusan scope):
- **Stock In/Out & Stock Opname** (`StockTransactionPage.tsx`, `StockOpnamePage.tsx`): dropdown Warehouse cuma menampilkan gudang yang di-assign ke `currentUser.warehouseId` kalau di-set.
- **Transfer** (`StockTransferPage.tsx`): "From Warehouse" dikunci ke gudang staff, "To Warehouse" tetap bebas pilih gudang aktif manapun (tujuan transfer).
- **[Selesai]** — view-scoping penuh menyusul (disinkronkan 2026-09-21): `StockHistoryPage.tsx`, `BatchesPage.tsx`, list transaksi di `StockTransactionPage.tsx`/`StockOpnamePage.tsx` (filter Warehouse terkunci ke satu opsi + hard-filter di data, bukan cuma default), `StockTransferPage.tsx` (transfer masuk **atau** keluar dari warehouse-nya), dan `ItemsPage.tsx` di Settings (kolom "Stock" + badge "Low Stock" + modal breakdown, semua dihitung dari warehouse-nya saja, bukan total semua gudang). `Reports` tidak perlu disentuh karena Warehouse Staff memang tidak punya permission `reports` sama sekali.

### 2. Approval Workflow — [Selesai, versi menengah]
Alur: transaksi dari user tanpa permission `approve` otomatis `pending` (stok belum berubah) sampai di-approve/reject — bisa inline di tabel Stock In/Out/Transfer/Opname, atau lewat halaman `ApprovalsPage.tsx` (antrian approval terpusat lintas jenis transaksi, sudah ada sebagai menu sidebar sendiri). Ada **ambang batas auto-approve** (`approvalThreshold`, dikonfigurasi di `ApprovalSettingsProvider`/Settings — default 100 unit): user ber-permission `approve` yang input di bawah ambang batas langsung `approved`, di atas ambang batas tetap `pending` walau dia punya izin approve. Notifikasi approval pending sudah muncul di bell (`Header.tsx`).

**Approval berjenjang (multi-level) — [Selesai]**. `Role.approvalLevel?: number` (`data/roles.ts`; Admin=2, Warehouse Supervisor=1, Warehouse Staff=undefined/0) + helper `canApproveAtLevel(user, module, level)` di `utils/permissions.ts`. Kedua threshold dikonfigurasi di Settings → General (`escalationThreshold`, default 500 unit, harus > `approvalThreshold`):
- Quantity ≤ `approvalThreshold` → tetap auto-approve seperti sebelumnya (kalau creator punya permission `approve`).
- `approvalThreshold` < quantity ≤ `escalationThreshold` → 1x approve seperti sebelumnya (siapapun ber-`approvalLevel` ≥ 1, mis. Supervisor atau Admin), langsung `approved` + stok ter-update.
- Quantity > `escalationThreshold` → `requiresSecondApproval: true` ditentukan sekali saat transaksi dibuat (tidak berubah retroaktif kalau threshold di-update belakangan). Alur status: `pending` → (approve oleh approvalLevel≥1, dicatat di `level1ApprovedBy`/`level1ApprovedAt`, **stok belum berubah**) → `pending_level2` → (final approve oleh approvalLevel≥2, mis. Admin) → `approved`, stok baru ter-update di titik ini.
- **Maker-checker**: user yang sama tidak bisa jadi approver level 1 **dan** level 2 pada transaksi yang sama, walau dia approvalLevel 2 (dicek `level1ApprovedBy !== currentUser.id` di `ApprovalsPage.tsx`) — kalau Admin approve level 1 sendiri, transaksi itu butuh Admin *lain* untuk final approve.
- Reject bisa dilakukan di status `pending` maupun `pending_level2` oleh siapapun yang eligible di level itu.
- Berlaku untuk semua jenis: Stock In/Out/Transfer/Opname. Badge status baru "Pending Final" (info/biru) di semua tabel + filter status, menampilkan "L1: {nama approver}" di `ApprovalsPage.tsx`.
- Diuji end-to-end: Staff buat transaksi > escalation threshold → Supervisor approve (jadi Pending Final, stok belum berubah, tombol Supervisor hilang) → Admin final approve (jadi Approved, stok ter-update) → dicek di Activity Log tercatat 2 baris terpisah ("Level 1 approved... menunggu final approval" lalu "Final approved (level 2)..."). Juga diuji maker-checker: Admin yang approve level 1 sendiri tidak bisa final-approve transaksi itu sendiri.

### 3. Dokumen resmi & lampiran — [Selesai]
Field `reference` untuk no. PO/tujuan, `supplierId` untuk in, `attachments?: Attachment[]` (tipe di-generalisasi ke `utils/attachments.ts`, dipakai juga oleh Tickets) untuk upload scan PO/Surat Jalan/Invoice/BAST — muncul sebagai kolom "Documents" di Stock In/Out & History.

### 4. Audit Trail (Activity Log) — [Selesai]
`data/activityLog.tsx` (`ActivityLogProvider` + `logActivity()`) dipanggil dari semua module (Inventory, Users, Roles, Suppliers, Warehouses, Tickets, Settings) di tiap aksi create/update/delete/approve/reject. Halaman `ActivityLogPage.tsx` sendiri di sidebar, append-only (tidak ada UI edit/hapus entry), filter per user/aksi/module/tanggal.

### 5. Role & Permission granular — [Selesai, lihat `docs/role-permission-plan.md`]
Role entitas dinamis (halaman "Roles" di Settings) dengan permission per-module dan per-aksi (`view`/`create`/`edit`/`delete`/`approve`/`export`). Contoh: Warehouse Staff bisa `create` Stock In/Out tapi tidak `approve`; Warehouse Supervisor bisa `approve`.

### 6. Notifikasi otomatis — [Selesai]
Bell icon di `Header.tsx`: low stock alert, approval pending (transaksi & stock opname), batch expired/expiring, plus (sejak modul Tickets) ticket assigned/comment/overdue — semua dengan toggle on/off per jenis di Settings → Notifications.

### 7. Batch/Lot & Expiry Date — [Selesai]
`Batch { id, itemId, warehouseId, batchNumber, expiryDate, quantity, receivedDate }`, konsumsi FEFO (`consumeFefo()`) saat Stock Out untuk item batch-tracked, halaman `BatchesPage.tsx`, alert expired/expiring di notification bell.

### 8. Konversi satuan — [Selesai]
`Item.purchaseUnit` + `purchaseConversionFactor` (mis. 1 box = 12 pcs). Form Stock In toggle input dalam unit pembelian atau unit dasar, auto-konversi (`hasUnitConversion()`), stok selalu disimpan dalam unit dasar.

### 9. Barcode / QR Code Scanning — [Selesai]
`Item.barcode` + `findItemByBarcode()`. Input scan (scanner USB = keyboard input + Enter) di form Stock In/Out auto-pilih item dari barcode.

### 10. Stock Opname — [Selesai]
`StockOpname { itemId, warehouseId, systemQty, physicalQty, difference, ... }`, halaman `StockOpnamePage.tsx`, approval menghasilkan transaksi adjustment.

### 11. Data master tambahan — [Selesai]
**Suppliers** — modul & menu sidebar sendiri (`data/suppliers.tsx`, `SuppliersPage.tsx`), dipakai sebagai pilihan di form Stock In. **Departemen/Cost Center** — `DEPARTMENTS` const + field `department` di `StockTransaction` (khusus Stock Out), dipakai untuk grouping di Reports.

### 12. Laporan & Export — [Selesai]
`ReportsPage.tsx`: mutation report (grouping by category/warehouse/department, summary card, export CSV, print/PDF). Sejak modul Tickets, halaman yang sama juga punya laporan Tickets (grouping by category/status/assignee) lewat selector "Report".

---

## Verifikasi (tiap phase implementasi)

1. `npm run build` dan `npm run lint` — pastikan TypeScript & ESLint lolos tanpa error.
2. Cek manual di browser tiap halaman baru (screenshot via Claude in Chrome) untuk layout tidak overlap dan data konsisten dengan mock.
3. Cek navigasi tab (`/inventory/items`, `/inventory/stock-in`, dst) berpindah dengan benar dan `Sidebar` tetap menandai "Inventory" aktif di semua sub-halaman.

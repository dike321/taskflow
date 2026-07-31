# Rencana Modul Inventory

## Context

TaskFlow akan digunakan untuk **administrasi barang masuk & keluar di perusahaan besar** (bukan pencatatan sederhana skala toko kecil). Ini memengaruhi kebutuhan fitur: perlu approval workflow, multi-gudang, audit trail, dan dokumentasi resmi — bukan sekadar CRUD barang.

Menu sidebar "Projects" sudah diganti menjadi **"Inventory"** (`/inventory`). Modul ini punya 4 bagian utama: **Items** (master data barang), **Stock In** (barang masuk), **Stock Out** (barang keluar), **History** (riwayat mutasi gabungan). Navigasi antar bagian memakai tab di dalam satu menu sidebar, masing-masing tetap punya URL sendiri agar bisa di-bookmark/refresh.

Status: **Items — [Selesai]**. **Stock In / Stock Out — [Selesai]**. History — **[Belum]**, menyusul. Fitur-fitur enterprise di bagian bawah dokumen ini adalah **roadmap lanjutan**, belum tentu semua dikerjakan sekaligus — akan diprioritaskan bertahap.

Role & Permission (lihat `docs/role-permission-plan.md`) sudah terpasang sejak awal di semua halaman Inventory: tombol aksi digating pakai `hasPermission(currentUser, module, action)`, dan tab di `InventoryLayout.tsx` cuma muncul kalau `currentUser` punya akses ke module tersebut (pola sama seperti `Sidebar.tsx`).

### Perubahan arsitektur: shared state lewat Outlet context

Stock In/Out perlu mengubah `item.stock` yang juga ditampilkan di halaman Items — tapi tiap halaman sebelumnya punya `useState` lokal sendiri (tidak ter-share). Untuk mengatasi ini, state `items` dan `transactions` **diangkat ke `InventoryLayout.tsx`** dan di-share ke semua halaman anak lewat `<Outlet context={...} />` + `useOutletContext<InventoryContext>()` (fitur bawaan React Router untuk kasus persis seperti ini — tidak perlu Context Provider terpisah). `ItemsPage.tsx` sudah disesuaikan untuk konsumsi context ini alih-alih state lokal. Sudah diverifikasi: approve transaksi Stock Out langsung mengurangi angka stok yang terlihat di tab Items, tanpa reload halaman.

### Mini approval workflow (bagian dari Stock In/Out, bukan roadmap #2 penuh)

Karena permission `approve` sudah ada di data model role, Stock In/Out mengimplementasikan alur approval sederhana (bukan yang penuh seperti roadmap #2 — belum ada halaman approval terpisah/notifikasi):
- User dengan permission `approve` (mis. Warehouse Supervisor, Admin) → transaksi yang mereka buat langsung berstatus `approved` dan stok langsung ter-update.
- User tanpa `approve` (mis. Warehouse Staff) → transaksi berstatus `pending`, stok **belum** berubah, menunggu user ber-permission `approve` klik tombol **Approve**/**Reject** di tabel (transaksi rejected tidak mengubah stok).
- Validasi: quantity harus > 0; untuk Stock Out, quantity tidak boleh melebihi stok tersedia saat ini.

---

## Phase 1 — Struktur Dasar (disepakati)

### Data Model — `src/data/inventory.ts`

Mengikuti pola `src/data/users.ts` (interface + mock array). **[Selesai — bagian `Item`]**:

```ts
export interface Item {
  id: number
  sku: string
  name: string
  category: string
  unit: string        // pcs, box, kg, dst
  stock: number        // qty saat ini
  minStock: number     // ambang batas stok rendah
}

export const CATEGORIES = ['ATK', 'Elektronik', 'Consumable']
export const UNITS = ['pcs', 'unit', 'box', 'rim', 'botol', 'kg']
```

`StockTransaction` — **[Selesai]**, persis seperti rencana awal:

```ts
export interface StockTransaction {
  id: number
  itemId: number
  type: 'in' | 'out'
  quantity: number
  date: string
  picId: number                              // merujuk ke User.id, bukan teks bebas
  status: 'pending' | 'approved' | 'rejected' // status approval
  approvedBy?: number                         // User.id approver
  approvedAt?: string
  reference?: string                          // no. PO / supplier (in) atau tujuan/departemen (out)
  note?: string
}
```

### Struktur Folder & Routing

```
src/pages/inventory/
├── InventoryLayout.tsx        # PageToolbar + tab nav + <Outlet context={items, transactions, ...}/>
├── ItemsPage.tsx               # [Selesai]
├── StockTransactionPage.tsx    # [Selesai] komponen bersama, di-parameterisasi via prop `type: 'in' | 'out'`
├── StockInPage.tsx             # [Selesai] wrapper tipis: <StockTransactionPage type="in" />
├── StockOutPage.tsx            # [Selesai] wrapper tipis: <StockTransactionPage type="out" />
└── StockHistoryPage.tsx        # [Belum]
```

Stock In dan Stock Out ~90% identik (form & tabel sama, cuma beda tipe dan matematika stok), jadi ditulis sebagai **satu komponen bersama** (`StockTransactionPage`) dipakai oleh dua wrapper tipis — bukan 2 file terduplikasi.

`AppRouter.tsx` — route `inventory` nested dengan index redirect:

```tsx
<Route path="inventory" element={<InventoryLayout />}>
  <Route index element={<Navigate to="items" replace />} />
  <Route path="items" element={<ItemsPage />} />
  <Route path="stock-in" element={<StockInPage />} />
  <Route path="stock-out" element={<StockOutPage />} />
  {/* history menyusul di Phase 3 */}
</Route>
```

`InventoryLayout.tsx` — **[Selesai]**. Reuse `PageToolbar`, `react-bootstrap` `Nav variant="tabs"` dengan `Nav.Link as={NavLink}`, diikuti `<Outlet context={...}/>`. Tab "Items" / "Stock In" / "Stock Out" **difilter pakai `hasModuleAccess(currentUser, tab.module)`** — pola sama seperti filtering menu di `Sidebar.tsx`. Tab History ditambahkan ke array ini begitu halamannya dibangun.

### Rencana tiap halaman

- **ItemsPage — [Selesai]** — pola identik `UsersPage.tsx`: search/filter terpisah per field (SKU, Name, Category, Stock status) + `Table` (kolom SKU, Name, Category, Stock dengan `Badge` merah "Low Stock" jika `stock <= minStock`) + `Modal` Add/Edit + `Modal` konfirmasi hapus (size="sm"). Tombol Add/Edit/Delete digating pakai `hasPermission(currentUser, 'inventory.items', action)`.
- **StockInPage / StockOutPage — [Selesai]** — tabel transaksi per tipe (join ke nama item & PIC), filter per Item & Status. `Modal` tambah transaksi (`Select` item dengan hint stok tersedia, `Input` qty (pakai `parseIntInput`, sama seperti fix bug di Items) /date/PIC (dropdown user aktif, default ke `currentUser`) /reference/note). Submit mengubah `item.stock` (+ untuk in, − untuk out) **kalau langsung approved**; kalau berstatus pending, stok baru berubah saat dapat approve. Validasi: qty > 0, dan untuk Stock Out qty tidak boleh melebihi stok tersedia.
- **StockHistoryPage — [Belum]** — tabel gabungan in+out (read-only), `Badge` hijau "IN" / merah "OUT", filter per item/tipe/tanggal.

Semua komponen yang dipakai (`Table`, `Modal`, `Input`, `Select`, `Badge`, `Button`, `Card`, `PageToolbar`) sudah ada di `components/ui/` dan `components/common/`.

### Keterkaitan dengan Users Module

Hasil review `src/data/users.ts` dan `src/pages/UsersPage.tsx` terhadap kebutuhan Inventory di atas:

- **`StockTransaction.picId` merujuk ke `User.id`** — **[Selesai]**. Form Stock In/Out pakai `Select` berisi daftar user `status: 'active'`, default ke `currentUser`.
- **Konsep "user yang sedang login"** — **[Selesai]**, lihat `docs/role-permission-plan.md` (`src/data/session.ts`). `Header.tsx` juga sudah ditarik dari `currentUser` yang sebenarnya, bukan teks statis lagi.
- **`User` field tambahan untuk cost tracking**:
  - `department: string` — **[Selesai]** sudah ditambahkan (`DEPARTMENTS` const di `data/users.ts`, kolom + filter + form di `UsersPage.tsx`). Dipakai untuk tracking barang keluar dipakai divisi mana begitu Stock Out dibangun.
  - `warehouseId?: number` — **[Belum]**, untuk membatasi staff hanya mengelola gudang yang ditugaskan (kalau multi-gudang diimplementasikan).
- **Role granular (staff/supervisor/admin/finance) — sudah dirancang di dokumen terpisah**: lihat `docs/role-permission-plan.md`. Role akan jadi entitas dinamis (bisa dikelola lewat halaman "Roles"), dengan permission per-module dan per-aksi (`view`/`create`/`edit`/`delete`/`approve`/`export`), bukan sekadar view/edit generik.

---

## Roadmap Fitur Enterprise (perusahaan besar)

Belum masuk implementasi, disusun sebagai arah pengembangan lanjutan supaya data model tidak perlu dibongkar ulang nanti.

### 1. Multi-gudang / Multi-lokasi
Stok dipecah per lokasi (bukan 1 angka global), plus fitur transfer stok antar gudang/cabang.

### 2. Approval Workflow — *versi mini sudah jalan di Stock In/Out*
Barang keluar (terutama jumlah besar) melalui alur: **Pending → Disetujui atasan → Dieksekusi**. Hak approve tergantung role/jabatan. Yang sudah ada: transaksi dari user tanpa permission `approve` otomatis `pending` dan stok belum berubah sampai di-approve inline di tabel yang sama. **Belum ada** (versi enterprise penuh): halaman/antrian approval terpisah, notifikasi ke approver, approval berjenjang (multi-level), atau ambang batas jumlah yang wajib approval (mis. "di atas 100 unit wajib approval, di bawahnya auto-approve").

### 3. Dokumen resmi & lampiran
Nomor **PO (Purchase Order)** untuk barang masuk, **Surat Jalan/Invoice**, **Berita Acara Serah Terima (BAST)**, dan upload lampiran/scan dokumen.

### 4. Audit Trail (Activity Log)
Histori siapa mengubah apa dan kapan, idealnya append-only (tidak bisa diedit/dihapus sembarangan). Sudah tercantum sebagai planned feature di README project.

### 5. Role & Permission granular — *sudah dirancang, lihat `docs/role-permission-plan.md`*
Role jadi entitas dinamis (halaman "Role Management" sendiri) dengan permission per-module dan per-aksi (`view`/`create`/`edit`/`delete`/`approve`/`export`). Contoh: Warehouse Staff bisa `create` Stock In/Out tapi tidak `approve`; Warehouse Supervisor bisa `approve`.

### 6. Notifikasi otomatis
Stok menipis (low stock alert), approval pending menunggu atasan. Sudah tercantum sebagai planned feature di README project.

### 7. Batch/Lot & Expiry Date
Untuk barang consumable/perishable: tracking per batch/lot number + tanggal kadaluarsa, dengan logika FIFO/FEFO.

### 8. Konversi satuan
Barang dibeli per Box/Karton, dikeluarkan per Pcs — perlu konversi satuan otomatis.

### 9. Barcode / QR Code Scanning
Input cepat dan mengurangi human error saat mencatat barang masuk/keluar.

### 10. Stock Opname
Mencocokkan stok sistem vs stok fisik gudang secara berkala, mencatat selisih (adjustment).

### 11. Data master tambahan
**Supplier/Vendor** (kontak, riwayat pembelian) dan **Departemen/Cost Center** (melacak barang keluar dipakai divisi mana, untuk alokasi biaya).

### 12. Laporan & Export
Laporan mutasi per periode/kategori/gudang, export Excel/PDF untuk audit dan laporan ke manajemen.

---

## Verifikasi (tiap phase implementasi)

1. `npm run build` — pastikan TypeScript lolos tanpa error.
2. Screenshot headless Chrome tiap halaman baru untuk cek layout tidak overlap.
3. Cek navigasi tab (`/inventory/items`, `/inventory/stock-in`, dst) berpindah dengan benar dan `Sidebar` tetap menandai "Inventory" aktif di semua sub-halaman.

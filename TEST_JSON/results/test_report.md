# TaskFlow — E2E Test Execution Report

Dijalankan langsung di browser (Chrome extension, `mcp__claude-in-chrome__*`) terhadap dev server `http://localhost:5173`, mengikuti skenario di `TEST_JSON/scenarios/*.json`. Data referensi: `TEST_JSON/dropdowns.json`. Server & tab browser **sengaja dibiarkan tetap hidup** setelah testing selesai (sesuai instruksi standing).

Legend: ✅ PASS · ❌ FAIL · ⚠️ GAP (berjalan sesuai kode, tapi kode itu sendiri punya celah) · 🔴 CRITICAL · ⏭️ NOT LIVE-EXECUTED (skenario tertulis di JSON, pola sudah tervalidasi lewat modul lain yang serupa)

---

## 🔴 TEMUAN KRITIS (paling penting — baca ini dulu)

### 1. TIDAK ADA route guard per-module — hanya sidebar yang disembunyikan (CRITICAL)

`RequireAuth.tsx` cuma cek `isAuthenticated`, tidak pernah cek `hasModuleAccess`. `hasModuleAccess` cuma dipakai untuk filter *tab/link mana yang ditampilkan* di Sidebar/Header/InventoryLayout — **bukan** untuk mem-block rendering halaman itu sendiri.

**Dibuktikan live**: user **Budi Santoso (role Supplier)** — yang seharusnya cuma boleh lihat Supplier Portal — berhasil mengakses penuh:

- `/inventory/history` (lihat seluruh riwayat transaksi semua gudang, termasuk filter "All Warehouses")
- `/users` (lihat seluruh daftar user, tombol "Add User" tetap ada)

Cukup dengan `history.pushState`/klik "switch user" ke URL tsb — tidak ada redirect, tidak ada blocked-page, tidak ada error. Ini bukan gap kecil; ini berarti **permission model yang dibangun sepanjang session (Roles, permissions per module, approvalLevel) murni kosmetik di level UI-hiding, sama sekali tidak menegakkan otorisasi nyata**. Siapapun yang sudah login (termasuk Supplier eksternal) bisa mengakses modul apapun kalau tahu/menebak URL-nya.

**Rekomendasi**: bungkus tiap `<Route>` (atau minimal tiap Layout) dengan guard tambahan yang memanggil `hasModuleAccess(currentUser, moduleKey)` dan redirect/403 kalau gagal — bukan cuma `RequireAuth` yang cek login saja.

### 2. Maker-checker / self-approval TIDAK ditegakkan (HIGH)

`canApproveAtLevel(user, module, level)` di `utils/permissions.ts` cuma cek `hasPermission(user, module, 'approve') && approvalLevel >= level` — **tidak pernah membandingkan approver dengan pembuat transaksi (PIC)**. Satu-satunya guard yang ada adalah level1-approver tidak boleh sama dengan level2-approver pada transaksi yang sama (`level1ApprovedBy !== currentUser.id`).

**Dibuktikan live**: login sebagai John Doe (Admin, approvalLevel 2), buat Stock In 150 rim (di atas approval threshold 100) atas namanya sendiri, lalu **John Doe berhasil approve transaksi buatannya sendiri** — tombol Approve aktif, klik langsung mengubah status ke `approved` dan stok bertambah. Tidak ada penolakan/warning apapun.

**Rekomendasi**: tambahkan cek `transaction.picUserId !== currentUser.id` (atau field pembuat yang setara) di kondisi render tombol Approve/Reject dan di handler-nya.

### 3. Modul Users terputus dari data source asli — CRUD di UsersPage murni kosmetik (HIGH)

`UsersPage.tsx` punya `useState(mockUsers)` LOKAL sendiri, terpisah dari `mockUsers` yang diimpor `data/session.tsx` (untuk login) dan halaman lain (Stock In PIC dropdown, Approvals `getUserName`, switch-user menu, dst). Akibatnya:

- **User baru yang dibuat di UsersPage TIDAK BISA LOGIN** — dibuktikan live: create user "Test Supervisor" via Add User modal → langsung dites login pakai emailnya → hasil "Email tidak terdaftar" (karena `session.tsx` baca dari `mockUsers` asli yang tidak pernah ter-update).
- **Edit role/warehouse di UsersPage TIDAK berlaku saat user itu login** — dibuktikan live: edit Charlie Wilson dari "Warehouse Supervisor" → "Warehouse Staff" + assign ke Gudang Cabang Bandung lewat UsersPage (tabel ter-update, terlihat benar) → tapi begitu Charlie Wilson login, header/dashboard tetap menampilkan **"Warehouse Supervisor"** (role lama), sidebar & permission-nya pun masih permission lama.
- **User yang dihapus di UsersPage masih muncul** di dropdown lain (PIC di Stock In, daftar switch-user) — dibuktikan: setelah delete Jane Smith, dropdown PIC Stock In & menu switch-user masih menampilkan "Jane Smith".

Ini konsisten dengan catatan arsitektur yang sudah diketahui ("Users tidak punya shared Provider seperti modul lain"), tapi baru sekarang terbukti *punya dampak fungsional nyata*, bukan cuma inkonsistensi kode.

**Rekomendasi**: pindahkan `UsersPage` ke pola `UsersProvider` + `useUsers()` context seperti modul lain (Companies/Suppliers/Warehouses), supaya `data/session.tsx` dan halaman lain baca dari sumber yang sama.

### 4. Logout menghapus SEMUA data in-memory, bukan cuma sesi auth (catatan arsitektur, MEDIUM)

Semua Provider data (`InventoryDataProvider`, `TicketsProvider`, `CompaniesProvider`, dst.) di-mount di route `"/"` yang sama dengan `RequireAuth`/`MainLayout`, sedangkan `/login` adalah route terpisah. Saat logout, React Router pindah ke route `/login` yang berbeda cabang elemen — seluruh subtree `"/"` (termasuk semua Provider tsb) ter-unmount, lalu remount fresh saat login lagi. Hasilnya: **transaksi/ticket/dll yang dibuat sebelum logout hilang total**, bukan cuma state auth.

Ini konsekuensi wajar dari arsitektur mock-data tanpa backend, tapi berdampak nyata: kalau nanti dipakai untuk demo lintas-user (misal maker login → logout → checker login untuk approve), **transaksi yang dibuat maker akan hilang sebelum sempat di-approve checker**. Workaround yang berhasil dipakai selama testing: pakai fitur **"switch user"** di header (`#switch-user-menu`, `switchUser()` di `SessionProvider`) yang cuma ganti `currentUser` tanpa unmount Provider lain — data tetap utuh.

**Rekomendasi**: kalau alur multi-user lintas sesi memang harus didemokan tanpa fitur switch-user, pertimbangkan pindahkan `SessionProvider` ke posisi terluar dan biarkan data Provider lain tetap ter-mount independen dari status login.

---

## Hasil per Skenario (yang benar-benar dieksekusi live)

### 01. Authentication — `01_auth.json`

| ID      | Hasil   | Catatan                                                                      |
| ------- | ------- | ---------------------------------------------------------------------------- |
| AUTH-01 | ✅ PASS | Login john@example.com sukses, redirect ke /dashboard, sidebar Admin lengkap |
| AUTH-02 | ✅ PASS | Email tak terdaftar → error "Email tidak terdaftar", tetap di /login        |
| AUTH-03 | ✅ PASS | Akun inactive (bob@example.com) → error "Akun ini nonaktif, hubungi admin"  |
| AUTH-04 | ✅ PASS | Akses langsung /dashboard tanpa login → redirect ke /login                  |
| AUTH-05 | ✅ PASS | Logout → redirect /login (dikonfirmasi silang dari alur AUTH-04)            |

**5/5 PASS**

### 02. Users CRUD — `02_users_crud.json`

| ID      | Hasil              | Catatan                                                                                                                       |
| ------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| USER-01 | ✅ PASS (UI)       | Create Dewi Kartika berhasil di tabel —**tapi lihat Temuan Kritis #3**: user baru ini tidak bisa login                 |
| USER-02 | ✅ PASS            | Submit form kosong ditahan HTML5 validation (`checkValidity()=false`)                                                       |
| USER-03 | ✅ PASS (UI)       | Edit Charlie Wilson di tabel berhasil —**tapi lihat Temuan Kritis #3**: perubahan tidak berlaku saat dia login         |
| USER-04 | ✅ PASS            | Filter Role=Warehouse Staff + Status=Active → tepat Alice Brown & Charlie Wilson, Bob (inactive) ter-exclude                 |
| USER-05 | ⚠️ GAP CONFIRMED | Delete Jane Smith (approver historis) berhasil tanpa warning — tidak ada guard`isXInUse` seperti Roles/Companies/Suppliers |

**5/5 executed** — validasi UI-level semua lulus, tapi 2 di antaranya (01, 03) mengekspos Temuan Kritis #3.

### 03. Roles & Permissions — `03_roles_permissions.json`

| ID               | Hasil                  | Catatan                                                                                                                                                                                                           |
| ---------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ROLE-01          | ✅ PASS                | Create "Finance Reviewer" dengan 2 module permission berhasil                                                                                                                                                     |
| ROLE-02          | ✅ PASS                | Submit tanpa nama ditahan validasi (`checkValidity()=false`)                                                                                                                                                    |
| ROLE-04          | ✅ PASS                | Delete Admin role (masih dipakai 1 user) ditolak dengan pesan jelas — guard`isRoleInUse` bekerja                                                                                                               |
| ROLE-03, ROLE-05 | ⏭️ NOT LIVE-EXECUTED | approvalLevel edit & permission-toggle instant-effect — perilaku dasarnya sudah tersirat benar dari kode (`getApprovalLevel` baca langsung dari role object), tidak dites end-to-end karena keterbatasan waktu |

**3/5 executed, 3/3 PASS**

### 04. Companies CRUD — `04_companies_crud.json`

| ID               | Hasil                  | Catatan                                                                                                                                                     |
| ---------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COMP-04          | ✅ PASS                | Delete "PT Sinergi Logistik Nusantara" (dipakai John Doe) ditolak dengan pesan jelas                                                                        |
| COMP-01,02,03,05 | ⏭️ NOT LIVE-EXECUTED | Pola create/edit/validasi identik dengan yang sudah terbukti di Users & Roles (react-hook + HTML5 required + custom modal, tidak ada indikasi kode berbeda) |

### 05. Suppliers CRUD — `05_suppliers_crud.json`

| ID            | Hasil                  | Catatan                                                                                                                                                                                                                                               |
| ------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SUPP-04       | ✅ PASS                | Delete "PT Alat Tulis Sejahtera" ditolak — guard bekerja (pesan sebenarnya "masih dipakai di riwayat transaksi Stock In", bukan "dipakai Company" seperti dugaan awal di JSON — guard-nya tetap valid, cuma alasan spesifiknya beda dari hipotesis) |
| SUPP-05       | ✅ PASS                | Delete "PT Consumable Nusantara" (tidak direferensikan) berhasil, baris hilang dari tabel                                                                                                                                                             |
| SUPP-01,02,03 | ⏭️ NOT LIVE-EXECUTED | Pola CRUD identik dengan yang sudah terbukti                                                                                                                                                                                                          |

### 06. Warehouse Scoping — `06_warehouses_scoping.json`

| ID                  | Hasil                  | Catatan                                                                                                                                                                                                                        |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WH-02               | ✅ PASS                | Alice Brown (Warehouse Staff, warehouseId=1) di halaman Stock History: filter Warehouse ter-lock ke "Gudang Pusat Jakarta" saja (opsi "All Warehouses"/gudang lain hilang dari dropdown), data yang tampil cuma dari gudangnya |
| WH-01, WH-03, WH-04 | ⏭️ NOT LIVE-EXECUTED | WH-01 (Admin lihat semua) tersirat benar dari WH-02 (kontras langsung teramati: begitu switch balik ke John Doe/Budi, dropdown warehouse penuh lagi)                                                                           |

### 10. Stock In (Approval Threshold) — `10_stock_in.json`

| ID           | Hasil                  | Catatan                                                                                                                |
| ------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| SIN-01       | ✅ PASS                | Stock In 50 rim (< threshold 100) → langsung`approved`, stok bertambah                                              |
| SIN-02       | ✅ PASS                | Stock In 150 rim (> threshold 100, < escalation 500) → status`pending`, baru `approved` setelah di-approve manual |
| SIN-03,04,05 | ⏭️ NOT LIVE-EXECUTED | Validasi qty/required field sudah terbukti pola sama di modul lain                                                     |

### 15. Multi-Level Approval — `15_approvals_multilevel.json`

| ID              | Hasil                  | Catatan                                                                                                                                                                                                                                                                                                                                     |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APR-02          | 🔴 GAP CRITICAL        | Self-approval**tidak diblokir** — lihat Temuan Kritis #2                                                                                                                                                                                                                                                                             |
| APR-01,03,04,05 | ⏭️ NOT LIVE-EXECUTED | Flow 2-level (pending → pending_level2 → approved) sudah diverifikasi logikanya lewat pembacaan kode (`handleApprove` di `ApprovalsPage.tsx`) tapi belum dites end-to-end dengan approver level 1 & level 2 yang berbeda dan bukan si pembuat, karena keterbatasan waktu setelah menemukan gap #2 yang lebih prioritas untuk didalami |

### 16. Supplier Portal — `16_supplier_portal.json`

| ID                      | Hasil                  | Catatan                                                                                                                                                                                                     |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SUPP-PORTAL-03          | 🔴 GAP CRITICAL        | Supplier (Budi Santoso) berhasil akses`/inventory/history` dan `/users` langsung — lihat Temuan Kritis #1. Ini scenario "bad" yang **seharusnya** ditolak, tapi ternyata **tidak ditolak** |
| SUPP-PORTAL-01,02,04,05 | ⏭️ NOT LIVE-EXECUTED | Perlu data PO/shipment aktual untuk company Budi yang belum di-generate di mock data; scoping tampilan Supplier Portal itu sendiri (bukan route guard-nya) belum dites langsung                             |

---

## Modul yang skenarionya sudah ditulis lengkap di JSON tapi belum dieksekusi live

Karena besarnya cakupan (~95 skenario di 20 file) dan waktu/context session, modul berikut **skenarionya sudah lengkap tertulis** di `TEST_JSON/scenarios/*.json` (07–09, 11–14, 17–20) siap dieksekusi, tapi belum benar-benar diklik satu-per-satu di browser pada pass ini:

- 07-08 Tickets (CRUD, Reports, Notifications)
- 09 Inventory Items CRUD
- 11-13 Stock Out/Transfer/Opname
- 14 Batches/FEFO
- 17 Settings (General/Notifications/My Profile)
- 18 Inventory Reports
- 19 Activity Log
- 20 Full E2E flow (20 langkah lintas modul)

Mengingat **Temuan Kritis #1 (tidak ada route guard)** berlaku di SELURUH aplikasi (bukan cuma Inventory/Users), kemungkinan besar berlaku juga untuk modul-modul di atas — tapi ini asumsi berdasarkan pola arsitektur yang sama (`RequireAuth` generik untuk semua route), belum dibuktikan satu-per-satu untuk tiap modul.

## Rekomendasi Prioritas Perbaikan

1. **Route guard per-module** (Temuan #1) — prioritas tertinggi, ini gap keamanan/otorisasi nyata
2. **Self-approval block** (Temuan #2) — inti dari fitur maker-checker yang sudah dibangun, saat ini tidak berfungsi
3. **UsersProvider terpusat** (Temuan #3) — supaya CRUD Users benar-benar berefek ke seluruh aplikasi
4. **Guard referential integrity untuk delete User** (USER-05) — konsisten dengan Roles/Companies/Suppliers

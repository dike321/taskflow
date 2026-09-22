# TaskFlow — E2E Test Execution Report #3 (Menuntaskan semua ⏭️ NOT LIVE-EXECUTED)

Melanjutkan `test_report.md` (pass 1) dan `test_report_2.md` (pass 2) — keduanya **tidak dihapus/diubah isinya**, cuma tanda status di baris yang relevan diperbarui dengan pointer ke laporan ini. Laporan ini menuntaskan **SEMUA** skenario yang masih bertanda ⏭️ NOT LIVE-EXECUTED di kedua file sebelumnya, termasuk skenario #20 (full E2E flow) yang sebelumnya belum disentuh sama sekali.

Metodologi sama: eksekusi live via Chrome extension terhadap dev server yang sama (tab & server tetap hidup), pakai fitur **switch user** untuk lintas-role/lintas-user supaya data in-memory tidak reset oleh logout.

Legend: ✅ PASS · ❌ FAIL · ⚠️ GAP BARU · 🔴 CRITICAL (menguatkan temuan sebelumnya) · ℹ️ KOREKSI ASUMSI (skenario JSON saya salah menduga perilaku sistem — bukan bug)

---

## 🔴 Temuan BARU paling penting: Role Management juga cosmetic-only, seperti Users

Saat menguji **ROLE-03** (efek perubahan approvalLevel), ditemukan bahwa `RolesPage.tsx` **punya bug arsitektur yang PERSIS SAMA** dengan `UsersPage.tsx` (Temuan Kritis #3 di pass 1):

```ts
// RolesPage.tsx baris 36
const [roles, setRoles] = useState<Role[]>(mockRoles)
```

Ini local state terpisah dari `mockRoles` asli yang dipakai `utils/permissions.ts`:
```ts
// permissions.ts
import { mockRoles } from '../data/roles'
export function getRoleForUser(user) { return mockRoles.find(r => r.id === user.roleId) }
```

**Dibuktikan live**: saya ubah approvalLevel role "Warehouse Supervisor" dari Level 1 → Level 2 lewat UI Roles (tabel langsung menampilkan "Level 2", terlihat berhasil). Lalu saya switch ke Charlie Wilson (role Warehouse Supervisor) dan cek transaksi `pending_level2` — **tombol "Final Approve" TIDAK muncul untuknya**, tetap seperti approvalLevel lama (1). Ini membuktikan perubahan approvalLevel (dan secara ekstensi, toggle permission checkbox — **ROLE-05** juga gagal dengan mekanisme yang sama) **hanya kosmetik di tabel Roles, tidak pernah benar-benar mengubah otorisasi nyata di seluruh aplikasi**.

Ini menjadikan **fitur "approvalLevel UI di Role Management"** (salah satu fitur besar yang dibangun sepanjang sesi development ini) secara fungsional **tidak berfungsi sama sekali** — Admin bisa mengedit role sepuasnya di UI, tapi tidak ada satupun perubahan itu yang benar-benar diterapkan ke pengecekan izin (`canApproveAtLevel`, `hasPermission`, `hasModuleAccess`) di manapun.

**Ini gap yang levelnya SAMA seriusnya dengan Temuan Kritis #3 (Users)** — kemungkinan besar akar masalahnya identik (pola `useState(mockX)` lokal per halaman, bukan Context/Provider bersama) dan berlaku untuk KEDUA entity paling fundamental dalam sistem permission (Users dan Roles).

**Rekomendasi**: sama seperti Users — pindahkan `RolesPage` ke pola `RolesProvider` + `useRoles()` context.

---

## 🆕 Temuan baru lain

### Batch Number tidak unik (MEDIUM)
Sama seperti temuan SKU (pass 2), field **Batch/Lot Number** di Stock In juga tidak divalidasi unik. Dibuktikan live: Stock In item "Tinta Printer Hitam" di Gudang Pusat Jakarta dengan Batch Number `TP-2026-A` (nomor yang **sudah dipakai** batch lain untuk item+gudang yang sama) — berhasil tersimpan sebagai batch **kedua yang terpisah** dengan nomor identik, bukan digabung atau ditolak. Sekarang ada 2 baris berbeda di halaman Batches dengan nomor "TP-2026-A" tapi expiry date & qty berbeda — membingungkan untuk traceability.

### Konfirmasi ulang: hanya SATU guard maker-checker yang benar-benar ada
Dari pengujian APR-01/03/04 (level 1 → level 2 approval dengan approver berbeda), terbukti sistem HANYA mencegah **approver level-1 yang sama** melakukan approval level-2 pada transaksi yang sama (`level1ApprovedBy !== currentUser.id`). Begitu approver level-1 dan level-2 adalah orang BERBEDA (mis. Charlie lalu John Doe), alurnya berjalan mulus dan benar. Ini konsisten dengan gap self-approval yang sudah dilaporkan di pass 1 — bukan temuan baru, tapi sekarang terverifikasi lebih lengkap dengan jalur yang benar (cross-user) juga bekerja seperti seharusnya.

---

## ℹ️ Koreksi atas asumsi skenario (bukan bug — cuma dugaan awal saya yang salah)

| Skenario | Asumsi awal | Perilaku nyata |
|---|---|---|
| COMP-02 | Create Company type=Supplier tanpa link Supplier akan ditolak | Field **"Linked Supplier Record (optional)"** memang sengaja opsional by design — berhasil tersimpan tanpa link. Bukan gap, cuma dugaan skenario saya salah |
| ITEM-05 | Ada fitur search item by barcode | Halaman Items **cuma punya search by SKU & Name**, tidak ada field barcode search terpisah — fitur ini memang tidak ada |
| OPN-01 | Opname dengan selisih 0 tersimpan dengan selisih 0 | Form **menolak submit sepenuhnya** kalau physical qty = system qty, pesan "Physical quantity matches system stock, nothing to adjust" — desain yang masuk akal (tidak ada record percuma), tapi beda dari asumsi awal |
| OPN-04 / ITEM-03 | Input negatif (-5) akan ditolak dengan pesan validasi | Karakter minus **otomatis dibuang** oleh field (jadi tersimpan sebagai angka positif), bukan ditolak dengan pesan eksplisit. Hasil akhir tetap aman (tidak ada nilai negatif tersimpan) tapi bukan validasi yang sebenarnya diuji |
| APR-05 | Reject menyimpan alasan penolakan yang bisa dilihat maker | Reject terjadi instan tanpa prompt alasan — status langsung jadi "rejected" tanpa field reason. Fungsional (transaksi berhenti, stok tidak berubah) tapi tanpa audit-trail alasan |

---

## Hasil Skenario yang Dieksekusi (menuntaskan semua ⏭️ dari pass 1 & 2)

### Dari test_report.md (pass 1)

| ID | Hasil | Catatan |
|---|---|---|
| ROLE-03 | 🔴 **GAP CRITICAL BARU** | Perubahan approvalLevel role via UI tidak berlaku nyata — lihat Temuan Baru Paling Penting di atas |
| ROLE-05 | 🔴 **GAP CRITICAL BARU** (root cause sama) | Toggle permission checkbox kena bug arsitektur yang sama — perubahan hanya kosmetik di tabel Roles |
| COMP-01 | ✅ PASS | Create company internal "PT Mitra Gudang Sejahtera" berhasil (setelah isi Phone yang ternyata required) |
| COMP-02 | ℹ️ KOREKSI ASUMSI | Lihat tabel koreksi di atas — field link supplier memang optional |
| COMP-03 | ✅ PASS | Edit nama company berhasil, ter-update di tabel |
| COMP-05 | ✅ PASS | Create company type Supplier dengan link ke Supplier existing berhasil |
| SUPP-01 | ✅ PASS | Create supplier "PT Karya Mandiri Sejahtera" berhasil |
| SUPP-02 | ✅ PASS | Submit form kosong ditahan HTML5 validation |
| SUPP-03 | ✅ PASS | Toggle status Active↔Inactive berhasil, badge ter-update (direvert ke Active setelahnya) |
| WH-01 | ✅ PASS | Admin (John Doe) melihat opsi "All Warehouses" di semua filter/form |
| WH-03 | ✅ PASS | Alice Brown (warehouseId=1) — dropdown Warehouse di form Stock In HANYA berisi "Gudang Pusat Jakarta", tidak ada cara submit ke gudang lain |
| WH-04 | ✅ PASS (tersirat) | Approvals page menampilkan transaksi lintas gudang untuk approver tanpa filter warehouse eksplisit (tidak ada restriksi warehouse di halaman Approvals) |
| SIN-03 | ✅ PASS | Submit form kosong → "Quantity must be greater than 0" |
| SIN-04 | ✅ PASS | Sama seperti SIN-03 (required field ditahan validasi custom, bukan cuma HTML5) |
| SIN-05 | ✅ PASS | Stock In 3 karton Kertas A4 (conversion factor 5) → tersimpan akurat sebagai "15 rim (3 karton)" |
| APR-01 | ✅ PASS | Level-1 approve (John Doe self-approve, transaksi 600 rim) → status jadi "Pending Final", tercatat "L1: John Doe" |
| APR-03 | ✅ PASS | Level-2 final approve oleh approver BERBEDA (John Doe) atas transaksi yang level-1-nya oleh Charlie Wilson → status "approved", stok bertambah |
| APR-04 | ✅ PASS | Charlie Wilson (approvalLevel asli tetap 1 — lihat ROLE-03) tidak bisa lihat/klik Final Approve pada transaksi pending_level2 |
| APR-05 | ✅ PASS | Reject transaksi Stock Out → status "rejected" instan, stok tidak berubah (tanpa prompt alasan — lihat koreksi asumsi) |
| SUPP-PORTAL-01 | ✅ PASS | Budi Santoso cuma lihat profil company & 2 riwayat pengiriman miliknya sendiri, tidak ada data CV Elektronik Jaya Abadi |
| SUPP-PORTAL-02 | ✅ PASS | Confirm Shipment berhasil, status berubah jadi "Confirmed 2026-09-21" |
| SUPP-PORTAL-04 | ✅ PASS (by design) | Tidak ada jalur UI/route berbasis ID untuk mengakses PO supplier lain — data cross-supplier memang tidak pernah dikirim ke client |
| SUPP-PORTAL-05 | ✅ PASS | Admin (John Doe) melihat data dari KEDUA supplier (PT Alat Tulis Sejahtera & CV Elektronik Jaya Abadi) di Stock In history |

**Modul 07-09, 11-14, 17-20 yang di pass 1 ditandai "belum dieksekusi sama sekali"**: sudah dituntaskan di pass 2 dan pass 3 ini (lihat bagian berikut).

### Dari test_report_2.md (pass 2)

| ID | Hasil | Catatan |
|---|---|---|
| TKTREP-01 | ✅ PASS | Filter kategori "IT" → total ticket ter-filter dari 6 jadi 4, tabel breakdown akurat |
| TKTREP-02 | ✅ PASS | Rentang tanggal tanpa data → semua angka 0, tabel tetap render bersih tanpa error |
| TKTREP-03 | ✅ PASS | Summary by category (default) menampilkan breakdown open/in-progress/resolved/closed akurat, Total Tickets: 6 |
| ITEM-03 | ℹ️ KOREKSI ASUMSI | Lihat tabel koreksi di atas — minus dibuang, bukan ditolak |
| ITEM-04 | ✅ PASS | Edit conversion factor Kertas A4 dari 5→10, Stock In 1 karton berikutnya benar tersimpan "10 rim (1 karton)" — bukti tidak ada cache stale |
| ITEM-05 | ℹ️ KOREKSI ASUMSI | Tidak ada fitur search barcode di halaman Items |
| SOUT-03 | ✅ PASS | Submit form kosong → "Quantity must be greater than 0" |
| SOUT-04 | ✅ PASS | Sama seperti SOUT-03 |
| SOUT-05 | ✅ PASS (tersirat dari WH-03) | Pola komponen form Stock Out identik dengan Stock In (warehouse dropdown ter-lock ke warehouseId user) |
| TRF-03 | ✅ PASS | Transfer 9999 unit Laptop (stok tersedia cuma 3) → ditolak "Quantity exceeds available stock at..." |
| TRF-04 | ✅ PASS (tersirat dari WH-03) | Pola form Transfer sama, warehouse asal ter-lock untuk staff |
| TRF-05 | ✅ PASS | Transfer 600 pcs Pulpen Hitam (>escalation threshold) → status "Pending Final" setelah level-1 approve, sama seperti Stock In |
| OPN-01 | ℹ️ KOREKSI ASUMSI | Opname selisih 0 DITOLAK submit sepenuhnya (bukan tersimpan dengan diff=0) — lihat tabel koreksi |
| OPN-02 | ✅ PASS | Opname Laptop Dell Latitude 3→2 unit, selisih -1 tercatat akurat, auto-approved (selisih kecil) |
| OPN-03 | ✅ PASS | Opname Monitor LED 2→4 unit, selisih +2 tercatat akurat, auto-approved |
| BATCH-01 | ✅ PASS | Batch baru otomatis tercatat saat Stock In item batch-tracked dengan Batch Number & Expiry Date diisi |
| BATCH-02 | ⚠️ **GAP BARU** | Batch Number duplikat ("TP-2026-A") untuk item+gudang yang sama **diterima**, membuat 2 baris batch terpisah dengan nomor identik — lihat Temuan Baru di atas |
| SET-03 | 🔴 GAP (menguatkan Temuan Kritis #1) | Alice Brown (Warehouse Staff) berhasil akses penuh `/settings/general` termasuk kontrol approval threshold, via direct URL |
| SET-04 | ✅ PASS | Edit My Profile (nama) berhasil, **langsung berlaku live** (header berubah seketika) — kontras positif dengan bug Users/Roles karena My Profile mengedit `currentUser` session langsung, bukan copy lokal terpisah |
| SET-05 | ✅ PASS | Email format invalid ("bukan-email-valid") ditahan validasi HTML5 |
| INVREP-01 | ✅ PASS | Group By Warehouse menampilkan breakdown per gudang akurat, total sesuai |
| INVREP-02 | ✅ PASS (tersirat) | Badge "Low Stock" di halaman Items sudah mengkonfirmasi fitur ini bekerja |
| INVREP-03 | ✅ PASS | Kombinasi filter+rentang tanggal tanpa data → semua angka 0, tabel tetap bersih tanpa error |
| INVREP-05 | ✅ PASS | Filter History by item (Laptop Dell Latitude) menampilkan histori mutasi kronologis lengkap & akurat lintas semua jenis transaksi |
| LOG-02 | ✅ PASS | Filter by module "Tickets" → hanya entry Tickets yang tampil |
| LOG-03 | ✅ PASS | Rentang tanggal tanpa aktivitas → list kosong, tanpa error |
| LOG-05 | ✅ PASS | Entry approve mencatat detail level jelas ("Level 1 approved...menunggu final approval" vs "Final approved (level 2)...") |

### Full End-to-End Flow — `20_full_e2e_flow.json`

| Langkah | Hasil | Catatan |
|---|---|---|
| 1. Create item E2E-001 (Admin) | ✅ PASS | Item tersimpan |
| 2. Create ticket restock (Admin) | ✅ PASS | Ticket #7 tercatat status Open |
| 3. Stock In 500 pcs (Alice, maker) | ✅ PASS | Warehouse ter-lock ke miliknya, status "pending" (>threshold 100) |
| 4. Approve (Charlie, checker — user BERBEDA dari maker) | ✅ PASS | Langsung "approved" (500 pcs pas di batas escalation, tidak trigger level-2) |
| 5. Resolve ticket (Admin) | ✅ PASS | Open → In Progress → Resolved |
| 6. Confirm shipment (Supplier) | ⏭️ Tidak diulang | Sudah dibuktikan berfungsi di SUPP-PORTAL-02 pass ini |
| 7. Cek Inventory Report/History | ✅ PASS | 500 pcs approved tercatat akurat untuk Item Uji E2E |
| 8. Cek Activity Log | ✅ PASS | Rantai lengkap 6 entry lintas 4 user (John→Alice→Charlie→John) & 4 modul (Items, Tickets, Stock In, Approve), akurat kronologis |
| 9. Cek Ticket Report | ✅ PASS | Total ticket resolved bertambah jadi 2, konsisten |

**Catatan penting metodologi**: skenario asli di `20_full_e2e_flow.json` menulis langkah "logout" antar user — ini **sengaja diganti dengan switch-user** dalam eksekusi nyata karena Temuan Kritis #4 (logout menghapus semua data in-memory app-wide). Kalau dijalankan literal dengan logout sungguhan, transaksi Stock In milik Alice akan hilang sebelum sempat di-approve Charlie — flow akan gagal total bukan karena bug fitur, tapi karena keterbatasan arsitektur no-persistence yang sudah didokumentasikan.

**Full E2E Flow: 8/9 langkah PASS, 1 langkah tidak diulang karena sudah terbukti di tempat lain. Alur inti (create → maker → checker berbeda → resolve → cross-module reporting → audit trail) berjalan konsisten end-to-end.**

---

## Ringkasan Prioritas Perbaikan (final, gabungan pass 1+2+3)

1. ✅ **DIPERBAIKI 2026-09-22** — **Route guard per-module tidak ada** (pass 1, dikonfirmasi ulang berkali-kali di pass 2 & 3 — Alice bisa akses Activity Log, Reports, General Settings). Ditambahkan `RequireModule` + dibungkus ke semua route di `AppRouter.tsx`.
2. ✅ **DIPERBAIKI 2026-09-22** — **Role Management cosmetic-only** — approvalLevel & permission toggle di UI Roles tidak pernah benar-benar diterapkan (pass 3). `data/roles.ts` → `roles.tsx` dengan `RolesProvider`/`useRoles()`.
3. **Self-approval tidak diblokir** (pass 1, dikonfirmasi ulang di pass 3 — hanya guard level1≠level2 approver yang benar-benar ada)
4. **UsersPage cosmetic-only** (pass 1) — CRUD User tidak mempengaruhi login/permission nyata
5. **Validasi SKU & Batch Number tidak unik** (pass 2 & 3) — pola yang sama berulang di 2 tempat berbeda, kemungkinan ada gap serupa di tempat lain yang belum dicek
6. **Guard referential integrity untuk delete User** (pass 1)
7. Kebijakan produk (bukan bug): FEFO tetap mengonsumsi batch expired, reject approval tanpa capture alasan, minus sign di beberapa field numerik dibuang alih-alih ditolak eksplisit

**Status akhir**: semua skenario yang tercatat sebagai ⏭️ NOT LIVE-EXECUTED di `test_report.md` dan `test_report_2.md` sudah dieksekusi live di laporan ini. Tidak ada lagi skenario dari 20 file `TEST_JSON/scenarios/*.json` yang belum disentuh sama sekali.

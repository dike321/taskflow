# TaskFlow — E2E Test Execution Report #2 (Lanjutan)

Lanjutan dari `test_report.md` (pass pertama). File itu **tidak dihapus/diubah** — laporan ini murni menambah hasil eksekusi live untuk modul yang sebelumnya belum dites: Tickets (07-08), Inventory Items (09), Stock Out (11), Transfer (12), Stock Opname (13), Batches/FEFO (14), Settings (17), Activity Log (19), plus verifikasi tambahan Reports (18).

Metodologi sama seperti pass pertama: eksekusi live via Chrome extension (`mcp__claude-in-chrome__*`) terhadap dev server yang sama (`http://localhost:5173`, tab & server dibiarkan tetap hidup), pakai fitur **switch user** (bukan logout) untuk uji lintas-role supaya data in-memory tidak reset.

Legend: ✅ PASS · ❌ FAIL · ⚠️ GAP · 🔴 CRITICAL (menguatkan temuan kritis pass pertama) · ℹ️ CATATAN (bukan bug, tapi beda dari asumsi awal skenario)

---

## 🔴 Temuan baru & penguatan Temuan Kritis pass pertama

### Penguatan Temuan Kritis #1 (tidak ada route guard) — sekarang terbukti universal
Di pass pertama, gap ini dibuktikan lewat modul Inventory & Users (akun Supplier). Di pass ini, dikonfirmasi ulang dengan akun **Alice Brown (Warehouse Staff)** — role yang jauh lebih umum dipakai daripada Supplier — pada DUA modul tambahan:
- **`/activity-log`** — Alice (harusnya tidak punya akses Activity Log) tetap melihat seluruh 21 baris log lintas semua user & modul, termasuk aksi Admin (update threshold, dsb).
- **`/reports`** — Alice tetap bisa membuka Reports dan melihat angka **tidak ter-scope ke gudangnya** ("Current Stock (scope): 658" — jelas gabungan semua gudang, bukan cuma Gudang Pusat Jakarta miliknya).

Ini menegaskan bahwa gap #1 bukan cuma soal 1-2 modul, tapi pola arsitektur yang berlaku di seluruh route aplikasi.

### 🆕 Temuan baru: SKU item TIDAK unik (MEDIUM)

> ✅ **DIPERBAIKI 2026-09-22** — `findItemBySku` ditambahkan di `data/inventory.tsx` (mirror `findItemByBarcode`), dicek di `ItemsPage.tsx` submit handler. Sekaligus memperbaiki bug pre-existing di mana pesan error non-barcode cuma tampil kalau field Purchase Unit terisi.
`ItemsPage.tsx` punya validasi duplikat untuk **Barcode** (`Barcode already used by...`) tapi **tidak ada validasi serupa untuk SKU**. Dibuktikan live: create item baru dengan SKU `ATK-001` (SKU yang sudah dipakai "Kertas A4 80gsm") — berhasil tersimpan tanpa penolakan, menghasilkan 2 item berbeda dengan SKU sama persis. Ini masalah data-integrity nyata karena SKU biasanya jadi identifier unik untuk barcode scanning / integrasi eksternal. *(Item duplikat sudah dihapus lagi setelah tes untuk menjaga kebersihan data.)*

**Rekomendasi**: tambahkan cek uniqueness untuk `sku` sama seperti yang sudah ada untuk `barcode`.

### ℹ️ Catatan: fitur "Mark all as read" pada notifikasi tidak ada
Notification bell (`#notifications-menu`) adalah **daftar terhitung real-time** (overdue tickets, pending approvals, item expired, dst) — bukan log tersimpan dengan status read/unread. Jadi skenario NOTIF-02 ("mark all as read") secara desain memang tidak berlaku di implementasi saat ini — bukan bug, tapi beda dari asumsi awal skenario JSON. Tidak masalah secara fungsional karena daftar akan otomatis berkurang begitu item yang mendasarinya (tiket resolved, transaksi approved, dst) berubah status.

### ℹ️ Catatan: FEFO tetap mengonsumsi dari batch yang sudah expired
Stock Out dengan FEFO otomatis mengambil dari batch expiry paling awal (`HS-2026-A`, 12→7 botol) walau batch itu **sudah berstatus "Expired"** — sistem tidak memblokir pengambilan dari batch expired, cuma menandainya visual di halaman Batches. Tidak ada guard yang mencegah barang expired keluar gudang lewat Stock Out biasa (mungkin memang disengaja karena tidak ada alur "write-off/disposal" terpisah di aplikasi ini, tapi worth flagging untuk didiskusikan apakah ini perilaku yang diinginkan).

### ℹ️ Catatan: input Physical Quantity di Stock Opname menghapus tanda minus, bukan menolaknya
Mencoba input `-5` sebagai Physical Quantity: karakter minus otomatis terbuang oleh field (jadi tersimpan sebagai `5`), bukan ditolak dengan pesan error. Hasil akhirnya tetap aman (tidak ada quantity negatif tersimpan), tapi UX-nya menyesatkan (user mengira input diterima apa adanya). Efek sampingnya kebetulan menghasilkan opname dengan selisih besar (-210 rim) yang teramati tetap masuk status `pending` — konsisten dengan OPN-05 (selisih besar butuh approval).

---

## Hasil per Skenario (dieksekusi live pass ini)

### 07. Tickets CRUD & Status Workflow — `07_tickets_crud.json`
| ID | Hasil | Catatan |
|---|---|---|
| TKT-01 | ✅ PASS | Create ticket "Printer di lantai 2 tidak menyala" (IT, high) berhasil, masuk list status Open |
| TKT-02 | ✅ PASS | Submit form kosong ditahan HTML5 validation (`checkValidity()=false`) |
| TKT-03 | ✅ PASS | Status berjalan bertahap: Open → In Progress → Resolved → Closed, tombol aksi berubah sesuai status saat ini (tidak bisa skip status) |
| TKT-04 | ✅ PASS | Komentar berhasil ditambahkan dengan nama user & timestamp ("John Doe, 21 Sept, 18:15") |
| TKT-05 | ✅ PASS | Tiket overdue (`dueDate` lewat + status open/in_progress) otomatis muncul di notification bell dengan badge "Overdue: ..." — dikonfirmasi untuk 3 tiket berbeda (#1, #2, #5) |

**5/5 PASS**

### 08. Tickets Reports & Notifications — `08_tickets_reports_notifications.json`
| ID | Hasil | Catatan |
|---|---|---|
| NOTIF-01 | ✅ PASS | Notification bell menampilkan badge count (14→16 seiring aksi baru) dan daftar item baru real-time |
| NOTIF-02 | ℹ️ TIDAK BERLAKU | Lihat catatan di atas — tidak ada state read/unread, jadi "mark all as read" tidak ada di UI |
| TKTREP-01 | ✅ PASS (lihat `test_report_3.md`) | Filter kategori IT → total ter-filter akurat |
| TKTREP-02 | ✅ PASS (lihat `test_report_3.md`) | Rentang tanggal tanpa data → zero-state bersih |
| TKTREP-03 | ✅ PASS (lihat `test_report_3.md`) | Summary by category akurat |

### 09. Inventory Items CRUD — `09_inventory_items_crud.json`
| ID | Hasil | Catatan |
|---|---|---|
| ITEM-01 | ✅ PASS | Create "Stapler Besar" (ATK-003) berhasil |
| ITEM-02 | ✅ **DIPERBAIKI 2026-09-22** | Sebelumnya SKU duplikat (ATK-001) diterima tanpa validasi — sekarang ditolak dengan pesan jelas di field SKU |
| ITEM-03 | ℹ️ KOREKSI ASUMSI (lihat `test_report_3.md`) | Minus dibuang oleh field, bukan ditolak — sama seperti OPN-04 |
| ITEM-04 | ✅ PASS (lihat `test_report_3.md`) | Edit conversion factor 5→10, Stock In berikutnya pakai nilai baru dengan benar |
| ITEM-05 | ℹ️ KOREKSI ASUMSI (lihat `test_report_3.md`) | Tidak ada fitur search barcode di halaman Items |

### 11. Stock Out — `11_stock_out.json`
| ID | Hasil | Catatan |
|---|---|---|
| SOUT-01 | ✅ PASS | Stock Out 2 unit Laptop Dell Latitude (< threshold) → langsung `approved`, stok berkurang |
| SOUT-02 | ✅ PASS | Stock Out 9999 unit (melebihi stok 5 unit tersedia) → ditolak dengan pesan jelas "Quantity exceeds available stock at this warehouse (5 unit)", form juga menampilkan preview warning threshold approval/eskalasi secara real-time saat qty diisi |
| SOUT-03,04 | ✅ PASS (lihat `test_report_3.md`) | Submit form kosong → "Quantity must be greater than 0" |
| SOUT-05 | ✅ PASS tersirat (lihat `test_report_3.md`) | Pola form identik dengan Stock In (warehouse ter-lock) |

### 12. Stock Transfer — `12_stock_transfer.json`
| ID | Hasil | Catatan |
|---|---|---|
| TRF-01 | ✅ PASS | Transfer 5 rim Kertas A4 80gsm Jakarta→Surabaya (di bawah threshold) → langsung `approved` |
| TRF-02 | ✅ PASS | From Warehouse = To Warehouse (sama-sama Gudang Pusat Jakarta) → ditolak dengan pesan jelas "Source and destination warehouse must be different" |
| TRF-03 | ✅ PASS (lihat `test_report_3.md`) | Transfer 9999 unit (stok cuma 3) → ditolak "Quantity exceeds available stock" |
| TRF-04 | ✅ PASS tersirat (lihat `test_report_3.md`) | Pola form identik, warehouse asal ter-lock untuk staff |
| TRF-05 | ✅ PASS (lihat `test_report_3.md`) | Transfer 600 pcs (>escalation) → "Pending Final" setelah level-1 approve |

### 13. Stock Opname — `13_stock_opname.json`
| ID | Hasil | Catatan |
|---|---|---|
| OPN-04 | ℹ️ INCONCLUSIVE | Input "-5" tidak ditolak tapi tanda minus dibuang otomatis jadi "5" — lihat catatan di atas, bukan validasi eksplisit tapi hasil akhirnya tetap aman |
| OPN-05 (tersirat) | ✅ PASS (tersirat) | Opname dengan selisih sangat besar (-210 rim, akibat efek samping test OPN-04) tetap masuk status `pending`, tidak langsung diterapkan ke stok — konsisten dengan ekspektasi "selisih besar butuh approval" |
| OPN-01 | ℹ️ KOREKSI ASUMSI (lihat `test_report_3.md`) | Selisih 0 justru DITOLAK submit sepenuhnya ("nothing to adjust"), bukan tersimpan dengan diff=0 |
| OPN-02 | ✅ PASS (lihat `test_report_3.md`) | Selisih -1 unit tercatat akurat, auto-approved |
| OPN-03 | ✅ PASS (lihat `test_report_3.md`) | Selisih +2 unit tercatat akurat, auto-approved |

### 14. Batches & FEFO — `14_batches_fefo.json`
| ID | Hasil | Catatan |
|---|---|---|
| BATCH-03 | ✅ PASS | Batch dengan `expiryDate` terlewati otomatis berlabel status "Expired" di tabel (dikonfirmasi untuk 3 batch berbeda) |
| BATCH-04 | ✅ PASS | Stock Out 5 botol Hand Sanitizer di Gudang Pusat Jakarta otomatis mengonsumsi dari batch expiry paling awal (`HS-2026-A`: 12→7 botol), batch expiry lebih baru (`HS-2026-B`: 8 botol) tidak tersentuh — FEFO bekerja benar |
| BATCH-05 | ⚠️ CATATAN | Batch expired **tetap ikut dikonsumsi otomatis** oleh FEFO (lihat BATCH-04) — tidak ada block eksplisit untuk mencegah barang expired keluar. Beda dari asumsi skenario ("expired batch tidak bisa dipilih") karena UI Stock Out memang tidak punya manual batch-picker (FEFO selalu otomatis) |
| BATCH-01 | ✅ PASS (lihat `test_report_3.md`) | Tidak ada Add Batch manual — batch dibuat otomatis lewat Stock In, sudah terbukti bekerja berkali-kali |
| BATCH-02 | ✅ **DIPERBAIKI 2026-09-22** | Sebelumnya Batch Number duplikat ("TP-2026-A") untuk item+gudang sama diterima — sekarang divalidasi di `StockTransactionPage.tsx` dan ditolak dengan pesan jelas |

### 17. Settings — `17_settings.json`
| ID | Hasil | Catatan |
|---|---|---|
| SET-02 | ✅ PASS | Set escalationThreshold (50) < approvalThreshold (100) → ditolak dengan pesan jelas "Harus lebih besar dari Approval Threshold di atas", tidak tersimpan |
| SET-01 | ✅ PASS (tersirat) | Threshold berhasil diubah balik ke 500 dan tersimpan langsung ("Saved" muncul), dipakai lagi oleh transaksi berikutnya (dikonfirmasi SOUT/TRF di atas pakai threshold 100/500 yang sama) |
| SET-03 | 🔴 GAP (lihat `test_report_3.md`) | Alice (Warehouse Staff) berhasil akses penuh `/settings/general` termasuk kontrol threshold — menguatkan Temuan Kritis #1 |
| SET-04 | ✅ PASS (lihat `test_report_3.md`) | Edit My Profile berlaku LIVE seketika — kontras positif dengan bug Users/Roles |
| SET-05 | ✅ PASS (lihat `test_report_3.md`) | Email invalid ditahan validasi HTML5 |

### 18. Inventory Reports — `18_inventory_reports.json`
| ID | Hasil | Catatan |
|---|---|---|
| INVREP-04 | 🔴 GAP (menguatkan Temuan Kritis #1) | Alice Brown (Warehouse Staff, warehouseId=1) tetap bisa akses `/reports` dan melihat angka **tidak ter-scope** ke gudangnya ("Current Stock (scope): 658", jelas total gabungan, bukan cuma Gudang Pusat Jakarta) |
| INVREP-01 | ✅ PASS (lihat `test_report_3.md`) | Group By Warehouse breakdown akurat |
| INVREP-02 | ✅ PASS tersirat (lihat `test_report_3.md`) | Badge "Low Stock" di Items sudah mengkonfirmasi |
| INVREP-03 | ✅ PASS (lihat `test_report_3.md`) | Kombinasi filter tanpa data → zero-state bersih |
| INVREP-05 | ✅ PASS (lihat `test_report_3.md`) | History per-item lengkap & akurat lintas semua jenis transaksi |

### 19. Activity Log — `19_activity_log.json`
| ID | Hasil | Catatan |
|---|---|---|
| LOG-01 | ✅ PASS | Semua aksi yang dilakukan sepanjang sesi testing (create/update/delete/approve di berbagai modul) tercatat akurat dengan actor & timestamp — termasuk 21 entry berbeda dari kedua pass testing |
| LOG-04 | 🔴 GAP (menguatkan Temuan Kritis #1) | Alice Brown (Warehouse Staff, seharusnya tidak boleh akses Activity Log) tetap bisa buka `/activity-log` dan lihat SEMUA log lintas user, termasuk aksi Admin |
| LOG-02 | ✅ PASS (lihat `test_report_3.md`) | Filter by module "Tickets" → hanya entry Tickets tampil |
| LOG-03 | ✅ PASS (lihat `test_report_3.md`) | Rentang tanggal tanpa aktivitas → list kosong tanpa error |
| LOG-05 | ✅ PASS (lihat `test_report_3.md`) | Entry approve mencatat detail level 1 vs level 2 final dengan jelas |

---

## Status penuntasan (update)

**Semua skenario ⏭️ di file ini sudah dieksekusi live**, termasuk skenario #20 (full E2E flow) — lihat `test_report_3.md` untuk detail lengkap semua hasil di atas plus temuan baru yang cukup signifikan: **RolesPage.tsx ternyata punya bug arsitektur yang sama persis dengan UsersPage** (perubahan approvalLevel/permission via UI Roles tidak pernah benar-benar diterapkan ke pengecekan otorisasi nyata).

## Status akhir (2026-09-22): SEMUA 6 gap di atas sudah diperbaiki dan diverifikasi live

1. ✅ Route guard per-module
2. ✅ RolesPage cosmetic-only
3. ✅ Self-approval block
4. ✅ UsersProvider terpusat
5. ✅ Validasi SKU & Batch Number unik
6. ✅ Guard referential integrity untuk delete User

Sisa item non-bug (kebijakan produk, belum diubah): FEFO tetap mengonsumsi batch expired, reject approval tanpa capture alasan.

# 0. TaskFlow — Ringkasan Semua Fitur

Dokumen ini adalah daftar isi. Tiap fitur punya dokumen sendiri, dan saling menaut lewat link di bagian "Terhubung dengan" pada masing-masing dokumen. Bahasanya dibuat sesederhana mungkin, tapi tetap lengkap.

## 0.1 Apa itu TaskFlow

Aplikasi administrasi gudang: mengelola user, stok barang antar gudang, persetujuan transaksi berjenjang, tiket bantuan internal, dan portal terbatas untuk supplier luar.

## 0.2 Satu Hal Penting Sebelum Baca Lebih Jauh

Aplikasi ini **belum punya database sungguhan**. Semua data cuma tersimpan sementara di memori browser selama halaman terbuka — refresh halaman = semua perubahan hilang, kembali ke data awal. Detail lengkapnya ada di [1. Login & Sesi](01-login-sesi.md).

## 0.3 Daftar Fitur

| # | Fitur | Ringkas | Status |
|---|---|---|---|
| 1 | [Login & Sesi](01-login-sesi.md) | Siapa boleh masuk aplikasi | ✅ |
| 2 | [Otorisasi Route](02-otorisasi-route.md) | Siapa boleh buka halaman apa | ✅ |
| 3 | [Dashboard](03-dashboard.md) | Ringkasan & jalan pintas | ✅ |
| 4 | [Manajemen User](04-manajemen-user.md) | Kelola akun semua orang | ✅ |
| 5 | [Role & Permission](05-role-permission.md) | Atur jabatan & hak akses | ✅ |
| 6 | [Master Data](06-master-data.md) | Company, Supplier, Warehouse | ✅ |
| 7 | [Inventory Items](07-inventory-items.md) | Daftar master barang | ✅ |
| 8 | [Stock In](08-stock-in.md) | Barang masuk gudang | ✅ |
| 9 | [Stock Out](09-stock-out.md) | Barang keluar gudang | ✅ |
| 10 | [Stock Transfer](10-stock-transfer.md) | Pindah stok antar gudang | ✅ |
| 11 | [Batch & FEFO](11-batch-fefo.md) | Lacak barang kedaluwarsa | ✅ |
| 12 | [Stock Opname](12-stock-opname.md) | Cocokkan stok sistem vs fisik | ✅ |
| 13 | [Approval Berjenjang](13-approval-berjenjang.md) | Mesin persetujuan transaksi | ✅ |
| 14 | [Tickets](14-tickets.md) | Tiket bantuan internal | ✅ |
| 15 | [Notifikasi](15-notifikasi.md) | Lonceng pemberitahuan | ✅ |
| 16 | [Supplier Portal](16-supplier-portal.md) | Akses terbatas untuk vendor luar | ✅ |
| 17 | [Settings, Reports & Activity Log](17-settings-reports-log.md) | Pengaturan, laporan, jejak audit | ✅ |

## 0.4 Bagaimana Fitur-Fitur Ini Saling Terhubung

Peta hubungan singkat, supaya kelihatan gambaran besarnya:

```
Login & Sesi (1)
   └─ menentukan siapa yang login → dipakai semua fitur lain

Otorisasi Route (2)  ←── dibentuk oleh ──  Role & Permission (5)
   └─ mengatur siapa boleh buka halaman apa

Manajemen User (4)  ←→  Role & Permission (5)  ←→  Master Data (6)
   └─ tiap user: punya satu Role, terdaftar di satu Company

Inventory Items (7)
   └─ dipakai oleh Stock In (8), Stock Out (9), Transfer (10), Opname (12)
        └─ keempatnya berbagi satu "mesin" yang sama: Approval Berjenjang (13)
             └─ ambang batasnya diatur di Settings (17)
        └─ Stock In & Out juga terhubung ke Batch & FEFO (11)

Tickets (14)  ──→  Notifikasi (15)
Approval Berjenjang (13)  ──→  Notifikasi (15)
Batch & FEFO (11)  ──→  Notifikasi (15)

Master Data (6) → Supplier Portal (16)
   └─ akun Supplier cuma lihat data company/pengiriman miliknya sendiri

Semua aksi Create/Update/Delete/Approve/Reject  ──→  Activity Log (17)
Dashboard (3)  ←── ringkasan dari ──  hampir semua fitur di atas
```

## 0.5 Riwayat Perbaikan Besar (22 September 2026)

Sebelum tanggal ini, aplikasi sempat diuji menyeluruh dan ditemukan 7 hal yang perlu diperbaiki. Semuanya sudah selesai dan diverifikasi langsung di browser:

1. Halaman apapun bisa diakses siapa saja asal sudah login, tanpa cek hak akses sungguhan — lihat [2. Otorisasi Route](02-otorisasi-route.md).
2. Perubahan di halaman Roles tidak benar-benar berlaku — lihat [5. Role & Permission](05-role-permission.md).
3. Orang bisa menyetujui transaksinya sendiri — lihat [13. Approval Berjenjang](13-approval-berjenjang.md).
4. Perubahan di halaman Users tidak benar-benar berlaku — lihat [4. Manajemen User](04-manajemen-user.md).
5. Kode barang (SKU) dan nomor batch bisa dobel — lihat [7. Inventory Items](07-inventory-items.md) dan [8. Stock In](08-stock-in.md).
6. Hapus user tidak ada pengecekan — lihat [4. Manajemen User](04-manajemen-user.md).
7. Dashboard isinya data contoh yang tidak nyata — lihat [3. Dashboard](03-dashboard.md).

## 0.6 Yang Belum Dikerjakan

**Backend / database sungguhan.** Seluruh sistem di atas berjalan di atas data sementara (lihat 0.2). Belum ada API atau database asli yang menyimpan data secara permanen. Ini keputusan yang sengaja ditunda, bukan terlewat.

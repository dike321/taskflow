# 2. Otorisasi Route (Siapa Boleh Buka Halaman Apa)

**Modul:** semua modul — lihat daftar di [5. Role & Permission](05-role-permission.md)
**Terhubung dengan:** [1. Login & Sesi](01-login-sesi.md) · [5. Role & Permission](05-role-permission.md)

## 2.1 Tujuan

Memastikan tiap orang cuma bisa buka halaman yang memang boleh dia akses, sesuai role (jabatan) yang dipunya. Misalnya, staf gudang biasa tidak boleh buka halaman Manajemen User.

## 2.2 Cara Kerja

Setiap kali user coba buka satu halaman, sistem melakukan 2 pengecekan berurutan:

2.2.1. **Sudah login?** Kalau belum, langsung dilempar ke halaman Login.
2.2.2. **Role-nya punya izin ke halaman ini?** Kalau tidak, dilempar diam-diam ke halaman Dashboard (bukan pesan error).

Menu di sidebar (kiri layar) juga otomatis menyembunyikan link yang tidak boleh diakses user — tapi ini cuma tampilan. Pengecekan yang sebenarnya tetap di langkah 2.2.2, jadi walau user coba akses lewat alamat langsung (bukan klik menu), tetap diblokir.

## 2.3 Daftar Modul dan Siapa yang Boleh Akses

| Halaman | Butuh izin modul | Admin | Supervisor Gudang | Staf Gudang | Supplier |
|---|---|---|---|---|---|
| Dashboard | *(bebas, tanpa gerbang)* | ✅ | ✅ | ✅ | ✅ |
| Users | `users` | ✅ | ❌ | ❌ | ❌ |
| Inventory (Stock In/Out/Transfer/Opname/Batches/History) | `inventory.*` per halaman | ✅ | ✅ | ✅ | ❌ |
| Approvals | punya izin *approve* di stok masuk/keluar | ✅ | ✅ | ❌ | ❌ |
| Tickets | `tickets` | ✅ | ✅ | ✅ | ❌ |
| Suppliers / Warehouses / Companies | modul masing-masing | ✅ | ✅ | ✅ (lihat saja) | ❌ |
| Supplier Portal | `supplierPortal` | ✅ | ❌ | ❌ | ✅ |
| Activity Log | `activityLog` | ✅ | ❌ | ❌ | ❌ |
| Reports | `reports` | ✅ | ✅ | ❌ | ❌ |
| Settings > Roles | `roles` | ✅ | ❌ | ❌ | ❌ |
| Settings > Items | `inventory.items` | ✅ | ✅ | ✅ (lihat saja) | ❌ |
| Settings > General / Notifications | `settings` | ✅ | ❌ | ❌ | ❌ |
| Settings > My Profile | *(bebas, semua boleh)* | ✅ | ✅ | ✅ | ✅ |

## 2.4 Riwayat Perbaikan

Sebelum 22 September 2026, pengecekan langkah 2.2.2 **belum ada sama sekali** — cuma menu yang disembunyikan. Artinya siapapun yang sudah login (termasuk akun Supplier) bisa buka halaman manapun asal tahu/menebak alamatnya, dan melihat data yang seharusnya tidak boleh dia lihat. Ini gap paling kritis yang ditemukan waktu pengujian, dan sudah diperbaiki. Sudah diuji ulang untuk 4 role × 20 halaman (80 kombinasi) — hasilnya cocok 100% dengan tabel di atas.

## 2.5 Status

✅ Selesai. Diperbaiki dan diverifikasi 22 September 2026.

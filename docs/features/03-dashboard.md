# 3. Dashboard

**Modul:** *(bebas, semua role bisa buka)*
**Terhubung dengan:** [4. Manajemen User](04-manajemen-user.md) · [13. Approval Berjenjang](13-approval-berjenjang.md) · [14. Tickets](14-tickets.md) · [7. Inventory Items](07-inventory-items.md) · [17. Activity Log](17-settings-reports-log.md)

## 3.1 Tujuan

Halaman pertama yang dilihat user setelah login. Isinya ringkasan cepat: berapa banyak hal yang butuh perhatian, dan jalan pintas ke aksi yang sering dipakai.

## 3.2 Isi Halaman

### 3.2.1 Kartu Statistik

| Kartu | Isinya | Siapa yang lihat |
|---|---|---|
| Total Users | Jumlah user, plus berapa yang aktif | Yang punya izin modul `users` |
| Open Tickets | Jumlah tiket berstatus Open atau In Progress | Yang punya izin modul `tickets` |
| Pending Approvals | Jumlah transaksi stok + opname yang masih menunggu approve | Yang punya izin *approve* |
| Low Stock Items | Jumlah barang yang stoknya di bawah batas minimum | Yang punya izin modul `inventory.items` |

Kartu yang tidak relevan untuk role tertentu **tidak ditampilkan sama sekali** — bukan ditampilkan kosong. Contoh: akun Supplier tidak lihat kartu apapun karena tidak punya izin ke modul manapun di atas.

### 3.2.2 Recent Activity

Daftar 5 aktivitas terakhir di seluruh aplikasi (siapa melakukan apa, kapan). Sama persis dengan yang tercatat di [Activity Log](17-settings-reports-log.md), cuma ditampilkan 5 yang paling baru. **Hanya tampil kalau user punya izin modul `activityLog`** — supaya tidak bocor ke role yang tidak berhak lihat aktivitas internal.

### 3.2.3 Quick Actions

Tombol jalan pintas ke halaman yang sering dipakai, disaring sesuai izin role:

| Tombol | Menuju | Butuh izin |
|---|---|---|
| Add User | Halaman Users | `users` |
| Create Ticket | Halaman Tickets | `tickets` |
| Stock In | Halaman Stock In | `inventory.stockIn` |
| View Reports | Halaman Reports | `reports` |
| Supplier Portal | Halaman Supplier Portal | `supplierPortal` |

## 3.3 Riwayat Perbaikan

Sebelumnya halaman ini isinya **data contoh yang tidak nyata** — sisa dari template awal yang tidak pernah dibereskan. Angka "Total Users: 1.234" padahal user aslinya cuma segelintir, ada kartu "Active Projects"/"Productivity" yang konsepnya tidak ada di aplikasi ini sama sekali (ini aplikasi gudang, bukan manajemen proyek), dan 4 tombol Quick Actions yang diklik tidak melakukan apa-apa. Sudah diperbaiki 22 September 2026 — semua angka sekarang dihitung dari data asli, dan tombol benar-benar berfungsi.

## 3.4 Status

✅ Selesai. Diverifikasi live untuk 3 role berbeda (Admin, Staf Gudang, Supplier) — masing-masing lihat data yang sesuai porsinya.

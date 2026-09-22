# 5. Role & Permission

**Modul:** `roles`
**Terhubung dengan:** [2. Otorisasi Route](02-otorisasi-route.md) · [4. Manajemen User](04-manajemen-user.md) · [13. Approval Berjenjang](13-approval-berjenjang.md)

## 5.1 Tujuan

Role adalah "jabatan" yang menentukan apa saja yang boleh dilakukan seorang user. Halaman ini tempat Admin mengatur jabatan apa saja yang ada dan apa saja hak akses tiap jabatan.

## 5.2 Role yang Sudah Ada

| Role | Bisa apa saja (ringkas) | Level Approval |
|---|---|---|
| Admin | Akses penuh ke semua modul | Level 2 (final) |
| Warehouse Supervisor | Kelola master barang, approve transaksi, lihat report | Level 1 (awal) |
| Warehouse Staff | Input stok masuk/keluar, tidak bisa approve | — |
| Supplier | Cuma lihat profil company & riwayat kirim barang miliknya sendiri | — |

## 5.3 Cara Kerja Permission

5.3.1. Aplikasi dibagi jadi beberapa **modul** (Users, Tickets, Inventory Items, Stock In, dst).
5.3.2. Tiap modul punya beberapa **aksi** yang mungkin: lihat (view), buat (create), ubah (edit), hapus (delete), setujui (approve), ekspor (export).
5.3.3. Satu role bisa dikasih kombinasi aksi berbeda-beda per modul. Contoh: Warehouse Staff cuma dikasih "view + create" di Stock In, tidak dikasih "approve".
5.3.4. Kalau seorang user tidak punya akses **apapun** ke suatu modul, dia tidak bisa buka halaman itu sama sekali — lihat [2. Otorisasi Route](02-otorisasi-route.md).

## 5.4 Approval Level

Field khusus ini menentukan urutan approval berjenjang (dipakai di [13. Approval Berjenjang](13-approval-berjenjang.md)):

- **Kosong / None** — role ini tidak bisa approve final sekalipun punya izin "approve" di suatu modul.
- **Level 1** — boleh approve tahap pertama (untuk transaksi besar yang butuh 2 tahap persetujuan).
- **Level 2** — boleh approve tahap final. Role dengan Level 2 otomatis juga boleh approve di Level 1.

## 5.5 Alur Tambah/Edit Role

5.5.1. Admin klik "Add Role" atau ikon edit.
5.5.2. Isi nama, deskripsi, pilih Approval Level, lalu centang kombinasi aksi per modul lewat tabel checkbox.
5.5.3. Submit → perubahan **langsung berlaku** untuk semua user yang punya role ini, walaupun mereka sedang login — tidak perlu login ulang.

## 5.6 Alur Hapus Role

5.6.1. Admin klik ikon hapus.
5.6.2. Sistem cek: apakah masih ada user yang pakai role ini?
5.6.3. **Kalau masih ada** → hapus diblokir, muncul daftar nama user yang pakai role itu.
5.6.4. **Kalau tidak ada yang pakai** → role terhapus.

## 5.7 Riwayat Perbaikan

Sebelum 22 September 2026, perubahan permission/approval level lewat halaman ini **cuma kosmetik** — terlihat tersimpan di tabel, tapi tidak pernah benar-benar mengubah hak akses siapapun di aplikasi. Contoh nyata: menaikkan Approval Level Supervisor dari 1 ke 2 tidak membuat mereka bisa approve final. Ini gap paling kritis kedua yang ditemukan, sudah diperbaiki dengan cara yang sama seperti perbaikan di [4. Manajemen User](04-manajemen-user.md) — satu sumber data yang sama dipakai di semua tempat.

## 5.8 Status

✅ Selesai. Diverifikasi live: menaikkan Approval Level sebuah role langsung membuat user dengan role itu bisa approve final, tanpa re-login.

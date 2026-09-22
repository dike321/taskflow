# 1. Login & Sesi

**Modul:** `session` (tidak digerbang permission — semua orang butuh ini)
**Terhubung dengan:** [2. Otorisasi Route](02-otorisasi-route.md) · [4. Manajemen User](04-manajemen-user.md)

## 1.1 Tujuan

Mengatur siapa yang boleh masuk ke aplikasi, dan menyimpan siapa yang sedang login ("sesi").

## 1.2 Cara Kerja

Aplikasi ini belum punya database sungguhan. Jadi:

- Login cuma mencocokkan **email** yang diketik ke daftar user yang ada.
- **Password tidak pernah benar-benar dicek** — asal diisi minimal 6 karakter, sistem anggap sah.
- Begitu email cocok dan akun berstatus **aktif**, user langsung masuk.

## 1.3 Alur Login

1.3.1. User buka halaman Login, isi Email dan Password.
1.3.2. Sistem cari email itu di daftar user.
1.3.3. Email tidak ketemu → muncul pesan **"Email tidak terdaftar"**, user coba lagi.
1.3.4. Email ketemu tapi status akun "Inactive" → muncul pesan **"Akun ini nonaktif, hubungi admin"**.
1.3.5. Email ketemu dan akun aktif → login berhasil, user diarahkan ke halaman Dashboard.

## 1.4 Alur Logout

1.4.1. User klik tombol Logout di menu.
1.4.2. Sistem hapus status login.
1.4.3. User diarahkan kembali ke halaman Login.

## 1.5 Hal Penting

| Poin | Penjelasan |
|---|---|
| Tidak ada database nyata | Semua data (user, tiket, stok, dst) cuma tersimpan sementara di memori browser. Kalau halaman di-refresh, **semua perubahan hilang** dan kembali ke data awal. |
| Logout menghapus semua data | Logout bukan cuma "keluar", tapi juga membuang semua data transaksi yang sedang berjalan di memori — bukan cuma sesi login. Jangan logout di tengah uji coba alur lintas-user. |
| Ganti user tanpa logout | Ada tombol "Switch User" (ikon orang) di pojok kanan atas, dipakai untuk pindah akun tanpa kehilangan data. Ini cuma untuk keperluan uji coba/demo. |
| Akses halaman tanpa login | User yang belum login dan coba buka alamat halaman apapun langsung, otomatis dilempar ke halaman Login. |

## 1.6 Status

✅ Selesai. Sudah diuji langsung dan berjalan sesuai rencana.

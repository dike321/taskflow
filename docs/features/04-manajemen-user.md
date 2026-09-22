# 4. Manajemen User

**Modul:** `users`
**Terhubung dengan:** [1. Login & Sesi](01-login-sesi.md) · [5. Role & Permission](05-role-permission.md) · [6. Master Data](06-master-data.md)

## 4.1 Tujuan

Tempat Admin mengelola akun semua orang yang pakai aplikasi ini: siapa saja, jabatannya apa, boleh akses gudang mana, dan status aktif/tidaknya.

## 4.2 Data yang Disimpan per User

| Field | Keterangan |
|---|---|
| Nama, Email, Telepon | Data dasar |
| Departemen | Management, Warehouse, Finance, IT, Operations, atau Vendor |
| Company | Perusahaan induk user ini — lihat [6. Master Data](06-master-data.md) |
| Role | Jabatan yang menentukan hak akses — lihat [5. Role & Permission](05-role-permission.md) |
| Status | Active atau Inactive. Yang Inactive tidak bisa login |
| Warehouse (opsional) | Kalau diisi, user itu cuma boleh pilih gudang ini saat bikin transaksi stok. Biasanya cuma diisi untuk Staf Gudang |

## 4.3 Alur Tambah User

4.3.1. Admin klik "Add User", isi form (nama, email, telepon, departemen, company, role, status, gudang opsional).
4.3.2. Field nama, email, telepon wajib diisi — kalau kosong, form tidak bisa dikirim.
4.3.3. Submit → user baru langsung tersimpan dan **langsung bisa login** dengan email itu.

## 4.4 Alur Edit User

4.4.1. Admin klik ikon edit di baris user, ubah data yang perlu (misalnya naikkan jabatan, pindah gudang).
4.4.2. Submit → perubahan langsung berlaku, termasuk kalau user itu login setelahnya.

## 4.5 Alur Hapus User

4.5.1. Admin klik ikon hapus.
4.5.2. Sistem cek dulu: apakah user ini pernah tercatat sebagai pembuat/penyetuju transaksi stok, atau sebagai pelapor/penerima tugas di sebuah tiket?
4.5.3. **Kalau iya** → hapus diblokir, muncul pesan bahwa user masih direferensikan. Solusinya: nonaktifkan saja statusnya, jangan dihapus.
4.5.4. **Kalau tidak pernah dipakai** → muncul konfirmasi biasa, hapus benar-benar terjadi setelah dikonfirmasi.

## 4.6 Riwayat Perbaikan

Ada 2 hal yang diperbaiki 22 September 2026:

1. **Tambah/edit user dulu sempat cuma "kosmetik"** — user baru yang dibuat lewat halaman ini tidak bisa login sama sekali, dan perubahan role/gudang lewat edit tidak berlaku saat user itu login. Ini karena data di halaman Users tersimpan terpisah dari data yang benar-benar dipakai sistem login. Sudah diperbaiki — sekarang satu sumber data yang sama.
2. **Hapus user dulu tidak ada pengecekan sama sekali** — user yang masih dipakai sebagai penyetuju transaksi bisa terhapus tanpa peringatan. Sudah ditambahkan pengecekan seperti dijelaskan di 4.5.

## 4.7 Status

✅ Selesai. Semua alur (tambah, edit, hapus + guard) sudah diverifikasi live.

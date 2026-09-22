# 6. Master Data: Company, Supplier, Warehouse

**Modul:** `companies`, `suppliers`, `warehouses`
**Terhubung dengan:** [4. Manajemen User](04-manajemen-user.md) · [15. Supplier Portal](15-supplier-portal.md) · [8. Stock In](08-stock-in.md)

## 6.1 Tujuan

Tiga data dasar yang dipakai di mana-mana di aplikasi ini. Ketiganya punya pola kerja yang sama persis, jadi dijelaskan dalam satu dokumen.

## 6.2 Apa Bedanya Ketiganya

| Entitas | Fungsinya |
|---|---|
| **Company** | Organisasi. Ada 2 jenis: *internal* (perusahaan sendiri) dan *supplier* (perusahaan vendor luar). Tiap user wajib terdaftar di satu Company. |
| **Supplier** | Data vendor/pemasok barang, dipakai saat mencatat Stock In (barang masuk dari siapa). |
| **Warehouse** | Data gudang fisik — kode, nama, alamat. Tempat stok disimpan. |

Company bertipe "supplier" bisa **ditautkan** ke satu data Supplier (opsional) — ini yang menentukan akun [Supplier Portal](15-supplier-portal.md) melihat data milik siapa.

## 6.3 Pola Kerja (Sama untuk Ketiganya)

### 6.3.1 Tambah

Isi form field yang diminta (nama wajib, sisanya biasanya opsional). Submit langsung tersimpan.

### 6.3.2 Ubah

Klik ikon edit, ubah data, submit.

### 6.3.3 Hapus

Sistem selalu cek dulu apakah data itu masih dipakai di tempat lain, sebelum benar-benar menghapus:

| Entitas | Diblokir hapus kalau... |
|---|---|
| Company | Masih ada user yang terdaftar di company itu |
| Supplier | Masih ada riwayat transaksi Stock In dari supplier itu |
| Warehouse | Masih ada stok tersisa atau riwayat transaksi di gudang itu |

Kalau tidak ada yang memakai, data langsung terhapus setelah dikonfirmasi.

## 6.4 Field Khusus yang Perlu Diketahui

- **Company tipe "supplier"** boleh punya tautan ke Supplier, tapi field ini **opsional** — bukan wajib diisi.
- **Company Name** pada form Company wajib diisi, begitu juga **Phone** — kalau kosong, form tidak bisa dikirim.

## 6.5 Status

✅ Selesai. Semua alur (tambah, ubah, hapus + guard) untuk ketiga entitas sudah diverifikasi live satu per satu.

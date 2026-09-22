# 7. Inventory Items

**Modul:** `inventory.items`
**Terhubung dengan:** [8. Stock In](08-stock-in.md) · [11. Batch & FEFO](11-batch-fefo.md) · [3. Dashboard](03-dashboard.md)

## 7.1 Tujuan

Daftar master barang yang dikelola di gudang — jenis barangnya apa saja, satuannya apa, batas minimum stoknya berapa.

## 7.2 Data yang Disimpan per Barang

| Field | Keterangan |
|---|---|
| SKU | Kode unik barang, wajib diisi dan **harus unik** — tidak boleh sama dengan barang lain |
| Name | Nama barang |
| Category | ATK, Elektronik, atau Consumable |
| Unit | Satuan dasar barang (pcs, unit, box, karton, rim, botol, kg) |
| Barcode (opsional) | Kalau diisi, harus unik juga |
| Minimum Stock | Batas bawah stok. Kalau stok sampai di bawah ini, barang ditandai "Low Stock" |
| Purchase Unit (opsional) | Satuan beli kalau beda dari satuan dasar. Contoh: beli per "karton", disimpan per "rim" |
| Purchase Conversion Factor | Berapa satuan dasar dalam 1 satuan beli. Contoh: 1 karton = 5 rim |

## 7.3 Alur Tambah/Edit Barang

7.3.1. Isi SKU, Nama, Kategori, Satuan (wajib).
7.3.2. Kalau diisi Purchase Unit, Purchase Unit **tidak boleh sama** dengan Unit dasar, dan Conversion Factor **minimal 2**.
7.3.3. Sistem cek: SKU sudah dipakai barang lain? Kalau iya, ditolak dengan pesan jelas.
7.3.4. Sistem cek: Barcode (kalau diisi) sudah dipakai barang lain? Kalau iya, ditolak juga.
7.3.5. Semua validasi lolos → tersimpan. Barang baru selalu mulai dengan stok 0 di semua gudang — penambahan stok dilakukan lewat [8. Stock In](08-stock-in.md).

## 7.4 Melihat Stok

Klik angka stok pada baris barang untuk melihat rincian per gudang. Staf yang ditugaskan ke satu gudang tertentu cuma lihat stok gudangnya sendiri, bukan total semua gudang.

## 7.5 Riwayat Perbaikan

SKU dulu **tidak dicek keunikannya** — beda dengan Barcode yang memang sudah dicek dari awal. Akibatnya bisa muncul 2 barang berbeda dengan SKU sama persis, yang membingungkan. Sudah diperbaiki 22 September 2026 — sekarang SKU juga dicek sama seperti Barcode, dan pesan errornya muncul tepat di kolom SKU.

## 7.6 Status

✅ Selesai. Validasi SKU, Barcode, dan konversi satuan sudah diverifikasi live.

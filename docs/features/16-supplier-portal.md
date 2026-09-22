# 16. Supplier Portal

**Modul:** `supplierPortal`
**Terhubung dengan:** [6. Master Data](06-master-data.md) · [8. Stock In](08-stock-in.md) · [2. Otorisasi Route](02-otorisasi-route.md)

## 16.1 Tujuan

Halaman terbatas khusus untuk akun Supplier — vendor luar yang tidak boleh lihat data internal apapun, cuma data yang terkait perusahaan mereka sendiri.

## 16.2 Yang Bisa Dilihat Supplier

16.2.1. **Profil Company** miliknya sendiri (nama, alamat, kontak).
16.2.2. **Riwayat pengiriman** — daftar transaksi Stock In yang tercatat berasal dari supplier itu.

Data supplier lain **tidak pernah dikirim ke akun ini sama sekali** — bukan cuma disembunyikan di tampilan, tapi memang tidak ada jalan untuk mengaksesnya.

## 16.3 Aksi yang Bisa Dilakukan

16.3.1. Klik **Confirm Shipment** pada baris pengiriman miliknya, untuk menandai "barang sudah saya kirim".
16.3.2. Ini murni tanda dari pihak supplier — terpisah dari status persetujuan internal (lihat [13. Approval Berjenjang](13-approval-berjenjang.md)). Supplier tidak bisa approve/reject transaksi.

## 16.4 Status

✅ Selesai. Sudah diverifikasi live bahwa data supplier lain benar-benar tidak bocor, dan tombol Confirm Shipment berfungsi.

# 9. Stock Out (Barang Keluar)

**Modul:** `inventory.stockOut`
**Terhubung dengan:** [8. Stock In](08-stock-in.md) · [11. Batch & FEFO](11-batch-fefo.md) · [13. Approval Berjenjang](13-approval-berjenjang.md)

## 9.1 Tujuan

Mencatat barang yang keluar dari gudang — biasanya karena dipakai suatu departemen.

## 9.2 Alur Pencatatan

9.2.1. Pilih Gudang (terkunci otomatis kalau user ditugaskan ke satu gudang tertentu).
9.2.2. Pilih Barang, isi Jumlah, pilih Departemen pemakai.
9.2.3. Sistem cek: jumlah yang diminta tidak boleh lebih besar dari stok yang tersedia di gudang itu.
9.2.4. Submit.

## 9.3 Aturan Persetujuan (Approval)

Sama persis dengan [8. Stock In](08-stock-in.md) — jumlah dibandingkan dengan Approval Threshold dan Escalation Threshold untuk menentukan status Approved langsung atau Pending.

## 9.4 Validasi

- Jumlah harus lebih besar dari 0.
- Jumlah **tidak boleh melebihi stok tersedia** di gudang yang dipilih — kalau melebihi, ditolak dengan pesan jelas berapa stok yang sebenarnya ada.

## 9.5 Hubungan dengan Batch

Kalau barang termasuk yang dilacak per-batch, begitu transaksi disetujui, stok akan diambil otomatis dari batch dengan tanggal kedaluwarsa paling dekat dulu (aturan FEFO). Detail lengkap di [11. Batch & FEFO](11-batch-fefo.md).

## 9.6 Status

✅ Selesai. Validasi stok cukup dan alur approval sudah diverifikasi live.

# 8. Stock In (Barang Masuk)

**Modul:** `inventory.stockIn`
**Terhubung dengan:** [7. Inventory Items](07-inventory-items.md) · [11. Batch & FEFO](11-batch-fefo.md) · [13. Approval Berjenjang](13-approval-berjenjang.md) · [17. Settings](17-settings-reports-log.md)

## 8.1 Tujuan

Mencatat barang yang masuk ke gudang — dari pembelian, retur, atau stok awal.

## 8.2 Alur Pencatatan

8.2.1. Pilih Gudang. Kalau user ditugaskan ke satu gudang tertentu, pilihan otomatis terkunci ke gudang itu saja.
8.2.2. Pilih Barang, isi Jumlah dan Satuan (bisa satuan dasar atau satuan beli kalau barang itu punya konversi — lihat [7. Inventory Items](07-inventory-items.md)).
8.2.3. Kalau barang termasuk yang dilacak per-batch (lihat [11. Batch & FEFO](11-batch-fefo.md)), wajib isi Nomor Batch dan Tanggal Kedaluwarsa. Nomor Batch **harus unik** untuk kombinasi barang+gudang yang sama.
8.2.4. Sistem hitung jumlah dalam satuan dasar.
8.2.5. Submit.

## 8.3 Aturan Persetujuan (Approval)

Jumlah barang menentukan apakah transaksi langsung disetujui otomatis atau perlu persetujuan orang lain dulu:

| Kondisi Jumlah | Yang Terjadi |
|---|---|
| ≤ Approval Threshold, dan user punya izin approve | Langsung **Approved** — stok & batch langsung dibuat |
| ≤ Approval Threshold, tapi user tidak punya izin approve | Status **Pending**, menunggu 1 orang approve |
| > Escalation Threshold | Status **Pending**, butuh 2 tahap persetujuan — lihat [13. Approval Berjenjang](13-approval-berjenjang.md) |

Batas Approval Threshold dan Escalation Threshold diatur di [17. Settings](17-settings-reports-log.md).

## 8.4 Validasi

- Jumlah harus lebih besar dari 0.
- Gudang wajib dipilih.
- Nomor Batch + Tanggal Kedaluwarsa wajib untuk barang yang dilacak per-batch, dan nomor batch tidak boleh dobel untuk barang+gudang yang sama.

## 8.5 Riwayat Perbaikan

Nomor Batch dulu **tidak dicek keunikannya**. Bisa terjadi 2 batch berbeda punya nomor sama persis untuk barang yang sama di gudang yang sama — membingungkan saat melacak barang mana yang mana. Sudah diperbaiki 22 September 2026.

## 8.6 Status

✅ Selesai. Alur pencatatan, ambang batas approval, dan validasi batch sudah diverifikasi live.

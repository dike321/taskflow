# 10. Stock Transfer (Pindah Gudang)

**Modul:** `inventory.transfer`
**Terhubung dengan:** [8. Stock In](08-stock-in.md) · [9. Stock Out](09-stock-out.md) · [13. Approval Berjenjang](13-approval-berjenjang.md)

## 10.1 Tujuan

Memindahkan stok barang dari satu gudang ke gudang lain, tanpa mengubah total stok keseluruhan.

## 10.2 Alur Pencatatan

10.2.1. Pilih Barang, Gudang Asal, Gudang Tujuan, dan Jumlah.
10.2.2. Sistem cek: Gudang Asal dan Gudang Tujuan **tidak boleh sama**.
10.2.3. Sistem cek: Jumlah tidak boleh melebihi stok yang ada di Gudang Asal.
10.2.4. Submit.

## 10.3 Aturan Persetujuan (Approval)

Sama seperti [8. Stock In](08-stock-in.md) — jumlah dibandingkan dengan Approval Threshold dan Escalation Threshold.

## 10.4 Validasi

| Kesalahan | Pesan |
|---|---|
| Gudang asal = gudang tujuan | "Source and destination warehouse must be different" |
| Jumlah melebihi stok di gudang asal | "Quantity exceeds available stock at..." |

Kalau user ditugaskan ke satu gudang tertentu, pilihan Gudang Asal otomatis terkunci ke gudang itu — tidak bisa transfer keluar dari gudang lain.

## 10.5 Status

✅ Selesai. Validasi gudang sama dan stok cukup sudah diverifikasi live, termasuk untuk transfer nilai besar yang butuh 2 tahap approval.

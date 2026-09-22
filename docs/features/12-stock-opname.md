# 12. Stock Opname (Hitung Fisik)

**Modul:** `inventory.opname`
**Terhubung dengan:** [8. Stock In](08-stock-in.md) · [13. Approval Berjenjang](13-approval-berjenjang.md)

## 12.1 Tujuan

Mencocokkan catatan stok di sistem dengan hasil hitung fisik barang sungguhan di gudang. Kalau beda, sistem otomatis menyesuaikan.

## 12.2 Alur Pencatatan

12.2.1. Pilih Gudang dan Barang.
12.2.2. Sistem tampilkan angka stok menurut catatan ("System Stock").
12.2.3. User isi hasil hitung fisik yang sebenarnya ("Physical Quantity").
12.2.4. Sistem hitung selisih = hasil fisik − catatan sistem.

## 12.3 Aturan Berdasarkan Selisih

| Kondisi | Yang Terjadi |
|---|---|
| Hasil fisik = catatan sistem (selisih 0) | Submit **ditolak** — muncul pesan "tidak ada yang perlu disesuaikan". Tidak ada catatan opname dibuat. |
| Selisih kecil, ≤ Approval Threshold | Langsung **Approved**, stok disesuaikan otomatis |
| Selisih besar, > Escalation Threshold | Butuh 2 tahap persetujuan — lihat [13. Approval Berjenjang](13-approval-berjenjang.md) |

## 12.4 Status

✅ Selesai. Perhitungan selisih dan alur approval sudah diverifikasi live untuk selisih kurang maupun lebih.

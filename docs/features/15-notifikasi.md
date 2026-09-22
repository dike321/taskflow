# 15. Notifikasi

**Modul:** *(bergantung pada izin modul terkait tiap kategori)*
**Terhubung dengan:** [14. Tickets](14-tickets.md) · [13. Approval Berjenjang](13-approval-berjenjang.md) · [11. Batch & FEFO](11-batch-fefo.md)

## 15.1 Tujuan

Lonceng notifikasi di header aplikasi, kumpulan hal-hal yang butuh perhatian user saat ini.

## 15.2 Cara Kerja

Berbeda dengan notifikasi pada umumnya, daftar ini **dihitung ulang setiap kali dibuka** — bukan catatan tersimpan yang menunggu dibaca. Jadi:

- Tidak ada status "sudah dibaca" / "belum dibaca".
- Tidak ada tombol "tandai semua sudah dibaca" (karena memang tidak ada yang perlu ditandai).
- Begitu penyebabnya sudah tidak berlaku lagi (misalnya tiket sudah diselesaikan), notifikasi itu **otomatis hilang sendiri**, tanpa perlu di-klik dulu.

## 15.3 Kategori Notifikasi

| Kategori | Muncul kalau... |
|---|---|
| Tiket Overdue | Ada tiket yang lewat batas waktu (lihat [14. Tickets](14-tickets.md)) |
| Approval Pending | Ada transaksi/opname yang menunggu persetujuan user ini (lihat [13. Approval Berjenjang](13-approval-berjenjang.md)) |
| Tiket Ditugaskan | Ada tiket yang di-assign ke user ini |
| Komentar Baru | Ada komentar baru di tiket yang terkait user ini |
| Batch Kedaluwarsa | Ada batch barang yang sudah lewat tanggal kedaluwarsa (lihat [11. Batch & FEFO](11-batch-fefo.md)) |

Angka di lonceng adalah jumlah total semua kategori di atas digabung.

## 15.4 Status

✅ Selesai sesuai desain yang direncanakan. Kalau ke depannya dibutuhkan riwayat notifikasi yang tersimpan (bukan cuma real-time), ini perlu dibangun sebagai fitur terpisah.

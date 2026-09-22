# 13. Approval Berjenjang

**Modul:** dipakai bersama oleh `inventory.stockIn`, `inventory.stockOut`, `inventory.transfer`, `inventory.opname`
**Terhubung dengan:** [8. Stock In](08-stock-in.md) · [9. Stock Out](09-stock-out.md) · [10. Stock Transfer](10-stock-transfer.md) · [12. Stock Opname](12-stock-opname.md) · [5. Role & Permission](05-role-permission.md) · [17. Settings](17-settings-reports-log.md)

## 13.1 Tujuan

Ini "mesin" persetujuan yang dipakai bersama oleh 4 fitur transaksi gudang. Tujuannya memastikan transaksi bernilai besar tidak langsung jalan begitu saja — perlu dicek orang lain dulu.

## 13.2 Dua Tahap Approval

Setiap transaksi yang butuh persetujuan punya status berjalan seperti ini:

13.2.1. **Pending** — baru dibuat, menunggu persetujuan pertama.
13.2.2. **Pending Final** (kalau jumlahnya besar) — sudah disetujui tahap pertama, masih menunggu persetujuan final.
13.2.3. **Approved** — disetujui penuh, stok/data langsung berubah.
13.2.4. **Rejected** — ditolak, transaksi berhenti, tidak ada perubahan stok.

Apakah suatu transaksi perlu 1 tahap atau 2 tahap, ditentukan oleh jumlahnya dibanding Escalation Threshold — lihat [17. Settings](17-settings-reports-log.md).

## 13.3 Siapa yang Boleh Approve

Ditentukan oleh **Approval Level** pada role user (lihat [5. Role & Permission](05-role-permission.md)):

| Approval Level Role | Boleh Approve Tahap 1 | Boleh Approve Tahap Final |
|---|---|---|
| Kosong (None) | ❌ | ❌ |
| Level 1 | ✅ | ❌ |
| Level 2 | ✅ | ✅ |

## 13.4 Aturan Keamanan (Maker-Checker)

Supaya orang tidak bisa menyetujui transaksinya sendiri, ada 2 aturan:

13.4.1. **Pembuat transaksi tidak boleh approve transaksinya sendiri** — di tahap manapun. Kalau dia coba buka halaman Approvals, tombol Approve/Reject untuk transaksi miliknya tidak akan muncul.
13.4.2. **Orang yang approve Tahap 1 tidak boleh approve Tahap Final** di transaksi yang sama — harus orang berbeda.

## 13.5 Alur Lengkap (Contoh Transaksi Besar)

13.5.1. Staf A bikin transaksi jumlah besar → status **Pending**.
13.5.2. Supervisor B (Level 1, bukan Staf A) buka Approvals, klik Approve → status jadi **Pending Final**, tercatat siapa yang approve tahap 1.
13.5.3. Admin C (Level 2, bukan Staf A, bukan Supervisor B) klik Final Approve → status jadi **Approved**, stok berubah.
13.5.4. Di tahap manapun, approver boleh pilih Reject sebagai ganti Approve → status langsung **Rejected**, alur berhenti, stok tidak berubah.

## 13.6 Catatan

Saat Reject, sistem **tidak meminta alasan penolakan** — status langsung berubah tanpa catatan kenapa ditolak. Ini keputusan desain yang belum diubah, bisa didiskusikan lagi kalau perlu jejak audit yang lebih lengkap.

## 13.7 Riwayat Perbaikan

Sebelum 22 September 2026, aturan 13.4.1 **belum ada** — siapapun yang punya izin approve bisa menyetujui transaksinya sendiri, termasuk transaksi besar. Satu-satunya aturan yang ada cuma 13.4.2. Sudah diperbaiki, dan diverifikasi: pembuat transaksi sekarang benar-benar kehilangan tombol Approve di transaksi miliknya, sementara approver lain tetap bisa approve normal.

## 13.8 Status

✅ Selesai. Alur 1 tahap, 2 tahap, dan kedua aturan maker-checker sudah diverifikasi live.

# 17. Settings, Reports & Activity Log

**Modul:** `settings`, `reports`, `activityLog`
**Terhubung dengan:** [8. Stock In](08-stock-in.md) · [13. Approval Berjenjang](13-approval-berjenjang.md) · [3. Dashboard](03-dashboard.md)

## 17.1 Settings (Pengaturan Umum)

### 17.1.1 Approval Threshold & Escalation Threshold

Dua angka ambang batas yang menentukan alur persetujuan di semua transaksi gudang ([8](08-stock-in.md), [9](09-stock-out.md), [10](10-stock-transfer.md), [12](12-stock-opname.md)):

| Ambang | Artinya |
|---|---|
| Approval Threshold | Jumlah di atas ini **butuh persetujuan**, tidak bisa langsung Approved otomatis meski user bisa approve |
| Escalation Threshold | Jumlah di atas ini butuh **2 tahap** persetujuan (lihat [13. Approval Berjenjang](13-approval-berjenjang.md)) |

**Aturan:** Escalation Threshold harus lebih besar dari Approval Threshold. Kalau dicoba diisi lebih kecil atau sama, sistem menolak dan tidak menyimpan.

### 17.1.2 My Profile

Setiap user (apapun role-nya) bisa ubah nama, telepon, dan kata sandi miliknya sendiri lewat menu ini. Perubahan **langsung berlaku**, beda dengan modul lain yang dulu sempat cuma tampilan (lihat catatan di [4. Manajemen User](04-manajemen-user.md) dan [5. Role & Permission](05-role-permission.md)) — halaman ini dari awal memang sudah benar.

## 17.2 Reports

Ringkasan angka transaksi gudang dan tiket, bisa dikelompokkan per Kategori, Gudang, atau Departemen. Kalau user ditugaskan ke satu gudang tertentu, laporan otomatis cuma menampilkan data gudang itu.

## 17.3 Activity Log

Catatan semua aksi penting yang terjadi di aplikasi — siapa melakukan apa, kapan, di modul mana. Dicatat otomatis setiap kali ada aksi Create, Update, Delete, Approve, atau Reject di modul manapun. Catatan ini **tidak pernah bisa dihapus atau diubah** (append-only), jadi bisa dipakai sebagai jejak audit.

## 17.4 Status

✅ Selesai. Validasi ambang batas, cakupan laporan per gudang, dan pencatatan Activity Log sudah diverifikasi live.

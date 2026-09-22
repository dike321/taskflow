# 11. Batch & FEFO

**Modul:** `inventory.batches`
**Terhubung dengan:** [8. Stock In](08-stock-in.md) · [9. Stock Out](09-stock-out.md) · [7. Inventory Items](07-inventory-items.md)

## 11.1 Tujuan

Melacak barang yang punya tanggal kedaluwarsa (misalnya tinta printer, hand sanitizer) per kelompok/lot, supaya barang lama dikeluarkan duluan sebelum kedaluwarsa.

## 11.2 Apa itu "Batch" dan "FEFO"

- **Batch** — satu kelompok barang yang masuk bersamaan, punya nomor batch dan tanggal kedaluwarsa sendiri.
- **FEFO** (*First-Expired-First-Out*) — aturan otomatis: barang dengan tanggal kedaluwarsa paling dekat, dikeluarkan duluan.

## 11.3 Alur Batch Terbentuk

11.3.1. Batch **tidak dibuat manual** lewat halaman terpisah — batch otomatis terbentuk setiap kali ada [Stock In](08-stock-in.md) untuk barang yang dilacak per-batch dan Nomor Batch + Tanggal Kedaluwarsa diisi.
11.3.2. Batch baru langsung muncul di halaman Batches.

## 11.4 Status Batch

| Status | Artinya |
|---|---|
| OK | Tanggal kedaluwarsa masih lebih dari 30 hari lagi |
| Expiring Soon | Tanggal kedaluwarsa dalam 30 hari ke depan |
| Expired | Tanggal kedaluwarsa sudah lewat |

## 11.5 Alur Konsumsi (FEFO)

11.5.1. Saat ada [Stock Out](09-stock-out.md) untuk barang yang dilacak per-batch, sistem otomatis ambil stok dari batch dengan tanggal kedaluwarsa **paling awal** dulu.
11.5.2. Kalau jumlah yang diminta lebih besar dari batch pertama, sisanya diambil dari batch berikutnya (urut dari yang paling awal kedaluwarsa).
11.5.3. **Batch yang sudah berstatus Expired tetap bisa dikonsumsi** — sistem tidak memblokirnya, cuma menandai statusnya secara visual di halaman Batches.

## 11.6 Catatan Kebijakan

Poin 11.5.3 di atas adalah keputusan desain, bukan bug — belum diubah. Kalau nanti dibutuhkan alur pemusnahan/write-off barang kedaluwarsa yang terpisah dari Stock Out biasa, ini perlu didiskusikan dan dibangun sebagai fitur baru.

## 11.7 Riwayat Perbaikan

Nomor Batch dulu bisa dobel untuk barang+gudang yang sama (lihat juga [8. Stock In](08-stock-in.md) bagian 8.5). Sudah diperbaiki 22 September 2026.

## 11.8 Status

✅ Selesai untuk bagian yang direncanakan. Perilaku FEFO-mengonsumsi-batch-expired tetap seperti sekarang sampai ada keputusan lain.

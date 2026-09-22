# 14. Tickets

**Modul:** `tickets`
**Terhubung dengan:** [15. Notifikasi](15-notifikasi.md) · [17. Settings, Reports & Activity Log](17-settings-reports-log.md)

## 14.1 Tujuan

Sistem tiket bantuan internal — tempat orang melaporkan masalah atau permintaan (misalnya "printer rusak", "butuh restock ATK").

## 14.2 Data Tiket

| Field | Keterangan |
|---|---|
| Judul, Deskripsi | Isi laporan |
| Category | IT, Finance, Operations, HR, atau Facilities |
| Priority | low, medium, high, atau urgent |
| Reporter | Yang melapor (otomatis, pembuat tiket) |
| Assignee (opsional) | Yang ditugaskan menangani |
| Due Date (opsional) | Batas waktu penyelesaian |

## 14.3 Alur Status Tiket

Status tiket berjalan bertahap, dari kiri ke kanan:

```
Open → In Progress → Resolved → Closed
```

- Dari **Resolved** atau **Closed**, bisa **Reopen** untuk kembali ke status **Open**.
- Tidak bisa lompat status (misalnya dari Open langsung ke Closed tanpa lewat In Progress dan Resolved).
- Komentar bisa ditambahkan kapan saja, di status manapun.

## 14.4 Aturan Overdue

Tiket dianggap **terlambat (overdue)** kalau Due Date sudah lewat dan statusnya masih Open atau In Progress. Tiket yang Resolved/Closed tidak pernah dianggap overdue walaupun Due Date-nya sudah lewat. Tiket overdue otomatis muncul di [15. Notifikasi](15-notifikasi.md).

## 14.5 Status

✅ Selesai. Alur status bertahap, komentar, dan deteksi overdue sudah diverifikasi live.

# Rencana Modul Tickets

## Context

`Ticket Management` dan `Comments` adalah dua item terakhir di "Planned Features" README yang belum punya implementasi nyata (di luar Inventory yang sudah selesai — lihat `docs/inventory-module-plan.md`). Modul ini dibangun sebagai request/issue tracking internal (mirip helpdesk) — bukan project/task management, karena "Projects" sudah digantikan Inventory.

Status: **Phase 1 — [Selesai]**. Data model, halaman `TicketsPage.tsx` (list + filter + CRUD + status workflow + comment thread), routing, sidebar, dan permission (`tickets` module key) sudah terpasang mengikuti pola yang sama seperti `Suppliers`/`Warehouses` (flat context provider, bukan Outlet nested seperti Inventory — modul ini tidak butuh sub-tab).

## Data Model — `src/data/tickets.tsx`

```ts
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: number
  title: string
  description: string
  category: string        // IT / Finance / Operations / HR / Facilities
  priority: TicketPriority
  status: TicketStatus
  reporterId: number       // User.id, selalu currentUser saat create
  assigneeId?: number      // User.id
  createdAt: string
  dueDate?: string
  resolvedAt?: string
}

export interface TicketComment {
  id: number
  ticketId: number
  userId: number
  text: string
  createdAt: string
}
```

Status workflow linear: `open → in_progress → resolved → closed`, dengan aksi "Reopen" dari `resolved`/`closed` balik ke `open`. Transisi maju dipetakan lewat `NEXT_STATUS` supaya tombol aksi ("Start Progress"/"Mark Resolved"/"Close Ticket") tidak hardcode per state di komponen.

## Permission — `src/data/roles.ts`

Module key `tickets` (`view`/`create`/`edit`/`delete`) ditambahkan ke `MODULES` + `mockRoles`:
- **Admin**: full access.
- **Warehouse Staff**: `view`, `create` — siapapun boleh mengajukan tiket & komentar, tidak bisa edit detail/hapus tiket orang lain.
- **Warehouse Supervisor**: `view`, `create`, `edit` — bisa ubah kategori/prioritas/assignee, tidak bisa hapus.

Pengecualian: **status ticket** (Start Progress/Resolve/Close/Reopen) tetap bisa diubah oleh *assignee* tiket tersebut walau dia tidak punya permission `edit` generik — supaya orang yang benar-benar mengerjakan tiket bisa update progress tanpa perlu role Supervisor. Comment mengikuti permission `create` (siapa yang bisa bikin tiket, bisa komentar).

## Halaman — `src/pages/TicketsPage.tsx`

Pola sama seperti `SuppliersPage.tsx` (Table + Modal Add/Edit + Modal delete), ditambah satu modal baru:
- **Modal Detail/Comments** (`size="lg"`, `scrollable`): ringkasan tiket (priority/status/category badge, deskripsi, reporter/assignee/tanggal), tombol aksi status, dan thread komentar + form tambah komentar.

Filter: title (search), category, priority, status. Kolom tabel: `#`, Title, Category, Priority, Status, Reporter, Assignee, Due Date, Actions (View/Edit/Delete).

Terintegrasi ke `Activity Log` (create/update/delete/status-change/comment semua di-`logActivity` dengan module `tickets`) — otomatis muncul di filter "Module" `ActivityLogPage.tsx` karena filter itu digenerate dari `MODULES`.

## Routing & Sidebar

- `AppRouter.tsx`: `<Route path="tickets" element={<TicketsPage />} />` di level yang sama dengan `suppliers`/`warehouses` (bukan nested), dibungkus `<TicketsProvider>` sejajar `SuppliersProvider`/`WarehousesProvider`.
- `Sidebar.tsx`: menu "Tickets" pakai icon `Ticket` (sudah ada di `Icons.tsx` sejak awal, belum pernah dipakai), digating `hasModuleAccess(currentUser, 'tickets')`.

## Notifikasi — `Header.tsx` [Selesai]

Mengikuti pola derived-notification yang sudah ada (low stock/pending approval/expiry, semua dihitung ulang tiap render via `useMemo`, tanpa state read/unread tersendiri):
- **Ticket assigned alert**: tiket dengan `assigneeId === currentUser.id` dan status `open`/`in_progress`.
- **Ticket comment alert**: komentar terbaru pada tiket di mana currentUser adalah reporter/assignee, dan bukan komentar dari diri sendiri (maks 1 notifikasi per tiket, komentar terbaru saja).

Keduanya digating `hasModuleAccess(currentUser, 'tickets')` + toggle baru di `NotificationPreferences` (`ticketAssignedAlert`, `ticketCommentAlert`), diatur dari `NotificationsSettingsPage.tsx`.

## Reports — `ReportsPage.tsx` [Selesai]

Ditambahkan selector "Report" (Inventory Mutations / Tickets) di atas halaman Reports yang sudah ada — bukan halaman baru, supaya sejalan dengan satu module permission `reports` yang sudah ada (Admin & Warehouse Supervisor). Saat "Tickets" dipilih:
- 4 summary card: Total, Open, In Progress, Resolved/Closed.
- Group By: Category / Status / Assignee (assignee kosong dikelompokkan sebagai "Unassigned"), dengan filter Category, Priority, dan rentang tanggal (`createdAt`).
- Tabel breakdown per grup: Total + jumlah per status (Open/In Progress/Resolved/Closed).
- Export CSV & Print/PDF pakai mekanisme yang sama seperti mutation report (branch berdasarkan `reportType`).

## SLA & Escalation — `data/tickets.tsx`, `TicketsPage.tsx`, `Header.tsx` [Selesai]

`isTicketOverdue(ticket)` di `data/tickets.tsx`: tiket overdue kalau `dueDate` sudah lewat dan status masih `open`/`in_progress` (resolved/closed tidak pernah overdue).
- **List & detail Tickets**: badge merah "Overdue" di kolom Due Date + alert banner di modal detail kalau tiket overdue.
- **Notifikasi (escalation)**: toggle `ticketOverdueAlert` baru. Assignee tiket overdue selalu dapat notifikasi; user dengan permission `edit` pada module `tickets` (Admin/Supervisor) dapat notifikasi untuk **semua** tiket overdue termasuk yang unassigned (eskalasi ke manajemen), bukan cuma milik sendiri — dedup otomatis by ticket id kalau assignee juga punya `edit`.

## Attachment — `utils/attachments.ts`, `TicketsPage.tsx` [Selesai]

Tipe `Attachment` dan helper `filesToAttachments()` dipindah dari `data/inventory.tsx` ke `utils/attachments.ts` (shared, generic) — `data/inventory.tsx` re-export tipe itu supaya `StockHistoryPage.tsx`/`StockTransactionPage.tsx` tidak perlu diubah, dan `StockTransactionPage.tsx` sekarang pakai helper yang sama alih-alih inline map sendiri.
- `Ticket` punya field `attachments?: Attachment[]` opsional.
- **Add/Edit modal**: input file (multiple) + list existing attachment dengan tombol hapus per-item; file baru digabung dengan yang lama (bukan replace) saat submit.
- **Detail modal**: section "Attachments" menampilkan link download/preview (blob URL, hanya valid selama sesi browser — sama seperti attachment Stock In/Out, karena tidak ada backend storage nyata).

Roadmap Phase 1 selesai — tidak ada item tersisa dari daftar awal.

## Verifikasi

1. `npm run build` — pastikan TypeScript lolos tanpa error.
2. Cek Sidebar: menu "Tickets" muncul/hilang sesuai role (`hasModuleAccess`), tombol Add/Edit/Delete tersembunyi sesuai `hasPermission`.
3. Buat tiket baru, ubah status lewat modal detail, tambah komentar — cek semuanya tercatat di Activity Log dengan module `tickets`.

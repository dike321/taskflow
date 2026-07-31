# Rencana Role & Permission

## Context

Berdasarkan pengalaman di project sebelumnya, sistem Role di TaskFlow perlu bisa:
1. **Membedakan menu** — role tertentu hanya melihat menu yang relevan dengan pekerjaannya.
2. **Membedakan level akses per aksi** — bukan cuma view vs edit, tapi granular per-aksi (misal: bisa melihat transaksi tapi tidak bisa approve, bisa input tapi tidak bisa hapus).

Role juga harus **dinamis** — bisa dibuat/dikelola sendiri lewat halaman admin (bukan daftar role tetap yang di-hardcode di kode), mirip pengaturan role di aplikasi seperti Jira/Slack.

Ini fitur **lintas-modul** (bukan cuma punya Inventory) — memengaruhi `Sidebar`, `UsersPage`, dan nantinya semua modul termasuk Inventory. Karena itu didokumentasikan terpisah dari `docs/inventory-module-plan.md`, tapi keduanya saling terhubung (lihat bagian akhir dokumen ini).

Status: **Halaman Role Management (CRUD) mulai diimplementasikan** sebagai sub-menu di dalam "Settings" (bukan menu top-level sidebar terpisah seperti draft awal). Bagian lain di dokumen ini (migrasi `User.roleId`, permission enforcement di Sidebar/tombol aksi, `currentUser`) **masih rencana, belum dikerjakan** — lihat "Urutan implementasi" di bagian bawah untuk status tiap tahap.

---

## Data Model — `src/data/roles.ts` (baru)

```ts
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'

export interface Role {
  id: number
  name: string
  description?: string
  permissions: Record<string, PermissionAction[]>   // key = module key (lihat daftar di bawah), value = aksi yang diizinkan
}
```

Tidak semua aksi relevan untuk semua module — misal `approve` hanya bermakna untuk `inventory.stockOut`/`inventory.stockIn`, `export` untuk module yang punya laporan. UI Role Management nanti hanya menampilkan aksi yang relevan per module (lihat bagian "Halaman Role Management").

### Daftar Module Key (target permission)

Menyesuaikan menu yang ada sekarang + rencana Inventory:

| Module key | Menu / Halaman |
|---|---|
| `dashboard` | Dashboard |
| `users` | Users |
| `roles` | Role Management (meta — biasanya cuma Admin yang boleh edit) |
| `inventory.items` | Inventory → tab Items |
| `inventory.stockIn` | Inventory → tab Stock In |
| `inventory.stockOut` | Inventory → tab Stock Out |
| `inventory.history` | Inventory → tab History |
| `tickets` | Tickets |
| `settings` | Settings |

Daftar ini akan bertambah seiring modul baru ditambahkan (Projects, Comments, dst sesuai README).

### Contoh mock role

```ts
export const mockRoles: Role[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'Akses penuh ke seluruh sistem',
    permissions: {
      dashboard: ['view'],
      users: ['view', 'create', 'edit', 'delete'],
      roles: ['view', 'create', 'edit', 'delete'],
      'inventory.items': ['view', 'create', 'edit', 'delete'],
      'inventory.stockIn': ['view', 'create', 'edit', 'approve'],
      'inventory.stockOut': ['view', 'create', 'edit', 'approve'],
      'inventory.history': ['view', 'export'],
      tickets: ['view', 'create', 'edit', 'delete'],
      settings: ['view', 'edit'],
    },
  },
  {
    id: 2,
    name: 'Warehouse Staff',
    description: 'Input barang masuk/keluar, tidak bisa approve',
    permissions: {
      dashboard: ['view'],
      'inventory.items': ['view'],
      'inventory.stockIn': ['view', 'create'],
      'inventory.stockOut': ['view', 'create'],
      'inventory.history': ['view'],
    },
  },
  {
    id: 3,
    name: 'Warehouse Supervisor',
    description: 'Approve transaksi, kelola master barang',
    permissions: {
      dashboard: ['view'],
      'inventory.items': ['view', 'create', 'edit'],
      'inventory.stockIn': ['view', 'create', 'approve'],
      'inventory.stockOut': ['view', 'create', 'approve'],
      'inventory.history': ['view', 'export'],
    },
  },
]
```

Module yang tidak disebut di `permissions` = tidak ada akses sama sekali (menu tersembunyi).

---

## Perubahan pada `User` — `src/data/users.ts`

**[Selesai]** Field `role: string` (bebas teks) diganti jadi referensi ke Role. Data mock user lama (`Admin`/`Manager`/`User`) dipetakan ke role baru: `Admin` → **Admin**, `Manager` → **Warehouse Supervisor**, `User` → **Warehouse Staff**.

```ts
export interface User {
  id: number
  name: string
  email: string
  phone: string
  roleId: number     // sebelumnya: role: string
  status: 'active' | 'inactive'
  createdAt: string
}
```

**Migrasi di `UsersPage.tsx` — [Selesai]:**
- Badge warna role sekarang digenerate otomatis dari palet tetap berdasarkan `roleId` (bukan mapping hardcode per nama role) — otomatis menyesuaikan berapa pun jumlah role yang dibuat lewat Role Management.
- `<Select>` daftar role di form Add/Edit dan filter, sekarang di-generate dari `mockRoles` (bukan hardcode `Admin`/`Manager`/`User` lagi).
- Kolom "Role" di tabel menampilkan `role.name` hasil lookup dari `roleId`.

---

## Halaman baru: Role Management

**[Diimplementasikan]** Ditempatkan sebagai **sub-menu di dalam "Settings"**, bukan menu top-level sidebar terpisah seperti draft awal. Struktur:

```
src/pages/settings/
├── SettingsLayout.tsx   # PageToolbar + tab nav + <Outlet/> (pola sama seperti InventoryLayout.tsx)
└── RolesPage.tsx         # sub-menu pertama; tab lain (General, dst) menyusul nanti
```

Routing (`AppRouter.tsx`):
```tsx
<Route path="settings" element={<SettingsLayout />}>
  <Route index element={<Navigate to="roles" replace />} />
  <Route path="roles" element={<RolesPage />} />
</Route>
```

Pola `RolesPage.tsx` mengikuti `UsersPage.tsx` (Table + Modal + konfirmasi hapus), dengan tambahan:
- **Tabel Roles**: Name, Description, jumlah module yang punya akses, Actions (edit/delete).
- **Modal Add/Edit Role** (`size="lg"` karena matriks permission butuh ruang lebar): Input Name/Description, lalu **matriks permission** — tabel dengan baris = module, kolom = aksi (`view`/`create`/`edit`/`delete`/`approve`/`export` — kolom yang tidak relevan untuk module tertentu otomatis kosong/tidak ada checkbox), tiap sel berupa checkbox.
- **Guard hapus role — [Selesai]**: tidak bisa hapus role yang masih dipakai user manapun. Modal konfirmasi hapus menampilkan pesan berisi jumlah & nama user yang memakai role tersebut, tombol Delete disembunyikan (hanya "Close") sampai user-user itu dipindahkan ke role lain.

---

## Penerapan permission di UI

### Sidebar (`Sidebar.tsx`) — [Selesai]
`menuItems` sekarang punya field `modules: string[]` (module key yang relevan untuk menu itu — Inventory memetakan ke keempat sub-modulenya sekaligus, Settings ke `settings` & `roles`), difilter dengan `hasModuleAccess(currentUser, module)` — menu Sidebar hanya muncul kalau `currentUser` punya akses (aksi apapun) ke minimal salah satu module terkait. Sudah diverifikasi: user dengan role Warehouse Staff cuma melihat Dashboard & Inventory di sidebar, sisanya (Users/Tickets/Settings) otomatis tersembunyi.

Sekalian diperbaiki bug kecil: highlight menu aktif sebelumnya exact-match path (`location.pathname === item.path`), jadi rusak begitu Settings jadi nested route (`/settings/roles`). Sekarang pakai prefix-match (`startsWith`) supaya tetap aktif di semua sub-halaman.

`InventoryLayout.tsx` sudah dibangun dengan tab filtering sejak awal (lihat `docs/inventory-module-plan.md`). `SettingsLayout.tsx` sendiri sudah tidak pakai tab lagi — navigasi Settings→Role sekarang lewat submenu Sidebar langsung (lihat catatan di bagian Sidebar di atas).

### Tombol aksi per halaman
Pola konsisten di semua modul (Users, dan nanti Inventory): tombol "Add"/"Edit"/"Delete"/"Approve" hanya dirender kalau `hasPermission(module, action)` bernilai true. Kalau user hanya punya `view`, halaman tetap bisa dibuka (lihat data) tapi tanpa tombol aksi apapun.

### Prasyarat: "current logged-in user" — [Selesai]

`src/data/session.ts` — `currentUser` di-hardcode ke `mockUsers[0]` (Admin) untuk sekarang. Nanti kalau ada backend/auth beneran, file ini yang diganti jadi ambil dari token/API, tanpa perlu ubah komponen yang sudah pakai `hasPermission`.

`src/utils/permissions.ts` — helper mengambil parameter `User` langsung (bukan `Role`) supaya lebih praktis dipakai di komponen (yang biasanya punya akses ke `currentUser`, bukan `Role` secara langsung):

```ts
export function getRoleForUser(user: User): Role | undefined {
  return mockRoles.find((role) => role.id === user.roleId)
}

export function hasPermission(user: User, module: string, action: PermissionAction): boolean {
  const role = getRoleForUser(user)
  return role?.permissions[module]?.includes(action) ?? false
}

export function hasModuleAccess(user: User, module: string): boolean {
  const role = getRoleForUser(user)
  return (role?.permissions[module]?.length ?? 0) > 0
}
```

`hasModuleAccess` khusus dipakai untuk filter Sidebar/tab (cek "ada akses apapun ke module ini?"), `hasPermission` untuk gating tombol aksi spesifik (create/edit/delete/approve/export).

**Loose end — [Selesai]:** `Header.tsx` sekarang menampilkan `currentUser.name` dan `getRoleForUser(currentUser)?.name`, tidak hardcode lagi.

---

## Keterkaitan dengan `docs/inventory-module-plan.md`

- `StockTransaction.picId` dan `approvedBy` (sudah direncanakan di dokumen Inventory) sekarang punya makna konkret: keduanya merujuk ke `User.id`, dan tombol "Approve" di Stock In/Out nanti muncul berdasarkan `hasPermission(currentUser, 'inventory.stockOut', 'approve')`.
- Roadmap Inventory poin #5 ("Role & Permission granular — belum diputuskan") **sekarang terjawab oleh dokumen ini**.

---

## Urutan implementasi yang disarankan

Karena Role & Permission ini jadi fondasi untuk fitur approval di Inventory, dan cukup besar sendiri, disarankan:

1. ~~`src/data/roles.ts` (fondasi data)~~ **[Selesai]**
2. ~~Halaman `RolesPage.tsx` (Role Management) sebagai sub-menu Settings~~ **[Selesai]**
3. ~~Migrasi `User.role` → `User.roleId` + update `UsersPage.tsx` + guard hapus role~~ **[Selesai]**
4. ~~`src/data/session.ts` + `src/utils/permissions.ts` (`currentUser` mock + helper `hasPermission`/`hasModuleAccess`)~~ **[Selesai]**
5. ~~Sidebar filtering berdasarkan permission~~ **[Selesai]**
6. ~~Implementasi Inventory Items dengan permission terpasang dari awal~~ **[Selesai]** — tombol aksi digating `hasPermission`, tab `InventoryLayout.tsx` digating `hasModuleAccess`. Stock In/Out/History menyusul dengan pola yang sama.

## Verifikasi

1. `npm run build` — pastikan TypeScript lolos tanpa error, terutama setelah migrasi `role` → `roleId` di seluruh referensi `User`.
2. Screenshot Sidebar dengan minimal 2 user berbeda role (misal Admin vs Warehouse Staff) — pastikan menu yang muncul benar-benar berbeda.
3. Cek tombol Add/Edit/Delete di UsersPage hilang/muncul sesuai permission role yang sedang "login" (`currentUser`).

# Rencana Role & Permission

## Context

Berdasarkan pengalaman di project sebelumnya, sistem Role di TaskFlow perlu bisa:
1. **Membedakan menu** — role tertentu hanya melihat menu yang relevan dengan pekerjaannya.
2. **Membedakan level akses per aksi** — bukan cuma view vs edit, tapi granular per-aksi (misal: bisa melihat transaksi tapi tidak bisa approve, bisa input tapi tidak bisa hapus).

Role juga harus **dinamis** — bisa dibuat/dikelola sendiri lewat halaman admin (bukan daftar role tetap yang di-hardcode di kode), mirip pengaturan role di aplikasi seperti Jira/Slack.

Ini fitur **lintas-modul** (bukan cuma punya Inventory) — memengaruhi `Sidebar`, `UsersPage`, dan nantinya semua modul termasuk Inventory. Karena itu didokumentasikan terpisah dari `docs/inventory-module-plan.md`, tapi keduanya saling terhubung (lihat bagian akhir dokumen ini).

Status: **[Selesai]** — seluruh dokumen ini sudah diimplementasikan (Role Management CRUD, migrasi `User.roleId`, `currentUser`/session, permission enforcement di Sidebar & tombol aksi tiap modul) dan sudah dipakai konsisten oleh modul-modul yang dibangun setelahnya (Suppliers, Warehouses, Tickets). Disinkronkan ulang 2026-09-21 — sebelumnya dokumen ini menyebut sebagian besar "masih rencana" padahal sudah lama selesai. Module key & contoh `mockRoles` di bawah juga sudah tertinggal dari data aktual di `data/roles.ts`, sudah diupdate.

---

## Data Model — `src/data/roles.ts` (baru)

```ts
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'

export interface Role {
  id: number
  name: string
  description?: string
  permissions: Record<string, PermissionAction[]>   // key = module key (lihat daftar di bawah), value = aksi yang diizinkan
  approvalLevel?: number   // [Selesai] untuk approval berjenjang Inventory — lihat docs/inventory-module-plan.md roadmap #2
}
```

Tidak semua aksi relevan untuk semua module — misal `approve` hanya bermakna untuk `inventory.stockOut`/`inventory.stockIn`, `export` untuk module yang punya laporan. UI Role Management nanti hanya menampilkan aksi yang relevan per module (lihat bagian "Halaman Role Management").

`approvalLevel` **[Selesai, termasuk UI-nya]** — ditambahkan belakangan, khusus dipakai fitur approval berjenjang di Inventory (`canApproveAtLevel()` di `utils/permissions.ts`). Admin=2, Warehouse Supervisor=1, Warehouse Staff=undefined (tidak bisa approve apapun). Form Add/Edit Role (`RolesPage.tsx`) punya `<Select>` "Approval Level" (None/Level 1/Level 2 — 0 disimpan sebagai `undefined`, bukan `0` literal, biar konsisten sama mock data), plus kolom badge "Approval Level" di tabel Roles. Field ini murni metadata role — baru actionable kalau role itu juga punya permission `approve` di module terkait (`canApproveAtLevel` selalu ngecek keduanya), jadi menaikkan approvalLevel role yang tidak punya `approve` sama sekali tidak berefek.

### Daftar Module Key [Selesai — sudah tumbuh jauh dari rencana awal]

Daftar aktual di `data/roles.ts` (`MODULES`), bertambah seiring modul baru dibangun:

| Module key | Menu / Halaman | Aksi tersedia |
|---|---|---|
| `dashboard` | Dashboard | view |
| `users` | Users | view, create, edit, delete |
| `roles` | Roles (sub-menu Settings) | view, create, edit, delete |
| `inventory.items` | Inventory → tab Items | view, create, edit, delete |
| `inventory.stockIn` | Inventory → tab Stock In | view, create, edit, approve |
| `inventory.stockOut` | Inventory → tab Stock Out | view, create, edit, approve |
| `inventory.history` | Inventory → tab History | view, export |
| `inventory.transfer` | Inventory → tab Transfer | view, create, approve |
| `inventory.opname` | Inventory → tab Stock Opname | view, create, edit, approve |
| `inventory.batches` | Inventory → tab Batches | view |
| `suppliers` | Suppliers (menu top-level sendiri) | view, create, edit, delete |
| `warehouses` | Warehouses | view, create, edit, delete |
| `companies` | Companies (menu top-level sendiri) | view, create, edit, delete |
| `tickets` | Tickets | view, create, edit, delete |
| `settings` | Settings | view, edit |
| `activityLog` | Activity Log | view |
| `reports` | Reports | view, export |

### Contoh mock role [ilustratif — lihat `data/roles.ts` untuk data lengkap & terkini]

Tiga role dasar sudah ada (`mockRoles`), masing-masing dengan permission penuh ke semua module di atas untuk Admin, dan subset untuk Warehouse Staff/Supervisor (termasuk `tickets`, `suppliers`, `warehouses` — bukan cuma Inventory seperti draft awal dokumen ini):

```ts
export const mockRoles: Role[] = [
  { id: 1, name: 'Admin', permissions: { /* semua module, semua aksi */ } },
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
      'inventory.transfer': ['view', 'create'],
      'inventory.opname': ['view', 'create'],
      'inventory.batches': ['view'],
      suppliers: ['view'],
      warehouses: ['view'],
      tickets: ['view', 'create'], // siapapun boleh lapor tiket & komentar
    },
  },
  {
    id: 3,
    name: 'Warehouse Supervisor',
    description: 'Approve transaksi, kelola master barang',
    permissions: {
      /* seperti Staff + approve + edit + reports.view/export */
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
  department: string    // ditambahkan belakangan untuk cost tracking, lihat docs/inventory-module-plan.md
  companyId: number      // wajib — lihat "Company" di bawah, sesuai flow.md poin 5
  roleId: number         // sebelumnya: role: string
  status: 'active' | 'inactive'
  createdAt: string
  warehouseId?: number   // opsional — lihat docs/inventory-module-plan.md roadmap #1
}
```

**Migrasi di `UsersPage.tsx` — [Selesai]:**
- Badge warna role sekarang digenerate otomatis dari palet tetap berdasarkan `roleId` (bukan mapping hardcode per nama role) — otomatis menyesuaikan berapa pun jumlah role yang dibuat lewat Role Management.
- `<Select>` daftar role di form Add/Edit dan filter, sekarang di-generate dari `mockRoles` (bukan hardcode `Admin`/`Manager`/`User` lagi).
- Kolom "Role" di tabel menampilkan `role.name` hasil lookup dari `roleId`.

### Company — `data/companies.tsx`, `pages/CompaniesPage.tsx` [Selesai]

Menjawab `flow.md` poin 5 ("setiap user wajib memiliki companynya masing-masing"). Percobaan pertama field ini (langsung nambah `companyId` ke `User` tanpa entity/form di baliknya) sempat di-revert karena bikin `UsersPage.tsx` gagal type-check — kali ini dibangun lengkap:

- **`Company { id, name, type: 'internal' | 'supplier', address, phone, email, status }`** — entity master data baru, terpisah dari `Supplier`/`Warehouse` yang sudah ada (bukan reuse) sesuai keputusan scope. `type` cuma pembeda tampilan (badge) — organisasi sendiri (`internal`) vs perusahaan vendor eksternal (`supplier`), tidak ada logika lain yang bergantung padanya.
- **Halaman `CompaniesPage.tsx`** — menu top-level sendiri (sejajar Suppliers/Warehouses), pola CRUD identik `SuppliersPage.tsx`: Table + Modal Add/Edit + Modal delete dengan guard "masih dipakai" (cek `mockUsers.some(u => u.companyId === id)`).
- **`User.companyId: number`** — **wajib**, bukan optional (sesuai kata "wajib" di flow.md). Form Add/Edit User dapat `<Select>` Company baru (required), default ke company pertama. Kelima mock user di-assign ke company internal (id 1) supaya tidak ada data yang invalid.
- **Scope yang sengaja tidak dikerjakan** (sesuai keputusan): `companyId` cuma field pencatatan, **tidak** membatasi akses data — beda dari `warehouseId` yang membatasi pilihan warehouse di form transaksi. Kalau nanti dibutuhkan multi-tenant sungguhan (user company A tidak bisa lihat data company B), itu perubahan permission model yang jauh lebih besar, di luar scope ini.

---

## Halaman baru: Role Management

**[Diimplementasikan]** Ditempatkan sebagai **sub-menu di dalam "Settings"**, bukan menu top-level sidebar terpisah seperti draft awal. Struktur:

```
src/pages/settings/
├── SettingsLayout.tsx              # PageToolbar + tab nav + <Outlet/> (pola sama seperti InventoryLayout.tsx)
├── RolesPage.tsx                    # Role Management
├── ItemsPage.tsx                    # master data Item (lihat docs/inventory-module-plan.md)
├── GeneralSettingsPage.tsx          # profil company
├── MyProfilePage.tsx                # profil currentUser
└── NotificationsSettingsPage.tsx    # toggle preferensi notification bell
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
- **Modal Add/Edit Role** (`size="lg"` karena matriks permission butuh ruang lebar): Input Name/Description, `<Select>` Approval Level (None/Level 1/Level 2, lihat bagian `approvalLevel` di atas), lalu **matriks permission** — tabel dengan baris = module, kolom = aksi (`view`/`create`/`edit`/`delete`/`approve`/`export` — kolom yang tidak relevan untuk module tertentu otomatis kosong/tidak ada checkbox), tiap sel berupa checkbox.
- **Guard hapus role — [Selesai]**: tidak bisa hapus role yang masih dipakai user manapun. Modal konfirmasi hapus menampilkan pesan berisi jumlah & nama user yang memakai role tersebut, tombol Delete disembunyikan (hanya "Close") sampai user-user itu dipindahkan ke role lain.

---

## Penerapan permission di UI

### Sidebar (`Sidebar.tsx`) — [Selesai]
`menuItems` sekarang punya field `modules: string[]` (module key yang relevan untuk menu itu — Inventory memetakan ke seluruh sub-modulenya sekaligus, Settings ke `settings` & `roles`), difilter dengan `hasModuleAccess(currentUser, module)` — menu Sidebar hanya muncul kalau `currentUser` punya akses (aksi apapun) ke minimal salah satu module terkait. Sudah diverifikasi berulang kali termasuk untuk modul Tickets: user dengan role Warehouse Staff (`view`+`create` saja) tidak melihat tombol Edit/Delete dan tidak melihat menu yang dia tidak punya akses sama sekali.

Sekalian diperbaiki bug kecil: highlight menu aktif sebelumnya exact-match path (`location.pathname === item.path`), jadi rusak begitu Settings jadi nested route (`/settings/roles`). Sekarang pakai prefix-match (`startsWith`) supaya tetap aktif di semua sub-halaman.

`InventoryLayout.tsx` sudah dibangun dengan tab filtering sejak awal (lihat `docs/inventory-module-plan.md`). `SettingsLayout.tsx` sendiri sudah tidak pakai tab lagi — navigasi Settings→Role sekarang lewat submenu Sidebar langsung (lihat catatan di bagian Sidebar di atas).

### Tombol aksi per halaman
Pola konsisten di semua modul: tombol "Add"/"Edit"/"Delete"/"Approve" hanya dirender kalau `hasPermission(module, action)` bernilai true. Kalau user hanya punya `view`, halaman tetap bisa dibuka (lihat data) tapi tanpa tombol aksi apapun.

### Prasyarat: "current logged-in user" — [Selesai]

`src/data/session.tsx` — `currentUser` default ke `mockUsers[0]` sampai `login()` dipanggil (lihat Authentication di bawah), plus `switchUser(userId)` untuk testing pasca-login (dipakai dropdown "Switch User (testing)" di Header — cuma ganti `currentUser`, tidak memengaruhi `isAuthenticated`). Nanti kalau ada backend/auth beneran, file ini yang diganti jadi ambil dari token/API, tanpa perlu ubah komponen yang sudah pakai `hasPermission`.

**Authentication — [Selesai, versi mock]**: `LoginPage.tsx` mencocokkan email ke `mockUsers` lewat `login(email)` di `SessionProvider` (password tidak diverifikasi terhadap apapun — tidak ada credential store nyata, cuma validasi format ≥6 karakter). Login gagal dengan pesan spesifik: email tidak terdaftar, atau akun `status !== 'active'` ("Akun ini nonaktif, hubungi admin"). `isAuthenticated` di session menggerbangi seluruh app lewat `RequireAuth` (`components/common/RequireAuth.tsx`, membungkus `MainLayout` di `AppRouter.tsx`) — akses URL manapun tanpa login redirect ke `/login`; sebaliknya `/login` saat sudah `isAuthenticated` redirect ke `/dashboard`. Tombol "Logout" di Sidebar (sebelumnya tidak punya `onClick` sama sekali) sekarang memanggil `logout()` + redirect ke `/login`. Karena state cuma in-memory (tidak ada backend/localStorage, sama seperti seluruh app), full page reload = otomatis ter-logout — bukan bug, konsisten dengan cara kerja mock data di modul lain.

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

## Keterkaitan dengan modul-modul lain

- `StockTransaction.picId` dan `approvedBy` merujuk ke `User.id`; tombol "Approve" di Stock In/Out/Transfer/Opname muncul berdasarkan `hasPermission(currentUser, module, 'approve')`. Lihat `docs/inventory-module-plan.md`.
- Modul-modul yang dibangun setelah dokumen ini (Suppliers, Warehouses, dan terutama Tickets — lihat `docs/ticket-module-plan.md`) mengikuti pola yang sama persis: tambah module key baru di `MODULES`/`mockRoles`, gating tombol via `hasPermission`, gating menu/tab via `hasModuleAccess`. Tickets bahkan menambah satu pola baru di atasnya: assignee tiket boleh ubah status tiketnya sendiri walau tidak punya permission `edit` generik (exception khusus, dicek terpisah dari `hasPermission`).

---

## Urutan implementasi

1. ~~`src/data/roles.ts` (fondasi data)~~ **[Selesai]**
2. ~~Halaman `RolesPage.tsx` (Role Management) sebagai sub-menu Settings~~ **[Selesai]**
3. ~~Migrasi `User.role` → `User.roleId` + update `UsersPage.tsx` + guard hapus role~~ **[Selesai]**
4. ~~`src/data/session.tsx` + `src/utils/permissions.ts` (`currentUser` mock + helper `hasPermission`/`hasModuleAccess`)~~ **[Selesai]**
5. ~~Sidebar filtering berdasarkan permission~~ **[Selesai]**
6. ~~Enforcement permission di semua modul (Inventory, Suppliers, Warehouses, Tickets)~~ **[Selesai]** — tombol aksi digating `hasPermission`, tab/menu digating `hasModuleAccess`, pola konsisten di seluruh app.

## Verifikasi

1. `npm run build` — pastikan TypeScript lolos tanpa error, terutama setelah migrasi `role` → `roleId` di seluruh referensi `User`.
2. Screenshot Sidebar dengan minimal 2 user berbeda role (misal Admin vs Warehouse Staff) — pastikan menu yang muncul benar-benar berbeda.
3. Cek tombol Add/Edit/Delete di UsersPage hilang/muncul sesuai permission role yang sedang "login" (`currentUser`).

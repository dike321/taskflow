GLOBAL INFOMRATION: proyek ini di peruntukkan untuk administrasi keluar masuknya barang

Story 1: WAREHOUSE

Status per poin (dicek ulang 2026-09-21, lihat `docs/role-permission-plan.md` & `docs/inventory-module-plan.md` untuk detail):

1. masing masing warehouse memiliki user yang di daftarkan oleh admin dari proyek ini — **[Selesai]**, lewat `User.warehouseId` (opsional, cuma dipakai Warehouse Staff) yang membatasi pilihan warehouse di form transaksi.
2. dalam proyek ini ada warehouse (gudang) dan supplier (distributor) — **[Selesai]**, `Warehouses` & `Suppliers` masing-masing menu top-level sendiri.
3. setiap warehouse memiliki user nya masing masing yang mana bisa memanagement barang yang diterima, begitu juga supplier — **[Selesai]**. Warehouse-side sudah (poin 1). Supplier-side: role baru **Supplier** + halaman **Supplier Portal** (`pages/SupplierPortalPage.tsx`) — user dari company bertipe supplier bisa login dan lihat profil company-nya sendiri + riwayat Stock In yang dikirim company-nya (di-scope lewat `Company.supplierId` yang menghubungkan ke `data/suppliers.tsx`), tanpa bisa lihat data supplier lain. "Kelola" di sini masih read-only (lihat status pengiriman), belum ada aksi tulis (mis. konfirmasi PO) dari sisi supplier — lihat `docs/role-permission-plan.md` untuk detail & scope yang sengaja belum dikerjakan.
4. masing masing user memiliki wewenang yang berbeda, yaitu ada manager, supervisor dan staff — **[Selesai, dengan penyesuaian nama]**. Role yang ada: Admin, Warehouse Supervisor, Warehouse Staff (bukan literal "Manager" — Admin berperan sebagai level tertinggi). Granular per-module/per-aksi, lihat `docs/role-permission-plan.md`.
5. setiap user wajib memiliki companynya masing masing, contoh user warehouse dari company mana, begitu juga user supplier dari company mana — **[Selesai]**. `Company` entity baru (`data/companies.tsx`, halaman `CompaniesPage.tsx`) + `User.companyId` wajib. Detail lengkap di `docs/role-permission-plan.md`.
6. (belum diisi)

GLOBAL INFOMRATION: proyek ini di peruntukkan untuk administrasi keluar masuknya barang

Story 1: WAREHOUSE

Status per poin (dicek ulang 2026-09-21, lihat `docs/role-permission-plan.md` & `docs/inventory-module-plan.md` untuk detail):

1. masing masing warehouse memiliki user yang di daftarkan oleh admin dari proyek ini — **[Selesai]**, lewat `User.warehouseId` (opsional, cuma dipakai Warehouse Staff) yang membatasi pilihan warehouse di form transaksi.
2. dalam proyek ini ada warehouse (gudang) dan supplier (distributor) — **[Selesai]**, `Warehouses` & `Suppliers` masing-masing menu top-level sendiri.
3. setiap warehouse memiliki user nya masing masing yang mana bisa memanagement barang yang diterima, begitu juga supplier — **[Sebagian]**. Warehouse-side sudah (poin 1). Supplier-side **belum** — `Supplier` di `data/suppliers.tsx` masih murni master data vendor (nama, kontak, dst), belum ada konsep "supplier user" yang login dan kelola barangnya sendiri.
4. masing masing user memiliki wewenang yang berbeda, yaitu ada manager, supervisor dan staff — **[Selesai, dengan penyesuaian nama]**. Role yang ada: Admin, Warehouse Supervisor, Warehouse Staff (bukan literal "Manager" — Admin berperan sebagai level tertinggi). Granular per-module/per-aksi, lihat `docs/role-permission-plan.md`.
5. setiap user wajib memiliki companynya masing masing, contoh user warehouse dari company mana, begitu juga user supplier dari company mana — **[Selesai]**. `Company` entity baru (`data/companies.tsx`, halaman `CompaniesPage.tsx`) + `User.companyId` wajib. Detail lengkap di `docs/role-permission-plan.md`.
6. (belum diisi)

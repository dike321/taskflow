import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../../pages/LoginPage'
import MainLayout from '../../layouts/MainLayout'
import RequireAuth from '../../components/common/RequireAuth'
import { SessionProvider } from '../../data/session'
import { ActivityLogProvider } from '../../data/activityLog'
import { InventoryDataProvider } from '../../data/inventory'
import { SuppliersProvider } from '../../data/suppliers'
import { WarehousesProvider } from '../../data/warehouses'
import { CompaniesProvider } from '../../data/companies'
import { TicketsProvider } from '../../data/tickets'
import { ApprovalSettingsProvider, NotificationPreferencesProvider } from '../../data/settings'
import DashboardPage from '../../pages/DashboardPage'
import UsersPage from '../../pages/UsersPage'
import InventoryLayout from '../../pages/inventory/InventoryLayout'
import StockInPage from '../../pages/inventory/StockInPage'
import StockOutPage from '../../pages/inventory/StockOutPage'
import StockTransferPage from '../../pages/inventory/StockTransferPage'
import StockOpnamePage from '../../pages/inventory/StockOpnamePage'
import BatchesPage from '../../pages/inventory/BatchesPage'
import StockHistoryPage from '../../pages/inventory/StockHistoryPage'
import SuppliersPage from '../../pages/SuppliersPage'
import WarehousesPage from '../../pages/WarehousesPage'
import CompaniesPage from '../../pages/CompaniesPage'
import SupplierPortalPage from '../../pages/SupplierPortalPage'
import ApprovalsPage from '../../pages/ApprovalsPage'
import TicketsPage from '../../pages/TicketsPage'
import ActivityLogPage from '../../pages/ActivityLogPage'
import ReportsPage from '../../pages/ReportsPage'
import SettingsLayout from '../../pages/settings/SettingsLayout'
import RolesPage from '../../pages/settings/RolesPage'
import ItemsPage from '../../pages/settings/ItemsPage'
import GeneralSettingsPage from '../../pages/settings/GeneralSettingsPage'
import NotificationsSettingsPage from '../../pages/settings/NotificationsSettingsPage'
import MyProfilePage from '../../pages/settings/MyProfilePage'
import NotFoundPage from '../../pages/NotFoundPage'

function AppRouter() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ActivityLogProvider>
                <InventoryDataProvider>
                  <CompaniesProvider>
                    <SuppliersProvider>
                      <WarehousesProvider>
                        <TicketsProvider>
                          <ApprovalSettingsProvider>
                            <NotificationPreferencesProvider>
                              <RequireAuth>
                                <MainLayout />
                              </RequireAuth>
                            </NotificationPreferencesProvider>
                          </ApprovalSettingsProvider>
                        </TicketsProvider>
                      </WarehousesProvider>
                    </SuppliersProvider>
                  </CompaniesProvider>
                </InventoryDataProvider>
              </ActivityLogProvider>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="inventory" element={<InventoryLayout />}>
              <Route index element={<Navigate to="stock-in" replace />} />
              <Route path="stock-in" element={<StockInPage />} />
              <Route path="stock-out" element={<StockOutPage />} />
              <Route path="transfer" element={<StockTransferPage />} />
              <Route path="opname" element={<StockOpnamePage />} />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="history" element={<StockHistoryPage />} />
            </Route>
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="warehouses" element={<WarehousesPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="supplier-portal" element={<SupplierPortalPage />} />
            <Route path="activity-log" element={<ActivityLogPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="roles" replace />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="general" element={<GeneralSettingsPage />} />
              <Route path="notifications" element={<NotificationsSettingsPage />} />
              <Route path="profile" element={<MyProfilePage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}

export default AppRouter

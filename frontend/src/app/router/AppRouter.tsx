import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../../pages/LoginPage'
import MainLayout from '../../layouts/MainLayout'
import RequireAuth from '../../components/common/RequireAuth'
import RequireModule from '../../components/common/RequireModule'
import { SessionProvider } from '../../data/session'
import { hasPermission } from '../../utils/permissions'
import { ActivityLogProvider } from '../../data/activityLog'
import { InventoryDataProvider } from '../../data/inventory'
import { SuppliersProvider } from '../../data/suppliers'
import { WarehousesProvider } from '../../data/warehouses'
import { CompaniesProvider } from '../../data/companies'
import { RolesProvider } from '../../data/roles'
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
                  <RolesProvider>
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
                  </RolesProvider>
                </InventoryDataProvider>
              </ActivityLogProvider>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route
              path="users"
              element={
                <RequireModule module="users">
                  <UsersPage />
                </RequireModule>
              }
            />
            <Route path="inventory" element={<InventoryLayout />}>
              <Route index element={<Navigate to="stock-in" replace />} />
              <Route
                path="stock-in"
                element={
                  <RequireModule module="inventory.stockIn">
                    <StockInPage />
                  </RequireModule>
                }
              />
              <Route
                path="stock-out"
                element={
                  <RequireModule module="inventory.stockOut">
                    <StockOutPage />
                  </RequireModule>
                }
              />
              <Route
                path="transfer"
                element={
                  <RequireModule module="inventory.transfer">
                    <StockTransferPage />
                  </RequireModule>
                }
              />
              <Route
                path="opname"
                element={
                  <RequireModule module="inventory.opname">
                    <StockOpnamePage />
                  </RequireModule>
                }
              />
              <Route
                path="batches"
                element={
                  <RequireModule module="inventory.batches">
                    <BatchesPage />
                  </RequireModule>
                }
              />
              <Route
                path="history"
                element={
                  <RequireModule module="inventory.history">
                    <StockHistoryPage />
                  </RequireModule>
                }
              />
            </Route>
            <Route
              path="approvals"
              element={
                <RequireModule
                  check={(user) =>
                    hasPermission(user, 'inventory.stockIn', 'approve') ||
                    hasPermission(user, 'inventory.stockOut', 'approve')
                  }
                >
                  <ApprovalsPage />
                </RequireModule>
              }
            />
            <Route
              path="tickets"
              element={
                <RequireModule module="tickets">
                  <TicketsPage />
                </RequireModule>
              }
            />
            <Route
              path="suppliers"
              element={
                <RequireModule module="suppliers">
                  <SuppliersPage />
                </RequireModule>
              }
            />
            <Route
              path="warehouses"
              element={
                <RequireModule module="warehouses">
                  <WarehousesPage />
                </RequireModule>
              }
            />
            <Route
              path="companies"
              element={
                <RequireModule module="companies">
                  <CompaniesPage />
                </RequireModule>
              }
            />
            <Route
              path="supplier-portal"
              element={
                <RequireModule module="supplierPortal">
                  <SupplierPortalPage />
                </RequireModule>
              }
            />
            <Route
              path="activity-log"
              element={
                <RequireModule module="activityLog">
                  <ActivityLogPage />
                </RequireModule>
              }
            />
            <Route
              path="reports"
              element={
                <RequireModule module="reports">
                  <ReportsPage />
                </RequireModule>
              }
            />
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="roles" replace />} />
              <Route
                path="roles"
                element={
                  <RequireModule module="roles">
                    <RolesPage />
                  </RequireModule>
                }
              />
              <Route
                path="items"
                element={
                  <RequireModule module="inventory.items">
                    <ItemsPage />
                  </RequireModule>
                }
              />
              <Route
                path="general"
                element={
                  <RequireModule module="settings">
                    <GeneralSettingsPage />
                  </RequireModule>
                }
              />
              <Route
                path="notifications"
                element={
                  <RequireModule module="settings">
                    <NotificationsSettingsPage />
                  </RequireModule>
                }
              />
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

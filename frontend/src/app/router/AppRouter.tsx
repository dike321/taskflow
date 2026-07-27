import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../../pages/LoginPage'
import MainLayout from '../../layouts/MainLayout'
import DashboardPage from '../../pages/DashboardPage'
import UsersPage from '../../pages/UsersPage'
import InventoryLayout from '../../pages/inventory/InventoryLayout'
import ItemsPage from '../../pages/inventory/ItemsPage'
import StockInPage from '../../pages/inventory/StockInPage'
import StockOutPage from '../../pages/inventory/StockOutPage'
import TicketsPage from '../../pages/TicketsPage'
import SettingsLayout from '../../pages/settings/SettingsLayout'
import RolesPage from '../../pages/settings/RolesPage'
import NotFoundPage from '../../pages/NotFoundPage'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="inventory" element={<InventoryLayout />}>
            <Route index element={<Navigate to="items" replace />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="stock-in" element={<StockInPage />} />
            <Route path="stock-out" element={<StockOutPage />} />
          </Route>
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="roles" replace />} />
            <Route path="roles" element={<RolesPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter

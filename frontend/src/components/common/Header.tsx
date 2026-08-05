import type { ComponentType } from 'react'
import { useMemo } from 'react'
import { Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Dropdown from '../ui/Dropdown'
import { AlertTriangle, Bell, ClipboardCheck, Search, User, Users } from './Icons'
import { SIDEBAR_WIDTH } from './Sidebar'
import { useSession } from '../../data/session'
import { mockUsers } from '../../data/users'
import { getRoleForUser, hasModuleAccess, hasPermission } from '../../utils/permissions'
import { getStockQuantity, useInventoryData } from '../../data/inventory'
import type { StockTransactionType } from '../../data/inventory'
import { useWarehouses } from '../../data/warehouses'
import { useNotificationPreferences } from '../../data/settings'

interface NotificationItem {
  id: string
  icon: ComponentType<{ size?: number; className?: string }>
  variant: 'danger' | 'warning'
  title: string
  description: string
  to: string
}

const moduleKeyForType = (type: StockTransactionType) =>
  type === 'in' ? 'inventory.stockIn' : type === 'out' ? 'inventory.stockOut' : 'inventory.transfer'
const labelForType = (type: StockTransactionType) => (type === 'in' ? 'Stock In' : type === 'out' ? 'Stock Out' : 'Transfer')

export default function Header() {
  const { currentUser, switchUser } = useSession()
  const role = getRoleForUser(currentUser)
  const { items, transactions, warehouseStock, stockOpnames } = useInventoryData()
  const { warehouses } = useWarehouses()
  const { preferences } = useNotificationPreferences()

  const getWarehouseName = (warehouseId?: number) =>
    warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? '-'

  const notifications = useMemo<NotificationItem[]>(() => {
    const lowStock: NotificationItem[] =
      preferences.lowStockAlert && hasModuleAccess(currentUser, 'inventory.items')
        ? items
            .filter((item) => getStockQuantity(warehouseStock, item.id) <= item.minStock)
            .map((item) => ({
              id: `low-stock-${item.id}`,
              icon: AlertTriangle,
              variant: 'danger',
              title: `Low stock: ${item.name}`,
              description: `${getStockQuantity(warehouseStock, item.id)} ${item.unit} left (min ${item.minStock})`,
              to: '/settings/items',
            }))
        : []

    const pendingApprovals: NotificationItem[] = preferences.approvalPendingAlert
      ? transactions
          .filter((t) => t.status === 'pending' && hasPermission(currentUser, moduleKeyForType(t.type), 'approve'))
          .map((t) => {
            const item = items.find((i) => i.id === t.itemId)
            const warehouseLabel =
              t.type === 'transfer'
                ? `${getWarehouseName(t.fromWarehouseId)} → ${getWarehouseName(t.toWarehouseId)}`
                : getWarehouseName(t.warehouseId)
            return {
              id: `pending-${t.id}`,
              icon: ClipboardCheck,
              variant: 'warning' as const,
              title: `${labelForType(t.type)} pending: ${item?.name ?? 'Unknown'}`,
              description: `${t.quantity} ${item?.unit ?? ''} · ${warehouseLabel}`,
              to: '/approvals',
            }
          })
      : []

    const pendingOpnames: NotificationItem[] = preferences.approvalPendingAlert
      ? stockOpnames
          .filter((o) => o.status === 'pending' && hasPermission(currentUser, 'inventory.opname', 'approve'))
          .map((o) => {
            const item = items.find((i) => i.id === o.itemId)
            return {
              id: `pending-opname-${o.id}`,
              icon: ClipboardCheck,
              variant: 'warning' as const,
              title: `Stock Opname pending: ${item?.name ?? 'Unknown'}`,
              description: `${o.difference > 0 ? '+' : ''}${o.difference} ${item?.unit ?? ''} · ${getWarehouseName(o.warehouseId)}`,
              to: '/approvals',
            }
          })
      : []

    return [...pendingApprovals, ...pendingOpnames, ...lowStock]
  }, [items, transactions, stockOpnames, warehouseStock, warehouses, preferences, currentUser])

  return (
    <header
      className="d-flex align-items-center bg-white border-bottom position-fixed top-0 end-0"
      style={{ height: 64, left: SIDEBAR_WIDTH, zIndex: 10 }}
    >
      <div className="d-flex align-items-center justify-content-between w-100 px-4">
        <div className="position-relative" style={{ maxWidth: 320, width: '100%' }}>
          <span
            className="position-absolute text-muted"
            style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }}
          >
            <Search size={18} />
          </span>
          <Form.Control type="text" placeholder="Search..." style={{ paddingLeft: 36 }} />
        </div>

        <div className="d-flex align-items-center gap-3">
          <Dropdown align="end">
            <Dropdown.Toggle
              as="button"
              id="notifications-menu"
              bsPrefix="notifications-toggle"
              className="btn btn-light position-relative rounded-3 p-2 border-0"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span
                  className="position-absolute bg-danger rounded-circle"
                  style={{ width: 8, height: 8, top: 8, right: 8 }}
                />
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ width: 340, maxHeight: 400, overflowY: 'auto', overflowX: 'hidden' }}>
              <Dropdown.Header>Notifications{notifications.length > 0 ? ` (${notifications.length})` : ''}</Dropdown.Header>
              {notifications.length === 0 ? (
                <p className="text-muted small mb-0 px-3 py-3 text-center">No new notifications</p>
              ) : (
                notifications.map((notification) => {
                  const Icon = notification.icon
                  return (
                    <Dropdown.Item
                      key={notification.id}
                      as={Link}
                      to={notification.to}
                      className="d-flex align-items-start gap-2 py-2"
                      style={{ whiteSpace: 'normal' }}
                    >
                      <span className={`text-${notification.variant} mt-1 flex-shrink-0`}>
                        <Icon size={16} />
                      </span>
                      <span>
                        <span className="d-block small fw-medium">{notification.title}</span>
                        <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>
                          {notification.description}
                        </span>
                      </span>
                    </Dropdown.Item>
                  )
                })
              )}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown align="end">
            <Dropdown.Toggle
              as="button"
              id="switch-user-menu"
              bsPrefix="switch-user-toggle"
              className="btn btn-light position-relative rounded-3 p-2 border-0"
              title="Switch user (testing)"
            >
              <Users size={20} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Header>Switch User (testing)</Dropdown.Header>
              {mockUsers.map((user) => (
                <Dropdown.Item
                  key={user.id}
                  active={user.id === currentUser.id}
                  onClick={() => switchUser(user.id)}
                >
                  <div className="d-flex flex-column">
                    <span>{user.name}</span>
                    <span className="text-muted small">{getRoleForUser(user)?.name ?? 'Unknown Role'}</span>
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown align="end">
            <Dropdown.Toggle
              as="div"
              id="account-menu"
              bsPrefix="account-menu-toggle"
              className="d-flex align-items-center gap-2 border-start ps-3"
              style={{ cursor: 'pointer' }}
            >
              <div className="text-end">
                <p className="mb-0 small fw-medium">{currentUser.name}</p>
                <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                  {role?.name ?? 'Unknown Role'}
                </p>
              </div>
              <div
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                style={{ width: 40, height: 40 }}
              >
                <User size={20} />
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item as={Link} to="/settings/profile">
                My Profile
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/settings/general">
                General
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/settings/notifications">
                Notifications
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </header>
  )
}

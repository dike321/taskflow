import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Nav } from 'react-bootstrap'
import { LayoutDashboard, Users, Package, Truck, Warehouse, ClipboardCheck, History, TrendingUp, Settings, ChevronDown, LogOut } from './Icons'
import { useSession } from '../../data/session'
import { hasModuleAccess, hasPermission } from '../../utils/permissions'

export const SIDEBAR_WIDTH = 256

interface MenuChild {
  path: string
  label: string
  module: string
}

interface MenuItem {
  path: string
  icon: typeof LayoutDashboard
  label: string
  modules: string[]
  children?: MenuChild[]
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', modules: ['dashboard'] },
  { path: '/users', icon: Users, label: 'Users', modules: ['users'] },
  {
    path: '/inventory',
    icon: Package,
    label: 'Inventory',
    modules: ['inventory.stockIn', 'inventory.stockOut', 'inventory.transfer', 'inventory.history'],
  },
  { path: '/approvals', icon: ClipboardCheck, label: 'Approvals', modules: ['approvals'] },
  { path: '/warehouses', icon: Warehouse, label: 'Warehouses', modules: ['warehouses'] },
  { path: '/suppliers', icon: Truck, label: 'Suppliers', modules: ['suppliers'] },
  { path: '/activity-log', icon: History, label: 'Activity Log', modules: ['activityLog'] },
  { path: '/reports', icon: TrendingUp, label: 'Reports', modules: ['reports'] },
  {
    path: '/settings',
    icon: Settings,
    label: 'Settings',
    modules: ['roles', 'inventory.items'],
    children: [
      { path: '/settings/roles', label: 'Roles', module: 'roles' },
      { path: '/settings/items', label: 'Items', module: 'inventory.items' },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const { currentUser } = useSession()

  const [expanded, setExpanded] = useState<string | null>(() => {
    const activeParent = menuItems.find((item) => item.children && location.pathname.startsWith(item.path))
    return activeParent?.path ?? null
  })

  const canApproveAny =
    hasPermission(currentUser, 'inventory.stockIn', 'approve') ||
    hasPermission(currentUser, 'inventory.stockOut', 'approve')

  const visibleMenuItems = menuItems
    .filter((item) =>
      item.modules.includes('approvals')
        ? canApproveAny
        : item.modules.some((module) => hasModuleAccess(currentUser, module)),
    )
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => hasModuleAccess(currentUser, child.module)),
    }))

  const toggleExpand = (path: string) => {
    setExpanded((prev) => (prev === path ? null : path))
  }

  return (
    <aside
      className="d-flex flex-column bg-dark position-fixed top-0 start-0 vh-100"
      style={{ width: SIDEBAR_WIDTH }}    >
      <div className="p-4">
        <h1 className="h4 fw-bold text-primary mb-0">TaskFlow</h1>
      </div>

      <Nav className="flex-column flex-grow-1 mt-2">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          const hasChildren = !!item.children && item.children.length > 0

          if (hasChildren) {
            const isExpanded = expanded === item.path

            return (
              <div key={item.path}>
                <button
                  type="button"
                  onClick={() => toggleExpand(item.path)}
                  className={`sidebar-link btn d-flex align-items-center gap-2 px-4 py-3 w-100 text-start bg-transparent border-0 rounded-0 ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <Icon size={20} />
                  <span className="flex-grow-1">{item.label}</span>
                  <span
                    className="d-inline-flex"
                    style={{
                      transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <ChevronDown size={16} />
                  </span>
                </button>
                {isExpanded && (
                  <div className="d-flex flex-column">
                    {item.children!.map((child) => {
                      const isChildActive =
                        location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)

                      return (
                        <Nav.Link
                          key={child.path}
                          as={Link}
                          to={child.path}
                          className={`sidebar-link py-2 ${isChildActive ? 'active' : ''}`}
                          style={{ paddingLeft: 56, paddingRight: 24 }}
                        >
                          {child.label}
                        </Nav.Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Nav.Link
              key={item.path}
              as={Link}
              to={item.path}
              className={`sidebar-link d-flex align-items-center gap-2 px-4 py-3 rounded-0 ${
                isActive ? 'active' : ''
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Nav.Link>
          )
        })}
      </Nav>

      <div className="p-4">
        <button
          type="button"
          className="sidebar-link btn d-flex align-items-center gap-2 text-decoration-none px-0 w-100 bg-transparent border-0"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

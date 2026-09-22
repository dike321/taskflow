import { Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import PageToolbar from '../components/common/PageToolbar'
import { Users, Ticket, ClipboardCheck, Package, ArrowLeftRight, TrendingUp, Truck } from '../components/common/Icons'
import { useSession } from '../data/session'
import { useUsers } from '../data/users'
import { useTickets } from '../data/tickets'
import { useInventoryData, getStockQuantity } from '../data/inventory'
import { useActivityLog } from '../data/activityLog'
import { hasModuleAccess, hasPermission } from '../utils/permissions'

function timeAgo(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(isoTimestamp).toLocaleDateString()
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useSession()
  const { users } = useUsers()
  const { tickets } = useTickets()
  const { items, warehouseStock, transactions, stockOpnames } = useInventoryData()
  const { entries } = useActivityLog()

  const canApproveAny =
    hasPermission(currentUser, 'inventory.stockIn', 'approve') || hasPermission(currentUser, 'inventory.stockOut', 'approve')

  const openTicketsCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length
  const pendingApprovalsCount =
    transactions.filter((t) => t.status === 'pending' || t.status === 'pending_level2').length +
    stockOpnames.filter((o) => o.status === 'pending' || o.status === 'pending_level2').length
  const lowStockCount = items.filter(
    (item) => getStockQuantity(warehouseStock, item.id, currentUser.warehouseId) <= item.minStock,
  ).length

  const stats = [
    {
      title: 'Total Users',
      value: String(users.length),
      subtitle: `${users.filter((u) => u.status === 'active').length} active`,
      icon: Users,
      variant: 'primary',
      show: hasModuleAccess(currentUser, 'users'),
    },
    {
      title: 'Open Tickets',
      value: String(openTicketsCount),
      subtitle: 'open or in progress',
      icon: Ticket,
      variant: openTicketsCount > 0 ? 'warning' : 'success',
      show: hasModuleAccess(currentUser, 'tickets'),
    },
    {
      title: 'Pending Approvals',
      value: String(pendingApprovalsCount),
      subtitle: 'waiting on you or your team',
      icon: ClipboardCheck,
      variant: pendingApprovalsCount > 0 ? 'warning' : 'success',
      show: canApproveAny,
    },
    {
      title: 'Low Stock Items',
      value: String(lowStockCount),
      subtitle: currentUser.warehouseId ? 'at your warehouse' : 'across all warehouses',
      icon: Package,
      variant: lowStockCount > 0 ? 'danger' : 'success',
      show: hasModuleAccess(currentUser, 'inventory.items'),
    },
  ].filter((stat) => stat.show)

  const quickActions = [
    {
      label: 'Add User',
      description: 'Create a new account',
      icon: Users,
      variant: 'primary',
      path: '/users',
      show: hasModuleAccess(currentUser, 'users'),
    },
    {
      label: 'Create Ticket',
      description: 'Log a support request',
      icon: Ticket,
      variant: 'warning',
      path: '/tickets',
      show: hasModuleAccess(currentUser, 'tickets'),
    },
    {
      label: 'Stock In',
      description: 'Record incoming stock',
      icon: ArrowLeftRight,
      variant: 'success',
      path: '/inventory/stock-in',
      show: hasModuleAccess(currentUser, 'inventory.stockIn'),
    },
    {
      label: 'View Reports',
      description: 'Mutation & ticket summaries',
      icon: TrendingUp,
      variant: 'info',
      path: '/reports',
      show: hasModuleAccess(currentUser, 'reports'),
    },
    {
      label: 'Supplier Portal',
      description: 'Your shipments & profile',
      icon: Truck,
      variant: 'primary',
      path: '/supplier-portal',
      show: hasModuleAccess(currentUser, 'supplierPortal'),
    },
  ].filter((action) => action.show)

  const canViewActivityLog = hasModuleAccess(currentUser, 'activityLog')
  const recentActivities = canViewActivityLog ? entries.slice(0, 5) : []

  return (
    <div>
      <PageToolbar title="Dashboard" description={`Welcome back, ${currentUser.name.split(' ')[0]}.`} />

      {stats.length > 0 && (
        <Row className="g-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Col key={stat.title} xs={12} sm={6} xl={3}>
                <Card className="h-100 shadow-sm">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <p className="text-muted small mb-1">{stat.title}</p>
                      <p className="fs-3 fw-bold mb-1">{stat.value}</p>
                      <p className="small mb-0 text-muted">{stat.subtitle}</p>
                    </div>
                    <div
                      className={`d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 bg-${stat.variant} ${
                        stat.variant === 'warning' ? 'text-dark' : 'text-white'
                      }`}
                      style={{ width: 48, height: 48 }}
                    >
                      <Icon size={22} />
                    </div>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}

      <Row className="g-4 mt-1">
        {canViewActivityLog && (
          <Col xs={12} lg={quickActions.length > 0 ? 6 : 12}>
            <Card title="Recent Activity" className="h-100">
              {recentActivities.length === 0 ? (
                <p className="text-muted small mb-0">No activity recorded yet.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="d-flex align-items-start gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary-emphasis fw-medium flex-shrink-0"
                        style={{ width: 32, height: 32, fontSize: '0.8rem' }}
                      >
                        {activity.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="mb-0 small">
                          <span className="fw-medium">{activity.userName}</span> {activity.description}
                        </p>
                        <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                          {timeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        )}

        <Col xs={12} lg={canViewActivityLog ? 6 : 12}>
          <Card title="Quick Actions" className="h-100">
            {quickActions.length === 0 ? (
              <p className="text-muted small mb-0">No quick actions available for your role.</p>
            ) : (
              <Row className="g-3">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Col xs={6} key={action.label}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary border w-100 h-100 text-start p-3"
                        onClick={() => navigate(action.path)}
                      >
                        <div
                          className={`d-flex align-items-center justify-content-center rounded-3 mb-3 bg-${action.variant}-subtle text-${action.variant}-emphasis`}
                          style={{ width: 40, height: 40 }}
                        >
                          <Icon size={18} />
                        </div>
                        <p className="fw-medium mb-1 text-dark">{action.label}</p>
                        <p className="text-muted small mb-0">{action.description}</p>
                      </button>
                    </Col>
                  )
                })}
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

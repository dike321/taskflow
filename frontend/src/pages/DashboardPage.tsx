import { Row, Col } from 'react-bootstrap'
import Card from '../components/ui/Card'
import PageToolbar from '../components/common/PageToolbar'
import { dashboardStats as stats, recentActivities, quickActions } from '../data/dashboard'

export default function DashboardPage() {
  return (
    <div>
      <PageToolbar title="Dashboard" description="Welcome back! Here's what's happening today." />

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
                    <p className={`small mb-0 ${stat.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                      {stat.change} from last month
                    </p>
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

      <Row className="g-4 mt-1">
        <Col xs={12} lg={6}>
          <Card title="Recent Activities" className="h-100">
            <div className="d-flex flex-column gap-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="d-flex align-items-start gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary-emphasis fw-medium flex-shrink-0"
                    style={{ width: 32, height: 32, fontSize: '0.8rem' }}
                  >
                    {activity.user.charAt(0)}
                  </div>
                  <div>
                    <p className="mb-0 small">
                      <span className="fw-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card title="Quick Actions" className="h-100">
            <Row className="g-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Col xs={6} key={action.label}>
                    <button type="button" className="btn btn-outline-secondary border w-100 h-100 text-start p-3">
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
          </Card>
        </Col>
      </Row>
    </div>
  )
}

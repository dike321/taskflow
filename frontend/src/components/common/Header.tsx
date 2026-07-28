import { Form } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Dropdown from '../ui/Dropdown'
import { Bell, Search, User, Users } from './Icons'
import { SIDEBAR_WIDTH } from './Sidebar'
import { useSession } from '../../data/session'
import { mockUsers } from '../../data/users'
import { getRoleForUser } from '../../utils/permissions'

export default function Header() {
  const { currentUser, switchUser } = useSession()
  const role = getRoleForUser(currentUser)

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
          <button type="button" className="btn btn-light position-relative rounded-3 p-2">
            <Bell size={20} />
            <span
              className="position-absolute bg-danger rounded-circle"
              style={{ width: 8, height: 8, top: 8, right: 8 }}
            />
          </button>

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

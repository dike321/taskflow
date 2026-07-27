import { Form } from 'react-bootstrap'
import { Bell, Search, User } from './Icons'
import { SIDEBAR_WIDTH } from './Sidebar'
import { currentUser } from '../../data/session'
import { getRoleForUser } from '../../utils/permissions'

export default function Header() {
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

          <div className="d-flex align-items-center gap-2 border-start ps-3">
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
          </div>
        </div>
      </div>
    </header>
  )
}

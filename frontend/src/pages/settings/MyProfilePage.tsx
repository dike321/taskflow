import { useState } from 'react'
import type { FormEvent } from 'react'
import { Row, Col } from 'react-bootstrap'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useSession } from '../../data/session'
import { useActivityLog } from '../../data/activityLog'
import { getRoleForUser } from '../../utils/permissions'

export default function MyProfilePage() {
  const { currentUser, updateCurrentUser } = useSession()
  const { logActivity } = useActivityLog()
  const role = getRoleForUser(currentUser)

  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
  })
  const [profileSaved, setProfileSaved] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault()
    updateCurrentUser(profileForm)
    logActivity({
      userId: currentUser.id,
      userName: profileForm.name,
      action: 'update',
      module: 'settings',
      description: 'Updated own profile (name/email/phone)',
    })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (passwordForm.next.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New password and confirmation do not match')
      return
    }

    setPasswordForm({ current: '', next: '', confirm: '' })
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      module: 'settings',
      description: 'Changed account password',
    })
    setPasswordSaved(true)
    setTimeout(() => setPasswordSaved(false), 2000)
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <div className="mb-3">
          <h2 className="h5 fw-bold mb-1">My Profile</h2>
          <p className="text-muted small mb-0">Update your personal information</p>
        </div>

        <Card>
          <form onSubmit={handleProfileSubmit} className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-2 mb-1">
              <Badge variant="secondary">{currentUser.department}</Badge>
              <Badge variant="primary">{role?.name ?? 'Unknown Role'}</Badge>
            </div>

            <Input
              label="Name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
            />
            <Row className="g-3">
              <Col xs={12} md={6}>
                <Input
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
              </Col>
              <Col xs={12} md={6}>
                <Input
                  label="Phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </Col>
            </Row>

            <div className="d-flex align-items-center gap-3 pt-2">
              <Button type="submit">Save Changes</Button>
              {profileSaved && <span className="text-success small">Saved</span>}
            </div>
          </form>
        </Card>
      </div>

      <div>
        <div className="mb-3">
          <h2 className="h5 fw-bold mb-1">Change Password</h2>
          <p className="text-muted small mb-0">Choose a new password for your account</p>
        </div>

        <Card>
          <form onSubmit={handlePasswordSubmit} className="d-flex flex-column gap-3">
            <Input
              label="Current Password"
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              required
            />
            <Row className="g-3">
              <Col xs={12} md={6}>
                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                  error={passwordError || undefined}
                  required
                />
              </Col>
              <Col xs={12} md={6}>
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  required
                />
              </Col>
            </Row>

            <div className="d-flex align-items-center gap-3 pt-2">
              <Button type="submit" variant="secondary">
                Update Password
              </Button>
              {passwordSaved && <span className="text-success small">Password updated</span>}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Row, Col } from 'react-bootstrap'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { mockCompanyProfile } from '../../data/settings'
import type { CompanyProfile } from '../../data/settings'
import { useSession } from '../../data/session'
import { useActivityLog } from '../../data/activityLog'
import { hasPermission } from '../../utils/permissions'

export default function GeneralSettingsPage() {
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()
  const canEdit = hasPermission(currentUser, 'settings', 'edit')

  const [formData, setFormData] = useState<CompanyProfile>(mockCompanyProfile)
  const [savedMessage, setSavedMessage] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      module: 'settings',
      description: `Updated company profile (${formData.name})`,
    })
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 2000)
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="h5 fw-bold mb-1">General</h2>
        <p className="text-muted small mb-0">Company profile shown across the app and on reports</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Company Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!canEdit}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            disabled={!canEdit}
          />
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!canEdit}
              />
            </Col>
            <Col xs={12} md={6}>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!canEdit}
              />
            </Col>
          </Row>

          {canEdit && (
            <div className="d-flex align-items-center gap-3 pt-2">
              <Button type="submit">Save Changes</Button>
              {savedMessage && <span className="text-success small">Saved</span>}
            </div>
          )}
        </form>
      </Card>
    </div>
  )
}

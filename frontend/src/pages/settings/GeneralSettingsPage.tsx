import { useState } from 'react'
import type { FormEvent } from 'react'
import { Row, Col } from 'react-bootstrap'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { mockCompanyProfile, useApprovalSettings } from '../../data/settings'
import type { CompanyProfile } from '../../data/settings'
import { useSession } from '../../data/session'
import { useActivityLog } from '../../data/activityLog'
import { hasPermission } from '../../utils/permissions'
import { parseIntInput } from '../../utils/number'

export default function GeneralSettingsPage() {
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()
  const { approvalThreshold, setApprovalThreshold, escalationThreshold, setEscalationThreshold } =
    useApprovalSettings()
  const canEdit = hasPermission(currentUser, 'settings', 'edit')

  const [formData, setFormData] = useState<CompanyProfile>(mockCompanyProfile)
  const [savedMessage, setSavedMessage] = useState(false)

  const [thresholdInput, setThresholdInput] = useState(approvalThreshold)
  const [thresholdSaved, setThresholdSaved] = useState(false)

  const [escalationInput, setEscalationInput] = useState(escalationThreshold)
  const [escalationError, setEscalationError] = useState('')
  const [escalationSaved, setEscalationSaved] = useState(false)

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

  const handleThresholdSubmit = (e: FormEvent) => {
    e.preventDefault()
    setApprovalThreshold(thresholdInput)
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      module: 'settings',
      description: `Updated approval threshold to ${thresholdInput} units`,
    })
    setThresholdSaved(true)
    setTimeout(() => setThresholdSaved(false), 2000)
  }

  const handleEscalationSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (escalationInput <= approvalThreshold) {
      setEscalationError('Harus lebih besar dari Approval Threshold di atas')
      return
    }
    setEscalationError('')
    setEscalationThreshold(escalationInput)
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      module: 'settings',
      description: `Updated escalation threshold to ${escalationInput} units`,
    })
    setEscalationSaved(true)
    setTimeout(() => setEscalationSaved(false), 2000)
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

      <div className="mt-4 mb-3">
        <h2 className="h5 fw-bold mb-1">Approval Rules</h2>
        <p className="text-muted small mb-0">
          Stock In/Out transactions above this quantity always require approval, even from users who can normally
          auto-approve
        </p>
      </div>

      <Card>
        <form onSubmit={handleThresholdSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Approval Threshold (units)"
            type="text"
            inputMode="numeric"
            value={thresholdInput}
            onChange={(e) => setThresholdInput(parseIntInput(e.target.value))}
            disabled={!canEdit}
          />
          {canEdit && (
            <div className="d-flex align-items-center gap-3 pt-2">
              <Button type="submit">Save Changes</Button>
              {thresholdSaved && <span className="text-success small">Saved</span>}
            </div>
          )}
        </form>
      </Card>

      <div className="mt-4 mb-3">
        <h2 className="h5 fw-bold mb-1">Escalation (approval berjenjang)</h2>
        <p className="text-muted small mb-0">
          Di atas jumlah ini, transaksi butuh 2 level approval berurutan — role ber-approval-level 1 (mis.
          Warehouse Supervisor) dulu, baru role ber-approval-level 2 (mis. Admin) untuk sign-off final
        </p>
      </div>

      <Card>
        <form onSubmit={handleEscalationSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Escalation Threshold (units)"
            type="text"
            inputMode="numeric"
            value={escalationInput}
            onChange={(e) => {
              setEscalationInput(parseIntInput(e.target.value))
              if (escalationError) setEscalationError('')
            }}
            error={escalationError}
            disabled={!canEdit}
          />
          {canEdit && (
            <div className="d-flex align-items-center gap-3 pt-2">
              <Button type="submit">Save Changes</Button>
              {escalationSaved && <span className="text-success small">Saved</span>}
            </div>
          )}
        </form>
      </Card>
    </div>
  )
}

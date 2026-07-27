import { useState } from 'react'
import { Form } from 'react-bootstrap'
import Card from '../../components/ui/Card'
import { mockNotificationPreferences } from '../../data/settings'
import type { NotificationPreferences } from '../../data/settings'
import { useSession } from '../../data/session'
import { useActivityLog } from '../../data/activityLog'
import { hasPermission } from '../../utils/permissions'

const toggles: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  {
    key: 'lowStockAlert',
    label: 'Low stock alert',
    description: 'Notify when an item’s stock reaches its minimum threshold',
  },
  {
    key: 'approvalPendingAlert',
    label: 'Approval pending alert',
    description: 'Notify approvers when a Stock In/Out transaction needs approval',
  },
  {
    key: 'emailNotifications',
    label: 'Email notifications',
    description: 'Also send the above alerts by email, in addition to in-app notifications',
  },
]

export default function NotificationsSettingsPage() {
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()
  const canEdit = hasPermission(currentUser, 'settings', 'edit')

  const [preferences, setPreferences] = useState<NotificationPreferences>(mockNotificationPreferences)

  const togglePreference = (toggle: (typeof toggles)[number]) => {
    const nextValue = !preferences[toggle.key]
    setPreferences((prev) => ({ ...prev, [toggle.key]: nextValue }))
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      module: 'settings',
      description: `Turned ${nextValue ? 'on' : 'off'} notification preference: ${toggle.label}`,
    })
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="h5 fw-bold mb-1">Notifications</h2>
        <p className="text-muted small mb-0">Choose which events trigger a notification</p>
      </div>

      <Card>
        <div className="d-flex flex-column gap-4">
          {toggles.map((toggle) => (
            <div key={toggle.key} className="d-flex align-items-start justify-content-between gap-3">
              <div>
                <p className="mb-0 fw-medium">{toggle.label}</p>
                <p className="mb-0 text-muted small">{toggle.description}</p>
              </div>
              <Form.Check
                type="switch"
                checked={preferences[toggle.key]}
                onChange={() => togglePreference(toggle)}
                disabled={!canEdit}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

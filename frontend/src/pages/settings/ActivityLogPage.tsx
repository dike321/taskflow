import { useMemo, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { useActivityLog } from '../../data/activityLog'
import type { ActivityAction, ActivityLogEntry } from '../../data/activityLog'
import { mockUsers } from '../../data/users'
import { MODULES } from '../../data/roles'

const actionVariant: Record<ActivityAction, 'success' | 'primary' | 'danger' | 'warning'> = {
  create: 'success',
  update: 'primary',
  approve: 'success',
  reject: 'danger',
  delete: 'danger',
}

const getModuleLabel = (moduleKey: string) => MODULES.find((m) => m.key === moduleKey)?.label ?? moduleKey

const formatTimestamp = (iso: string) => {
  const date = new Date(iso)
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ActivityLogPage() {
  const { entries } = useActivityLog()

  const [userFilter, setUserFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        const entryDate = entry.timestamp.split('T')[0]
        const matchesUser = userFilter === 'all' || entry.userId === Number(userFilter)
        const matchesAction = actionFilter === 'all' || entry.action === actionFilter
        const matchesModule = moduleFilter === 'all' || entry.module === moduleFilter
        const matchesFrom = !dateFrom || entryDate >= dateFrom
        const matchesTo = !dateTo || entryDate <= dateTo
        return matchesUser && matchesAction && matchesModule && matchesFrom && matchesTo
      })
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
  }, [entries, userFilter, actionFilter, moduleFilter, dateFrom, dateTo])

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (entry: ActivityLogEntry) => formatTimestamp(entry.timestamp),
    },
    { key: 'user', header: 'User', render: (entry: ActivityLogEntry) => entry.userName },
    {
      key: 'action',
      header: 'Action',
      render: (entry: ActivityLogEntry) => (
        <Badge variant={actionVariant[entry.action]}>{entry.action.toUpperCase()}</Badge>
      ),
    },
    { key: 'module', header: 'Module', render: (entry: ActivityLogEntry) => getModuleLabel(entry.module) },
    { key: 'description', header: 'Description' },
  ]

  return (
    <div>
      <div className="mb-3">
        <h2 className="h5 fw-bold mb-1">Activity Log</h2>
        <p className="text-muted small mb-0">Append-only history of who changed what and when</p>
      </div>

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={2}>
            <Select label="User" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
              <option value="all">All Users</option>
              {mockUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Select label="Action" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </Select>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="Module" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="all">All Modules</option>
              {MODULES.map((module) => (
                <option key={module.key} value={module.key}>
                  {module.label}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Col>
        </Row>

        <Table columns={columns} data={filteredEntries} emptyMessage="No activity recorded yet" />
      </Card>
    </div>
  )
}

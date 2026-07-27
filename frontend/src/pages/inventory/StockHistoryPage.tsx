import { useMemo, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import { useOutletContext } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Download } from '../../components/common/Icons'
import type { StockTransaction } from '../../data/inventory'
import { mockUsers } from '../../data/users'
import { useSession } from '../../data/session'
import { hasPermission } from '../../utils/permissions'
import type { InventoryContext } from './InventoryLayout'

const typeVariant: Record<StockTransaction['type'], 'success' | 'danger'> = {
  in: 'success',
  out: 'danger',
}

const statusVariant: Record<StockTransaction['status'], 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
}

export default function StockHistoryPage() {
  const { items, transactions } = useOutletContext<InventoryContext>()
  const { currentUser } = useSession()

  const canExport = hasPermission(currentUser, 'inventory.history', 'export')

  const [itemFilter, setItemFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const getItemName = (itemId: number) => items.find((item) => item.id === itemId)?.name ?? 'Unknown'
  const getItemUnit = (itemId: number) => items.find((item) => item.id === itemId)?.unit ?? ''
  const getUserName = (userId?: number) => mockUsers.find((user) => user.id === userId)?.name ?? '-'

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesItem = itemFilter === 'all' || t.itemId === Number(itemFilter)
        const matchesType = typeFilter === 'all' || t.type === typeFilter
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter
        const matchesFrom = !dateFrom || t.date >= dateFrom
        const matchesTo = !dateTo || t.date <= dateTo
        return matchesItem && matchesType && matchesStatus && matchesFrom && matchesTo
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [transactions, itemFilter, typeFilter, statusFilter, dateFrom, dateTo])

  const handleExport = () => {
    const header = ['Date', 'Type', 'Item', 'Quantity', 'Unit', 'PIC', 'Reference', 'Status', 'Note']
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type.toUpperCase(),
      getItemName(t.itemId),
      t.quantity,
      getItemUnit(t.itemId),
      getUserName(t.picId),
      t.reference ?? '',
      t.status,
      t.note ?? '',
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stock-history-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { key: 'date', header: 'Date' },
    {
      key: 'type',
      header: 'Type',
      render: (t: StockTransaction) => <Badge variant={typeVariant[t.type]}>{t.type.toUpperCase()}</Badge>,
    },
    { key: 'item', header: 'Item', render: (t: StockTransaction) => getItemName(t.itemId) },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (t: StockTransaction) => `${t.quantity} ${getItemUnit(t.itemId)}`,
    },
    { key: 'pic', header: 'PIC', render: (t: StockTransaction) => getUserName(t.picId) },
    { key: 'reference', header: 'Reference', render: (t: StockTransaction) => t.reference ?? '-' },
    {
      key: 'status',
      header: 'Status',
      render: (t: StockTransaction) => <Badge variant={statusVariant[t.status]}>{t.status}</Badge>,
    },
  ]

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        {canExport && (
          <Button variant="secondary" onClick={handleExport}>
            <Download size={18} className="me-2" />
            Export CSV
          </Button>
        )}
      </div>

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={3}>
            <Select label="Item" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)}>
              <option value="all">All Items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </Select>
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Col>
        </Row>

        <Table columns={columns} data={filteredTransactions} emptyMessage="No stock movement history yet" />
      </Card>
    </div>
  )
}

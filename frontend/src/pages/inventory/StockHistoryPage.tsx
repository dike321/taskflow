import { useMemo, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import { useOutletContext } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Download, Paperclip } from '../../components/common/Icons'
import type { Attachment, StockTransaction, StockTransactionType } from '../../data/inventory'
import { DEPARTMENTS, mockUsers } from '../../data/users'
import { useSession } from '../../data/session'
import { useWarehouses } from '../../data/warehouses'
import { hasPermission } from '../../utils/permissions'
import type { InventoryContext } from './InventoryLayout'

type HistoryType = StockTransactionType | 'opname'

interface HistoryRow {
  id: string
  date: string
  type: HistoryType
  itemId: number
  quantityLabel: string
  warehouseLabel: string
  warehouseIds: number[]
  picId: number
  reference: string
  department?: string
  note?: string
  attachments?: Attachment[]
  status: StockTransaction['status']
}

const typeVariant: Record<HistoryType, 'success' | 'danger' | 'info' | 'warning'> = {
  in: 'success',
  out: 'danger',
  transfer: 'info',
  opname: 'warning',
}

const statusVariant: Record<StockTransaction['status'], 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
}

export default function StockHistoryPage() {
  const { items, transactions, stockOpnames } = useOutletContext<InventoryContext>()
  const { currentUser } = useSession()
  const { warehouses } = useWarehouses()

  const canExport = hasPermission(currentUser, 'inventory.history', 'export')

  const [itemFilter, setItemFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const getItemName = (itemId: number) => items.find((item) => item.id === itemId)?.name ?? 'Unknown'
  const getItemUnit = (itemId: number) => items.find((item) => item.id === itemId)?.unit ?? ''
  const getUserName = (userId?: number) => mockUsers.find((user) => user.id === userId)?.name ?? '-'
  const getWarehouseName = (warehouseId?: number) =>
    warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? '-'

  const rows = useMemo<HistoryRow[]>(() => {
    const transactionRows: HistoryRow[] = transactions.map((t) => ({
      id: `tx-${t.id}`,
      date: t.date,
      type: t.type,
      itemId: t.itemId,
      quantityLabel: `${t.quantity} ${getItemUnit(t.itemId)}`,
      warehouseLabel:
        t.type === 'transfer'
          ? `${getWarehouseName(t.fromWarehouseId)} → ${getWarehouseName(t.toWarehouseId)}`
          : getWarehouseName(t.warehouseId),
      warehouseIds: [t.warehouseId, t.fromWarehouseId, t.toWarehouseId].filter((id): id is number => !!id),
      picId: t.picId,
      reference: t.reference ?? '-',
      department: t.department,
      note: t.note,
      attachments: t.attachments,
      status: t.status,
    }))

    const opnameRows: HistoryRow[] = stockOpnames.map((o) => ({
      id: `opname-${o.id}`,
      date: o.date,
      type: 'opname',
      itemId: o.itemId,
      quantityLabel: `${o.difference > 0 ? '+' : ''}${o.difference} ${getItemUnit(o.itemId)}`,
      warehouseLabel: getWarehouseName(o.warehouseId),
      warehouseIds: [o.warehouseId],
      picId: o.picId,
      reference: `System ${o.systemQty} → Physical ${o.physicalQty}`,
      note: o.note,
      status: o.status,
    }))

    return [...transactionRows, ...opnameRows]
  }, [transactions, stockOpnames, items, warehouses])

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        const matchesItem = itemFilter === 'all' || row.itemId === Number(itemFilter)
        const matchesType = typeFilter === 'all' || row.type === typeFilter
        const matchesWh = warehouseFilter === 'all' || row.warehouseIds.includes(Number(warehouseFilter))
        const matchesStatus = statusFilter === 'all' || row.status === statusFilter
        const matchesDepartment = departmentFilter === 'all' || row.department === departmentFilter
        const matchesFrom = !dateFrom || row.date >= dateFrom
        const matchesTo = !dateTo || row.date <= dateTo
        return matchesItem && matchesType && matchesWh && matchesStatus && matchesDepartment && matchesFrom && matchesTo
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [rows, itemFilter, typeFilter, warehouseFilter, statusFilter, departmentFilter, dateFrom, dateTo])

  const handleExport = () => {
    const header = ['Date', 'Type', 'Item', 'Quantity', 'Warehouse', 'PIC', 'Department', 'Reference', 'Status', 'Note', 'Documents']
    const csvRows = filteredRows.map((row) => [
      row.date,
      row.type.toUpperCase(),
      getItemName(row.itemId),
      row.quantityLabel,
      row.warehouseLabel,
      getUserName(row.picId),
      row.department ?? '',
      row.reference,
      row.status,
      row.note ?? '',
      row.attachments?.map((a) => a.name).join('; ') ?? '',
    ])

    const csv = [header, ...csvRows]
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
      render: (row: HistoryRow) => <Badge variant={typeVariant[row.type]}>{row.type.toUpperCase()}</Badge>,
    },
    { key: 'item', header: 'Item', render: (row: HistoryRow) => getItemName(row.itemId) },
    { key: 'quantity', header: 'Quantity', render: (row: HistoryRow) => row.quantityLabel },
    { key: 'warehouse', header: 'Warehouse', render: (row: HistoryRow) => row.warehouseLabel },
    { key: 'pic', header: 'PIC', render: (row: HistoryRow) => getUserName(row.picId) },
    { key: 'department', header: 'Department', render: (row: HistoryRow) => row.department ?? '-' },
    { key: 'reference', header: 'Reference', render: (row: HistoryRow) => row.reference },
    {
      key: 'attachments',
      header: 'Documents',
      render: (row: HistoryRow) =>
        row.attachments && row.attachments.length > 0 ? (
          <div className="d-flex flex-column gap-1">
            {row.attachments.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="small d-flex align-items-center gap-1"
              >
                <Paperclip size={14} />
                {a.name}
              </a>
            ))}
          </div>
        ) : (
          <span className="text-muted small">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: HistoryRow) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
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
          <Col xs={12} md={6} lg={2}>
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
              <option value="transfer">Transfer</option>
              <option value="opname">Stock Opname</option>
            </Select>
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Select label="Warehouse" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
              <option value="all">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
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
            <Select label="Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
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

        <Table columns={columns} data={filteredRows} emptyMessage="No stock movement history yet" />
      </Card>
    </div>
  )
}

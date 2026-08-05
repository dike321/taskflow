import { useMemo, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import PageToolbar from '../components/common/PageToolbar'
import { Download, Printer } from '../components/common/Icons'
import { CATEGORIES, getStockQuantity, useInventoryData } from '../data/inventory'
import type { StockOpname, StockTransaction } from '../data/inventory'
import { useWarehouses } from '../data/warehouses'
import { useSession } from '../data/session'
import { hasPermission } from '../utils/permissions'

type GroupBy = 'category' | 'warehouse'

interface ReportRow {
  key: string
  label: string
  stockIn: number
  stockOut: number
  transferIn: number
  transferOut: number
  opnameAdjustment: number
  netChange: number
  currentStock: number
}

function aggregate(
  itemIds: number[],
  warehouseIds: number[],
  transactions: StockTransaction[],
  stockOpnames: StockOpname[],
  dateFrom: string,
  dateTo: string,
) {
  const withinDate = (date: string) => (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo)
  const itemIdSet = new Set(itemIds)
  const warehouseIdSet = new Set(warehouseIds)

  let stockIn = 0
  let stockOut = 0
  let transferIn = 0
  let transferOut = 0
  let opnameAdjustment = 0

  transactions.forEach((t) => {
    if (t.status !== 'approved' || !itemIdSet.has(t.itemId) || !withinDate(t.date)) return
    if (t.type === 'in' && t.warehouseId !== undefined && warehouseIdSet.has(t.warehouseId)) stockIn += t.quantity
    if (t.type === 'out' && t.warehouseId !== undefined && warehouseIdSet.has(t.warehouseId)) stockOut += t.quantity
    if (t.type === 'transfer') {
      if (t.toWarehouseId !== undefined && warehouseIdSet.has(t.toWarehouseId)) transferIn += t.quantity
      if (t.fromWarehouseId !== undefined && warehouseIdSet.has(t.fromWarehouseId)) transferOut += t.quantity
    }
  })

  stockOpnames.forEach((o) => {
    if (o.status !== 'approved' || !itemIdSet.has(o.itemId) || !withinDate(o.date)) return
    if (warehouseIdSet.has(o.warehouseId)) opnameAdjustment += o.difference
  })

  return {
    stockIn,
    stockOut,
    transferIn,
    transferOut,
    opnameAdjustment,
    netChange: stockIn - stockOut + transferIn - transferOut + opnameAdjustment,
  }
}

export default function ReportsPage() {
  const { items, transactions, stockOpnames, warehouseStock } = useInventoryData()
  const { warehouses } = useWarehouses()
  const { currentUser } = useSession()

  const canExport = hasPermission(currentUser, 'reports', 'export')

  const [groupBy, setGroupBy] = useState<GroupBy>('category')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const scopedItemIds = useMemo(
    () => items.filter((item) => categoryFilter === 'all' || item.category === categoryFilter).map((item) => item.id),
    [items, categoryFilter],
  )
  const scopedWarehouseIds = useMemo(
    () => (warehouseFilter === 'all' ? warehouses.map((w) => w.id) : [Number(warehouseFilter)]),
    [warehouses, warehouseFilter],
  )

  const totals = useMemo(
    () => aggregate(scopedItemIds, scopedWarehouseIds, transactions, stockOpnames, dateFrom, dateTo),
    [scopedItemIds, scopedWarehouseIds, transactions, stockOpnames, dateFrom, dateTo],
  )

  const currentStockTotal = useMemo(
    () =>
      scopedItemIds.reduce(
        (sum, itemId) =>
          sum + (warehouseFilter === 'all' ? getStockQuantity(warehouseStock, itemId) : getStockQuantity(warehouseStock, itemId, Number(warehouseFilter))),
        0,
      ),
    [scopedItemIds, warehouseFilter, warehouseStock],
  )

  const rows = useMemo<ReportRow[]>(() => {
    const groupKeys =
      groupBy === 'category'
        ? CATEGORIES.filter((c) => categoryFilter === 'all' || c === categoryFilter)
        : warehouses
            .filter((w) => warehouseFilter === 'all' || w.id === Number(warehouseFilter))
            .map((w) => String(w.id))

    return groupKeys.map((key) => {
      const groupItemIds =
        groupBy === 'category'
          ? items.filter((item) => item.category === key).map((item) => item.id)
          : scopedItemIds
      const groupWarehouseIds = groupBy === 'warehouse' ? [Number(key)] : scopedWarehouseIds

      const agg = aggregate(groupItemIds, groupWarehouseIds, transactions, stockOpnames, dateFrom, dateTo)
      const currentStock = groupItemIds.reduce(
        (sum, itemId) =>
          sum +
          (groupBy === 'warehouse'
            ? getStockQuantity(warehouseStock, itemId, Number(key))
            : warehouseFilter === 'all'
              ? getStockQuantity(warehouseStock, itemId)
              : getStockQuantity(warehouseStock, itemId, Number(warehouseFilter))),
        0,
      )

      return {
        key,
        label: groupBy === 'warehouse' ? (warehouses.find((w) => w.id === Number(key))?.name ?? key) : key,
        ...agg,
        currentStock,
      }
    })
  }, [groupBy, categoryFilter, warehouseFilter, items, warehouses, scopedItemIds, scopedWarehouseIds, transactions, stockOpnames, dateFrom, dateTo, warehouseStock])

  const handleExportCsv = () => {
    const header = [
      groupBy === 'category' ? 'Category' : 'Warehouse',
      'Stock In',
      'Stock Out',
      'Transfer In',
      'Transfer Out',
      'Opname Adjustment',
      'Net Change',
      'Current Stock',
    ]
    const csvRows = rows.map((row) => [
      row.label,
      row.stockIn,
      row.stockOut,
      row.transferIn,
      row.transferOut,
      row.opnameAdjustment,
      row.netChange,
      row.currentStock,
    ])

    const csv = [header, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mutation-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { key: 'label', header: groupBy === 'category' ? 'Category' : 'Warehouse' },
    { key: 'stockIn', header: 'Stock In', render: (row: ReportRow) => (row.stockIn > 0 ? `+${row.stockIn}` : '0') },
    { key: 'stockOut', header: 'Stock Out', render: (row: ReportRow) => (row.stockOut > 0 ? `-${row.stockOut}` : '0') },
    { key: 'transferIn', header: 'Transfer In', render: (row: ReportRow) => `+${row.transferIn}` },
    { key: 'transferOut', header: 'Transfer Out', render: (row: ReportRow) => `-${row.transferOut}` },
    {
      key: 'opnameAdjustment',
      header: 'Opname Adj.',
      render: (row: ReportRow) => `${row.opnameAdjustment > 0 ? '+' : ''}${row.opnameAdjustment}`,
    },
    {
      key: 'netChange',
      header: 'Net Change',
      render: (row: ReportRow) => (
        <span className={row.netChange > 0 ? 'text-success fw-medium' : row.netChange < 0 ? 'text-danger fw-medium' : ''}>
          {row.netChange > 0 ? '+' : ''}
          {row.netChange}
        </span>
      ),
    },
    { key: 'currentStock', header: 'Current Stock' },
  ]

  return (
    <div>
      <PageToolbar
        title="Reports"
        description="Mutation summary by category or warehouse, for the selected period"
        actions={
          canExport && (
            <div className="d-flex gap-2 no-print">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer size={18} className="me-2" />
                Print / Export PDF
              </Button>
              <Button variant="secondary" onClick={handleExportCsv}>
                <Download size={18} className="me-2" />
                Export CSV
              </Button>
            </div>
          )
        }
      />

      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="h-100">
            <p className="text-muted small mb-1">Total Stock In</p>
            <p className="fs-4 fw-bold text-success mb-0">+{totals.stockIn}</p>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="h-100">
            <p className="text-muted small mb-1">Total Stock Out</p>
            <p className="fs-4 fw-bold text-danger mb-0">-{totals.stockOut}</p>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="h-100">
            <p className="text-muted small mb-1">Net Change</p>
            <p className={`fs-4 fw-bold mb-0 ${totals.netChange >= 0 ? 'text-success' : 'text-danger'}`}>
              {totals.netChange > 0 ? '+' : ''}
              {totals.netChange}
            </p>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="h-100">
            <p className="text-muted small mb-1">Current Stock (scope)</p>
            <p className="fs-4 fw-bold mb-0">{currentStockTotal}</p>
          </Card>
        </Col>
      </Row>

      <Card>
        <Row className="g-3 mb-3 no-print">
          <Col xs={12} md={6} lg={2}>
            <Select label="Group By" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
              <option value="category">Category</option>
              <option value="warehouse">Warehouse</option>
            </Select>
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
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
          <Col xs={12} md={6} lg={3}>
            <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Col>
        </Row>

        <Table columns={columns} data={rows} emptyMessage="No data for the selected filters" />
      </Card>
    </div>
  )
}

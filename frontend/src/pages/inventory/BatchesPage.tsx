import { useMemo, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import { useOutletContext } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import { getBatchStatus, isBatchTracked } from '../../data/inventory'
import type { Batch, BatchStatus } from '../../data/inventory'
import { useWarehouses } from '../../data/warehouses'
import { useSession } from '../../data/session'
import type { InventoryContext } from './InventoryLayout'

const statusVariant: Record<BatchStatus, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  expiring: 'warning',
  expired: 'danger',
}

const statusLabel: Record<BatchStatus, string> = {
  ok: 'OK',
  expiring: 'Expiring Soon',
  expired: 'Expired',
}

export default function BatchesPage() {
  const { items, batches } = useOutletContext<InventoryContext>()
  const { warehouses } = useWarehouses()
  const { currentUser } = useSession()

  const trackedItems = useMemo(() => items.filter((item) => isBatchTracked(item)), [items])

  // User dengan warehouseId di-assign cuma boleh lihat batch warehouse-nya sendiri (lihat User.warehouseId).
  const warehouseOptions = currentUser.warehouseId
    ? warehouses.filter((w) => w.id === currentUser.warehouseId)
    : warehouses
  const scopedBatches = currentUser.warehouseId
    ? batches.filter((b) => b.warehouseId === currentUser.warehouseId)
    : batches

  const [itemFilter, setItemFilter] = useState('all')
  const [warehouseFilter, setWarehouseFilter] = useState(
    currentUser.warehouseId ? String(currentUser.warehouseId) : 'all',
  )
  const [statusFilter, setStatusFilter] = useState('all')

  const getItemName = (itemId: number) => items.find((item) => item.id === itemId)?.name ?? 'Unknown'
  const getItemUnit = (itemId: number) => items.find((item) => item.id === itemId)?.unit ?? ''
  const getWarehouseName = (warehouseId: number) => warehouses.find((w) => w.id === warehouseId)?.name ?? '-'

  const rows = useMemo<Batch[]>(() => {
    return scopedBatches
      .filter((b) => b.quantity > 0)
      .filter((b) => {
        const matchesItem = itemFilter === 'all' || b.itemId === Number(itemFilter)
        const matchesWarehouse = warehouseFilter === 'all' || b.warehouseId === Number(warehouseFilter)
        const matchesStatus = statusFilter === 'all' || getBatchStatus(b.expiryDate) === statusFilter
        return matchesItem && matchesWarehouse && matchesStatus
      })
      .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1))
  }, [scopedBatches, itemFilter, warehouseFilter, statusFilter])

  const summary = useMemo(() => {
    const active = scopedBatches.filter((b) => b.quantity > 0).map((b) => getBatchStatus(b.expiryDate))
    return {
      expired: active.filter((s) => s === 'expired').length,
      expiring: active.filter((s) => s === 'expiring').length,
      ok: active.filter((s) => s === 'ok').length,
    }
  }, [scopedBatches])

  const columns = [
    { key: 'item', header: 'Item', render: (row: Batch) => getItemName(row.itemId) },
    { key: 'warehouse', header: 'Warehouse', render: (row: Batch) => getWarehouseName(row.warehouseId) },
    { key: 'batchNumber', header: 'Batch/Lot Number' },
    { key: 'receivedDate', header: 'Received' },
    { key: 'expiryDate', header: 'Expiry Date' },
    {
      key: 'quantity',
      header: 'Qty Remaining',
      render: (row: Batch) => `${row.quantity} ${getItemUnit(row.itemId)}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Batch) => {
        const status = getBatchStatus(row.expiryDate)
        return <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
      },
    },
  ]

  return (
    <div>
      <div className="mb-3">
        <p className="text-muted small mb-0">
          Batch/lot tracking untuk barang consumable, diurutkan berdasarkan tanggal kadaluarsa (FEFO — First-Expired-First-Out).
        </p>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={4}>
          <Card className="h-100">
            <p className="text-muted small mb-1">Expired</p>
            <p className="fs-4 fw-bold text-danger mb-0">{summary.expired}</p>
          </Card>
        </Col>
        <Col xs={4}>
          <Card className="h-100">
            <p className="text-muted small mb-1">Expiring Soon (≤30 hari)</p>
            <p className="fs-4 fw-bold text-warning mb-0">{summary.expiring}</p>
          </Card>
        </Col>
        <Col xs={4}>
          <Card className="h-100">
            <p className="text-muted small mb-1">OK</p>
            <p className="fs-4 fw-bold text-success mb-0">{summary.ok}</p>
          </Card>
        </Col>
      </Row>

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={3}>
            <Select label="Item" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)}>
              <option value="all">All Items</option>
              {trackedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="Warehouse" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
              {!currentUser.warehouseId && <option value="all">All Warehouses</option>}
              {warehouseOptions.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="expired">Expired</option>
              <option value="expiring">Expiring Soon</option>
              <option value="ok">OK</option>
            </Select>
          </Col>
        </Row>

        <Table columns={columns} data={rows} emptyMessage="No active batches" />
      </Card>
    </div>
  )
}

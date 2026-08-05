import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Row, Col } from 'react-bootstrap'
import { useOutletContext } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import { Plus } from '../../components/common/Icons'
import { adjustWarehouseStock, getStockQuantity } from '../../data/inventory'
import type { StockOpname } from '../../data/inventory'
import { mockUsers } from '../../data/users'
import { useSession } from '../../data/session'
import { useActivityLog } from '../../data/activityLog'
import { useApprovalSettings } from '../../data/settings'
import { useWarehouses } from '../../data/warehouses'
import { hasPermission } from '../../utils/permissions'
import { parseIntInput } from '../../utils/number'
import type { InventoryContext } from './InventoryLayout'

const today = () => new Date().toISOString().split('T')[0]

const statusVariant: Record<StockOpname['status'], 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
}

export default function StockOpnamePage() {
  const { items, stockOpnames, setStockOpnames, warehouseStock, setWarehouseStock } =
    useOutletContext<InventoryContext>()
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()
  const { approvalThreshold } = useApprovalSettings()
  const { warehouses } = useWarehouses()

  const canCreate = hasPermission(currentUser, 'inventory.opname', 'create')
  const canApprove = hasPermission(currentUser, 'inventory.opname', 'approve')

  const activeUsers = mockUsers.filter((user) => user.status === 'active')
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.status === 'active')

  const buildEmptyFormData = () => ({
    itemId: items[0]?.id ?? 0,
    warehouseId: activeWarehouses[0]?.id ?? 0,
    physicalQty: 0,
    date: today(),
    picId: currentUser.id,
    note: '',
  })

  const [formData, setFormData] = useState(buildEmptyFormData)
  const [formError, setFormError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [itemFilter, setItemFilter] = useState('all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredOpnames = useMemo(() => {
    return stockOpnames.filter((o) => {
      const matchesItem = itemFilter === 'all' || o.itemId === Number(itemFilter)
      const matchesWarehouse = warehouseFilter === 'all' || o.warehouseId === Number(warehouseFilter)
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      return matchesItem && matchesWarehouse && matchesStatus
    })
  }, [stockOpnames, itemFilter, warehouseFilter, statusFilter])

  const getItemName = (itemId: number) => items.find((item) => item.id === itemId)?.name ?? 'Unknown'
  const getItemUnit = (itemId: number) => items.find((item) => item.id === itemId)?.unit ?? ''
  const getUserName = (userId?: number) => mockUsers.find((user) => user.id === userId)?.name ?? '-'
  const getWarehouseName = (warehouseId?: number) =>
    warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? '-'

  const currentSystemQty = getStockQuantity(warehouseStock, formData.itemId, formData.warehouseId)

  const handleAdd = () => {
    setFormData(buildEmptyFormData())
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!formData.warehouseId) {
      setFormError('Please select a warehouse')
      return
    }

    const systemQty = getStockQuantity(warehouseStock, formData.itemId, formData.warehouseId)
    const difference = formData.physicalQty - systemQty

    if (difference === 0) {
      setFormError('Physical quantity matches system stock, nothing to adjust')
      return
    }

    const withinThreshold = Math.abs(difference) <= approvalThreshold
    const approvedNow = canApprove && withinThreshold

    const newOpname: StockOpname = {
      id: Math.max(...stockOpnames.map((o) => o.id), 0) + 1,
      itemId: formData.itemId,
      warehouseId: formData.warehouseId,
      systemQty,
      physicalQty: formData.physicalQty,
      difference,
      date: formData.date,
      picId: formData.picId,
      status: approvedNow ? 'approved' : 'pending',
      approvedBy: approvedNow ? currentUser.id : undefined,
      approvedAt: approvedNow ? today() : undefined,
      note: formData.note || undefined,
    }

    setStockOpnames([...stockOpnames, newOpname])

    if (approvedNow) {
      setWarehouseStock((prev) => adjustWarehouseStock(prev, newOpname.itemId, newOpname.warehouseId, difference))
    }

    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'create',
      module: 'inventory.opname',
      description: `Created Stock Opname for ${getItemName(newOpname.itemId)} at ${getWarehouseName(newOpname.warehouseId)} (system ${systemQty}, physical ${formData.physicalQty}, diff ${difference > 0 ? '+' : ''}${difference} ${getItemUnit(newOpname.itemId)})`,
    })

    setIsModalOpen(false)
  }

  const columns = [
    { key: 'date', header: 'Date' },
    { key: 'item', header: 'Item', render: (o: StockOpname) => getItemName(o.itemId) },
    { key: 'warehouse', header: 'Warehouse', render: (o: StockOpname) => getWarehouseName(o.warehouseId) },
    {
      key: 'systemQty',
      header: 'System Qty',
      render: (o: StockOpname) => `${o.systemQty} ${getItemUnit(o.itemId)}`,
    },
    {
      key: 'physicalQty',
      header: 'Physical Qty',
      render: (o: StockOpname) => `${o.physicalQty} ${getItemUnit(o.itemId)}`,
    },
    {
      key: 'difference',
      header: 'Difference',
      render: (o: StockOpname) => (
        <Badge variant={o.difference > 0 ? 'success' : 'danger'}>
          {o.difference > 0 ? '+' : ''}
          {o.difference} {getItemUnit(o.itemId)}
        </Badge>
      ),
    },
    { key: 'pic', header: 'PIC', render: (o: StockOpname) => getUserName(o.picId) },
    {
      key: 'status',
      header: 'Status',
      render: (o: StockOpname) => <Badge variant={statusVariant[o.status]}>{o.status}</Badge>,
    },
  ]

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button onClick={handleAdd}>
            <Plus size={18} className="me-2" />
            Add Stock Opname
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
          <Col xs={12} md={6} lg={3}>
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
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </Col>
        </Row>

        <Table columns={columns} data={filteredOpnames} emptyMessage="No stock opname records yet" />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Stock Opname">
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Select
            label="Warehouse"
            value={formData.warehouseId}
            onChange={(e) => {
              setFormData({ ...formData, warehouseId: Number(e.target.value) })
              if (formError) setFormError('')
            }}
          >
            {activeWarehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </Select>
          <Select
            label="Item"
            value={formData.itemId}
            onChange={(e) => setFormData({ ...formData, itemId: Number(e.target.value) })}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <p className="text-muted small mb-0">
            System stock: <strong>{currentSystemQty}</strong> {items.find((i) => i.id === formData.itemId)?.unit}
          </p>
          <Input
            label="Physical Quantity (hasil hitung fisik)"
            type="text"
            inputMode="numeric"
            value={formData.physicalQty}
            onChange={(e) => {
              setFormData({ ...formData, physicalQty: parseIntInput(e.target.value) })
              if (formError) setFormError('')
            }}
            error={formError || undefined}
            required
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Select
            label="PIC"
            value={formData.picId}
            onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })}
          >
            {activeUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
          <Input
            label="Note"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Optional note"
          />
          {!canApprove && (
            <p className="text-muted small mb-0">
              Penyesuaian ini akan berstatus <strong>Pending</strong> sampai disetujui oleh Supervisor.
            </p>
          )}
          <div className="d-flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-fill">
              Cancel
            </Button>
            <Button type="submit" className="flex-fill">
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

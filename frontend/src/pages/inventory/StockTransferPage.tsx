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
import type { StockTransaction } from '../../data/inventory'
import { mockUsers } from '../../data/users'
import { useSession } from '../../data/session'
import { useActivityLog } from '../../data/activityLog'
import { useApprovalSettings } from '../../data/settings'
import { useWarehouses } from '../../data/warehouses'
import { hasPermission } from '../../utils/permissions'
import { parseIntInput } from '../../utils/number'
import type { InventoryContext } from './InventoryLayout'

const today = () => new Date().toISOString().split('T')[0]

const statusVariant: Record<StockTransaction['status'], 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
}

export default function StockTransferPage() {
  const { items, transactions, setTransactions, warehouseStock, setWarehouseStock } =
    useOutletContext<InventoryContext>()
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()
  const { approvalThreshold } = useApprovalSettings()
  const { warehouses } = useWarehouses()

  const canCreate = hasPermission(currentUser, 'inventory.transfer', 'create')
  const canApprove = hasPermission(currentUser, 'inventory.transfer', 'approve')

  const activeUsers = mockUsers.filter((user) => user.status === 'active')
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.status === 'active')

  const buildEmptyFormData = () => ({
    itemId: items[0]?.id ?? 0,
    fromWarehouseId: activeWarehouses[0]?.id ?? 0,
    toWarehouseId: activeWarehouses[1]?.id ?? activeWarehouses[0]?.id ?? 0,
    quantity: 0,
    date: today(),
    picId: currentUser.id,
    note: '',
  })

  const [formData, setFormData] = useState(buildEmptyFormData)
  const [formError, setFormError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [itemFilter, setItemFilter] = useState('all')
  const [fromFilter, setFromFilter] = useState('all')
  const [toFilter, setToFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const transferTransactions = useMemo(() => transactions.filter((t) => t.type === 'transfer'), [transactions])

  const filteredTransactions = useMemo(() => {
    return transferTransactions.filter((t) => {
      const matchesItem = itemFilter === 'all' || t.itemId === Number(itemFilter)
      const matchesFrom = fromFilter === 'all' || t.fromWarehouseId === Number(fromFilter)
      const matchesTo = toFilter === 'all' || t.toWarehouseId === Number(toFilter)
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      return matchesItem && matchesFrom && matchesTo && matchesStatus
    })
  }, [transferTransactions, itemFilter, fromFilter, toFilter, statusFilter])

  const getItemName = (itemId: number) => items.find((item) => item.id === itemId)?.name ?? 'Unknown'
  const getItemUnit = (itemId: number) => items.find((item) => item.id === itemId)?.unit ?? ''
  const getUserName = (userId?: number) => mockUsers.find((user) => user.id === userId)?.name ?? '-'
  const getWarehouseName = (warehouseId?: number) =>
    warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? '-'

  const moveStock = (itemId: number, fromWarehouseId: number, toWarehouseId: number, quantity: number) => {
    setWarehouseStock((prev) => {
      const decremented = adjustWarehouseStock(prev, itemId, fromWarehouseId, -quantity)
      return adjustWarehouseStock(decremented, itemId, toWarehouseId, quantity)
    })
  }

  const handleAdd = () => {
    setFormData(buildEmptyFormData())
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (formData.quantity <= 0) {
      setFormError('Quantity must be greater than 0')
      return
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      setFormError('Source and destination warehouse must be different')
      return
    }

    const selectedItem = items.find((item) => item.id === formData.itemId)
    const availableAtSource = getStockQuantity(warehouseStock, formData.itemId, formData.fromWarehouseId)
    if (selectedItem && formData.quantity > availableAtSource) {
      setFormError(`Quantity exceeds available stock at source warehouse (${availableAtSource} ${selectedItem.unit})`)
      return
    }

    const withinThreshold = formData.quantity <= approvalThreshold
    const approvedNow = canApprove && withinThreshold

    const newTransaction: StockTransaction = {
      id: Math.max(...transactions.map((t) => t.id), 0) + 1,
      itemId: formData.itemId,
      type: 'transfer',
      quantity: formData.quantity,
      date: formData.date,
      picId: formData.picId,
      status: approvedNow ? 'approved' : 'pending',
      approvedBy: approvedNow ? currentUser.id : undefined,
      approvedAt: approvedNow ? today() : undefined,
      note: formData.note || undefined,
      fromWarehouseId: formData.fromWarehouseId,
      toWarehouseId: formData.toWarehouseId,
    }

    setTransactions([...transactions, newTransaction])

    if (approvedNow) {
      moveStock(newTransaction.itemId, formData.fromWarehouseId, formData.toWarehouseId, newTransaction.quantity)
    }

    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'create',
      module: 'inventory.transfer',
      description: `Created Transfer for ${getItemName(newTransaction.itemId)} (${newTransaction.quantity} ${getItemUnit(newTransaction.itemId)}) from ${getWarehouseName(formData.fromWarehouseId)} to ${getWarehouseName(formData.toWarehouseId)}`,
    })

    setIsModalOpen(false)
  }

  const columns = [
    { key: 'date', header: 'Date' },
    { key: 'item', header: 'Item', render: (t: StockTransaction) => getItemName(t.itemId) },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (t: StockTransaction) => `${t.quantity} ${getItemUnit(t.itemId)}`,
    },
    {
      key: 'route',
      header: 'From → To',
      render: (t: StockTransaction) => (
        <span>
          {getWarehouseName(t.fromWarehouseId)} <span className="text-muted">→</span> {getWarehouseName(t.toWarehouseId)}
        </span>
      ),
    },
    { key: 'pic', header: 'PIC', render: (t: StockTransaction) => getUserName(t.picId) },
    {
      key: 'status',
      header: 'Status',
      render: (t: StockTransaction) => <Badge variant={statusVariant[t.status]}>{t.status}</Badge>,
    },
  ]

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button onClick={handleAdd}>
            <Plus size={18} className="me-2" />
            Add Transfer
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
            <Select label="From" value={fromFilter} onChange={(e) => setFromFilter(e.target.value)}>
              <option value="all">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="To" value={toFilter} onChange={(e) => setToFilter(e.target.value)}>
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

        <Table columns={columns} data={filteredTransactions} emptyMessage="No transfer transactions yet" />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transfer">
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
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
          <Select
            label="From Warehouse"
            value={formData.fromWarehouseId}
            onChange={(e) => {
              setFormData({ ...formData, fromWarehouseId: Number(e.target.value) })
              if (formError) setFormError('')
            }}
          >
            {activeWarehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({getStockQuantity(warehouseStock, formData.itemId, warehouse.id)}{' '}
                {items.find((i) => i.id === formData.itemId)?.unit} available)
              </option>
            ))}
          </Select>
          <Select
            label="To Warehouse"
            value={formData.toWarehouseId}
            onChange={(e) => {
              setFormData({ ...formData, toWarehouseId: Number(e.target.value) })
              if (formError) setFormError('')
            }}
          >
            {activeWarehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </Select>
          <Input
            label="Quantity"
            type="text"
            inputMode="numeric"
            value={formData.quantity}
            onChange={(e) => {
              setFormData({ ...formData, quantity: parseIntInput(e.target.value) })
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
              Transaksi ini akan berstatus <strong>Pending</strong> sampai disetujui oleh Supervisor.
            </p>
          )}
          {canApprove && formData.quantity > approvalThreshold && (
            <p className="text-muted small mb-0">
              Quantity melebihi ambang batas approval ({approvalThreshold} unit), transaksi ini akan tetap berstatus{' '}
              <strong>Pending</strong> walau Anda punya izin approve.
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

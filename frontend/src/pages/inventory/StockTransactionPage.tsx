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
import { Plus, Paperclip } from '../../components/common/Icons'
import { adjustWarehouseStock, consumeFefo, getStockQuantity, isBatchTracked } from '../../data/inventory'
import type { Attachment, Batch, StockTransaction } from '../../data/inventory'
import { mockUsers, DEPARTMENTS } from '../../data/users'
import { useSession } from '../../data/session'
import { useActivityLog } from '../../data/activityLog'
import { useSuppliers } from '../../data/suppliers'
import { useApprovalSettings } from '../../data/settings'
import { useWarehouses } from '../../data/warehouses'
import { hasPermission } from '../../utils/permissions'
import { parseIntInput, formatFileSize } from '../../utils/number'
import type { InventoryContext } from './InventoryLayout'

interface StockTransactionPageProps {
  type: 'in' | 'out'
}

const today = () => new Date().toISOString().split('T')[0]

const statusVariant: Record<StockTransaction['status'], 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
}

export default function StockTransactionPage({ type }: StockTransactionPageProps) {
  const { items, transactions, setTransactions, warehouseStock, setWarehouseStock, batches, setBatches } =
    useOutletContext<InventoryContext>()
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()
  const { suppliers } = useSuppliers()
  const { approvalThreshold } = useApprovalSettings()
  const { warehouses } = useWarehouses()

  const moduleKey = type === 'in' ? 'inventory.stockIn' : 'inventory.stockOut'
  const label = type === 'in' ? 'Stock In' : 'Stock Out'
  const canCreate = hasPermission(currentUser, moduleKey, 'create')
  const canApprove = hasPermission(currentUser, moduleKey, 'approve')

  const activeUsers = mockUsers.filter((user) => user.status === 'active')
  const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'active')
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.status === 'active')

  const buildEmptyFormData = () => ({
    itemId: items[0]?.id ?? 0,
    warehouseId: activeWarehouses[0]?.id ?? 0,
    quantity: 0,
    date: today(),
    picId: currentUser.id,
    reference: '',
    supplierId: 0,
    department: currentUser.department,
    note: '',
    batchNumber: '',
    expiryDate: '',
  })

  const [formData, setFormData] = useState(buildEmptyFormData)
  const [formError, setFormError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const [itemFilter, setItemFilter] = useState('all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const typeTransactions = useMemo(() => transactions.filter((t) => t.type === type), [transactions, type])

  const filteredTransactions = useMemo(() => {
    return typeTransactions.filter((t) => {
      const matchesItem = itemFilter === 'all' || t.itemId === Number(itemFilter)
      const matchesWarehouse = warehouseFilter === 'all' || t.warehouseId === Number(warehouseFilter)
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      return matchesItem && matchesWarehouse && matchesStatus
    })
  }, [typeTransactions, itemFilter, warehouseFilter, statusFilter])

  const getItemName = (itemId: number) => items.find((item) => item.id === itemId)?.name ?? 'Unknown'
  const getItemUnit = (itemId: number) => items.find((item) => item.id === itemId)?.unit ?? ''
  const getUserName = (userId?: number) => mockUsers.find((user) => user.id === userId)?.name ?? '-'
  const getSupplierName = (supplierId?: number) => suppliers.find((supplier) => supplier.id === supplierId)?.name ?? '-'
  const getWarehouseName = (warehouseId?: number) =>
    warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? '-'

  const adjustStock = (itemId: number, warehouseId: number, quantity: number) => {
    setWarehouseStock((prev) => adjustWarehouseStock(prev, itemId, warehouseId, type === 'in' ? quantity : -quantity))
  }

  const selectedItem = items.find((item) => item.id === formData.itemId)
  const isBatchItem = selectedItem ? isBatchTracked(selectedItem) : false

  const availableBatches = batches
    .filter((b) => b.itemId === formData.itemId && b.warehouseId === formData.warehouseId && b.quantity > 0)
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1))

  const handleAdd = () => {
    setFormData(buildEmptyFormData())
    setFormError('')
    setFiles([])
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (formData.quantity <= 0) {
      setFormError('Quantity must be greater than 0')
      return
    }

    if (!formData.warehouseId) {
      setFormError('Please select a warehouse')
      return
    }

    const availableAtWarehouse = getStockQuantity(warehouseStock, formData.itemId, formData.warehouseId)
    if (type === 'out' && selectedItem && formData.quantity > availableAtWarehouse) {
      setFormError(`Quantity exceeds available stock at this warehouse (${availableAtWarehouse} ${selectedItem.unit})`)
      return
    }

    if (type === 'in' && isBatchItem && (!formData.batchNumber.trim() || !formData.expiryDate)) {
      setFormError('Batch/lot number and expiry date are required for this item')
      return
    }

    const withinThreshold = formData.quantity <= approvalThreshold
    const approvedNow = canApprove && withinThreshold

    const attachments: Attachment[] = files.map((file, index) => ({
      id: index + 1,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    }))

    const newTransaction: StockTransaction = {
      id: Math.max(...transactions.map((t) => t.id), 0) + 1,
      itemId: formData.itemId,
      type,
      quantity: formData.quantity,
      date: formData.date,
      picId: formData.picId,
      status: approvedNow ? 'approved' : 'pending',
      approvedBy: approvedNow ? currentUser.id : undefined,
      approvedAt: approvedNow ? today() : undefined,
      reference: formData.reference || undefined,
      supplierId: type === 'in' && formData.supplierId ? formData.supplierId : undefined,
      department: type === 'out' ? formData.department : undefined,
      batchNumber: type === 'in' && isBatchItem ? formData.batchNumber.trim() : undefined,
      expiryDate: type === 'in' && isBatchItem ? formData.expiryDate : undefined,
      note: formData.note || undefined,
      warehouseId: formData.warehouseId,
      attachments: attachments.length > 0 ? attachments : undefined,
    }

    setTransactions([...transactions, newTransaction])

    if (approvedNow) {
      adjustStock(newTransaction.itemId, newTransaction.warehouseId!, newTransaction.quantity)

      if (type === 'in' && newTransaction.batchNumber && newTransaction.expiryDate) {
        const newBatch: Batch = {
          id: Math.max(...batches.map((b) => b.id), 0) + 1,
          itemId: newTransaction.itemId,
          warehouseId: newTransaction.warehouseId!,
          batchNumber: newTransaction.batchNumber,
          expiryDate: newTransaction.expiryDate,
          quantity: newTransaction.quantity,
          receivedDate: newTransaction.date,
        }
        setBatches([...batches, newBatch])
      }

      if (type === 'out' && isBatchItem) {
        setBatches((prev) => consumeFefo(prev, newTransaction.itemId, newTransaction.warehouseId!, newTransaction.quantity))
      }
    }

    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'create',
      module: moduleKey,
      description: `Created ${label} for ${getItemName(newTransaction.itemId)} (${type === 'in' ? '+' : '-'}${newTransaction.quantity} ${getItemUnit(newTransaction.itemId)}) at ${getWarehouseName(newTransaction.warehouseId)}${newTransaction.supplierId ? ` from ${getSupplierName(newTransaction.supplierId)}` : ''}${newTransaction.department ? `, dept ${newTransaction.department}` : ''}${newTransaction.batchNumber ? `, batch ${newTransaction.batchNumber} (exp ${newTransaction.expiryDate})` : ''}${newTransaction.reference ? `, ref ${newTransaction.reference}` : ''}`,
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
    { key: 'warehouse', header: 'Warehouse', render: (t: StockTransaction) => getWarehouseName(t.warehouseId) },
    { key: 'pic', header: 'PIC', render: (t: StockTransaction) => getUserName(t.picId) },
    ...(type === 'in'
      ? [
          { key: 'supplier', header: 'Supplier', render: (t: StockTransaction) => getSupplierName(t.supplierId) },
          {
            key: 'batch',
            header: 'Batch / Expiry',
            render: (t: StockTransaction) =>
              t.batchNumber ? `${t.batchNumber} (exp ${t.expiryDate})` : <span className="text-muted small">—</span>,
          },
        ]
      : [{ key: 'department', header: 'Department', render: (t: StockTransaction) => t.department ?? '-' }]),
    { key: 'reference', header: 'Reference', render: (t: StockTransaction) => t.reference ?? '-' },
    {
      key: 'attachments',
      header: 'Documents',
      render: (t: StockTransaction) =>
        t.attachments && t.attachments.length > 0 ? (
          <div className="d-flex flex-column gap-1">
            {t.attachments.map((a) => (
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
      render: (t: StockTransaction) => <Badge variant={statusVariant[t.status]}>{t.status}</Badge>,
    },
  ]

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button onClick={handleAdd}>
            <Plus size={18} className="me-2" />
            Add {label}
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

        <Table
          columns={columns}
          data={filteredTransactions}
          emptyMessage={`No ${label.toLowerCase()} transactions yet`}
        />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Add ${label}`}>
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
                {item.name} ({getStockQuantity(warehouseStock, item.id, formData.warehouseId)} {item.unit} available
                at this warehouse)
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
            onChange={(e) => {
              const picId = Number(e.target.value)
              const pic = activeUsers.find((user) => user.id === picId)
              setFormData({ ...formData, picId, department: pic?.department ?? formData.department })
            }}
          >
            {activeUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
          {type === 'out' && (
            <Select
              label="Department (Cost Center)"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </Select>
          )}
          {type === 'in' && (
            <Select
              label="Supplier"
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: Number(e.target.value) })}
            >
              <option value={0}>No supplier selected</option>
              {activeSuppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          )}
          {type === 'in' && isBatchItem && (
            <>
              <Input
                label="Batch / Lot Number"
                value={formData.batchNumber}
                onChange={(e) => {
                  setFormData({ ...formData, batchNumber: e.target.value })
                  if (formError) setFormError('')
                }}
                placeholder="HS-2026-E"
                required
              />
              <Input
                label="Expiry Date"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => {
                  setFormData({ ...formData, expiryDate: e.target.value })
                  if (formError) setFormError('')
                }}
                required
              />
            </>
          )}
          {type === 'out' && isBatchItem && (
            <div className="border rounded-3 p-3 bg-light">
              <p className="small fw-medium mb-2">Available batches (FEFO order)</p>
              {availableBatches.length === 0 ? (
                <p className="small text-muted mb-0">No batches with stock at this warehouse</p>
              ) : (
                <ul className="list-unstyled small mb-0 d-flex flex-column gap-1">
                  {availableBatches.map((batch) => (
                    <li key={batch.id}>
                      {batch.batchNumber} (exp {batch.expiryDate}): {batch.quantity} {selectedItem?.unit}
                    </li>
                  ))}
                </ul>
              )}
              <p className="small text-muted mb-0 mt-2">
                Stok akan diambil otomatis dari batch dengan expiry paling dekat lebih dulu saat disetujui.
              </p>
            </div>
          )}
          <Input
            label={type === 'in' ? 'Reference (PO Number)' : 'Reference (Purpose)'}
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder={type === 'in' ? 'PO-2024-003' : 'Project X kickoff'}
          />
          <Input
            label="Note"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Optional note"
          />
          <Input
            label={type === 'in' ? 'Documents (PO / Invoice / BAST scan)' : 'Documents (Surat Jalan / BAST scan)'}
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          {files.length > 0 && (
            <ul className="list-unstyled small text-muted mb-0 d-flex flex-column gap-1">
              {files.map((file, index) => (
                <li key={index} className="d-flex align-items-center gap-1">
                  <Paperclip size={14} />
                  {file.name} ({formatFileSize(file.size)})
                </li>
              ))}
            </ul>
          )}
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

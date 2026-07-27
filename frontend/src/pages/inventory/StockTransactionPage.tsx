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
import type { StockTransaction } from '../../data/inventory'
import { mockUsers } from '../../data/users'
import { currentUser } from '../../data/session'
import { hasPermission } from '../../utils/permissions'
import { parseIntInput } from '../../utils/number'
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
  const { items, setItems, transactions, setTransactions } = useOutletContext<InventoryContext>()

  const moduleKey = type === 'in' ? 'inventory.stockIn' : 'inventory.stockOut'
  const label = type === 'in' ? 'Stock In' : 'Stock Out'
  const canCreate = hasPermission(currentUser, moduleKey, 'create')
  const canApprove = hasPermission(currentUser, moduleKey, 'approve')

  const activeUsers = mockUsers.filter((user) => user.status === 'active')

  const buildEmptyFormData = () => ({
    itemId: items[0]?.id ?? 0,
    quantity: 0,
    date: today(),
    picId: currentUser.id,
    reference: '',
    note: '',
  })

  const [formData, setFormData] = useState(buildEmptyFormData)
  const [formError, setFormError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [itemFilter, setItemFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const typeTransactions = useMemo(() => transactions.filter((t) => t.type === type), [transactions, type])

  const filteredTransactions = useMemo(() => {
    return typeTransactions.filter((t) => {
      const matchesItem = itemFilter === 'all' || t.itemId === Number(itemFilter)
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      return matchesItem && matchesStatus
    })
  }, [typeTransactions, itemFilter, statusFilter])

  const getItemName = (itemId: number) => items.find((item) => item.id === itemId)?.name ?? 'Unknown'
  const getItemUnit = (itemId: number) => items.find((item) => item.id === itemId)?.unit ?? ''
  const getUserName = (userId?: number) => mockUsers.find((user) => user.id === userId)?.name ?? '-'

  const adjustStock = (itemId: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, stock: item.stock + (type === 'in' ? quantity : -quantity) } : item,
      ),
    )
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

    const selectedItem = items.find((item) => item.id === formData.itemId)
    if (type === 'out' && selectedItem && formData.quantity > selectedItem.stock) {
      setFormError(`Quantity exceeds available stock (${selectedItem.stock} ${selectedItem.unit})`)
      return
    }

    const approvedNow = canApprove

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
      note: formData.note || undefined,
    }

    setTransactions([...transactions, newTransaction])

    if (approvedNow) {
      adjustStock(newTransaction.itemId, newTransaction.quantity)
    }

    setIsModalOpen(false)
  }

  const handleApprove = (transaction: StockTransaction) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transaction.id ? { ...t, status: 'approved', approvedBy: currentUser.id, approvedAt: today() } : t,
      ),
    )
    adjustStock(transaction.itemId, transaction.quantity)
  }

  const handleReject = (transaction: StockTransaction) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transaction.id ? { ...t, status: 'rejected', approvedBy: currentUser.id, approvedAt: today() } : t,
      ),
    )
  }

  const columns = [
    { key: 'date', header: 'Date' },
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
    {
      key: 'actions',
      header: 'Actions',
      render: (t: StockTransaction) =>
        canApprove && t.status === 'pending' ? (
          <div className="d-flex align-items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleApprove(t)}>
              Approve
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleReject(t)}>
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-muted small">—</span>
        ),
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
          <Col xs={12} md={6} lg={4}>
            <Select label="Item" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)}>
              <option value="all">All Items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={4}>
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
            label="Item"
            value={formData.itemId}
            onChange={(e) => setFormData({ ...formData, itemId: Number(e.target.value) })}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.stock} {item.unit} available)
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
            label={type === 'in' ? 'Reference (PO / Supplier)' : 'Reference (Department / Purpose)'}
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder={type === 'in' ? 'PO-2024-003' : 'IT Department'}
          />
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

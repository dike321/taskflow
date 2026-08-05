import { useMemo, useState } from 'react'
import { Row, Col } from 'react-bootstrap'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import PageToolbar from '../components/common/PageToolbar'
import { useInventoryData, adjustWarehouseStock } from '../data/inventory'
import type { StockOpname, StockTransaction, StockTransactionType } from '../data/inventory'
import { mockUsers } from '../data/users'
import { useSession } from '../data/session'
import { useActivityLog } from '../data/activityLog'
import { useSuppliers } from '../data/suppliers'
import { useWarehouses } from '../data/warehouses'
import { hasPermission } from '../utils/permissions'

const today = () => new Date().toISOString().split('T')[0]

const typeVariant: Record<StockTransactionType, 'success' | 'danger' | 'info'> = {
  in: 'success',
  out: 'danger',
  transfer: 'info',
}

export default function ApprovalsPage() {
  const { items, transactions, setTransactions, stockOpnames, setStockOpnames, setWarehouseStock } = useInventoryData()
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()
  const { suppliers } = useSuppliers()
  const { warehouses } = useWarehouses()

  const [typeFilter, setTypeFilter] = useState('all')
  const [itemFilter, setItemFilter] = useState('all')

  const pendingTransactions = useMemo(() => transactions.filter((t) => t.status === 'pending'), [transactions])

  const filteredTransactions = useMemo(() => {
    return pendingTransactions
      .filter((t) => {
        const matchesType = typeFilter === 'all' || t.type === typeFilter
        const matchesItem = itemFilter === 'all' || t.itemId === Number(itemFilter)
        return matchesType && matchesItem
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [pendingTransactions, typeFilter, itemFilter])

  const getItemName = (itemId: number) => items.find((item) => item.id === itemId)?.name ?? 'Unknown'
  const getItemUnit = (itemId: number) => items.find((item) => item.id === itemId)?.unit ?? ''
  const getUserName = (userId?: number) => mockUsers.find((user) => user.id === userId)?.name ?? '-'
  const getSupplierName = (supplierId?: number) => suppliers.find((supplier) => supplier.id === supplierId)?.name ?? '-'
  const getWarehouseName = (warehouseId?: number) =>
    warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? '-'
  const moduleKeyFor = (type: StockTransactionType) =>
    type === 'in' ? 'inventory.stockIn' : type === 'out' ? 'inventory.stockOut' : 'inventory.transfer'
  const labelFor = (type: StockTransactionType) => (type === 'in' ? 'Stock In' : type === 'out' ? 'Stock Out' : 'Transfer')

  const warehouseLabel = (t: StockTransaction) =>
    t.type === 'transfer' ? `${getWarehouseName(t.fromWarehouseId)} → ${getWarehouseName(t.toWarehouseId)}` : getWarehouseName(t.warehouseId)

  const applyStockChange = (transaction: StockTransaction) => {
    setWarehouseStock((prev) => {
      if (transaction.type === 'transfer') {
        const decremented = adjustWarehouseStock(prev, transaction.itemId, transaction.fromWarehouseId!, -transaction.quantity)
        return adjustWarehouseStock(decremented, transaction.itemId, transaction.toWarehouseId!, transaction.quantity)
      }
      const delta = transaction.type === 'in' ? transaction.quantity : -transaction.quantity
      return adjustWarehouseStock(prev, transaction.itemId, transaction.warehouseId!, delta)
    })
  }

  const handleApprove = (transaction: StockTransaction) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transaction.id ? { ...t, status: 'approved', approvedBy: currentUser.id, approvedAt: today() } : t,
      ),
    )
    applyStockChange(transaction)
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'approve',
      module: moduleKeyFor(transaction.type),
      description: `Approved ${labelFor(transaction.type)} for ${getItemName(transaction.itemId)} (${transaction.quantity} ${getItemUnit(transaction.itemId)}) — ${warehouseLabel(transaction)}`,
    })
  }

  const handleReject = (transaction: StockTransaction) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transaction.id ? { ...t, status: 'rejected', approvedBy: currentUser.id, approvedAt: today() } : t,
      ),
    )
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'reject',
      module: moduleKeyFor(transaction.type),
      description: `Rejected ${labelFor(transaction.type)} for ${getItemName(transaction.itemId)} (${transaction.quantity} ${getItemUnit(transaction.itemId)}) — ${warehouseLabel(transaction)}`,
    })
  }

  const pendingOpnames = useMemo(() => stockOpnames.filter((o) => o.status === 'pending'), [stockOpnames])

  const filteredOpnames = useMemo(() => {
    return pendingOpnames
      .filter((o) => itemFilter === 'all' || o.itemId === Number(itemFilter))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [pendingOpnames, itemFilter])

  const handleApproveOpname = (opname: StockOpname) => {
    setStockOpnames((prev) =>
      prev.map((o) =>
        o.id === opname.id ? { ...o, status: 'approved', approvedBy: currentUser.id, approvedAt: today() } : o,
      ),
    )
    setWarehouseStock((prev) => adjustWarehouseStock(prev, opname.itemId, opname.warehouseId, opname.difference))
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'approve',
      module: 'inventory.opname',
      description: `Approved Stock Opname for ${getItemName(opname.itemId)} at ${getWarehouseName(opname.warehouseId)} (diff ${opname.difference > 0 ? '+' : ''}${opname.difference} ${getItemUnit(opname.itemId)})`,
    })
  }

  const handleRejectOpname = (opname: StockOpname) => {
    setStockOpnames((prev) =>
      prev.map((o) =>
        o.id === opname.id ? { ...o, status: 'rejected', approvedBy: currentUser.id, approvedAt: today() } : o,
      ),
    )
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'reject',
      module: 'inventory.opname',
      description: `Rejected Stock Opname for ${getItemName(opname.itemId)} at ${getWarehouseName(opname.warehouseId)} (diff ${opname.difference > 0 ? '+' : ''}${opname.difference} ${getItemUnit(opname.itemId)})`,
    })
  }

  const opnameColumns = [
    { key: 'date', header: 'Date' },
    { key: 'item', header: 'Item', render: (o: StockOpname) => getItemName(o.itemId) },
    { key: 'warehouse', header: 'Warehouse', render: (o: StockOpname) => getWarehouseName(o.warehouseId) },
    { key: 'systemQty', header: 'System Qty', render: (o: StockOpname) => `${o.systemQty} ${getItemUnit(o.itemId)}` },
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
      key: 'actions',
      header: 'Actions',
      render: (o: StockOpname) =>
        hasPermission(currentUser, 'inventory.opname', 'approve') ? (
          <div className="d-flex align-items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleApproveOpname(o)}>
              Approve
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleRejectOpname(o)}>
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-muted small">—</span>
        ),
    },
  ]

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
    { key: 'warehouse', header: 'Warehouse', render: (t: StockTransaction) => warehouseLabel(t) },
    { key: 'pic', header: 'PIC', render: (t: StockTransaction) => getUserName(t.picId) },
    {
      key: 'supplierOrReference',
      header: 'Supplier / Reference',
      render: (t: StockTransaction) => (t.type === 'in' ? getSupplierName(t.supplierId) : (t.reference ?? '-')),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t: StockTransaction) =>
        hasPermission(currentUser, moduleKeyFor(t.type), 'approve') ? (
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
      <PageToolbar title="Approvals" description="Pending Stock In/Out/Transfer/Opname transactions waiting for your approval" />

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={3}>
            <Select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="transfer">Transfer</option>
            </Select>
          </Col>
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
        </Row>

        <Table columns={columns} data={filteredTransactions} emptyMessage="No transactions waiting for approval" />
      </Card>

      <div className="mt-4 mb-3">
        <h2 className="h6 fw-bold mb-1">Stock Opname</h2>
        <p className="text-muted small mb-0">Pending physical count adjustments waiting for your approval</p>
      </div>

      <Card>
        <Table columns={opnameColumns} data={filteredOpnames} emptyMessage="No stock opname waiting for approval" />
      </Card>
    </div>
  )
}

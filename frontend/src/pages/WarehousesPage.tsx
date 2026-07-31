import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Row, Col } from 'react-bootstrap'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import PageToolbar from '../components/common/PageToolbar'
import { Pencil, Trash2, Plus } from '../components/common/Icons'
import { useWarehouses } from '../data/warehouses'
import type { Warehouse } from '../data/warehouses'
import { useInventoryData } from '../data/inventory'
import { useSession } from '../data/session'
import { useActivityLog } from '../data/activityLog'
import { hasPermission } from '../utils/permissions'

const emptyFormData = {
  code: '',
  name: '',
  address: '',
  status: 'active' as Warehouse['status'],
}

export default function WarehousesPage() {
  const { warehouses, setWarehouses } = useWarehouses()
  const { items, transactions, warehouseStock } = useInventoryData()
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()

  const canCreate = hasPermission(currentUser, 'warehouses', 'create')
  const canEdit = hasPermission(currentUser, 'warehouses', 'edit')
  const canDelete = hasPermission(currentUser, 'warehouses', 'delete')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null)
  const [formData, setFormData] = useState(emptyFormData)

  const [nameQuery, setNameQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredWarehouses = useMemo(() => {
    const name = nameQuery.trim().toLowerCase()
    return warehouses.filter((warehouse) => {
      const matchesName =
        !name ||
        warehouse.name.toLowerCase().includes(name) ||
        warehouse.code.toLowerCase().includes(name)
      const matchesStatus = statusFilter === 'all' || warehouse.status === statusFilter
      return matchesName && matchesStatus
    })
  }, [warehouses, nameQuery, statusFilter])

  const totalStockInWarehouse = (warehouseId: number) =>
    warehouseStock.filter((w) => w.warehouseId === warehouseId).reduce((sum, w) => sum + w.quantity, 0)

  const isWarehouseInUse = (warehouseId: number) =>
    totalStockInWarehouse(warehouseId) > 0 ||
    transactions.some(
      (t) => t.warehouseId === warehouseId || t.fromWarehouseId === warehouseId || t.toWarehouseId === warehouseId,
    )

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address,
      status: warehouse.status,
    })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingWarehouse(null)
    setFormData(emptyFormData)
    setIsModalOpen(true)
  }

  const handleDelete = (warehouse: Warehouse) => {
    setDeleteTarget(warehouse)
  }

  const confirmDelete = () => {
    if (deleteTarget && !isWarehouseInUse(deleteTarget.id)) {
      setWarehouses(warehouses.filter((warehouse) => warehouse.id !== deleteTarget.id))
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'delete',
        module: 'warehouses',
        description: `Deleted warehouse ${deleteTarget.code} (${deleteTarget.name})`,
      })
    }
    setDeleteTarget(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (editingWarehouse) {
      setWarehouses(
        warehouses.map((warehouse) => (warehouse.id === editingWarehouse.id ? { ...warehouse, ...formData } : warehouse)),
      )
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'update',
        module: 'warehouses',
        description: `Updated warehouse ${formData.code} (${formData.name})`,
      })
    } else {
      const newWarehouse: Warehouse = {
        id: Math.max(...warehouses.map((w) => w.id), 0) + 1,
        ...formData,
      }
      setWarehouses([...warehouses, newWarehouse])
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'create',
        module: 'warehouses',
        description: `Created warehouse ${newWarehouse.code} (${newWarehouse.name})`,
      })
    }

    setIsModalOpen(false)
  }

  const columns = [
    { key: 'code', header: 'Code', render: (w: Warehouse) => <span className="fw-medium">{w.code}</span> },
    { key: 'name', header: 'Name' },
    { key: 'address', header: 'Address' },
    {
      key: 'itemsStocked',
      header: 'Items Stocked',
      render: (w: Warehouse) => {
        const itemCount = warehouseStock.filter((ws) => ws.warehouseId === w.id && ws.quantity > 0).length
        return `${itemCount} of ${items.length} item${items.length === 1 ? '' : 's'}`
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (w: Warehouse) => <Badge variant={w.status === 'active' ? 'success' : 'secondary'}>{w.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (w: Warehouse) => (
        <div className="d-flex align-items-center gap-2">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(w)}>
              <Pencil size={16} />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(w)}>
              <Trash2 size={16} className="text-danger" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageToolbar
        title="Warehouses"
        description="Manage warehouse/location master data used to split stock across Inventory"
        actions={
          canCreate && (
            <Button onClick={handleAdd}>
              <Plus size={18} className="me-2" />
              Add Warehouse
            </Button>
          )
        }
      />

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={4}>
            <Input
              label="Code / Name"
              placeholder="Search..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Col>
        </Row>

        <Table columns={columns} data={filteredWarehouses} emptyMessage="No warehouses match your search or filters" />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
      >
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="WH-JKT"
            required
          />
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Gudang Pusat Jakarta"
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Jl. Industri Raya No. 12, Jakarta"
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Warehouse['status'] })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="d-flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-fill">
              Cancel
            </Button>
            <Button type="submit" className="flex-fill">
              {editingWarehouse ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Warehouse" size="sm">
        {deleteTarget && isWarehouseInUse(deleteTarget.id) ? (
          <>
            <p className="mb-4">
              <strong>{deleteTarget.name}</strong> masih punya stok atau riwayat transaksi. Warehouse tidak bisa
              dihapus selama masih dipakai — pindahkan/transfer stoknya terlebih dahulu.
            </p>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} className="w-100">
              Close
            </Button>
          </>
        ) : (
          <>
            <p className="mb-4">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </p>
            <div className="d-flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} className="flex-fill">
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={confirmDelete} className="flex-fill">
                Delete
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

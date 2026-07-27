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
import { useSuppliers } from '../data/suppliers'
import type { Supplier } from '../data/suppliers'
import { useInventoryData } from '../data/inventory'
import { useSession } from '../data/session'
import { useActivityLog } from '../data/activityLog'
import { hasPermission } from '../utils/permissions'

const emptyFormData = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  status: 'active' as Supplier['status'],
}

export default function SuppliersPage() {
  const { suppliers, setSuppliers } = useSuppliers()
  const { transactions } = useInventoryData()
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()

  const canCreate = hasPermission(currentUser, 'suppliers', 'create')
  const canEdit = hasPermission(currentUser, 'suppliers', 'edit')
  const canDelete = hasPermission(currentUser, 'suppliers', 'delete')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState(emptyFormData)

  const [nameQuery, setNameQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredSuppliers = useMemo(() => {
    const name = nameQuery.trim().toLowerCase()
    return suppliers.filter((supplier) => {
      const matchesName =
        !name ||
        supplier.name.toLowerCase().includes(name) ||
        supplier.contactPerson.toLowerCase().includes(name)
      const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
      return matchesName && matchesStatus
    })
  }, [suppliers, nameQuery, statusFilter])

  const isSupplierInUse = (supplierId: number) => transactions.some((t) => t.supplierId === supplierId)

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      status: supplier.status,
    })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingSupplier(null)
    setFormData(emptyFormData)
    setIsModalOpen(true)
  }

  const handleDelete = (supplier: Supplier) => {
    setDeleteTarget(supplier)
  }

  const confirmDelete = () => {
    if (deleteTarget && !isSupplierInUse(deleteTarget.id)) {
      setSuppliers(suppliers.filter((supplier) => supplier.id !== deleteTarget.id))
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'delete',
        module: 'suppliers',
        description: `Deleted supplier ${deleteTarget.name}`,
      })
    }
    setDeleteTarget(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (editingSupplier) {
      setSuppliers(
        suppliers.map((supplier) => (supplier.id === editingSupplier.id ? { ...supplier, ...formData } : supplier)),
      )
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'update',
        module: 'suppliers',
        description: `Updated supplier ${formData.name}`,
      })
    } else {
      const newSupplier: Supplier = {
        id: Math.max(...suppliers.map((s) => s.id), 0) + 1,
        ...formData,
      }
      setSuppliers([...suppliers, newSupplier])
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'create',
        module: 'suppliers',
        description: `Created supplier ${newSupplier.name}`,
      })
    }

    setIsModalOpen(false)
  }

  const columns = [
    { key: 'name', header: 'Name', render: (s: Supplier) => <span className="fw-medium">{s.name}</span> },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    {
      key: 'status',
      header: 'Status',
      render: (s: Supplier) => <Badge variant={s.status === 'active' ? 'success' : 'secondary'}>{s.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s: Supplier) => (
        <div className="d-flex align-items-center gap-2">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}>
              <Pencil size={16} />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(s)}>
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
        title="Suppliers"
        description="Manage vendor/supplier master data used across Inventory"
        actions={
          canCreate && (
            <Button onClick={handleAdd}>
              <Plus size={18} className="me-2" />
              Add Supplier
            </Button>
          )
        }
      />

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={4}>
            <Input
              label="Name / Contact Person"
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

        <Table columns={columns} data={filteredSuppliers} emptyMessage="No suppliers match your search or filters" />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
      >
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Company Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="PT Alat Tulis Sejahtera"
            required
          />
          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="Budi Santoso"
            required
          />
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[\s-]/g, '') })}
                placeholder="+622155512001"
                required
              />
            </Col>
            <Col xs={12} md={6}>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sales@supplier.co.id"
              />
            </Col>
          </Row>
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Supplier['status'] })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="d-flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-fill">
              Cancel
            </Button>
            <Button type="submit" className="flex-fill">
              {editingSupplier ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Supplier" size="sm">
        {deleteTarget && isSupplierInUse(deleteTarget.id) ? (
          <>
            <p className="mb-4">
              <strong>{deleteTarget.name}</strong> masih dipakai di riwayat transaksi Stock In. Supplier tidak bisa
              dihapus selama masih direferensikan transaksi.
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

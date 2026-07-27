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
import { Pencil, Trash2, Plus } from '../../components/common/Icons'
import { CATEGORIES, UNITS } from '../../data/inventory'
import type { Item } from '../../data/inventory'
import { currentUser } from '../../data/session'
import { hasPermission } from '../../utils/permissions'
import { parseIntInput } from '../../utils/number'
import type { InventoryContext } from './InventoryLayout'

const emptyFormData = { sku: '', name: '', category: CATEGORIES[0], unit: UNITS[0], stock: 0, minStock: 0 }

export default function ItemsPage() {
  const { items, setItems } = useOutletContext<InventoryContext>()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [formData, setFormData] = useState(emptyFormData)

  const [skuQuery, setSkuQuery] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  const canCreate = hasPermission(currentUser, 'inventory.items', 'create')
  const canEdit = hasPermission(currentUser, 'inventory.items', 'edit')
  const canDelete = hasPermission(currentUser, 'inventory.items', 'delete')

  const filteredItems = useMemo(() => {
    const sku = skuQuery.trim().toLowerCase()
    const name = nameQuery.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSku = !sku || item.sku.toLowerCase().includes(sku)
      const matchesName = !name || item.name.toLowerCase().includes(name)
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && item.stock <= item.minStock) ||
        (stockFilter === 'ok' && item.stock > item.minStock)

      return matchesSku && matchesName && matchesCategory && matchesStock
    })
  }, [items, skuQuery, nameQuery, categoryFilter, stockFilter])

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      stock: item.stock,
      minStock: item.minStock,
    })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData(emptyFormData)
    setIsModalOpen(true)
  }

  const handleDelete = (item: Item) => {
    setDeleteTarget(item)
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      setItems(items.filter((item) => item.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (editingItem) {
      setItems(items.map((item) => (item.id === editingItem.id ? { ...item, ...formData } : item)))
    } else {
      const newItem: Item = {
        id: Math.max(...items.map((i) => i.id), 0) + 1,
        ...formData,
      }
      setItems([...items, newItem])
    }

    setIsModalOpen(false)
  }

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category' },
    {
      key: 'stock',
      header: 'Stock',
      render: (item: Item) => (
        <div className="d-flex align-items-center gap-2">
          <span className="fw-medium">
            {item.stock} {item.unit}
          </span>
          {item.stock <= item.minStock && <Badge variant="danger">Low Stock</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: Item) => (
        <div className="d-flex align-items-center gap-2">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
              <Pencil size={16} />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
              <Trash2 size={16} className="text-danger" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        {canCreate && (
          <Button onClick={handleAdd}>
            <Plus size={18} className="me-2" />
            Add Item
          </Button>
        )}
      </div>

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={3}>
            <Input
              label="SKU"
              placeholder="Search by SKU..."
              value={skuQuery}
              onChange={(e) => setSkuQuery(e.target.value)}
            />
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Input
              label="Name"
              placeholder="Search by name..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
          </Col>
          <Col xs={6} md={3} lg={3}>
            <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={6} md={3} lg={3}>
            <Select label="Stock" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="ok">In Stock</option>
            </Select>
          </Col>
        </Row>

        <Table columns={columns} data={filteredItems} emptyMessage="No items match your search or filters" />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'Add Item'}
      >
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            label="SKU"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="ATK-001"
            required
          />
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Kertas A4 80gsm"
            required
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <Select label="Unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Select>
          <Input
            label="Stock"
            type="text"
            inputMode="numeric"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseIntInput(e.target.value) })}
            required
          />
          <Input
            label="Minimum Stock"
            type="text"
            inputMode="numeric"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: parseIntInput(e.target.value) })}
            required
          />
          <div className="d-flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-fill">
              Cancel
            </Button>
            <Button type="submit" className="flex-fill">
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Item" size="sm">
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
      </Modal>
    </div>
  )
}

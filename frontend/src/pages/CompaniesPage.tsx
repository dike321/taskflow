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
import { useCompanies } from '../data/companies'
import type { Company } from '../data/companies'
import { mockUsers } from '../data/users'
import { useSession } from '../data/session'
import { useActivityLog } from '../data/activityLog'
import { hasPermission } from '../utils/permissions'

const emptyFormData = {
  name: '',
  type: 'internal' as Company['type'],
  address: '',
  phone: '',
  email: '',
  status: 'active' as Company['status'],
}

const typeLabel: Record<Company['type'], string> = {
  internal: 'Internal',
  supplier: 'Supplier',
}
const typeVariant: Record<Company['type'], 'primary' | 'info'> = {
  internal: 'primary',
  supplier: 'info',
}

export default function CompaniesPage() {
  const { companies, setCompanies } = useCompanies()
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()

  const canCreate = hasPermission(currentUser, 'companies', 'create')
  const canEdit = hasPermission(currentUser, 'companies', 'edit')
  const canDelete = hasPermission(currentUser, 'companies', 'delete')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [formData, setFormData] = useState(emptyFormData)

  const [nameQuery, setNameQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredCompanies = useMemo(() => {
    const name = nameQuery.trim().toLowerCase()
    return companies.filter((company) => {
      const matchesName = !name || company.name.toLowerCase().includes(name)
      const matchesType = typeFilter === 'all' || company.type === typeFilter
      const matchesStatus = statusFilter === 'all' || company.status === statusFilter
      return matchesName && matchesType && matchesStatus
    })
  }, [companies, nameQuery, typeFilter, statusFilter])

  const isCompanyInUse = (companyId: number) => mockUsers.some((u) => u.companyId === companyId)

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      type: company.type,
      address: company.address,
      phone: company.phone,
      email: company.email,
      status: company.status,
    })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingCompany(null)
    setFormData(emptyFormData)
    setIsModalOpen(true)
  }

  const handleDelete = (company: Company) => {
    setDeleteTarget(company)
  }

  const confirmDelete = () => {
    if (deleteTarget && !isCompanyInUse(deleteTarget.id)) {
      setCompanies(companies.filter((company) => company.id !== deleteTarget.id))
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'delete',
        module: 'companies',
        description: `Deleted company ${deleteTarget.name}`,
      })
    }
    setDeleteTarget(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (editingCompany) {
      setCompanies(
        companies.map((company) => (company.id === editingCompany.id ? { ...company, ...formData } : company)),
      )
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'update',
        module: 'companies',
        description: `Updated company ${formData.name}`,
      })
    } else {
      const newCompany: Company = {
        id: Math.max(...companies.map((c) => c.id), 0) + 1,
        ...formData,
      }
      setCompanies([...companies, newCompany])
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'create',
        module: 'companies',
        description: `Created company ${newCompany.name}`,
      })
    }

    setIsModalOpen(false)
  }

  const columns = [
    { key: 'name', header: 'Name', render: (c: Company) => <span className="fw-medium">{c.name}</span> },
    {
      key: 'type',
      header: 'Type',
      render: (c: Company) => <Badge variant={typeVariant[c.type]}>{typeLabel[c.type]}</Badge>,
    },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    {
      key: 'status',
      header: 'Status',
      render: (c: Company) => <Badge variant={c.status === 'active' ? 'success' : 'secondary'}>{c.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Company) => (
        <div className="d-flex align-items-center gap-2">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
              <Pencil size={16} />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}>
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
        title="Companies"
        description="Organisasi yang jadi 'induk' tiap user — internal (operator warehouse) atau eksternal (supplier)"
        actions={
          canCreate && (
            <Button onClick={handleAdd}>
              <Plus size={18} className="me-2" />
              Add Company
            </Button>
          )
        }
      />

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={4}>
            <Input label="Name" placeholder="Search..." value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} />
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="internal">Internal</option>
              <option value="supplier">Supplier</option>
            </Select>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Col>
        </Row>

        <Table columns={columns} data={filteredCompanies} emptyMessage="No companies match your search or filters" />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? 'Edit Company' : 'Add Company'}
      >
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Company Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="PT Sinergi Logistik Nusantara"
            required
          />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Company['type'] })}
          >
            <option value="internal">Internal</option>
            <option value="supplier">Supplier</option>
          </Select>
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
                placeholder="info@company.co.id"
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
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Company['status'] })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="d-flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-fill">
              Cancel
            </Button>
            <Button type="submit" className="flex-fill">
              {editingCompany ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Company" size="sm">
        {deleteTarget && isCompanyInUse(deleteTarget.id) ? (
          <>
            <p className="mb-4">
              <strong>{deleteTarget.name}</strong> masih dipakai sebagai company salah satu user. Company tidak bisa
              dihapus selama masih dipakai — pindahkan dulu user tersebut ke company lain.
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

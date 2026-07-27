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
import { mockUsers, DEPARTMENTS } from '../data/users'
import type { User } from '../data/users'
import { mockRoles } from '../data/roles'
import type { Role } from '../data/roles'

const badgeVariants: Array<'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'> = [
  'primary',
  'info',
  'success',
  'warning',
  'secondary',
  'danger',
]

const getRoleVariant = (roleId: number) => badgeVariants[(roleId - 1) % badgeVariants.length]
const getRoleName = (roleId: number) => mockRoles.find((role) => role.id === roleId)?.name ?? 'Unknown'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: DEPARTMENTS[0],
    roleId: mockRoles[0]?.id ?? 0,
    status: 'active',
  })

  const [nameQuery, setNameQuery] = useState('')
  const [emailQuery, setEmailQuery] = useState('')
  const [phoneQuery, setPhoneQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredUsers = useMemo(() => {
    const name = nameQuery.trim().toLowerCase()
    const email = emailQuery.trim().toLowerCase()
    const phone = phoneQuery.replace(/[\s-]/g, '')

    return users.filter((user) => {
      const matchesName = !name || user.name.toLowerCase().includes(name)
      const matchesEmail = !email || user.email.toLowerCase().includes(email)
      const matchesPhone = !phone || user.phone.includes(phone)
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter
      const matchesRole = roleFilter === 'all' || user.roleId === Number(roleFilter)
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter

      return matchesName && matchesEmail && matchesPhone && matchesDepartment && matchesRole && matchesStatus
    })
  }, [users, nameQuery, emailQuery, phoneQuery, departmentFilter, roleFilter, statusFilter])

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      roleId: user.roleId,
      status: user.status,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (user: User) => {
    setDeleteTarget(user)
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      setUsers(users.filter((user) => user.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const handleAdd = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: DEPARTMENTS[0],
      roleId: mockRoles[0]?.id ?? 0,
      status: 'active',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (editingUser) {
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? { ...user, ...formData, status: formData.status as 'active' | 'inactive' }
            : user,
        ),
      )
    } else {
      const newUser: User = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        ...formData,
        status: formData.status as 'active' | 'inactive',
        createdAt: new Date().toISOString().split('T')[0],
      }
      setUsers([...users, newUser])
    }

    setIsModalOpen(false)
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'department', header: 'Department' },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => <Badge variant={getRoleVariant(user.roleId)}>{getRoleName(user.roleId)}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => <Badge variant={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge>,
    },
    { key: 'createdAt', header: 'Created At' },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="d-flex align-items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(user)}>
            <Trash2 size={16} className="text-danger" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageToolbar
        title="Users"
        description="Manage user accounts and permissions"
        actions={
          <Button onClick={handleAdd}>
            <Plus size={18} className="me-2" />
            Add User
          </Button>
        }
      />

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={2}>
            <Input
              label="Name"
              placeholder="Search by name..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Input
              label="Email"
              placeholder="Search by email..."
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
            />
          </Col>
          <Col xs={12} md={6} lg={2}>
            <Input
              label="Phone"
              placeholder="Search by phone..."
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
            />
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Select label="Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              {mockRoles.map((role: Role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={6} md={3} lg={2}>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Col>
        </Row>

        <Table columns={columns} data={filteredUsers} emptyMessage="No users match your search or filters" />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[\s-]/g, '') })}
            placeholder="+6281234567890"
            required
          />
          <Select
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          >
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
          <Select
            label="Role"
            value={formData.roleId}
            onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
          >
            {mockRoles.map((role: Role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="d-flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-fill">
              Cancel
            </Button>
            <Button type="submit" className="flex-fill">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User" size="sm">
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

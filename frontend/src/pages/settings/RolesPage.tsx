import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Pencil, Trash2, Plus } from '../../components/common/Icons'
import { mockRoles, MODULES, ALL_ACTIONS } from '../../data/roles'
import type { Role, PermissionAction } from '../../data/roles'
import { mockUsers } from '../../data/users'
import { useSession } from '../../data/session'
import { useActivityLog } from '../../data/activityLog'

interface RoleFormData {
  name: string
  description: string
  permissions: Record<string, PermissionAction[]>
}

const emptyFormData: RoleFormData = { name: '', description: '', permissions: {} }

export default function RolesPage() {
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()
  const [roles, setRoles] = useState<Role[]>(mockRoles)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
  const [formData, setFormData] = useState<RoleFormData>(emptyFormData)

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({ name: role.name, description: role.description, permissions: role.permissions })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingRole(null)
    setFormData(emptyFormData)
    setIsModalOpen(true)
  }

  const handleDelete = (role: Role) => {
    setDeleteTarget(role)
  }

  const confirmDelete = () => {
    if (deleteTarget && !isRoleInUse(deleteTarget.id)) {
      setRoles(roles.filter((role) => role.id !== deleteTarget.id))
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'delete',
        module: 'roles',
        description: `Deleted role ${deleteTarget.name}`,
      })
    }
    setDeleteTarget(null)
  }

  const usersWithRole = (roleId: number) => mockUsers.filter((user) => user.roleId === roleId)
  const isRoleInUse = (roleId: number) => usersWithRole(roleId).length > 0

  const togglePermission = (moduleKey: string, action: PermissionAction) => {
    setFormData((prev) => {
      const current = prev.permissions[moduleKey] ?? []
      const updated = current.includes(action) ? current.filter((a) => a !== action) : [...current, action]
      return { ...prev, permissions: { ...prev.permissions, [moduleKey]: updated } }
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (editingRole) {
      setRoles(roles.map((role) => (role.id === editingRole.id ? { ...role, ...formData } : role)))
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'update',
        module: 'roles',
        description: `Updated role ${formData.name}`,
      })
    } else {
      const newRole: Role = {
        id: Math.max(...roles.map((r) => r.id), 0) + 1,
        ...formData,
      }
      setRoles([...roles, newRole])
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'create',
        module: 'roles',
        description: `Created role ${newRole.name}`,
      })
    }

    setIsModalOpen(false)
  }

  const columns = [
    { key: 'name', header: 'Name', render: (role: Role) => <span className="fw-medium">{role.name}</span> },
    { key: 'description', header: 'Description' },
    {
      key: 'modules',
      header: 'Modules',
      render: (role: Role) => {
        const count = Object.values(role.permissions).filter((actions) => actions.length > 0).length
        return (
          <Badge variant="secondary">
            {count} / {MODULES.length} modules
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (role: Role) => (
        <div className="d-flex align-items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(role)}>
            <Trash2 size={16} className="text-danger" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="h5 fw-bold mb-1">Roles</h2>
          <p className="text-muted small mb-0">
            Define roles and control which modules & actions each role can access
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={18} className="me-2" />
          Add Role
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={roles} emptyMessage="No roles yet" />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Add Role'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Warehouse Staff"
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Short description of this role"
          />

          <div>
            <label className="form-label">Permissions</label>
            <div className="table-responsive border rounded-3">
              <table className="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="text-uppercase small text-muted">Module</th>
                    {ALL_ACTIONS.map((action) => (
                      <th key={action} className="text-uppercase small text-muted text-center">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((module) => (
                    <tr key={module.key}>
                      <td className="fw-medium">{module.label}</td>
                      {ALL_ACTIONS.map((action) => (
                        <td key={action} className="text-center">
                          {module.actions.includes(action) ? (
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={formData.permissions[module.key]?.includes(action) ?? false}
                              onChange={() => togglePermission(module.key, action)}
                            />
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-fill">
              Cancel
            </Button>
            <Button type="submit" className="flex-fill">
              {editingRole ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Role" size="sm">
        {deleteTarget && isRoleInUse(deleteTarget.id) ? (
          <>
            <p className="mb-4">
              <strong>{deleteTarget.name}</strong> masih digunakan oleh {usersWithRole(deleteTarget.id).length} user
              ({usersWithRole(deleteTarget.id).map((user) => user.name).join(', ')}). Pindahkan user tersebut ke role
              lain dulu sebelum menghapus role ini.
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

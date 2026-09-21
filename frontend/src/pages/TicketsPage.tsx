import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import PageToolbar from '../components/common/PageToolbar'
import { Pencil, Trash2, Plus } from '../components/common/Icons'
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  NEXT_STATUS,
  isTicketOverdue,
  useTickets,
} from '../data/tickets'
import type { Ticket, TicketPriority, TicketStatus } from '../data/tickets'
import { mockUsers } from '../data/users'
import { useSession } from '../data/session'
import { useActivityLog } from '../data/activityLog'
import { hasPermission } from '../utils/permissions'

const emptyFormData = {
  title: '',
  description: '',
  category: TICKET_CATEGORIES[0],
  priority: 'medium' as TicketPriority,
  assigneeId: 0,
  dueDate: '',
}

const priorityVariant: Record<TicketPriority, 'secondary' | 'info' | 'warning' | 'danger'> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

const statusVariant: Record<TicketStatus, 'warning' | 'info' | 'success' | 'secondary'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'secondary',
}

const statusLabel: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const nextStatusLabel: Record<TicketStatus, string> = {
  open: 'Start Progress',
  in_progress: 'Mark Resolved',
  resolved: 'Close Ticket',
  closed: '',
}

const today = () => new Date().toISOString().split('T')[0]

export default function TicketsPage() {
  const { tickets, setTickets, comments, setComments } = useTickets()
  const { currentUser } = useSession()
  const { logActivity } = useActivityLog()

  const canCreate = hasPermission(currentUser, 'tickets', 'create')
  const canEdit = hasPermission(currentUser, 'tickets', 'edit')
  const canDelete = hasPermission(currentUser, 'tickets', 'delete')

  const activeUsers = mockUsers.filter((user) => user.status === 'active')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null)
  const [detailTarget, setDetailTarget] = useState<Ticket | null>(null)
  const [formData, setFormData] = useState(emptyFormData)
  const [commentText, setCommentText] = useState('')

  const [titleQuery, setTitleQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const getUserName = (userId?: number) => mockUsers.find((user) => user.id === userId)?.name ?? '-'

  const filteredTickets = useMemo(() => {
    const title = titleQuery.trim().toLowerCase()
    return tickets
      .filter((ticket) => {
        const matchesTitle = !title || ticket.title.toLowerCase().includes(title)
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
        const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
        const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
        return matchesTitle && matchesStatus && matchesPriority && matchesCategory
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [tickets, titleQuery, statusFilter, priorityFilter, categoryFilter])

  const ticketComments = (ticketId: number) =>
    comments.filter((c) => c.ticketId === ticketId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))

  const canChangeStatus = (ticket: Ticket) => canEdit || ticket.assigneeId === currentUser.id

  const handleAdd = () => {
    setEditingTicket(null)
    setFormData(emptyFormData)
    setIsModalOpen(true)
  }

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setFormData({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      assigneeId: ticket.assigneeId ?? 0,
      dueDate: ticket.dueDate ?? '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = (ticket: Ticket) => setDeleteTarget(ticket)

  const confirmDelete = () => {
    if (deleteTarget) {
      setTickets(tickets.filter((t) => t.id !== deleteTarget.id))
      setComments(comments.filter((c) => c.ticketId !== deleteTarget.id))
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'delete',
        module: 'tickets',
        description: `Deleted ticket #${deleteTarget.id} (${deleteTarget.title})`,
      })
    }
    setDeleteTarget(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const assigneeId = formData.assigneeId || undefined

    if (editingTicket) {
      setTickets(
        tickets.map((t) =>
          t.id === editingTicket.id
            ? {
                ...t,
                title: formData.title,
                description: formData.description,
                category: formData.category,
                priority: formData.priority,
                assigneeId,
                dueDate: formData.dueDate || undefined,
              }
            : t,
        ),
      )
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'update',
        module: 'tickets',
        description: `Updated ticket #${editingTicket.id} (${formData.title})`,
      })
    } else {
      const newTicket: Ticket = {
        id: Math.max(...tickets.map((t) => t.id), 0) + 1,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'open',
        reporterId: currentUser.id,
        assigneeId,
        createdAt: today(),
        dueDate: formData.dueDate || undefined,
      }
      setTickets([...tickets, newTicket])
      logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'create',
        module: 'tickets',
        description: `Created ticket #${newTicket.id} (${newTicket.title})`,
      })
    }

    setIsModalOpen(false)
  }

  const advanceStatus = (ticket: Ticket) => {
    const next = NEXT_STATUS[ticket.status]
    if (!next) return
    setTickets(
      tickets.map((t) =>
        t.id === ticket.id ? { ...t, status: next, resolvedAt: next === 'resolved' ? today() : t.resolvedAt } : t,
      ),
    )
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      module: 'tickets',
      description: `Changed status of ticket #${ticket.id} (${ticket.title}) to ${statusLabel[next]}`,
    })
    setDetailTarget((prev) => (prev && prev.id === ticket.id ? { ...prev, status: next } : prev))
  }

  const reopenTicket = (ticket: Ticket) => {
    setTickets(tickets.map((t) => (t.id === ticket.id ? { ...t, status: 'open', resolvedAt: undefined } : t)))
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      module: 'tickets',
      description: `Reopened ticket #${ticket.id} (${ticket.title})`,
    })
    setDetailTarget((prev) => (prev && prev.id === ticket.id ? { ...prev, status: 'open' } : prev))
  }

  const handleAddComment = (ticket: Ticket) => {
    const text = commentText.trim()
    if (!text) return
    setComments([
      ...comments,
      { id: Math.max(...comments.map((c) => c.id), 0) + 1, ticketId: ticket.id, userId: currentUser.id, text, createdAt: new Date().toISOString() },
    ])
    logActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update',
      module: 'tickets',
      description: `Commented on ticket #${ticket.id} (${ticket.title})`,
    })
    setCommentText('')
  }

  const columns = [
    { key: 'id', header: '#', render: (t: Ticket) => `#${t.id}` },
    { key: 'title', header: 'Title', render: (t: Ticket) => <span className="fw-medium">{t.title}</span> },
    { key: 'category', header: 'Category' },
    {
      key: 'priority',
      header: 'Priority',
      render: (t: Ticket) => <Badge variant={priorityVariant[t.priority]}>{t.priority.toUpperCase()}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Ticket) => <Badge variant={statusVariant[t.status]}>{statusLabel[t.status]}</Badge>,
    },
    { key: 'reporter', header: 'Reporter', render: (t: Ticket) => getUserName(t.reporterId) },
    { key: 'assignee', header: 'Assignee', render: (t: Ticket) => t.assigneeId ? getUserName(t.assigneeId) : <span className="text-muted small">Unassigned</span> },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (t: Ticket) =>
        t.dueDate ? (
          <span className={isTicketOverdue(t) ? 'text-danger fw-medium' : undefined}>
            {t.dueDate}
            {isTicketOverdue(t) && <Badge variant="danger" className="ms-2">Overdue</Badge>}
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t: Ticket) => (
        <div className="d-flex align-items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDetailTarget(t)}>
            View
          </Button>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>
              <Pencil size={16} />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(t)}>
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
        title="Tickets"
        description="Internal support request & issue tracking"
        actions={
          canCreate && (
            <Button onClick={handleAdd}>
              <Plus size={18} className="me-2" />
              Add Ticket
            </Button>
          )
        }
      />

      <Card>
        <Row className="g-3 mb-3">
          <Col xs={12} md={6} lg={3}>
            <Input label="Title" placeholder="Search by title..." value={titleQuery} onChange={(e) => setTitleQuery(e.target.value)} />
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">All Priorities</option>
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table columns={columns} data={filteredTickets} emptyMessage="No tickets match your search or filters" />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTicket ? `Edit Ticket #${editingTicket.id}` : 'Add Ticket'}
      >
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Laptop tidak bisa connect ke WiFi kantor"
            required
          />
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan detail masalah/permintaan..."
              required
            />
          </Form.Group>
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Select label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                {TICKET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={6}>
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
              >
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </Col>
          </Row>
          <Select
            label="Assignee (optional)"
            value={formData.assigneeId}
            onChange={(e) => setFormData({ ...formData, assigneeId: Number(e.target.value) })}
          >
            <option value={0}>Unassigned</option>
            {activeUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <div className="d-flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-fill">
              Cancel
            </Button>
            <Button type="submit" className="flex-fill">
              {editingTicket ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Ticket" size="sm">
        <p className="mb-4">
          Are you sure you want to delete <strong>#{deleteTarget?.id} {deleteTarget?.title}</strong>? This action cannot be undone.
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

      <Modal
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget ? `#${detailTarget.id} ${detailTarget.title}` : ''}
        size="lg"
        scrollable
      >
        {detailTarget && (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-wrap gap-2">
              <Badge variant={priorityVariant[detailTarget.priority]}>{detailTarget.priority.toUpperCase()}</Badge>
              <Badge variant={statusVariant[detailTarget.status]}>{statusLabel[detailTarget.status]}</Badge>
              <Badge variant="dark">{detailTarget.category}</Badge>
            </div>
            <p className="mb-0">{detailTarget.description}</p>
            <Row className="g-2 small text-muted">
              <Col xs={6} md={3}>
                <div className="fw-medium text-body">Reporter</div>
                {getUserName(detailTarget.reporterId)}
              </Col>
              <Col xs={6} md={3}>
                <div className="fw-medium text-body">Assignee</div>
                {detailTarget.assigneeId ? getUserName(detailTarget.assigneeId) : 'Unassigned'}
              </Col>
              <Col xs={6} md={3}>
                <div className="fw-medium text-body">Created</div>
                {detailTarget.createdAt}
              </Col>
              <Col xs={6} md={3}>
                <div className="fw-medium text-body">Due Date</div>
                <span className={isTicketOverdue(detailTarget) ? 'text-danger fw-medium' : undefined}>
                  {detailTarget.dueDate ?? '-'}
                </span>
              </Col>
            </Row>
            {isTicketOverdue(detailTarget) && (
              <div className="alert alert-danger py-2 px-3 mb-0 small">
                This ticket is overdue — due date has passed and it is still {statusLabel[detailTarget.status].toLowerCase()}.
              </div>
            )}

            {canChangeStatus(detailTarget) && (
              <div className="d-flex gap-2">
                {NEXT_STATUS[detailTarget.status] && (
                  <Button size="sm" onClick={() => advanceStatus(detailTarget)}>
                    {nextStatusLabel[detailTarget.status]}
                  </Button>
                )}
                {(detailTarget.status === 'resolved' || detailTarget.status === 'closed') && (
                  <Button size="sm" variant="secondary" onClick={() => reopenTicket(detailTarget)}>
                    Reopen
                  </Button>
                )}
              </div>
            )}

            <hr className="my-1" />

            <div>
              <p className="fw-medium mb-2">Comments</p>
              <div className="d-flex flex-column gap-2 mb-3">
                {ticketComments(detailTarget.id).length === 0 && (
                  <p className="text-muted small mb-0">No comments yet</p>
                )}
                {ticketComments(detailTarget.id).map((comment) => (
                  <div key={comment.id} className="border rounded-3 p-2 bg-light">
                    <div className="d-flex justify-content-between">
                      <span className="fw-medium small">{getUserName(comment.userId)}</span>
                      <span className="text-muted small">{new Date(comment.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="mb-0 small">{comment.text}</p>
                  </div>
                ))}
              </div>
              {canCreate && (
                <div className="d-flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Tulis komentar..."
                    className="flex-fill"
                  />
                  <Button type="button" onClick={() => handleAddComment(detailTarget)}>
                    Post
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

import { useMemo } from 'react'
import { Row, Col } from 'react-bootstrap'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import PageToolbar from '../components/common/PageToolbar'
import { useCompanies } from '../data/companies'
import { useSuppliers } from '../data/suppliers'
import { useInventoryData } from '../data/inventory'
import type { StockTransaction } from '../data/inventory'
import { useWarehouses } from '../data/warehouses'
import { useSession } from '../data/session'

const statusVariant: Record<StockTransaction['status'], 'success' | 'warning' | 'danger' | 'info'> = {
  approved: 'success',
  pending: 'warning',
  pending_level2: 'info',
  rejected: 'danger',
}
const statusLabel: Record<StockTransaction['status'], string> = {
  approved: 'Approved',
  pending: 'Pending',
  pending_level2: 'Pending Final',
  rejected: 'Rejected',
}

export default function SupplierPortalPage() {
  const { currentUser } = useSession()
  const { companies } = useCompanies()
  const { suppliers } = useSuppliers()
  const { items, transactions } = useInventoryData()
  const { warehouses } = useWarehouses()

  const myCompany = companies.find((c) => c.id === currentUser.companyId)
  const linkedSupplier = myCompany?.supplierId ? suppliers.find((s) => s.id === myCompany.supplierId) : undefined

  const getItemName = (itemId: number) => items.find((item) => item.id === itemId)?.name ?? 'Unknown'
  const getItemUnit = (itemId: number) => items.find((item) => item.id === itemId)?.unit ?? ''
  const getWarehouseName = (warehouseId?: number) =>
    warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? '-'

  const myDeliveries = useMemo(() => {
    if (!linkedSupplier) return []
    return transactions
      .filter((t) => t.type === 'in' && t.supplierId === linkedSupplier.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [transactions, linkedSupplier])

  const columns = [
    { key: 'date', header: 'Date' },
    { key: 'item', header: 'Item', render: (t: StockTransaction) => getItemName(t.itemId) },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (t: StockTransaction) =>
        t.purchaseQuantity
          ? `${t.quantity} ${getItemUnit(t.itemId)} (${t.purchaseQuantity} ${t.purchaseUnit})`
          : `${t.quantity} ${getItemUnit(t.itemId)}`,
    },
    { key: 'warehouse', header: 'Delivered To', render: (t: StockTransaction) => getWarehouseName(t.warehouseId) },
    { key: 'reference', header: 'Reference (PO)', render: (t: StockTransaction) => t.reference ?? '-' },
    {
      key: 'status',
      header: 'Status',
      render: (t: StockTransaction) => <Badge variant={statusVariant[t.status]}>{statusLabel[t.status]}</Badge>,
    },
  ]

  return (
    <div>
      <PageToolbar
        title="Supplier Portal"
        description="Profil company Anda dan riwayat pengiriman yang tercatat di sistem — cuma menampilkan data milik company Anda sendiri"
      />

      {!myCompany ? (
        <Card>
          <p className="text-muted mb-0">Company Anda tidak ditemukan. Hubungi admin.</p>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <Row className="g-3">
              <Col xs={12} md={6}>
                <p className="text-muted small mb-1">Company Name</p>
                <p className="fw-medium mb-0">{myCompany.name}</p>
              </Col>
              <Col xs={6} md={3}>
                <p className="text-muted small mb-1">Status</p>
                <Badge variant={myCompany.status === 'active' ? 'success' : 'secondary'}>{myCompany.status}</Badge>
              </Col>
              <Col xs={6} md={3}>
                <p className="text-muted small mb-1">Phone</p>
                <p className="mb-0">{myCompany.phone}</p>
              </Col>
              <Col xs={12} md={6}>
                <p className="text-muted small mb-1">Email</p>
                <p className="mb-0">{myCompany.email}</p>
              </Col>
              <Col xs={12} md={6}>
                <p className="text-muted small mb-1">Address</p>
                <p className="mb-0">{myCompany.address}</p>
              </Col>
            </Row>
          </Card>

          <div className="mb-3">
            <h2 className="h6 fw-bold mb-1">My Deliveries</h2>
            <p className="text-muted small mb-0">
              Riwayat Stock In yang dicatat sistem untuk pengiriman dari company Anda
            </p>
          </div>

          {!linkedSupplier ? (
            <Card>
              <p className="text-muted mb-0">
                Company Anda belum dihubungkan ke record Supplier manapun, jadi belum ada riwayat pengiriman yang
                bisa ditampilkan. Hubungi admin untuk menghubungkan company Anda ke record Supplier yang sesuai.
              </p>
            </Card>
          ) : (
            <Card>
              <Table columns={columns} data={myDeliveries} emptyMessage="Belum ada pengiriman yang tercatat" />
            </Card>
          )}
        </>
      )}
    </div>
  )
}

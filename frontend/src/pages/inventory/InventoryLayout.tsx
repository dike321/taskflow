import type { Dispatch, SetStateAction } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Nav } from 'react-bootstrap'
import PageToolbar from '../../components/common/PageToolbar'
import { useSession } from '../../data/session'
import { hasModuleAccess } from '../../utils/permissions'
import { useInventoryData } from '../../data/inventory'
import type { Item, StockTransaction, WarehouseStock } from '../../data/inventory'

export interface InventoryContext {
  items: Item[]
  setItems: Dispatch<SetStateAction<Item[]>>
  transactions: StockTransaction[]
  setTransactions: Dispatch<SetStateAction<StockTransaction[]>>
  warehouseStock: WarehouseStock[]
  setWarehouseStock: Dispatch<SetStateAction<WarehouseStock[]>>
}

const tabs = [
  { path: 'stock-in', label: 'Stock In', module: 'inventory.stockIn' },
  { path: 'stock-out', label: 'Stock Out', module: 'inventory.stockOut' },
  { path: 'transfer', label: 'Transfer', module: 'inventory.transfer' },
  { path: 'history', label: 'History', module: 'inventory.history' },
]

export default function InventoryLayout() {
  const { currentUser } = useSession()
  const { items, setItems, transactions, setTransactions, warehouseStock, setWarehouseStock } = useInventoryData()

  const visibleTabs = tabs.filter((tab) => hasModuleAccess(currentUser, tab.module))

  const context: InventoryContext = { items, setItems, transactions, setTransactions, warehouseStock, setWarehouseStock }

  return (
    <div>
      <PageToolbar title="Inventory" description="Manage items and track incoming/outgoing stock" />

      <Nav variant="tabs" className="mb-4">
        {visibleTabs.map((tab) => (
          <Nav.Item key={tab.path}>
            <Nav.Link as={NavLink} to={tab.path}>
              {tab.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <Outlet context={context} />
    </div>
  )
}

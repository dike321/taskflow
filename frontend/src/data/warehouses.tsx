import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

export interface Warehouse {
  id: number
  code: string
  name: string
  address: string
  status: 'active' | 'inactive'
}

export const mockWarehouses: Warehouse[] = [
  {
    id: 1,
    code: 'WH-JKT',
    name: 'Gudang Pusat Jakarta',
    address: 'Jl. Industri Raya No. 12, Cakung, Jakarta Timur',
    status: 'active',
  },
  {
    id: 2,
    code: 'WH-SBY',
    name: 'Gudang Cabang Surabaya',
    address: 'Jl. Rungkut Industri No. 5, Surabaya',
    status: 'active',
  },
  {
    id: 3,
    code: 'WH-BDG',
    name: 'Gudang Cabang Bandung',
    address: 'Jl. Soekarno Hatta No. 88, Bandung',
    status: 'active',
  },
]

interface WarehousesContextValue {
  warehouses: Warehouse[]
  setWarehouses: Dispatch<SetStateAction<Warehouse[]>>
}

const WarehousesContext = createContext<WarehousesContextValue | undefined>(undefined)

export function WarehousesProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses)

  return <WarehousesContext.Provider value={{ warehouses, setWarehouses }}>{children}</WarehousesContext.Provider>
}

export function useWarehouses() {
  const context = useContext(WarehousesContext)
  if (!context) throw new Error('useWarehouses must be used within a WarehousesProvider')
  return context
}

import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

export interface Supplier {
  id: number
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  status: 'active' | 'inactive'
}

export const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'PT Alat Tulis Sejahtera',
    contactPerson: 'Budi Santoso',
    phone: '+622155512001',
    email: 'sales@alattulisejahtera.co.id',
    address: 'Jl. Gudang Peluru No. 12, Jakarta Timur',
    status: 'active',
  },
  {
    id: 2,
    name: 'CV Elektronik Jaya Abadi',
    contactPerson: 'Dewi Anggraini',
    phone: '+622155512002',
    email: 'order@elektronikjaya.co.id',
    address: 'Jl. Mangga Dua Raya No. 88, Jakarta Utara',
    status: 'active',
  },
  {
    id: 3,
    name: 'PT Consumable Nusantara',
    contactPerson: 'Rudi Hartono',
    phone: '+622155512003',
    email: 'purchasing@consumablenusantara.co.id',
    address: 'Jl. Raya Bekasi No. 45, Bekasi',
    status: 'inactive',
  },
]

interface SuppliersContextValue {
  suppliers: Supplier[]
  setSuppliers: Dispatch<SetStateAction<Supplier[]>>
}

const SuppliersContext = createContext<SuppliersContextValue | undefined>(undefined)

export function SuppliersProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers)

  return <SuppliersContext.Provider value={{ suppliers, setSuppliers }}>{children}</SuppliersContext.Provider>
}

export function useSuppliers() {
  const context = useContext(SuppliersContext)
  if (!context) throw new Error('useSuppliers must be used within a SuppliersProvider')
  return context
}

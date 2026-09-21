import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

export type CompanyType = 'internal' | 'supplier'

export interface Company {
  id: number
  name: string
  /** internal = organisasi sendiri (operator warehouse), supplier = perusahaan vendor eksternal. */
  type: CompanyType
  address: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  /** Cuma relevan kalau type 'supplier' — Supplier.id di data/suppliers.tsx yang direpresentasikan company ini, dipakai untuk scoping Supplier Portal (data/tickets.tsx-style link, bukan merge entity). */
  supplierId?: number
}

export const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'PT Sinergi Logistik Nusantara',
    type: 'internal',
    address: 'Jl. Industri Raya No. 45, Jakarta Timur',
    phone: '+62 21 5551234',
    email: 'info@sinergilogistik.co.id',
    status: 'active',
  },
  {
    id: 2,
    name: 'PT Alat Tulis Sejahtera',
    type: 'supplier',
    address: 'Jl. Gudang Peluru No. 12, Jakarta Timur',
    phone: '+622155512001',
    email: 'sales@alattulisejahtera.co.id',
    status: 'active',
    supplierId: 1,
  },
  {
    id: 3,
    name: 'CV Elektronik Jaya Abadi',
    type: 'supplier',
    address: 'Jl. Mangga Dua Raya No. 88, Jakarta Utara',
    phone: '+622155512002',
    email: 'order@elektronikjaya.co.id',
    status: 'active',
    supplierId: 2,
  },
]

interface CompaniesContextValue {
  companies: Company[]
  setCompanies: Dispatch<SetStateAction<Company[]>>
}

const CompaniesContext = createContext<CompaniesContextValue | undefined>(undefined)

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies)

  return <CompaniesContext.Provider value={{ companies, setCompanies }}>{children}</CompaniesContext.Provider>
}

export function useCompanies() {
  const context = useContext(CompaniesContext)
  if (!context) throw new Error('useCompanies must be used within a CompaniesProvider')
  return context
}

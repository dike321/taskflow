import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

export interface CompanyProfile {
  name: string
  address: string
  phone: string
  email: string
}

export const mockCompanyProfile: CompanyProfile = {
  name: 'PT Sinergi Logistik Nusantara',
  address: 'Jl. Industri Raya No. 45, Jakarta Timur',
  phone: '+62 21 5551234',
  email: 'info@sinergilogistik.co.id',
}

export interface NotificationPreferences {
  lowStockAlert: boolean
  approvalPendingAlert: boolean
  emailNotifications: boolean
}

export const mockNotificationPreferences: NotificationPreferences = {
  lowStockAlert: true,
  approvalPendingAlert: true,
  emailNotifications: false,
}

const DEFAULT_APPROVAL_THRESHOLD = 100

interface ApprovalSettingsContextValue {
  approvalThreshold: number
  setApprovalThreshold: Dispatch<SetStateAction<number>>
}

const ApprovalSettingsContext = createContext<ApprovalSettingsContextValue | undefined>(undefined)

export function ApprovalSettingsProvider({ children }: { children: ReactNode }) {
  const [approvalThreshold, setApprovalThreshold] = useState<number>(DEFAULT_APPROVAL_THRESHOLD)

  return (
    <ApprovalSettingsContext.Provider value={{ approvalThreshold, setApprovalThreshold }}>
      {children}
    </ApprovalSettingsContext.Provider>
  )
}

export function useApprovalSettings() {
  const context = useContext(ApprovalSettingsContext)
  if (!context) throw new Error('useApprovalSettings must be used within an ApprovalSettingsProvider')
  return context
}

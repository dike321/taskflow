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

interface NotificationPreferencesContextValue {
  preferences: NotificationPreferences
  setPreferences: Dispatch<SetStateAction<NotificationPreferences>>
}

const NotificationPreferencesContext = createContext<NotificationPreferencesContextValue | undefined>(undefined)

export function NotificationPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(mockNotificationPreferences)

  return (
    <NotificationPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </NotificationPreferencesContext.Provider>
  )
}

export function useNotificationPreferences() {
  const context = useContext(NotificationPreferencesContext)
  if (!context) throw new Error('useNotificationPreferences must be used within a NotificationPreferencesProvider')
  return context
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

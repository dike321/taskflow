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

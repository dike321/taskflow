import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type ActivityAction = 'create' | 'update' | 'delete' | 'approve' | 'reject'

export interface ActivityLogEntry {
  id: number
  timestamp: string
  userId: number
  userName: string
  action: ActivityAction
  module: string
  description: string
}

const seedLog: ActivityLogEntry[] = [
  {
    id: 1,
    timestamp: '2024-03-01T08:00:00',
    userId: 4,
    userName: 'Alice Brown',
    action: 'create',
    module: 'inventory.stockIn',
    description: 'Created Stock In for Kertas A4 80gsm (+50 rim), ref PO-2024-001',
  },
  {
    id: 2,
    timestamp: '2024-03-01T08:05:00',
    userId: 2,
    userName: 'Jane Smith',
    action: 'approve',
    module: 'inventory.stockIn',
    description: 'Approved Stock In for Kertas A4 80gsm (+50 rim)',
  },
  {
    id: 3,
    timestamp: '2024-03-05T09:00:00',
    userId: 4,
    userName: 'Alice Brown',
    action: 'create',
    module: 'inventory.stockIn',
    description: 'Created Stock In for Laptop Dell Latitude (+5 unit), ref PO-2024-002',
  },
  {
    id: 4,
    timestamp: '2024-03-05T09:10:00',
    userId: 5,
    userName: 'Charlie Wilson',
    action: 'approve',
    module: 'inventory.stockIn',
    description: 'Approved Stock In for Laptop Dell Latitude (+5 unit)',
  },
  {
    id: 5,
    timestamp: '2024-03-10T10:00:00',
    userId: 4,
    userName: 'Alice Brown',
    action: 'create',
    module: 'inventory.stockOut',
    description: 'Created Stock Out for Monitor LED 24" (-2 unit) for IT Department',
  },
  {
    id: 6,
    timestamp: '2024-03-10T10:15:00',
    userId: 2,
    userName: 'Jane Smith',
    action: 'approve',
    module: 'inventory.stockOut',
    description: 'Approved Stock Out for Monitor LED 24" (-2 unit)',
  },
  {
    id: 7,
    timestamp: '2024-03-12T11:00:00',
    userId: 4,
    userName: 'Alice Brown',
    action: 'create',
    module: 'inventory.stockOut',
    description: 'Created Stock Out for Tinta Printer Hitam (-3 botol) for Finance Department',
  },
]

interface ActivityLogContextValue {
  entries: ActivityLogEntry[]
  logActivity: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void
}

const ActivityLogContext = createContext<ActivityLogContextValue | undefined>(undefined)

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>(seedLog)

  const logActivity = (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    setEntries((prev) => [
      { ...entry, id: Math.max(...prev.map((e) => e.id), 0) + 1, timestamp: new Date().toISOString() },
      ...prev,
    ])
  }

  return <ActivityLogContext.Provider value={{ entries, logActivity }}>{children}</ActivityLogContext.Provider>
}

export function useActivityLog() {
  const context = useContext(ActivityLogContext)
  if (!context) throw new Error('useActivityLog must be used within an ActivityLogProvider')
  return context
}

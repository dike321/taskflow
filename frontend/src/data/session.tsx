import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { mockUsers } from './users'
import type { User } from './users'

interface SessionContextValue {
  currentUser: User
  updateCurrentUser: (updates: Partial<User>) => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0])

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }))
  }

  return <SessionContext.Provider value={{ currentUser, updateCurrentUser }}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')
  return context
}

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { mockUsers } from './users'
import type { User } from './users'

interface SessionContextValue {
  currentUser: User
  updateCurrentUser: (updates: Partial<User>) => void
  switchUser: (userId: number) => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0])

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }))
  }

  const switchUser = (userId: number) => {
    const user = mockUsers.find((u) => u.id === userId)
    if (user) setCurrentUser(user)
  }

  return (
    <SessionContext.Provider value={{ currentUser, updateCurrentUser, switchUser }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')
  return context
}

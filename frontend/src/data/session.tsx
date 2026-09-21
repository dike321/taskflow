import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { mockUsers } from './users'
import type { User } from './users'

export type LoginResult = { success: true } | { success: false; error: string }

interface SessionContextValue {
  currentUser: User
  isAuthenticated: boolean
  updateCurrentUser: (updates: Partial<User>) => void
  switchUser: (userId: number) => void
  /** Tidak ada backend/credential store nyata — login cuma mencocokkan email ke mockUsers, password tidak diverifikasi. */
  login: (email: string) => LoginResult
  logout: () => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }))
  }

  const switchUser = (userId: number) => {
    const user = mockUsers.find((u) => u.id === userId)
    if (user) setCurrentUser(user)
  }

  const login = (email: string): LoginResult => {
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) return { success: false, error: 'Email tidak terdaftar' }
    if (user.status !== 'active') return { success: false, error: 'Akun ini nonaktif, hubungi admin' }
    setCurrentUser(user)
    setIsAuthenticated(true)
    return { success: true }
  }

  const logout = () => {
    setIsAuthenticated(false)
  }

  return (
    <SessionContext.Provider
      value={{ currentUser, isAuthenticated, updateCurrentUser, switchUser, login, logout }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')
  return context
}

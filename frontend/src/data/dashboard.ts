import type { ComponentType } from 'react'
import { Users, FolderKanban, Ticket, TrendingUp } from '../components/common/Icons'

interface IconProps {
  size?: number
  className?: string
}

export interface StatItem {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: ComponentType<IconProps>
  variant: string
}

export interface ActivityItem {
  id: number
  user: string
  action: string
  time: string
}

export interface QuickAction {
  label: string
  description: string
  icon: ComponentType<IconProps>
  variant: string
}

export const dashboardStats: StatItem[] = [
  { title: 'Total Users', value: '1,234', change: '+12%', trend: 'up', icon: Users, variant: 'primary' },
  { title: 'Active Projects', value: '45', change: '+5%', trend: 'up', icon: FolderKanban, variant: 'success' },
  { title: 'Open Tickets', value: '128', change: '-3%', trend: 'down', icon: Ticket, variant: 'warning' },
  { title: 'Productivity', value: '87%', change: '+8%', trend: 'up', icon: TrendingUp, variant: 'info' },
]

export const recentActivities: ActivityItem[] = [
  { id: 1, user: 'John Doe', action: 'created a new project', time: '2 minutes ago' },
  { id: 2, user: 'Jane Smith', action: 'updated ticket #123', time: '5 minutes ago' },
  { id: 3, user: 'Bob Johnson', action: 'completed task #456', time: '10 minutes ago' },
  { id: 4, user: 'Alice Brown', action: 'added a comment', time: '15 minutes ago' },
  { id: 5, user: 'Charlie Wilson', action: 'assigned ticket to John', time: '20 minutes ago' },
]

export const quickActions: QuickAction[] = [
  { label: 'Add User', description: 'Create new user', icon: Users, variant: 'primary' },
  { label: 'New Project', description: 'Start a project', icon: FolderKanban, variant: 'success' },
  { label: 'Create Ticket', description: 'Add new ticket', icon: Ticket, variant: 'warning' },
  { label: 'View Reports', description: 'Analytics', icon: TrendingUp, variant: 'info' },
]

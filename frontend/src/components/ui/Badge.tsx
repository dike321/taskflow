import type { HTMLAttributes } from 'react'
import { Badge as BsBadge } from 'react-bootstrap'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'
}

export default function Badge({ variant = 'secondary', className = '', children, ...props }: BadgeProps) {
  return (
    <BsBadge bg={variant} className={`fw-medium ${className}`} {...props}>
      {children}
    </BsBadge>
  )
}

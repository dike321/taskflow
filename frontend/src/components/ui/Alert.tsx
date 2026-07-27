import type { HTMLAttributes } from 'react'
import { Alert as BsAlert } from 'react-bootstrap'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  onClose?: () => void
}

export default function Alert({ variant = 'info', onClose, className = '', children, ...props }: AlertProps) {
  return (
    <BsAlert variant={variant} onClose={onClose} dismissible={!!onClose} className={className} {...props}>
      {children}
    </BsAlert>
  )
}

import type { ReactElement } from 'react'
import { OverlayTrigger, Tooltip as BsTooltip } from 'react-bootstrap'

interface TooltipProps {
  label: string
  children: ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ label, children, placement = 'top' }: TooltipProps) {
  return (
    <OverlayTrigger placement={placement} overlay={<BsTooltip>{label}</BsTooltip>}>
      {children}
    </OverlayTrigger>
  )
}

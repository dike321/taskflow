import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { Card as BsCard } from 'react-bootstrap'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, className = '', children, ...props }, ref) => {
    return (
      <BsCard ref={ref} className={className} {...props}>
        {(title || subtitle) && (
          <BsCard.Header className="bg-white">
            {title && <BsCard.Title className="mb-0">{title}</BsCard.Title>}
            {subtitle && <BsCard.Subtitle className="text-muted mt-1">{subtitle}</BsCard.Subtitle>}
          </BsCard.Header>
        )}
        <BsCard.Body>{children}</BsCard.Body>
      </BsCard>
    )
  },
)

Card.displayName = 'Card'

export default Card

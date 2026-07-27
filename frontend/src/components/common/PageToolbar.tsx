import type { ReactNode } from 'react'
import { Breadcrumb } from 'react-bootstrap'

interface PageToolbarProps {
  title: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: ReactNode
}

export default function PageToolbar({ title, description, breadcrumbs, actions }: PageToolbarProps) {
  return (
    <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-1">
            {breadcrumbs.map((crumb, index) => (
              <Breadcrumb.Item key={crumb.label} href={crumb.href} active={index === breadcrumbs.length - 1}>
                {crumb.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        )}
        <h1 className="h3 fw-bold mb-0">{title}</h1>
        {description && <p className="text-muted mb-0 mt-1">{description}</p>}
      </div>
      {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
    </div>
  )
}

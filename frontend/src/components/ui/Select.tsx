import type { SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { Form } from 'react-bootstrap'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    return (
      <Form.Group className="w-100">
        {label && <Form.Label>{label}</Form.Label>}
        <Form.Select ref={ref} isInvalid={!!error} className={className} {...props}>
          {children}
        </Form.Select>
        {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      </Form.Group>
    )
  },
)

Select.displayName = 'Select'

export default Select

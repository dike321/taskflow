import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { Form } from 'react-bootstrap'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value'> {
  label?: string
  error?: string
  value?: string | number
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <Form.Group className="w-100">
        {label && <Form.Label>{label}</Form.Label>}
        <Form.Control ref={ref} isInvalid={!!error} className={className} {...props} />
        {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      </Form.Group>
    )
  },
)

Input.displayName = 'Input'

export default Input

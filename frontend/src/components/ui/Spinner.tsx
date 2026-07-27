import { Spinner as BsSpinner } from 'react-bootstrap'

interface SpinnerProps {
  size?: 'sm'
  className?: string
  label?: string
}

export default function Spinner({ size, className = '', label = 'Loading...' }: SpinnerProps) {
  return (
    <BsSpinner animation="border" size={size} role="status" className={className}>
      <span className="visually-hidden">{label}</span>
    </BsSpinner>
  )
}

import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { Button as BsButton } from 'react-bootstrap'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variantMap: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'danger',
  ghost: 'light',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <BsButton
        ref={ref}
        variant={variantMap[variant]}
        size={size === 'md' ? undefined : size}
        className={variant === 'ghost' ? `border-0 bg-transparent ${className}` : className}
        {...props}
      >
        {children}
      </BsButton>
    )
  },
)

Button.displayName = 'Button'

export default Button

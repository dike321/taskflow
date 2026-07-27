import { useState } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form } from 'react-bootstrap'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      navigate('/dashboard')
    }, 1000)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
      <Card className="w-100 shadow-sm" style={{ maxWidth: 420 }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold text-primary">TaskFlow</h1>
          <p className="text-muted mb-0">Sign in to your account</p>
        </div>

        <Form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            disabled={isLoading}
          />

          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            disabled={isLoading}
          />

          <div className="d-flex align-items-center justify-content-between">
            <Form.Check type="checkbox" id="remember-me" label="Remember me" className="small" />
            <a href="#" className="small text-decoration-none">
              Forgot password?
            </a>
          </div>

          <Button type="submit" className="w-100" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </Form>

        <p className="text-center text-muted small mt-4 mb-0">
          Don't have an account?{' '}
          <a href="#" className="fw-medium text-decoration-none">
            Sign up
          </a>
        </p>
      </Card>
    </div>
  )
}

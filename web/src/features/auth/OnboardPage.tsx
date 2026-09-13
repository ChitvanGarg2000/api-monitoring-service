import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth, useOnboardSuperAdmin } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/api-client'

const onboardSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
})

type OnboardForm = z.infer<typeof onboardSchema>

export default function OnboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const onboard = useOnboardSuperAdmin()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardForm>({
    resolver: zodResolver(onboardSchema),
  })

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = handleSubmit(async (data) => {
    setError('')
    try {
      await onboard.mutateAsync(data)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent-muted">
            <Activity className="size-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold">Initial Setup</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Create the first super admin account for your monitoring system
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-surface-card p-8 space-y-5"
        >
          {error && (
            <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
          )}

          <Input
            label="Username"
            placeholder="admin"
            error={errors.username?.message}
            {...register('username')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="admin@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min 8 chars with uppercase, lowercase & number"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" className="w-full" isLoading={onboard.isPending}>
            Create Super Admin
          </Button>

          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

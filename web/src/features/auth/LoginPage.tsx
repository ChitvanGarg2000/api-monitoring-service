import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth, useLogin } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/api-client'

const loginSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(6, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const login = useLogin()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = handleSubmit(async (data) => {
    setError('')
    try {
      await login.mutateAsync(data)
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
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to your API monitoring dashboard
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
            placeholder="Enter your username"
            error={errors.username?.message}
            {...register('username')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" className="w-full" isLoading={login.isPending}>
            Sign in
          </Button>

          <p className="text-center text-sm text-text-muted">
            First time setup?{' '}
            <Link to="/onboard" className="text-accent hover:underline">
              Create super admin
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

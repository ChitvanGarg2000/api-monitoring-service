import { memo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useCreateClientUser } from '@/hooks/queries/useClients'
import { useAuth } from '@/hooks/useAuth'
import { useClientContext } from '@/context/ClientContext'
import { getErrorMessage } from '@/lib/api-client'

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['client_admin', 'client_viewer']),
})

type UserForm = z.infer<typeof userSchema>

const roleOptions = [
  { value: 'client_viewer', label: 'Viewer (analytics only)' },
  { value: 'client_admin', label: 'Admin (full access)' },
]

export default memo(function UsersPage() {
  const { isSuperAdmin } = useAuth()
  const { effectiveClientId, clients, setSelectedClientId } = useClientContext()
  const createUser = useCreateClientUser(effectiveClientId ?? '')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'client_viewer' },
  })

  const clientOptions = clients?.map((c) => ({ value: c._id, label: c.name })) ?? []

  const onSubmit = handleSubmit(async (data) => {
    if (!effectiveClientId) return
    setError('')
    setSuccess('')
    try {
      const user = await createUser.mutateAsync(data)
      setSuccess(`User "${user.username}" created successfully`)
      reset()
      setIsModalOpen(false)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  })

  return (
    <div>
      <Header
        title="Users"
        subtitle="Manage team members and their access levels"
        actions={
          <div className="flex items-center gap-3">
            {isSuperAdmin && clientOptions.length > 0 && (
              <Select
                options={clientOptions}
                value={effectiveClientId ?? ''}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-48"
              />
            )}
            <Button onClick={() => setIsModalOpen(true)} disabled={!effectiveClientId}>
              <Plus className="size-4" />
              Add User
            </Button>
          </div>
        }
      />

      {success && (
        <div className="mb-6 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      {!effectiveClientId ? (
        <Card className="py-16 text-center">
          <Users className="mx-auto mb-4 size-12 text-text-muted" />
          <p className="text-text-secondary">Select a client to manage users</p>
        </Card>
      ) : (
        <Card className="py-16 text-center">
          <Users className="mx-auto mb-4 size-12 text-text-muted" />
          <h3 className="text-lg font-semibold">User Management</h3>
          <p className="mt-1 text-sm text-text-secondary max-w-md mx-auto">
            Create new users for this client. User listing will be available in a future update.
          </p>
          <Button className="mt-6" onClick={() => setIsModalOpen(true)}>
            <Plus className="size-4" />
            Add User
          </Button>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create User">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
          )}
          <Input label="Username" error={errors.username?.message} {...register('username')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
          <Select label="Role" options={roleOptions} error={errors.role?.message} {...register('role')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createUser.isPending}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
})

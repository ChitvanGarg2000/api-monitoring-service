import { memo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useClients, useCreateClient } from '@/hooks/queries/useClients'
import { getErrorMessage } from '@/lib/api-client'

const clientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  description: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type ClientForm = z.infer<typeof clientSchema>

export default memo(function ClientsPage() {
  const { data: clients, isLoading } = useClients()
  const createClient = useCreateClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  })

  const onSubmit = handleSubmit(async (data) => {
    setError('')
    try {
      await createClient.mutateAsync({
        name: data.name,
        email: data.email,
        description: data.description,
        website: data.website || undefined,
      })
      reset()
      setIsModalOpen(false)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  })

  return (
    <div>
      <Header
        title="Clients"
        subtitle="Manage organizations and their monitoring access"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="size-4" />
            Onboard Client
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !clients?.length ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="mb-4 size-12 text-text-muted" />
          <h3 className="text-lg font-semibold">No clients yet</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Onboard your first client to start monitoring their APIs
          </p>
          <Button className="mt-6" onClick={() => setIsModalOpen(true)}>
            <Plus className="size-4" />
            Onboard Client
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client._id} hover>
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent-muted">
                  <Building2 className="size-5 text-accent" />
                </div>
                <Badge variant={client.isActive ? 'success' : 'default'}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{client.name}</h3>
              <p className="mt-1 text-sm text-text-secondary">{client.email}</p>
              {client.description && (
                <p className="mt-2 text-xs text-text-muted line-clamp-2">{client.description}</p>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                <span className="font-mono">{client.slug}</span>
                <span>·</span>
                <span>{client.settings.timezone}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New Client"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
          )}
          <Input label="Organization Name" error={errors.name?.message} {...register('name')} />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input label="Description" error={errors.description?.message} {...register('description')} />
          <Input label="Website" placeholder="https://..." error={errors.website?.message} {...register('website')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createClient.isPending}>Create Client</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
})

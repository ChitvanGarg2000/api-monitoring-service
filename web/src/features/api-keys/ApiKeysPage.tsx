import { memo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, Copy, KeyRound, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useApiKeys, useCreateApiKey } from '@/hooks/queries/useClients'
import { useAuth } from '@/hooks/useAuth'
import { useClientContext } from '@/context/ClientContext'
import { getErrorMessage } from '@/lib/api-client'

const apiKeySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  environment: z.enum(['production', 'staging', 'development', 'testing']),
})

type ApiKeyForm = z.infer<typeof apiKeySchema>

const envOptions = [
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
]

export default memo(function ApiKeysPage() {
  const { isSuperAdmin } = useAuth()
  const { effectiveClientId, clients, setSelectedClientId } = useClientContext()
  const { data: apiKeys, isLoading } = useApiKeys(effectiveClientId)
  const createApiKey = useCreateApiKey(effectiveClientId ?? '')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApiKeyForm>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: { environment: 'production' },
  })

  const clientOptions = clients?.map((c) => ({ value: c._id, label: c.name })) ?? []

  const onSubmit = handleSubmit(async (data) => {
    if (!effectiveClientId) return
    setError('')
    try {
      const result = await createApiKey.mutateAsync(data)
      if (result.keyValue) {
        setNewKeyValue(result.keyValue)
      }
      reset()
      setIsModalOpen(false)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  })

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <Header
        title="API Keys"
        subtitle="Manage ingestion keys for your monitored services"
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
              Create Key
            </Button>
          </div>
        }
      />

      {newKeyValue && (
        <Card className="mb-6 border-accent/30 bg-accent-muted/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent" />
            <div className="flex-1">
              <h3 className="font-semibold text-accent">Save your API key now</h3>
              <p className="mt-1 text-sm text-text-secondary">
                This key will only be shown once. Copy it to a secure location.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-surface px-3 py-2 font-mono text-sm">
                  {newKeyValue}
                </code>
                <Button variant="secondary" size="sm" onClick={() => handleCopy(newKeyValue)}>
                  <Copy className="size-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setNewKeyValue(null)}>Dismiss</Button>
          </div>
        </Card>
      )}

      {!effectiveClientId ? (
        <Card className="py-16 text-center">
          <KeyRound className="mx-auto mb-4 size-12 text-text-muted" />
          <p className="text-text-secondary">Select a client to manage API keys</p>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !apiKeys?.length ? (
        <Card className="py-16 text-center">
          <KeyRound className="mx-auto mb-4 size-12 text-text-muted" />
          <h3 className="text-lg font-semibold">No API keys</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Create an API key to start sending hit data
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <Card key={key._id} className="!p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent-muted">
                  <KeyRound className="size-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-xs text-text-muted font-mono">{key.keyId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="accent">{key.environment}</Badge>
                <Badge variant={key.isActive ? 'success' : 'default'}>
                  {key.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create API Key">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
          )}
          <Input label="Key Name" placeholder="Production Ingest Key" error={errors.name?.message} {...register('name')} />
          <Input label="Description" error={errors.description?.message} {...register('description')} />
          <Select label="Environment" options={envOptions} error={errors.environment?.message} {...register('environment')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createApiKey.isPending}>Create Key</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
})

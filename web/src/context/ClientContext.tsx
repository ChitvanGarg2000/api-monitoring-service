import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useClients } from '@/hooks/queries/useClients'

interface ClientContextValue {
  selectedClientId: string | undefined
  setSelectedClientId: (id: string) => void
  effectiveClientId: string | undefined
  clients: ReturnType<typeof useClients>['data']
  isLoadingClients: boolean
}

const ClientContext = createContext<ClientContextValue | null>(null)

export function ClientProvider({ children }: { children: ReactNode }) {
  const { user, isSuperAdmin } = useAuth()
  const { data: clients, isLoading: isLoadingClients } = useClients(isSuperAdmin)
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>()

  const effectiveClientId = useMemo(() => {
    if (isSuperAdmin) {
      return selectedClientId ?? clients?.[0]?._id
    }
    return user?.clientId
  }, [isSuperAdmin, selectedClientId, clients, user?.clientId])

  const value = useMemo(
    () => ({
      selectedClientId,
      setSelectedClientId,
      effectiveClientId,
      clients,
      isLoadingClients,
    }),
    [selectedClientId, effectiveClientId, clients, isLoadingClients],
  )

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
}

export function useClientContext() {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error('useClientContext must be used within ClientProvider')
  return ctx
}

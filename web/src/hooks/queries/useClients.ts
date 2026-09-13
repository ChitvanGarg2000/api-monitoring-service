import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  clientsApi,
  type CreateApiKeyPayload,
  type CreateClientPayload,
  type CreateUserPayload,
} from '@/lib/api/clients'
import { queryKeys } from '@/lib/query-client'

export function useClients(enabled = true) {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: clientsApi.list,
    staleTime: 60_000,
    enabled,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateClientPayload) => clientsApi.onboard(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients })
    },
  })
}

export function useApiKeys(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.apiKeys(clientId ?? ''),
    queryFn: () => clientsApi.getApiKeys(clientId!),
    enabled: !!clientId,
  })
}

export function useCreateApiKey(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => clientsApi.createApiKey(clientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys(clientId) })
    },
  })
}

export function useCreateClientUser(clientId: string) {
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => clientsApi.createUser(clientId, payload),
  })
}

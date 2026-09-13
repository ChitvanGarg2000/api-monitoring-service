import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const queryKeys = {
  profile: ['profile'] as const,
  clients: ['clients'] as const,
  client: (id: string) => ['clients', id] as const,
  apiKeys: (clientId: string) => ['api-keys', clientId] as const,
  dashboard: (params?: Record<string, string | undefined>) => ['dashboard', params] as const,
  stats: (params?: Record<string, string | undefined>) => ['stats', params] as const,
}

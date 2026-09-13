import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api/analytics'
import { queryKeys } from '@/lib/query-client'
import type { TimeRangeParams } from '@/types/api'

export function useDashboard(params?: TimeRangeParams) {
  const serialized = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
      )
    : undefined

  return useQuery({
    queryKey: queryKeys.dashboard(serialized),
    queryFn: () => analyticsApi.getDashboard(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useStats(params?: TimeRangeParams) {
  const serialized = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
      )
    : undefined

  return useQuery({
    queryKey: queryKeys.stats(serialized),
    queryFn: () => analyticsApi.getStats(params),
    staleTime: 30_000,
  })
}

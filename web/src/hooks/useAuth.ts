import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, type LoginPayload, type OnboardPayload } from '@/lib/api/auth'
import { queryKeys } from '@/lib/query-client'
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: authApi.getProfile,
    retry: false,
    staleTime: 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.profile, user)
    },
  })
}

export function useOnboardSuperAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: OnboardPayload) => authApi.onboardSuperAdmin(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.profile, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.profile, null)
      queryClient.clear()
    },
  })
}

export function useAuth() {
  const { data: user, isLoading, isError, error } = useProfile()

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !isError,
    isSuperAdmin: user?.role === 'super_admin',
    isClientAdmin: user?.role === 'client_admin',
    canViewAnalytics: user?.role === 'super_admin' || user?.permissions?.canViewAnalytics,
    canManageUsers: user?.role === 'super_admin' || user?.permissions?.canManageUsers,
    canCreateApiKeys: user?.role === 'super_admin' || user?.permissions?.canCreateApiKeys,
    error,
  }
}

export function useEffectiveClientId(selectedClientId?: string): string | undefined {
  const { user, isSuperAdmin } = useAuth()
  if (isSuperAdmin) return selectedClientId
  return user?.clientId
}

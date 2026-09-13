import { apiClient } from '@/lib/api-client'
import type { ApiResponse, User } from '@/types/api'

export interface LoginPayload {
  username: string
  password: string
}

export interface OnboardPayload {
  username: string
  email: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  role?: string
}

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiResponse<User>>('/api/auth/login', payload)
    return data.data
  },

  onboardSuperAdmin: async (payload: OnboardPayload) => {
    const { data } = await apiClient.post<ApiResponse<User>>('/api/auth/onboard-super-admin', payload)
    return data.data
  },

  getProfile: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>('/api/auth/get-profile')
    return data.data
  },

  logout: async () => {
    await apiClient.post('/api/auth/logout')
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<ApiResponse<User>>('/api/auth/register', payload)
    return data.data
  },
}

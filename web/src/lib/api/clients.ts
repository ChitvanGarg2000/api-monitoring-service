import { apiClient } from '@/lib/api-client'
import type { ApiKey, ApiResponse, Client, User } from '@/types/api'

export interface CreateClientPayload {
  name: string
  email: string
  description?: string
  website?: string
}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  role?: 'client_admin' | 'client_viewer'
}

export interface CreateApiKeyPayload {
  name: string
  description?: string
  environment?: 'production' | 'staging' | 'development' | 'testing'
}

export const clientsApi = {
  list: async () => {
    const { data } = await apiClient.get<ApiResponse<Client[]>>('/api/admin/client')
    return data.data
  },

  onboard: async (payload: CreateClientPayload) => {
    const { data } = await apiClient.post<ApiResponse<Client>>('/api/admin/client/onboard', payload)
    return data.data
  },

  createUser: async (clientId: string, payload: CreateUserPayload) => {
    const { data } = await apiClient.post<ApiResponse<User>>(
      `/api/admin/client/${clientId}/users`,
      payload,
    )
    return data.data
  },

  getApiKeys: async (clientId: string) => {
    const { data } = await apiClient.get<ApiResponse<ApiKey[]>>(
      `/api/admin/client/${clientId}/get/api-keys`,
    )
    return data.data
  },

  createApiKey: async (clientId: string, payload: CreateApiKeyPayload) => {
    const { data } = await apiClient.post<ApiResponse<ApiKey>>(
      `/api/admin/client/${clientId}/api-keys`,
      payload,
    )
    return data.data
  },
}

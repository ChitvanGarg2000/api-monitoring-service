import { apiClient } from '@/lib/api-client'
import type { ApiResponse, DashboardData, DashboardStats, TimeRangeParams } from '@/types/api'

export const analyticsApi = {
  getStats: async (params?: TimeRangeParams) => {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/api/analytics/stats', {
      params,
    })
    return data.data
  },

  getDashboard: async (params?: TimeRangeParams) => {
    const { data } = await apiClient.get<ApiResponse<DashboardData>>('/api/analytics/dashboard', {
      params,
    })
    return data.data
  },
}

export type UserRole = 'super_admin' | 'client_admin' | 'client_viewer'

export interface UserPermissions {
  canManageUsers: boolean
  canCreateApiKeys: boolean
  canViewAnalytics: boolean
  canExportData: boolean
}

export interface User {
  _id: string
  username: string
  email: string
  role: UserRole
  clientId?: string
  isActive: boolean
  permissions: UserPermissions
  createdAt: string
  updatedAt: string
}

export interface Client {
  _id: string
  name: string
  slug: string
  email: string
  description?: string
  website?: string
  createdBy: string
  isActive: boolean
  settings: {
    dataRetentionDays: number
    alertsEnabled: boolean
    timezone: string
  }
  createdAt: string
  updatedAt: string
}

export interface ApiKey {
  _id: string
  keyId: string
  keyValue?: string
  clientId: string
  name: string
  description?: string
  environment: 'production' | 'staging' | 'development' | 'testing'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  statusCode: number
  timestamp: number
}

export interface ApiErrorResponse {
  success: false
  error: unknown
  message: string
  statusCode: number
  timestamp: number
}

export interface DashboardStats {
  totalHits: number
  errorRate: number
  successRate: number
  avgLatency: number
  uniqueServices: number
  uniqueEndpoints: number
  timeRange: {
    start: string
    end: string
  }
}

export interface TopEndpoint {
  serviceName: string
  endpoint: string
  method: string
  totalHits: number
  avgLatency: string
  errorHits: number
  errorRate: string
}

export interface TimeSeriesPoint {
  serviceName: string
  endpoint: string
  method: string
  totalHits: number
  errorHits: number
  avgLatency: string
  minLatency: string
  maxLatency: string
  timeBucket: string
}

export interface DashboardData {
  stats: DashboardStats
  topEndpoints: TopEndpoint[]
  recentActivity: TimeSeriesPoint[]
}

export interface TimeRangeParams {
  startTime?: string
  endTime?: string
  clientId?: string
}

import axios, { type AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types/api'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    return axiosError.response?.data?.message ?? axiosError.message ?? 'An unexpected error occurred'
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

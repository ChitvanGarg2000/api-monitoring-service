import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatLatency(ms: number | string): string {
  const num = typeof ms === 'string' ? parseFloat(ms) : ms
  if (num >= 1000) return `${(num / 1000).toFixed(2)}s`
  return `${num.toFixed(0)}ms`
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'text-emerald-400 bg-emerald-400/10',
    POST: 'text-blue-400 bg-blue-400/10',
    PUT: 'text-amber-400 bg-amber-400/10',
    PATCH: 'text-purple-400 bg-purple-400/10',
    DELETE: 'text-red-400 bg-red-400/10',
  }
  return colors[method] ?? 'text-text-secondary bg-white/5'
}

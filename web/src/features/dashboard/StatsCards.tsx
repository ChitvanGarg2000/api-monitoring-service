import { memo } from 'react'
import { Activity, AlertTriangle, Clock, Server, TrendingUp, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatLatency, formatNumber, formatPercent } from '@/lib/utils'
import type { DashboardStats } from '@/types/api'

interface StatsCardsProps {
  stats?: DashboardStats
  isLoading: boolean
}

const statConfig = [
  {
    key: 'totalHits' as const,
    label: 'Total Hits',
    icon: Activity,
    format: (v: number) => formatNumber(v),
    accent: 'text-accent',
  },
  {
    key: 'successRate' as const,
    label: 'Successful Requests',
    icon: TrendingUp,
    format: (v: number) => formatNumber(v),
    accent: 'text-success',
  },
  {
    key: 'errorRate' as const,
    label: 'Error Rate',
    icon: AlertTriangle,
    format: (v: number) => formatPercent(v),
    accent: 'text-error',
  },
  {
    key: 'avgLatency' as const,
    label: 'Avg Latency',
    icon: Clock,
    format: (v: number) => formatLatency(v),
    accent: 'text-amber-400',
  },
  {
    key: 'uniqueServices' as const,
    label: 'Services',
    icon: Server,
    format: (v: number) => formatNumber(v),
    accent: 'text-blue-400',
  },
  {
    key: 'uniqueEndpoints' as const,
    label: 'Endpoints',
    icon: Zap,
    format: (v: number) => formatNumber(v),
    accent: 'text-purple-400',
  },
]

export const StatsCards = memo(function StatsCards({ stats, isLoading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {statConfig.map(({ key, label, icon: Icon, format, accent }) => (
        <Card key={key} className="!p-4">
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">{label}</span>
                <Icon className={`size-4 ${accent}`} />
              </div>
              <p className="text-2xl font-bold tracking-tight">
                {stats ? format(stats[key]) : '—'}
              </p>
            </>
          )}
        </Card>
      ))}
    </div>
  )
})

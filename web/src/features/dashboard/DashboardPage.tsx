import { memo, useMemo, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Select } from '@/components/ui/Select'
import { useDashboard } from '@/hooks/queries/useAnalytics'
import { useAuth } from '@/hooks/useAuth'
import { useClientContext } from '@/context/ClientContext'
import { StatsCards } from './StatsCards'
import { HitsChart } from './HitsChart'
import { TopEndpointsTable } from './TopEndpointsTable'
import { IntegrationSnippet } from './IntegrationSnippet'

const timeRangeOptions = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

function getTimeRange(value: string) {
  const end = new Date()
  const start = new Date()

  switch (value) {
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    default:
      start.setHours(start.getHours() - 24)
  }

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  }
}

export default memo(function DashboardPage() {
  const { isSuperAdmin } = useAuth()
  const { effectiveClientId, clients, setSelectedClientId } = useClientContext()
  const [timeRange, setTimeRange] = useState('24h')

  const params = useMemo(
    () => ({
      ...getTimeRange(timeRange),
      ...(isSuperAdmin && effectiveClientId ? { clientId: effectiveClientId } : {}),
    }),
    [timeRange, isSuperAdmin, effectiveClientId],
  )

  const { data, isLoading, isFetching } = useDashboard(params)

  const clientOptions = useMemo(
    () => clients?.map((c) => ({ value: c._id, label: c.name })) ?? [],
    [clients],
  )

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Real-time API monitoring and analytics"
        actions={
          <div className="flex items-center gap-3">
            {isSuperAdmin && clientOptions.length > 0 && (
              <Select
                options={clientOptions}
                value={effectiveClientId ?? ''}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-48"
              />
            )}
            <Select
              options={timeRangeOptions}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-40"
            />
            {isFetching && !isLoading && (
              <span className="text-xs text-text-muted animate-pulse">Updating...</span>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        <StatsCards stats={data?.stats} isLoading={isLoading} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <HitsChart data={data?.recentActivity} isLoading={isLoading} />
          <IntegrationSnippet />
        </div>

        <TopEndpointsTable endpoints={data?.topEndpoints} isLoading={isLoading} />
      </div>
    </div>
  )
})

import { memo } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { getMethodColor } from '@/lib/utils'
import type { TopEndpoint } from '@/types/api'

interface TopEndpointsTableProps {
  endpoints?: TopEndpoint[]
  isLoading: boolean
}

export const TopEndpointsTable = memo(function TopEndpointsTable({
  endpoints,
  isLoading,
}: TopEndpointsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Endpoints</CardTitle>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !endpoints?.length ? (
        <p className="py-8 text-center text-sm text-text-muted">No endpoint data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="pb-3 pr-4 font-medium">Method</th>
                <th className="pb-3 pr-4 font-medium">Service</th>
                <th className="pb-3 pr-4 font-medium">Endpoint</th>
                <th className="pb-3 pr-4 font-medium text-right">Hits</th>
                <th className="pb-3 pr-4 font-medium text-right">Latency</th>
                <th className="pb-3 font-medium text-right">Error %</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${getMethodColor(ep.method)}`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">{ep.serviceName}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-text-primary max-w-[200px] truncate">
                    {ep.endpoint}
                  </td>
                  <td className="py-3 pr-4 text-right font-medium">{ep.totalHits}</td>
                  <td className="py-3 pr-4 text-right text-text-secondary">{ep.avgLatency}ms</td>
                  <td className="py-3 text-right">
                    <Badge variant={parseFloat(ep.errorRate) > 5 ? 'error' : 'success'}>
                      {ep.errorRate}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
})

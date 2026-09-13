import { memo, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import type { TimeSeriesPoint } from '@/types/api'

interface HitsChartProps {
  data?: TimeSeriesPoint[]
  isLoading: boolean
}

interface ChartPoint {
  time: string
  hits: number
  errors: number
}

export const HitsChart = memo(function HitsChart({ data, isLoading }: HitsChartProps) {
  const chartData = useMemo<ChartPoint[]>(() => {
    if (!data?.length) return []

    const bucketMap = new Map<string, { hits: number; errors: number }>()

    for (const point of data) {
      const time = new Date(point.timeBucket).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const existing = bucketMap.get(time) ?? { hits: 0, errors: 0 }
      bucketMap.set(time, {
        hits: existing.hits + point.totalHits,
        errors: existing.errors + point.errorHits,
      })
    }

    return Array.from(bucketMap.entries()).map(([time, values]) => ({
      time,
      hits: values.hits,
      errors: values.errors,
    }))
  }, [data])

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>API Hits Over Time</CardTitle>
      </CardHeader>

      {isLoading ? (
        <Skeleton className="h-[280px] w-full" />
      ) : chartData.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-text-muted">
          No data available for the selected time range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="hitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#161618',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#a1a1aa' }}
            />
            <Area
              type="monotone"
              dataKey="hits"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#hitsGradient)"
              name="Hits"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
})

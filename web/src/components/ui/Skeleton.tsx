import { memo } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export const Skeleton = memo(function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-white/5', className)}
      aria-hidden="true"
    />
  )
})

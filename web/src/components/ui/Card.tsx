import { memo, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export const Card = memo(function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface-card p-6',
        hover && 'transition-colors duration-200 hover:border-border-strong hover:bg-surface-hover',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

export const CardHeader = memo(function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  )
})

export const CardTitle = memo(function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-text-primary', className)} {...props}>
      {children}
    </h3>
  )
})

import { memo, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent'
}

const variants: Record<string, string> = {
  default: 'bg-white/5 text-text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-amber-400/10 text-amber-400',
  error: 'bg-error/10 text-error',
  accent: 'bg-accent-muted text-accent',
}

export const Badge = memo(function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
})

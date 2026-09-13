import { memo } from 'react'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth, useLogout } from '@/hooks/useAuth'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const Header = memo(function Header({ title, subtitle, actions }: HeaderProps) {
  const { user } = useAuth()
  const logout = useLogout()

  return (
    <header className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        {user && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-card px-4 py-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent-muted">
              <User className="size-4 text-accent" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-text-muted capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              isLoading={logout.isPending}
              aria-label="Logout"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
})

import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Activity,
  Building2,
  KeyRound,
  LayoutDashboard,
  Users,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', requiresAnalytics: true },
  { to: '/clients', icon: Building2, label: 'Clients', requiresSuperAdmin: true },
  { to: '/api-keys', icon: KeyRound, label: 'API Keys', requiresApiKeys: true },
  { to: '/users', icon: Users, label: 'Users', requiresManageUsers: true },
]

export const Sidebar = memo(function Sidebar() {
  const { isSuperAdmin, canViewAnalytics, canCreateApiKeys, canManageUsers } = useAuth()

  const visibleItems = navItems.filter((item) => {
    if (item.requiresSuperAdmin && !isSuperAdmin) return false
    if (item.requiresAnalytics && !canViewAnalytics) return false
    if (item.requiresApiKeys && !canCreateApiKeys && !isSuperAdmin) return false
    if (item.requiresManageUsers && !canManageUsers && !isSuperAdmin) return false
    return true
  })

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col items-center border-r border-border bg-surface-raised py-6">
      <div className="mb-8 flex size-10 items-center justify-center rounded-xl bg-accent-muted">
        <Activity className="size-5 text-accent" />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                'group relative flex size-11 items-center justify-center rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : 'text-text-muted hover:bg-white/5 hover:text-text-primary',
              )
            }
          >
            <Icon className="size-5" />
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
          <Zap className="size-4 text-accent" />
        </div>
      </div>
    </aside>
  )
})

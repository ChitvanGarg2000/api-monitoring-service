import { memo, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-[72px] min-h-screen p-8">{children}</main>
    </div>
  )
})

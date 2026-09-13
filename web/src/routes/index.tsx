import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ClientProvider } from '@/context/ClientContext'

const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const OnboardPage = lazy(() => import('@/features/auth/OnboardPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const ClientsPage = lazy(() => import('@/features/clients/ClientsPage'))
const ApiKeysPage = lazy(() => import('@/features/api-keys/ApiKeysPage'))
const UsersPage = lazy(() => import('@/features/users/UsersPage'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

function ClientLayout() {
  return (
    <ClientProvider>
      <Outlet />
    </ClientProvider>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/onboard',
    element: withSuspense(OnboardPage),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ClientLayout />,
        children: [
          { path: '/dashboard', element: withSuspense(DashboardPage) },
          { path: '/clients', element: withSuspense(ClientsPage) },
          { path: '/api-keys', element: withSuspense(ApiKeysPage) },
          { path: '/users', element: withSuspense(UsersPage) },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

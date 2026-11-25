import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { LocalAuthProvider } from '@/features/auth/LocalAuthProvider'
import { isLocalMode } from '@/lib/env'
import { Toaster } from '@/components/ui/toaster'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

const Auth = isLocalMode ? LocalAuthProvider : AuthProvider

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user": respeta prefers-reduced-motion en todas las animaciones de motion */}
      <MotionConfig reducedMotion="user">
        <Auth>
          {children}
          <Toaster />
        </Auth>
      </MotionConfig>
    </QueryClientProvider>
  )
}

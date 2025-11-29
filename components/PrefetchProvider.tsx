'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { prefetchQueries } from '@/lib/query-client'

// Aggressive prefetching based on user navigation patterns
export default function PrefetchProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Prefetch likely next destinations based on current page
    const prefetchForPage = async () => {
      switch (pathname) {
        case '/dashboard':
          // From dashboard, users often go to vehicles or repairs
          await Promise.allSettled([
            prefetchQueries.vehicles(),
            prefetchQueries.repairs()
          ])
          break

        case '/admin/vehicles':
          // From vehicles, users often go to service records
          await prefetchQueries.serviceRecords()
          break

        case '/repairs':
          // From repairs, users often go back to dashboard
          await prefetchQueries.dashboard()
          break

        case '/login':
          // After login, they'll go to dashboard
          setTimeout(() => {
            prefetchQueries.dashboard().catch(console.warn)
          }, 1000) // Delay to avoid competing with auth
          break

        default:
          // For any other page, prefetch dashboard as fallback
          if (!pathname.startsWith('/booking-link')) {
            await prefetchQueries.dashboard()
          }
          break
      }
    }

    // Use requestIdleCallback for non-blocking prefetching
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        prefetchForPage().catch(console.warn)
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        prefetchForPage().catch(console.warn)
      }, 100)
    }
  }, [pathname])

  return <>{children}</>
}
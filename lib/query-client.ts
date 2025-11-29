// React Query client configuration for optimal performance
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 15 minutes (longer for better performance)
      gcTime: 15 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus for fresh data (less aggressive)
      refetchOnWindowFocus: 'always',
      // Remove aggressive background refresh - let components control this
      refetchInterval: false,
      // Faster refetch on reconnect
      refetchOnReconnect: 'always',
      // Enable background updates when component is active
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
})

// Query keys for consistent caching
export const queryKeys = {
  vehicles: ['vehicles'] as const,
  vehicle: (id: string) => ['vehicle', id] as const,
  mechanics: ['mechanics'] as const,
  mechanic: (id: string) => ['mechanic', id] as const,
  bookings: ['bookings'] as const,
  booking: (id: string) => ['booking', id] as const,
  repairRequests: (status?: string) => ['repair-requests', status] as const,
  repairRequest: (id: string) => ['repair-request', id] as const,
  serviceRecords: ['service-records'] as const,
  dashboardStats: ['dashboard-stats'] as const,
  drivers: ['drivers'] as const,
}

// Performance utilities for prefetching
export const prefetchQueries = {
  // Prefetch dashboard data when user lands
  async dashboard() {
    const queries = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardStats,
        queryFn: () => fetch('/api/dashboard').then(res => res.json()),
        staleTime: 2 * 60 * 1000, // 2 minutes for dashboard
      }),
      queryClient.prefetchQuery({
        queryKey: ['dashboard-jobs'],
        queryFn: () => fetch('/api/jobs').then(res => res.json()),
        staleTime: 1 * 60 * 1000, // 1 minute for jobs
      }),
    ]
    return Promise.allSettled(queries)
  },

  // Prefetch common data when navigating to vehicles
  async vehicles() {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.vehicles,
      queryFn: () => fetch('/api/vehicles').then(res => res.json()),
      staleTime: 3 * 60 * 1000, // 3 minutes for vehicles
    })
  },

  // Prefetch repairs data
  async repairs() {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.repairRequests(),
      queryFn: () => fetch('/api/repair-requests').then(res => res.json()),
      staleTime: 1 * 60 * 1000, // 1 minute for repairs (more dynamic)
    })
  },

  // Prefetch service records
  async serviceRecords() {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.serviceRecords,
      queryFn: () => fetch('/api/service-records').then(res => res.json()),
      staleTime: 2 * 60 * 1000, // 2 minutes for service records
    })
  },
}
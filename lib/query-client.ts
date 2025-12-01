// React Query client configuration for optimal performance
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered stale immediately to ensure freshness, 
      // but will be served from cache while refetching
      staleTime: 0,
      // Keep data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests 1 time to fail fast
      retry: 1,
      // Refetch on window focus to ensure data consistency
      refetchOnWindowFocus: true,
      // Remove aggressive background refresh
      refetchInterval: false,
      // Refetch on reconnect
      refetchOnReconnect: 'always',
      // No background updates by default
      refetchIntervalInBackground: false,
    },
    mutations: {
      // No retries for mutations to prevent duplicate actions
      retry: 0,
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
        staleTime: 10 * 1000, // 10 seconds
      }),
      queryClient.prefetchQuery({
        queryKey: ['dashboard-jobs'],
        queryFn: () => fetch('/api/jobs').then(res => res.json()),
        staleTime: 10 * 1000,
      }),
    ]
    return Promise.allSettled(queries)
  },

  // Prefetch common data when navigating to vehicles
  async vehicles() {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.vehicles,
      queryFn: () => fetch('/api/vehicles').then(res => res.json()),
      staleTime: 10 * 1000,
    })
  },

  // Prefetch repairs data
  async repairs() {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.repairRequests(),
      queryFn: () => fetch('/api/repair-requests').then(res => res.json()),
      staleTime: 10 * 1000,
    })
  },

  // Prefetch service records
  async serviceRecords() {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.serviceRecords,
      queryFn: () => fetch('/api/service-records').then(res => res.json()),
      staleTime: 10 * 1000,
    })
  },
}

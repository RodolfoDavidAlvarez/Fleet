// React Query client configuration for optimal performance
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 30 seconds, reducing unnecessary refetches
      staleTime: 30 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 1 time to fail fast
      retry: 1,
      // Only refetch on window focus if data is stale (not constantly)
      refetchOnWindowFocus: false,
      // Remove aggressive background refresh
      refetchInterval: false,
      // Refetch on reconnect only if stale
      refetchOnReconnect: true,
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
  adminUsers: ['admin-users'] as const,
  calendarSettings: ['calendar-settings'] as const,
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

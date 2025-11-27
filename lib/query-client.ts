// React Query client configuration for optimal performance
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Background refetch every 30 seconds for critical data
      refetchInterval: 30 * 1000,
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
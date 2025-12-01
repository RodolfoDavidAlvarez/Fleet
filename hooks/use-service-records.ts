// Custom hook for service records
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { ServiceRecord } from '@/types'

// Fetch service records with optimized caching
export function useServiceRecords() {
  return useQuery({
    queryKey: queryKeys.serviceRecords,
    queryFn: async () => {
      const response = await fetch('/api/service-records')
      if (!response.ok) throw new Error('Failed to fetch service records')
      const data = await response.json()
      return data.records || []
    },
    // Keep previous data visible during refetch
    placeholderData: (prev) => prev ?? [],
    select: (data) => {
      // Sort by date for consistent UI
      return data.sort((a: ServiceRecord, b: ServiceRecord) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      )
    }
  })
}

// Create service record with optimistic updates
export function useCreateServiceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<ServiceRecord>) => {
      const response = await fetch("/api/service-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create service record");
      return response.json();
    },
    // Optimistic update
    onMutate: async (newRecord) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.serviceRecords })
      
      const previousRecords = queryClient.getQueryData(queryKeys.serviceRecords)
      
      // Optimistically update the cache
      const optimisticRecord = {
        id: 'temp-' + Date.now(),
        ...newRecord,
        createdAt: new Date().toISOString(),
      }
      
      queryClient.setQueryData(queryKeys.serviceRecords, (old: ServiceRecord[] = []) => 
        [optimisticRecord, ...old]
      )
      
      return { previousRecords }
    },
    onError: (err, newRecord, context) => {
      // Rollback on error
      if (context?.previousRecords) {
        queryClient.setQueryData(queryKeys.serviceRecords, context.previousRecords)
      }
    },
    onSuccess: (data) => {
      // Update with real data
      queryClient.setQueryData(queryKeys.serviceRecords, (old: ServiceRecord[] = []) => {
        // Remove optimistic record and add real one
        const filtered = old.filter(record => !record.id.startsWith('temp-'))
        return [data.record, ...filtered]
      })
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats })
    }
  })
}

// Update service record with optimistic updates
export function useUpdateServiceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ServiceRecord> }) => {
      const response = await fetch(`/api/service-records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update service record");
      return response.json();
    },
    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.serviceRecords })
      
      const previousRecords = queryClient.getQueryData(queryKeys.serviceRecords)
      
      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.serviceRecords, (old: ServiceRecord[] = []) =>
        old.map(record => 
          record.id === id 
            ? { ...record, ...data, updatedAt: new Date().toISOString() }
            : record
        )
      )
      
      return { previousRecords }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousRecords) {
        queryClient.setQueryData(queryKeys.serviceRecords, context.previousRecords)
      }
    },
    onSuccess: (response, { id }) => {
      // Update with real data
      queryClient.setQueryData(queryKeys.serviceRecords, (old: ServiceRecord[] = []) =>
        old.map(record => 
          record.id === id ? response.record : record
        )
      )
    }
  })
}

// Custom hook for service records
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { ServiceRecord } from '@/types'

// Fetch service records
export function useServiceRecords() {
  return useQuery({
    queryKey: queryKeys.serviceRecords,
    queryFn: async () => {
      const response = await fetch('/api/service-records')
      if (!response.ok) throw new Error('Failed to fetch service records')
      const data = await response.json()
      return data.records || []
    },
    staleTime: 60 * 1000, 
  })
}

// Create service record
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.serviceRecords })
        }
    })
}

// Update service record
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.serviceRecords })
        }
    })
}

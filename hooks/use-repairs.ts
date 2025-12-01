// Custom hook for repair requests with caching and optimistic updates
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { RepairRequest, RepairReport } from '@/types'

// Fetch repair requests
export function useRepairs(status?: string) {
  return useQuery({
    queryKey: queryKeys.repairRequests(status),
    queryFn: async () => {
      const searchParams = status ? `?status=${status}` : '';
      const response = await fetch(`/api/repair-requests${searchParams}`)
      if (!response.ok) throw new Error('Failed to fetch repair requests')
      const data = await response.json()
      return data.requests || []
    },
    // Keep previous data visible during refetch
    placeholderData: (prev) => prev ?? [],
  })
}

// Fetch single repair request details
export function useRepairDetails(id: string) {
  return useQuery({
    queryKey: queryKeys.repairRequest(id),
    queryFn: async () => {
        if (!id) return null;
        const response = await fetch(`/api/repair-requests/${id}`)
        if (!response.ok) throw new Error('Failed to fetch repair details')
        return response.json()
    },
    enabled: !!id,
  })
}


// Update repair request (e.g. status change, edit details)
export function useUpdateRepair() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RepairRequest> }) => {
      const response = await fetch(`/api/repair-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Failed to update repair request')
      return response.json()
    },
    onMutate: async ({ id, updates }) => {
      // Cancel refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.repairRequests() })
      
      // Get previous data
      const previousRepairs = queryClient.getQueryData<RepairRequest[]>(queryKeys.repairRequests())

      // Optimistically update
      if (previousRepairs) {
        queryClient.setQueryData<RepairRequest[]>(queryKeys.repairRequests(), (old) => {
            return old?.map(r => r.id === id ? { ...r, ...updates } : r) || []
        })
      }

      return { previousRepairs }
    },
    onError: (err, variables, context) => {
        if (context?.previousRepairs) {
            queryClient.setQueryData(queryKeys.repairRequests(), context.previousRepairs)
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.repairRequests() })
    }
  })
}

// Submit a repair report
export function useSubmitRepairReport() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async ({ requestId, data }: { requestId: string, data: any }) => {
            const response = await fetch(`/api/repair-requests/${requestId}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to submit report");
            return response.json();
        },
        onSuccess: (data, variables) => {
             // Invalidate list to show updated status
             queryClient.invalidateQueries({ queryKey: queryKeys.repairRequests() })
             // Invalidate specific request
             queryClient.invalidateQueries({ queryKey: queryKeys.repairRequest(variables.requestId) })
        }
    })
}

// Custom hook for vehicle data with caching and optimistic updates
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { Vehicle, User } from '@/types'

// Fetch vehicles with caching
export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: async () => {
      const response = await fetch('/api/vehicles')
      if (!response.ok) throw new Error('Failed to fetch vehicles')
      const data = await response.json()
      return data.vehicles || []
    },
    placeholderData: (prev: Vehicle[] | undefined) => prev ?? [],
    // Keep the last good payload if a transient refetch returns an empty array
    structuralSharing: (oldData, newData) => {
      if (Array.isArray(newData) && newData.length === 0 && Array.isArray(oldData) && oldData.length > 0) {
        return oldData
      }
      return newData
    },
    select: (data: Vehicle[]) => 
      // Sort vehicles to prioritize complete records (copy first to avoid mutating cache)
      [...data].sort((a: Vehicle, b: Vehicle) => {
        const isCompleteA = a.make && a.model && !a.vin.startsWith('AIRTABLE');
        const isCompleteB = b.make && b.model && !b.vin.startsWith('AIRTABLE');
        if (isCompleteA && !isCompleteB) return -1;
        if (!isCompleteA && isCompleteB) return 1;
        return (a.make || '').localeCompare(b.make || '');
      }),
    staleTime: 2 * 60 * 1000, // 2 minutes for frequently updated data
  })
}

// Create vehicle with optimistic update
export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vehicleData: Omit<Vehicle, 'id' | 'createdAt'>) => {
      const formData = new FormData()
      Object.entries(vehicleData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      const response = await fetch('/api/vehicles', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to create vehicle')
      return response.json()
    },
    onMutate: async (newVehicle) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicles })

      // Snapshot previous value
      const previousVehicles = queryClient.getQueryData(queryKeys.vehicles)

      // Optimistically update
      const optimisticVehicle: Vehicle = {
        id: `temp-${Date.now()}`,
        ...newVehicle,
        createdAt: new Date().toISOString(),
        serviceHistory: [],
      }

      queryClient.setQueryData(queryKeys.vehicles, (old: Vehicle[] = []) => [
        optimisticVehicle,
        ...old,
      ])

      return { previousVehicles }
    },
    onError: (err, newVehicle, context) => {
      // Rollback on error
      if (context?.previousVehicles) {
        queryClient.setQueryData(queryKeys.vehicles, context.previousVehicles)
      }
    },
    onSuccess: (data) => {
      // Replace optimistic update with real data
      queryClient.setQueryData(queryKeys.vehicles, (old: Vehicle[] = []) =>
        old.map((vehicle) =>
          vehicle.id.startsWith('temp-') ? data.vehicle : vehicle
        )
      )
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles })
    },
  })
}

// Update vehicle with optimistic update
export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates, photoFile }: { 
      id: string, 
      updates: Partial<Vehicle>,
      photoFile?: File 
    }) => {
      const formData = new FormData()
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })
      
      if (photoFile) {
        formData.append('photo', photoFile)
      }

      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to update vehicle')
      return response.json()
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicles })
      const previousVehicles = queryClient.getQueryData(queryKeys.vehicles)

      // Optimistic update
      queryClient.setQueryData(queryKeys.vehicles, (old: Vehicle[] = []) =>
        old.map((vehicle) =>
          vehicle.id === id ? { ...vehicle, ...updates } : vehicle
        )
      )

      return { previousVehicles }
    },
    onError: (err, variables, context) => {
      if (context?.previousVehicles) {
        queryClient.setQueryData(queryKeys.vehicles, context.previousVehicles)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vehicles, (old: Vehicle[] = []) =>
        old.map((vehicle) =>
          vehicle.id === data.vehicle.id ? data.vehicle : vehicle
        )
      )
    },
  })
}

// Delete vehicle with optimistic update
export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete vehicle')
      return { id }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicles })
      const previousVehicles = queryClient.getQueryData(queryKeys.vehicles)

      queryClient.setQueryData(queryKeys.vehicles, (old: Vehicle[] = []) =>
        old.filter((vehicle) => vehicle.id !== id)
      )

      return { previousVehicles }
    },
    onError: (err, id, context) => {
      if (context?.previousVehicles) {
        queryClient.setQueryData(queryKeys.vehicles, context.previousVehicles)
      }
    },
  })
}

// Fetch drivers with caching
export function useDrivers() {
  return useQuery({
    queryKey: queryKeys.drivers,
    queryFn: async () => {
      const response = await fetch('/api/drivers')
      if (!response.ok) throw new Error('Failed to fetch drivers')
      const data = await response.json()
      return data.drivers || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for less frequently updated data
  })
}

// Create driver with optimistic update
export function useCreateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (driverData: { name: string, email: string, phone?: string }) => {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData),
      })

      if (!response.ok) throw new Error('Failed to create driver')
      return response.json()
    },
    onMutate: async (newDriver) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.drivers })
      const previousDrivers = queryClient.getQueryData(queryKeys.drivers)

      const optimisticDriver: User = {
        id: `temp-${Date.now()}`,
        ...newDriver,
        role: 'driver',
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData(queryKeys.drivers, (old: User[] = []) => [
        optimisticDriver,
        ...old,
      ])

      return { previousDrivers }
    },
    onError: (err, newDriver, context) => {
      if (context?.previousDrivers) {
        queryClient.setQueryData(queryKeys.drivers, context.previousDrivers)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.drivers, (old: User[] = []) =>
        old.map((driver) =>
          driver.id.startsWith('temp-') ? data.driver : driver
        )
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers })
    },
  })
}

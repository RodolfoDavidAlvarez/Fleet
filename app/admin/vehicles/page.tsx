'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Car, Plus, User as UserIcon, Wrench, Calendar, Gauge } from 'lucide-react'
import { Vehicle } from '@/types'
import { getStatusColor, formatDate } from '@/lib/utils'
import { useVehicles } from '@/hooks/use-vehicles'

export default function VehiclesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const { data: vehicles = [], isLoading, error: vehiclesError } = useVehicles()
  const activeCount = vehicles.filter((v) => v.status === 'active').length
  const inServiceCount = vehicles.filter((v) => v.status === 'in_service').length

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      router.push('/login')
      return
    }
    setUser(parsedUser)
  }, [router])

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || 'admin'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Fleet</p>
                <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
                <p className="text-gray-600">Manage your fleet vehicles and their status.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="card-surface p-3 rounded-xl text-sm">
                  <p className="text-xs text-gray-500">Active</p>
                  <p className="text-lg font-semibold text-gray-900">{activeCount}</p>
                </div>
                <div className="card-surface p-3 rounded-xl text-sm">
                  <p className="text-xs text-gray-500">In Service</p>
                  <p className="text-lg font-semibold text-gray-900">{inServiceCount}</p>
                </div>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Vehicle
                </button>
              </div>
            </div>

            {vehiclesError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                Failed to load vehicles. Please try again.
              </div>
            )}

            {isLoading ? (
              <div className="p-8 text-center text-gray-600">Loading vehicles...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="card-surface rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-3 rounded-full">
                          <Car className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {vehicle.make && vehicle.model
                              ? `${vehicle.make} ${vehicle.model}`
                              : vehicle.vehicleNumber || vehicle.vin}
                          </h3>
                          {vehicle.year && (
                            <p className="text-sm text-gray-500">{vehicle.year}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {vehicle.licensePlate && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-2">Plate:</span>
                          {vehicle.licensePlate}
                        </div>
                      )}
                      {vehicle.vin && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-2">VIN:</span>
                          <span className="font-mono text-xs">{vehicle.vin}</span>
                        </div>
                      )}
                      {vehicle.driverName && (
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 mr-2" />
                          {vehicle.driverName}
                        </div>
                      )}
                      {vehicle.mileage !== undefined && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Gauge className="h-4 w-4 mr-2" />
                          {vehicle.mileage.toLocaleString()} miles
                        </div>
                      )}
                    </div>

                    {(vehicle.nextServiceDue || vehicle.lastServiceDate) && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-1">
                        {vehicle.nextServiceDue && (
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="font-medium">Next Service:</span>
                            <span className="ml-2">{formatDate(vehicle.nextServiceDue)}</span>
                          </div>
                        )}
                        {vehicle.lastServiceDate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Wrench className="h-4 w-4 mr-2" />
                            <span>Last Service: {formatDate(vehicle.lastServiceDate)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        {vehicle.serviceHistory?.length || 0} service records
                      </div>
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
                {vehicles.length === 0 && (
                  <div className="p-6 text-center text-gray-500 col-span-full">
                    No vehicles found.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

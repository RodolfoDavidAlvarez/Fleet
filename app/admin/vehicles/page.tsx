'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Car, Plus, User as UserIcon, Wrench, Calendar, Gauge, X, Loader2, Save } from 'lucide-react'
import { Vehicle } from '@/types'
import { getStatusColor, formatDate } from '@/lib/utils'
import { useVehicles, useCreateVehicle } from '@/hooks/use-vehicles'
import { VehicleCardSkeleton } from '@/components/ui/loading-states'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/toast'

export default function VehiclesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const { data: vehicles = [], isLoading, error: vehiclesError } = useVehicles()
  const createVehicle = useCreateVehicle()
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    licensePlate: '',
    mileage: 0,
    status: 'active' as 'active' | 'in_service' | 'retired',
    vehicleNumber: '',
  })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createVehicle.mutateAsync(formData)
      setShowAddModal(false)
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        licensePlate: '',
        mileage: 0,
        status: 'active',
        vehicleNumber: '',
      })
      showToast('Vehicle added successfully!', 'success')
    } catch (error) {
      console.error('Error creating vehicle:', error)
      showToast('Failed to add vehicle. Please try again.', 'error')
    }
  }

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
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <motion.div 
                layout 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {vehicles.map((vehicle, i) => (
                    <motion.div
                      key={vehicle.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                      className="card-surface rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/60 group cursor-pointer"
                      onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                            <Car className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-primary-700 transition-colors">
                              {vehicle.make && vehicle.model
                                ? `${vehicle.make} ${vehicle.model}`
                                : vehicle.vehicleNumber || vehicle.vin}
                            </h3>
                            {vehicle.year && (
                              <p className="text-sm font-medium text-gray-500">{vehicle.year}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status?.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {vehicle.licensePlate && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plate</p>
                            <p className="text-sm font-bold text-gray-900 font-mono">{vehicle.licensePlate}</p>
                          </div>
                        )}
                        {vehicle.vin && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">VIN</p>
                            <p className="text-xs font-mono text-gray-900 truncate" title={vehicle.vin}>{vehicle.vin}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                        {vehicle.mileage !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="bg-primary-50 p-1.5 rounded-lg">
                              <Gauge className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Mileage</p>
                              <p className="text-sm font-semibold text-gray-900">{vehicle.mileage.toLocaleString()} mi</p>
                            </div>
                          </div>
                        )}
                        {vehicle.driverName && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="bg-primary-50 p-1.5 rounded-lg">
                              <UserIcon className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Driver</p>
                              <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]" title={vehicle.driverName}>{vehicle.driverName}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {(vehicle.nextServiceDue || vehicle.lastServiceDate) && (
                        <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 space-y-2">
                          {vehicle.nextServiceDue && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-blue-600 font-medium">Next Service</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(vehicle.nextServiceDue)}</p>
                              </div>
                            </div>
                          )}
                          {vehicle.lastServiceDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                <Wrench className="h-4 w-4 text-indigo-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-indigo-600 font-medium">Last Service</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(vehicle.lastServiceDate)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 font-medium">
                            {vehicle.serviceHistory?.length || 0} service {vehicle.serviceHistory?.length === 1 ? 'record' : 'records'}
                          </span>
                        </div>
                        <button 
                          className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/vehicles/${vehicle.id}`)
                          }}
                        >
                          View Details
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {vehicles.length === 0 && (
                  <div className="p-6 text-center text-gray-500 col-span-full">
                    No vehicles found.
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
              onClick={() => setShowAddModal(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Add New Vehicle</h2>
                      <p className="text-xs text-gray-500">Fill in the vehicle details below</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-ghost btn-icon"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                  {/* Basic Information */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Car className="h-4 w-4 text-primary-600" />
                      </div>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Make *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full"
                          value={formData.make}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                          placeholder="e.g., Ford"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Model *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="e.g., F-150"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Year *</span>
                        <input
                          type="number"
                          required
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          className="input-field w-full"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Vehicle Number</span>
                        <input
                          type="text"
                          className="input-field w-full"
                          value={formData.vehicleNumber}
                          onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                          placeholder="e.g., 223"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Identification */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Car className="h-4 w-4 text-green-600" />
                      </div>
                      Identification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">VIN *</span>
                        <input
                          type="text"
                          required
                          minLength={3}
                          className="input-field w-full font-mono"
                          value={formData.vin}
                          onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                          placeholder="Vehicle Identification Number"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">License Plate *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full font-mono"
                          value={formData.licensePlate}
                          onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                          placeholder="ABC-1234"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Status & Mileage */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Gauge className="h-4 w-4 text-indigo-600" />
                      </div>
                      Status & Mileage
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Status *</span>
                        <select
                          required
                          className="input-field w-full"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        >
                          <option value="active">Active</option>
                          <option value="in_service">In Service</option>
                          <option value="retired">Retired</option>
                        </select>
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Mileage</span>
                        <input
                          type="number"
                          min="0"
                          className="input-field w-full"
                          value={formData.mileage}
                          onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="btn btn-secondary flex-1"
                      disabled={createVehicle.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1 flex items-center gap-2 justify-center"
                      disabled={createVehicle.isPending}
                    >
                      {createVehicle.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Add Vehicle
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Car, ArrowLeft, Edit, Loader2, Save, X, User as UserIcon, Gauge, Calendar, Wrench, Mail, Phone, UserPlus, UserMinus } from 'lucide-react'
import { Vehicle } from '@/types'
import { getStatusColor, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useDrivers } from '@/hooks/use-vehicles'
import { ChevronDown, Check, Search } from 'lucide-react'

export default function VehicleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Vehicle>>({})
  const [saving, setSaving] = useState(false)
  const [showDriverSelector, setShowDriverSelector] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [assigningDriver, setAssigningDriver] = useState(false)
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false)
  const [driverSearch, setDriverSearch] = useState('')
  const driverDropdownRef = useRef<HTMLDivElement>(null)
  const { data: drivers = [], isLoading: driversLoading } = useDrivers()

  const vehicleId = params.id as string

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

  useEffect(() => {
    if (!vehicleId) return

    const loadVehicle = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/vehicles/${vehicleId}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Vehicle not found')
          }
          throw new Error('Failed to load vehicle')
        }
        const data = await res.json()
        setVehicle(data.vehicle)
      } catch (err) {
        console.error('Error fetching vehicle:', err)
        setError(err instanceof Error ? err.message : 'Failed to load vehicle')
      } finally {
        setLoading(false)
      }
    }

    loadVehicle()
  }, [vehicleId])

  const openEdit = () => {
    if (!vehicle) return
    setEditing(true)
    setEditForm({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      licensePlate: vehicle.licensePlate,
      mileage: vehicle.mileage,
      status: vehicle.status,
      vehicleNumber: vehicle.vehicleNumber,
    })
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditForm({})
  }

  const saveVehicle = async () => {
    if (!vehicle) return
    
    try {
      setSaving(true)
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update vehicle')
      }

      const data = await res.json()
      const updatedVehicle = data.vehicle || { ...vehicle, ...editForm }
      
      setVehicle(updatedVehicle)
      setEditing(false)
      setEditForm({})
      showToast('Vehicle updated successfully!', 'success')
    } catch (err) {
      console.error('Error updating vehicle:', err)
      showToast(err instanceof Error ? err.message : 'Failed to update vehicle', 'error')
    } finally {
      setSaving(false)
    }
  }

  const assignDriver = async () => {
    if (!vehicle) return
    
    try {
      setAssigningDriver(true)
      const driverId = selectedDriverId === '' ? null : selectedDriverId
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to assign driver')
      }

      const data = await res.json()
      setVehicle(data.vehicle)
      setShowDriverSelector(false)
      setSelectedDriverId('')
      showToast(driverId ? 'Driver assigned successfully!' : 'Driver removed successfully!', 'success')
    } catch (err) {
      console.error('Error assigning driver:', err)
      showToast(err instanceof Error ? err.message : 'Failed to assign driver', 'error')
    } finally {
      setAssigningDriver(false)
    }
  }

  const removeDriver = async () => {
    if (!vehicle) return
    
    try {
      setAssigningDriver(true)
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: null }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove driver')
      }

      const data = await res.json()
      setVehicle(data.vehicle)
      showToast('Driver removed successfully!', 'success')
    } catch (err) {
      console.error('Error removing driver:', err)
      showToast(err instanceof Error ? err.message : 'Failed to remove driver', 'error')
    } finally {
      setAssigningDriver(false)
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar role={user?.role || 'admin'} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header userName={user.name} userRole={user.role} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar role={user?.role || 'admin'} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header userName={user.name} userRole={user.role} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error || 'Vehicle not found'}
              </div>
              <button
                onClick={() => router.push('/admin/vehicles')}
                className="mt-4 btn btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Vehicles
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || 'admin'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/vehicles')}
                className="btn btn-ghost btn-icon"
                aria-label="Back to vehicles"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Vehicle Details</p>
                <h1 className="text-3xl font-bold text-gray-900">
                  {vehicle.make && vehicle.model
                    ? `${vehicle.make} ${vehicle.model}`
                    : vehicle.vehicleNumber || vehicle.vin}
                </h1>
              </div>
              {!editing && (
                <button
                  onClick={openEdit}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Vehicle
                </button>
              )}
            </div>

            {editing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-surface rounded-xl p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Edit Vehicle</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelEdit}
                      className="btn btn-secondary"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveVehicle}
                      className="btn btn-primary flex items-center gap-2"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Make *</span>
                    <input
                      type="text"
                      required
                      className="input-field w-full"
                      value={editForm.make || ''}
                      onChange={(e) => setEditForm({ ...editForm, make: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Model *</span>
                    <input
                      type="text"
                      required
                      className="input-field w-full"
                      value={editForm.model || ''}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
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
                      value={editForm.year || ''}
                      onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Vehicle Number</span>
                    <input
                      type="text"
                      className="input-field w-full"
                      value={editForm.vehicleNumber || ''}
                      onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">VIN *</span>
                    <input
                      type="text"
                      required
                      className="input-field w-full font-mono"
                      value={editForm.vin || ''}
                      onChange={(e) => setEditForm({ ...editForm, vin: e.target.value.toUpperCase() })}
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">License Plate *</span>
                    <input
                      type="text"
                      required
                      className="input-field w-full font-mono"
                      value={editForm.licensePlate || ''}
                      onChange={(e) => setEditForm({ ...editForm, licensePlate: e.target.value.toUpperCase() })}
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Status *</span>
                    <select
                      required
                      className="input-field w-full"
                      value={editForm.status || 'active'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
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
                      value={editForm.mileage || 0}
                      onChange={(e) => setEditForm({ ...editForm, mileage: parseInt(e.target.value) || 0 })}
                    />
                  </label>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Vehicle Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="card-surface rounded-xl p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-xl shadow-sm">
                            <Car className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                              {vehicle.make && vehicle.model
                                ? `${vehicle.make} ${vehicle.model}`
                                : vehicle.vehicleNumber || vehicle.vin}
                            </h2>
                            {vehicle.year && (
                              <p className="text-sm text-gray-500 mt-1">{vehicle.year}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status?.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {vehicle.licensePlate && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">License Plate</p>
                            <p className="text-lg font-bold text-gray-900 font-mono">{vehicle.licensePlate}</p>
                          </div>
                        )}
                        {vehicle.vin && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">VIN</p>
                            <p className="text-sm font-mono text-gray-900 break-all">{vehicle.vin}</p>
                          </div>
                        )}
                        {vehicle.vehicleNumber && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Vehicle Number</p>
                            <p className="text-lg font-bold text-gray-900">{vehicle.vehicleNumber}</p>
                          </div>
                        )}
                        {vehicle.mileage !== undefined && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Mileage</p>
                            <div className="flex items-center gap-2">
                              <Gauge className="h-5 w-5 text-primary-600" />
                              <p className="text-lg font-bold text-gray-900">{vehicle.mileage.toLocaleString()} mi</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Service Information */}
                    {(vehicle.nextServiceDue || vehicle.lastServiceDate) && (
                      <div className="card-surface rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Service Information</h3>
                        <div className="space-y-4">
                          {vehicle.nextServiceDue && (
                            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="bg-white p-2 rounded-lg shadow-sm">
                                <Calendar className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Next Service Due</p>
                                <p className="text-lg font-semibold text-gray-900">{formatDate(vehicle.nextServiceDue)}</p>
                              </div>
                            </div>
                          )}
                          {vehicle.lastServiceDate && (
                            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                              <div className="bg-white p-2 rounded-lg shadow-sm">
                                <Wrench className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Last Service Date</p>
                                <p className="text-lg font-semibold text-gray-900">{formatDate(vehicle.lastServiceDate)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Service History */}
                    {vehicle.serviceHistory && vehicle.serviceHistory.length > 0 && (
                      <div className="card-surface rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Service History ({vehicle.serviceHistory.length})
                        </h3>
                        <div className="space-y-3">
                          {vehicle.serviceHistory.map((record) => (
                            <div key={record.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{record.serviceType}</p>
                                  {record.description && (
                                    <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    {record.date && <span>{formatDate(record.date)}</span>}
                                    {record.mileage && <span>{record.mileage.toLocaleString()} mi</span>}
                                    {record.cost && <span>${record.cost.toLocaleString()}</span>}
                                  </div>
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                  {record.status?.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Driver Information */}
                    <div className="card-surface rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <UserIcon className="h-5 w-5 text-primary-600" />
                          Assigned Driver
                        </h3>
                        {!showDriverSelector && (
                          <button
                            onClick={() => {
                              setShowDriverSelector(true)
                              setSelectedDriverId(vehicle.driverId || '')
                            }}
                            className="btn btn-sm btn-secondary flex items-center gap-1.5"
                          >
                            {vehicle.driverName ? (
                              <>
                                <Edit className="h-3.5 w-3.5" />
                                Change
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3.5 w-3.5" />
                                Assign
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {showDriverSelector ? (
                        <div className="space-y-3">
                          <label className="space-y-1.5 block">
                            <span className="text-sm font-semibold text-gray-700">Select Driver</span>
                            <select
                              className="input-field w-full"
                              value={selectedDriverId}
                              onChange={(e) => setSelectedDriverId(e.target.value)}
                              disabled={assigningDriver || driversLoading}
                            >
                              <option value="">No driver assigned</option>
                              {drivers.map((driver) => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.name} {driver.email ? `(${driver.email})` : ''}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={assignDriver}
                              className="btn btn-primary btn-sm flex-1 flex items-center gap-1.5"
                              disabled={assigningDriver || driversLoading}
                            >
                              {assigningDriver ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3.5 w-3.5" />
                                  Save
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setShowDriverSelector(false)
                                setSelectedDriverId('')
                              }}
                              className="btn btn-secondary btn-sm"
                              disabled={assigningDriver}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : vehicle.driverName ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Name</p>
                            <p className="text-base font-semibold text-gray-900">{vehicle.driverName}</p>
                          </div>
                          {vehicle.driverEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-700">{vehicle.driverEmail}</p>
                            </div>
                          )}
                          {vehicle.driverPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-700">{vehicle.driverPhone}</p>
                            </div>
                          )}
                          {vehicle.driverAssignedDate && (
                            <div>
                              <p className="text-xs text-gray-500">Assigned</p>
                              <p className="text-sm text-gray-700">{formatDate(vehicle.driverAssignedDate)}</p>
                            </div>
                          )}
                          <button
                            onClick={removeDriver}
                            className="btn btn-sm btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 w-full mt-2 flex items-center justify-center gap-1.5"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            Remove Driver
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500 mb-3">No driver assigned to this vehicle</p>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="card-surface rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-semibold text-gray-900">{formatDate(vehicle.createdAt)}</p>
                        </div>
                        {vehicle.department && (
                          <div>
                            <p className="text-gray-500">Department</p>
                            <p className="font-semibold text-gray-900">{vehicle.department}</p>
                          </div>
                        )}
                        {vehicle.supervisor && (
                          <div>
                            <p className="text-gray-500">Supervisor</p>
                            <p className="font-semibold text-gray-900">{vehicle.supervisor}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}



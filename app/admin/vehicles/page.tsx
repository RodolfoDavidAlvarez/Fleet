'use client'

import { FormEvent, useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Car, Plus, Edit, Trash2, Search, Info, UserPlus, X, Upload, Camera, Wrench, Calendar, DollarSign, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Vehicle, User } from '@/types'
import { getStatusColor } from '@/lib/utils'
import { useVehicles, useDrivers, useCreateVehicle, useUpdateVehicle, useCreateDriver } from '@/hooks/use-vehicles'
import { PageTransition } from '@/components/ui/smooth-transitions'
import { VehicleCardSkeleton } from '@/components/ui/loading-states'
import { useDebounce } from '@/hooks/use-debounce'

export default function VehiclesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  const { data: vehicles = [], isLoading: vehiclesLoading, error: vehiclesError } = useVehicles()
  const { data: drivers = [], isLoading: driversLoading } = useDrivers()
  const createVehicleMutation = useCreateVehicle()
  const updateVehicleMutation = useUpdateVehicle()
  const createDriverMutation = useCreateDriver()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [updating, setUpdating] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loading = vehiclesLoading || driversLoading
  const globalError = error || vehiclesError?.message || createVehicleMutation.error?.message || updateVehicleMutation.error?.message || createDriverMutation.error?.message || null
  const saving = createVehicleMutation.isPending
  const driverSaving = createDriverMutation.isPending
  const [editForm, setEditForm] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    licensePlate: '',
    mileage: '',
    status: 'active' as 'active' | 'in_service' | 'retired',
    driverId: '',
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [driverForm, setDriverForm] = useState({ name: '', email: '', phone: '' })
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [selectedRepairRequest, setSelectedRepairRequest] = useState<any>(null)
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    vin: '',
    licensePlate: '',
    mileage: '',
    driverId: '',
  })

  // Authentication and filtering
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin' && parsedUser.role !== 'mechanic') {
      router.push('/login')
      return
    }
    setUser(parsedUser)
  }, [router])

  // Optimized vehicle filtering and sorting
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = vehicles

    // Apply search filter
    if (debouncedSearch.trim()) {
      const search = debouncedSearch.toLowerCase()
      filtered = vehicles.filter(vehicle => 
        vehicle.make?.toLowerCase().includes(search) ||
        vehicle.model?.toLowerCase().includes(search) ||
        vehicle.vin?.toLowerCase().includes(search) ||
        vehicle.licensePlate?.toLowerCase().includes(search) ||
        vehicle.driverName?.toLowerCase().includes(search)
      )
    }

    // Sort vehicles to prioritize complete records
    return filtered.sort((a: Vehicle, b: Vehicle) => {
      // Helper to check if a vehicle is "complete" (has make/model and real VIN)
      const isCompleteA = a.make && a.model && !a.vin.startsWith('AIRTABLE');
      const isCompleteB = b.make && b.model && !b.vin.startsWith('AIRTABLE');

      // Complete records come first
      if (isCompleteA && !isCompleteB) return -1;
      if (!isCompleteA && isCompleteB) return 1;
      
      // Secondary sort by Make
      return (a.make || '').localeCompare(b.make || '');
    })
  }, [vehicles, debouncedSearch])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    createVehicleMutation.mutate({
      make: form.make,
      model: form.model,
      year: Number(form.year),
      vin: form.vin,
      licensePlate: form.licensePlate,
      mileage: form.mileage ? Number(form.mileage) : 0,
      status: 'active' as const,
      serviceHistory: [],
      driverId: form.driverId || undefined,
    }, {
      onSuccess: () => {
        setForm({
          make: '',
          model: '',
          year: new Date().getFullYear().toString(),
          vin: '',
          licensePlate: '',
          mileage: '',
          driverId: '',
        })
        setFormOpen(false)
      },
    })
  }

  const handleCreateDriver = async (e: FormEvent) => {
    e.preventDefault()
    
    createDriverMutation.mutate(driverForm, {
      onSuccess: () => {
        setDriverForm({ name: '', email: '', phone: '' })
      },
    })
  }

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setEditForm({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      vin: vehicle.vin,
      licensePlate: vehicle.licensePlate,
      mileage: vehicle.mileage.toString(),
      status: vehicle.status,
      driverId: vehicle.driverId || '',
    })
    setPhotoPreview(vehicle.photoUrl || null)
    setPhotoFile(null)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleUpdateVehicle = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return

    setUpdating(true)
    setError(null)

    try {
      // First upload photo if selected
      let photoUrl = editingVehicle.photoUrl
      if (photoFile) {
        const photoFormData = new FormData()
        photoFormData.append('photo', photoFile)
        const photoRes = await fetch(`/api/vehicles/${editingVehicle.id}/photo`, {
          method: 'POST',
          body: photoFormData,
        })
        const photoData = await photoRes.json()
        if (!photoRes.ok) {
          throw new Error(photoData.error || 'Failed to upload photo')
        }
        photoUrl = photoData.photoUrl
      }

      // Then update vehicle data
      const res = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: editForm.make,
          model: editForm.model,
          year: parseInt(editForm.year),
          vin: editForm.vin,
          licensePlate: editForm.licensePlate,
          mileage: parseInt(editForm.mileage) || 0,
          status: editForm.status,
          driverId: editForm.driverId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update vehicle')
      }

      // Update selected vehicle if it matches
      if (selectedVehicle?.id === editingVehicle.id) {
        setSelectedVehicle({ ...data.vehicle, photoUrl: photoUrl || data.vehicle.photoUrl })
      }

      setEditingVehicle(null)
      setPhotoFile(null)
      setPhotoPreview(null)
    } catch (err) {
      console.error('Error updating vehicle:', err)
      setError(err instanceof Error ? err.message : 'Failed to update vehicle')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete vehicle')
      }

      if (selectedVehicle?.id === vehicleId) {
        setSelectedVehicle(null)
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle')
    }
  }

  // Statistics with memoization
  const vehicleStats = useMemo(() => ({
    totalActive: vehicles.filter((v) => v.status === 'active').length,
    totalService: vehicles.filter((v) => v.status === 'in_service').length,
    totalRetired: vehicles.filter((v) => v.status === 'retired').length,
  }), [vehicles])
  
  const { totalActive, totalService, totalRetired } = vehicleStats

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar role={user?.role || 'admin'} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header userName={user?.name || ''} userRole={user?.role || 'admin'} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="space-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
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
          <Header userName={user?.name || ''} userRole={user?.role || 'admin'} />
          <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-primary-700 font-semibold uppercase tracking-[0.08em]">Fleet</p>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
                  <span className="px-3 py-1 text-xs font-semibold bg-primary-50 text-primary-700 rounded-full">
                    {filteredAndSortedVehicles.length} showing / {vehicles.length} total
                  </span>
                </div>
                <p className="text-sm text-gray-600">Condensed view with always-visible actions.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFormOpen(prev => !prev)}
                  className="btn-primary px-4 py-2.5 flex items-center gap-2 rounded-lg"
                >
                  <Plus className="h-5 w-5" />
                  {formOpen ? 'Close Form' : 'Add Vehicle'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="card-surface rounded-xl p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Total</p>
                <p className="text-xl font-semibold text-gray-900">{vehicles.length}</p>
              </div>
              <div className="card-surface rounded-xl p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Active</p>
                <p className="text-xl font-semibold text-gray-900">{totalActive}</p>
              </div>
              <div className="card-surface rounded-xl p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">In Service</p>
                <p className="text-xl font-semibold text-gray-900">{totalService}</p>
              </div>
              <div className="card-surface rounded-xl p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Retired</p>
                <p className="text-xl font-semibold text-gray-900">{totalRetired}</p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search vehicles by make, model, VIN, license plate, or driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all gpu-accelerated"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {formOpen && (
              <>
                <div className="card-surface p-4 rounded-2xl">
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-2 text-sm text-gray-700">
                      Make *
                      <input
                        required
                        placeholder="Make"
                        value={form.make}
                        onChange={(e) => setForm({ ...form, make: e.target.value })}
                        className="input-field py-2"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-gray-700">
                      Model *
                      <input
                        required
                        placeholder="Model"
                        value={form.model}
                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                        className="input-field py-2"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-gray-700">
                      Year *
                      <input
                        required
                        type="number"
                        placeholder="Year"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                        className="input-field py-2"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-gray-700">
                      VIN *
                      <input
                        required
                        placeholder="VIN"
                        value={form.vin}
                        onChange={(e) => setForm({ ...form, vin: e.target.value })}
                        className="input-field py-2"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-gray-700">
                      License Plate *
                      <input
                        required
                        placeholder="License Plate"
                        value={form.licensePlate}
                        onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                        className="input-field py-2"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-gray-700">
                      Mileage
                      <input
                        type="number"
                        placeholder="Mileage"
                        value={form.mileage}
                        onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                        className="input-field py-2"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-gray-700">
                      Driver
                      <select
                        value={form.driverId}
                        onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                        className="input-field py-2"
                      >
                        <option value="">Unassigned</option>
                        {drivers.map((driver: User) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} • {driver.phone || driver.email}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary px-6 py-2.5 flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Vehicle'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
                <div className="card-surface p-4 rounded-2xl mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="h-5 w-5 text-primary-700" />
                    <p className="text-sm font-semibold text-gray-900">Quick add driver</p>
                  </div>
                  <form onSubmit={handleCreateDriver} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      required
                      placeholder="Name"
                      value={driverForm.name}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email"
                      value={driverForm.email}
                      onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <input
                      placeholder="Phone"
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <div className="md:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={driverSaving}
                        className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-gray-900/20 transition-shadow duration-150 hover:shadow-xl hover:shadow-gray-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {driverSaving ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save driver'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {globalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {globalError}
              </div>
            )}

            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500 shadow-sm"
                />
              </div>
            </div>

            <div className="card-surface rounded-xl border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-600">Loading vehicles...</div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-[32%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[14%]" />
                        <col className="w-[22%]" />
                        <col className="w-[8%]" />
                      </colgroup>
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Make / Model
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            License Plate
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Mileage
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Driver
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredAndSortedVehicles.map((vehicle) => (
                          <tr
                            key={vehicle.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            <td className="px-4 py-3 align-top">
                              <div className="flex items-start gap-3">
                                {vehicle.photoUrl ? (
                                    <img 
                                        src={vehicle.photoUrl} 
                                        alt={`${vehicle.make} ${vehicle.model}`}
                                        className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                                    />
                                ) : (
                                    <div className="bg-primary-50 p-2 rounded-lg border border-primary-100">
                                        <Car className="h-5 w-5 text-primary-600" />
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                  <div className={`text-sm font-semibold leading-tight ${!vehicle.make && !vehicle.model ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                                    {vehicle.make || vehicle.model ? `${vehicle.make} ${vehicle.model}` : 'Unknown Make/Model'}
                                  </div>
                                  <div className="text-xs text-gray-500 leading-tight">Year: {vehicle.year}</div>
                                  {!vehicle.vin.startsWith('AIRTABLE') && (
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">VIN: {vehicle.vin}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 align-top">
                              {vehicle.licensePlate ? (
                                <span className="font-medium bg-gray-100 px-2 py-1 rounded text-gray-700 text-xs border border-gray-200">
                                  {vehicle.licensePlate}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs italic">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 align-top">
                              {vehicle.mileage.toLocaleString()} mi
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${getStatusColor(vehicle.status || '')}`}>
                                {vehicle.status ? vehicle.status.replace('_', ' ') : 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 align-top">
                              {vehicle.driverName ? (
                                <div className="space-y-0.5">
                                  <p className="font-semibold leading-tight">{vehicle.driverName}</p>
                                  <p className="text-xs text-gray-500 leading-tight">
                                    {vehicle.driverPhone || vehicle.driverEmail}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">Unassigned</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right sticky right-0 bg-white border-l border-gray-100 align-top">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditClick(vehicle)
                                  }}
                                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 text-primary-700 hover:bg-primary-50"
                                  aria-label="Edit vehicle"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteVehicle(vehicle.id)
                                  }}
                                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:bg-red-50"
                                  aria-label="Delete vehicle"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden divide-y divide-gray-200">
                    {filteredAndSortedVehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="w-full text-left p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</p>
                            <p className="text-sm text-gray-600">{vehicle.year} • {vehicle.licensePlate}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status || '')}`}>
                            {vehicle.status ? vehicle.status.replace('_', ' ') : 'Unknown'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">VIN: {vehicle.vin}</p>
                        <p className="text-xs text-gray-500">Mileage: {vehicle.mileage.toLocaleString()} mi</p>
                        <p className="text-xs text-gray-500">
                          Driver: {vehicle.driverName || 'Unassigned'}
                        </p>
                      </button>
                    ))}
                  </div>
                  {filteredAndSortedVehicles.length === 0 && !loading && (
                    <div className="p-6 text-center text-gray-500">No vehicles found.</div>
                  )}
                </>
              )}
            </div>

            {/* Vehicle Details Slide-Over */}
            {selectedVehicle && (
              <div className="fixed inset-0 z-40 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity opacity-100" 
                  onClick={() => setSelectedVehicle(null)}
                />
                <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl transform transition-transform duration-300 translate-x-0 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                    <h2 className="text-lg font-bold text-gray-900">Vehicle Details</h2>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditClick(selectedVehicle)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit Vehicle"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => setSelectedVehicle(null)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative group w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                        {selectedVehicle.photoUrl ? (
                          <img 
                            src={selectedVehicle.photoUrl} 
                            alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Car className="h-16 w-16 mb-2 opacity-50" />
                            <span className="text-sm font-medium">No photo available</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                           <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full shadow-sm border ${getStatusColor(selectedVehicle.status || '')} bg-white`}>
                              {selectedVehicle.status ? selectedVehicle.status.replace('_', ' ') : 'Unknown'}
                           </span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                        </h3>
                        {selectedVehicle.vehicleNumber && (
                          <p className="text-sm font-medium text-primary-600 mt-1">
                            Fleet ID: #{selectedVehicle.vehicleNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                           <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mileage</p>
                           <p className="font-bold text-gray-900">{selectedVehicle.mileage.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                           <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">License</p>
                           <p className="font-bold text-gray-900">{selectedVehicle.licensePlate}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                           <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Service</p>
                           <p className="font-bold text-gray-900">{selectedVehicle.nextServiceDue || '—'}</p>
                        </div>
                    </div>

                    {/* Detailed Specs */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Info className="h-4 w-4 text-primary-600" />
                        Specifications & Assignment
                      </h4>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                         <div>
                            <p className="text-xs text-gray-500 mb-0.5">VIN</p>
                            <p className="font-medium text-gray-900 font-mono">{selectedVehicle.vin}</p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500 mb-0.5">Department</p>
                            <p className="font-medium text-gray-900">{selectedVehicle.department || '—'}</p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500 mb-0.5">Supervisor</p>
                            <p className="font-medium text-gray-900">{selectedVehicle.supervisor || '—'}</p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500 mb-0.5">Tag Expiry</p>
                            <p className="font-medium text-gray-900">{selectedVehicle.tagExpiry || '—'}</p>
                         </div>
                         <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-0.5">Assigned Driver</p>
                            <div className="flex items-center gap-2">
                               <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                                  {(selectedVehicle.driverName || 'U')[0]}
                               </div>
                               <p className="font-medium text-gray-900">{selectedVehicle.driverName || 'Unassigned'}</p>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Service History Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                         <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                           <Wrench className="h-4 w-4 text-primary-600" />
                           Service History
                         </h4>
                         <span className="text-xs text-gray-500">{selectedVehicle.serviceHistory?.length || 0} Records</span>
                      </div>
                      
                      {selectedVehicle.serviceHistory && selectedVehicle.serviceHistory.length > 0 ? (
                        <div className="space-y-3">
                          {selectedVehicle.serviceHistory.map((record: any) => (
                            <button 
                              key={record.id} 
                              onClick={() => setSelectedRecord(record)}
                              className="w-full text-left bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 hover:bg-primary-50/30 transition-all group"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-gray-900 group-hover:text-primary-700">{record.serviceType}</span>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{record.date}</span>
                              </div>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">{record.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3 mt-1">
                                <div className="flex items-center gap-1">
                                    <Car className="h-3 w-3" />
                                    <span>{record.mileage ? `${record.mileage.toLocaleString()}` : '—'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>{record.cost?.toLocaleString() ?? 0}</span>
                                </div>
                                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                    record.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {record.status || 'Completed'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <Wrench className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 font-medium">No service history found</p>
                        </div>
                      )}
                    </div>

                    {/* Repair Requests Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                         <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                           <AlertTriangle className="h-4 w-4 text-amber-600" />
                           Repair Requests
                         </h4>
                         <span className="text-xs text-gray-500">{selectedVehicle.repairRequests?.length || 0} Requests</span>
                      </div>
                      
                      {selectedVehicle.repairRequests && selectedVehicle.repairRequests.length > 0 ? (
                        <div className="space-y-3">
                          {selectedVehicle.repairRequests.map((request: any) => (
                            <button 
                              key={request.id} 
                              onClick={() => setSelectedRepairRequest(request)}
                              className="w-full text-left bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${
                                    request.urgency === 'critical' ? 'bg-red-500' : 
                                    request.urgency === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                                  }`} />
                                  <span className="font-semibold text-gray-900 group-hover:text-amber-800">
                                    {request.driverName || 'Driver Report'}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">{request.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3 mt-1">
                                <div className="flex items-center gap-1">
                                    <Car className="h-3 w-3" />
                                    <span>{request.odometer ? `${request.odometer.toLocaleString()}` : '—'}</span>
                                </div>
                                {request.aiCategory && (
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium truncate max-w-[120px]">
                                    {request.aiCategory}
                                  </span>
                                )}
                                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                    request.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                    request.status === 'submitted' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {request.status || 'Submitted'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <AlertTriangle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 font-medium">No repair requests found</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer Actions */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                     <button className="flex-1 btn-secondary justify-center">Assign Job</button>
                     <button className="flex-1 btn-primary justify-center" onClick={() => handleEditClick(selectedVehicle)}>Edit Vehicle</button>
                  </div>
                </div>
              </div>
            )}

            {/* Repair Request Details Modal */}
            {selectedRepairRequest && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                  <div className="bg-gray-50 border-b border-gray-100 p-6 flex items-start justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">Repair Request</h3>
                        <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide rounded-full border ${
                          selectedRepairRequest.urgency === 'critical' ? 'bg-red-50 text-red-700 border-red-100' : 
                          selectedRepairRequest.urgency === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {selectedRepairRequest.urgency || 'Normal'} Priority
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(selectedRepairRequest.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRepairRequest(null)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Driver & Vehicle Context */}
                    <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {(selectedRepairRequest.driverName || 'U')[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{selectedRepairRequest.driverName}</p>
                        <p className="text-xs text-gray-500">{selectedRepairRequest.driverPhone || selectedRepairRequest.driverEmail || 'No contact info'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{selectedRepairRequest.odometer ? `${selectedRepairRequest.odometer.toLocaleString()} mi` : '—'}</p>
                        <p className="text-xs text-gray-500">Odometer</p>
                      </div>
                    </div>

                    {/* AI Category Badge */}
                    {selectedRepairRequest.aiCategory && (
                      <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="mt-0.5">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1">AI Analysis</p>
                          <p className="text-sm text-blue-900 font-medium">{selectedRepairRequest.aiCategory}</p>
                          {selectedRepairRequest.aiSummary && (
                            <p className="text-xs text-blue-700 mt-1 leading-relaxed">{selectedRepairRequest.aiSummary}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Problem Description
                      </div>
                      <div className="bg-white p-4 text-sm text-gray-800 leading-relaxed border border-gray-200 rounded-xl shadow-sm">
                        {selectedRepairRequest.description}
                      </div>
                    </div>

                    {/* Photos Grid */}
                    {selectedRepairRequest.photoUrls && selectedRepairRequest.photoUrls.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <Camera className="h-4 w-4 text-gray-500" />
                          Attached Photos ({selectedRepairRequest.photoUrls.length})
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedRepairRequest.photoUrls.map((url: string, idx: number) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-100">
                              <img 
                                src={url} 
                                alt={`Evidence ${idx + 1}`} 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                                onClick={() => window.open(url, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Modal Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm">
                      Mark Complete
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm">
                      Schedule Repair
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Service Record Details Modal */}
            {selectedRecord && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-gray-50 border-b border-gray-100 p-6 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{selectedRecord.serviceType}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                          selectedRecord.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' : 
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {selectedRecord.status || 'Completed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {selectedRecord.date}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRecord(null)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                        <div className="flex items-center gap-2 text-primary-700 mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">Total Cost</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">${selectedRecord.cost?.toLocaleString() ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Car className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">Mileage</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedRecord.mileage ? selectedRecord.mileage.toLocaleString() : '—'}
                          <span className="text-sm font-normal text-gray-500 ml-1">mi</span>
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Service Details
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-100">
                        {selectedRecord.description || 'No description provided.'}
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                          {(selectedRecord.mechanicName || 'M')[0]}
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{selectedRecord.mechanicName || 'External Mechanic'}</p>
                          <p className="text-xs text-gray-500">Performed Service</p>
                        </div>
                      </div>
                      
                      {selectedRecord.nextServiceDue && (
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                          <Clock className="h-3 w-3" />
                          Next Due: {selectedRecord.nextServiceDue}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editingVehicle && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all duration-300">
                <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
                  <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Edit Vehicle</h2>
                      <p className="text-sm text-gray-500 mt-1">Update vehicle details, photos, and assignments</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingVehicle(null)
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateVehicle} className="p-8 space-y-8">
                    {/* Photo Upload Section */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                      <label className="block text-sm font-semibold text-gray-900 mb-4">
                        Vehicle Photo
                      </label>
                      <div className="flex items-start gap-6">
                        <div className="relative group">
                          {photoPreview ? (
                            <img 
                              src={photoPreview} 
                              alt="Preview" 
                              className="w-40 h-40 rounded-xl object-cover border-2 border-white shadow-md"
                            />
                          ) : editingVehicle.photoUrl ? (
                            <img 
                              src={editingVehicle.photoUrl} 
                              alt="Current" 
                              className="w-40 h-40 rounded-xl object-cover border-2 border-white shadow-md"
                            />
                          ) : (
                            <div className="w-40 h-40 rounded-xl bg-gray-200 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                              <Car className="h-10 w-10 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-500 font-medium">No Image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoChange}
                                  className="hidden"
                                />
                                <div className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors">
                                  <Camera className="h-5 w-5 text-gray-700" />
                                </div>
                            </label>
                          </div>
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                              />
                              <span className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                                <Upload className="h-4 w-4 mr-2" />
                                {photoPreview || editingVehicle.photoUrl ? 'Replace Photo' : 'Upload Photo'}
                              </span>
                            </label>
                            {(photoPreview || editingVehicle.photoUrl) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        // TODO: Implement delete photo logic properly if needed
                                        setPhotoPreview(null);
                                        setPhotoFile(null);
                                        // Note: Clearing editingVehicle.photoUrl would require backend support to delete/unset
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Recommended: High-quality JPG or PNG, max 5MB. 
                            <br />Images help mechanics identify vehicles quickly.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-2">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary-600" />
                                Basic Information
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Make <span className="text-red-500">*</span></label>
                            <input
                              required
                              value={editForm.make}
                              onChange={(e) => setEditForm({ ...editForm, make: e.target.value })}
                              className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                              placeholder="e.g. Ford"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Model <span className="text-red-500">*</span></label>
                            <input
                              required
                              value={editForm.model}
                              onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                              className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                              placeholder="e.g. F-150"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Year <span className="text-red-500">*</span></label>
                            <input
                              required
                              type="number"
                              value={editForm.year}
                              onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                              className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                              placeholder="e.g. 2023"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">License Plate <span className="text-red-500">*</span></label>
                            <input
                              required
                              value={editForm.licensePlate}
                              onChange={(e) => setEditForm({ ...editForm, licensePlate: e.target.value })}
                              className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                              placeholder="e.g. ABC-1234"
                            />
                          </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-2">
                             <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary-600" />
                                Details & Status
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">VIN <span className="text-red-500">*</span></label>
                            <input
                              required
                              value={editForm.vin}
                              onChange={(e) => setEditForm({ ...editForm, vin: e.target.value })}
                              className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                              placeholder="Vehicle Identification Number"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Mileage</label>
                            <div className="relative">
                                <input
                                type="number"
                                value={editForm.mileage}
                                onChange={(e) => setEditForm({ ...editForm, mileage: e.target.value })}
                                className="input-field w-full pl-4 pr-12 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                                placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">mi</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
                            <select
                              required
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                              className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]"
                            >
                              <option value="active">Active</option>
                              <option value="in_service">In Service</option>
                              <option value="retired">Retired</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Assigned Driver</label>
                            <select
                              value={editForm.driverId}
                              onChange={(e) => setEditForm({ ...editForm, driverId: e.target.value })}
                              className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[right_0.5rem_center]"
                            >
                              <option value="">Unassigned</option>
                              {drivers.map((driver: User) => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.name} • {driver.phone || driver.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 bg-gray-50/50 -mx-8 -mb-8 p-8 mt-4 rounded-b-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVehicle(null)
                          setPhotoFile(null)
                          setPhotoPreview(null)
                        }}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white hover:shadow-sm transition-all focus:ring-2 focus:ring-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updating || uploadingPhoto}
                        className="btn-primary px-8 py-2.5 flex items-center gap-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {updating || uploadingPhoto ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {uploadingPhoto ? 'Uploading...' : 'Saving Changes...'}
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

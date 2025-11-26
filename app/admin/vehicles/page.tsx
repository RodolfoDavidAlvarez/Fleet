'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Car, Plus, Edit, Trash2, Search, Info, UserPlus, X, Upload, Camera } from 'lucide-react'
import { Vehicle, User } from '@/types'
import { getStatusColor } from '@/lib/utils'

export default function VehiclesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [updating, setUpdating] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
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
  const [driverSaving, setDriverSaving] = useState(false)
  const [driverForm, setDriverForm] = useState({ name: '', email: '', phone: '' })
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    vin: '',
    licensePlate: '',
    mileage: '',
    driverId: '',
  })

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

    loadVehicles()
    loadDrivers()
  }, [router])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vehicles')
      if (!res.ok) throw new Error('Failed to load vehicles')
      const data = await res.json()
      setVehicles(data.vehicles || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching vehicles:', err)
      setError('Failed to load vehicles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadDrivers = async () => {
    try {
      const res = await fetch('/api/drivers')
      if (!res.ok) throw new Error('Failed to load drivers')
      const data = await res.json()
      setDrivers(data.drivers || [])
    } catch (err) {
      console.error('Error fetching drivers:', err)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: form.make,
          model: form.model,
          year: form.year,
          vin: form.vin,
          licensePlate: form.licensePlate,
          mileage: form.mileage ? Number(form.mileage) : 0,
          driverId: form.driverId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create vehicle')
      }

      setVehicles(prev => [data.vehicle, ...prev])
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
    } catch (err) {
      console.error('Error saving vehicle:', err)
      setError(err instanceof Error ? err.message : 'Failed to save vehicle')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDriver = async (e: FormEvent) => {
    e.preventDefault()
    setDriverSaving(true)
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverForm),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create driver')
      }
      setDrivers((prev) => [data.driver, ...prev])
      setDriverForm({ name: '', email: '', phone: '' })
    } catch (err) {
      console.error('Error creating driver:', err)
      setError(err instanceof Error ? err.message : 'Failed to create driver')
    } finally {
      setDriverSaving(false)
    }
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

      // Update local state
      setVehicles(prev => prev.map(v => 
        v.id === editingVehicle.id 
          ? { ...data.vehicle, photoUrl: photoUrl || data.vehicle.photoUrl }
          : v
      ))
      
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

      setVehicles(prev => prev.filter(v => v.id !== vehicleId))
      if (selectedVehicle?.id === vehicleId) {
        setSelectedVehicle(null)
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle')
    }
  }

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalActive = vehicles.filter((v) => v.status === 'active').length
  const totalService = vehicles.filter((v) => v.status === 'in_service').length
  const totalRetired = vehicles.filter((v) => v.status === 'retired').length

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-primary-700 font-semibold uppercase tracking-[0.08em]">Fleet</p>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
                  <span className="px-3 py-1 text-xs font-semibold bg-primary-50 text-primary-700 rounded-full">
                    {vehicles.length} total
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
                        {drivers.map((driver) => (
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                            Vehicle
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
                        {filteredVehicles.map((vehicle) => (
                          <tr
                            key={vehicle.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            <td className="px-4 py-3 align-top">
                              <div className="flex items-start gap-3">
                                <Car className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold text-gray-900 leading-tight">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                  </div>
                                  <div className="text-xs text-gray-500 leading-tight">{vehicle.vin}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 align-top">
                              {vehicle.licensePlate}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 align-top">
                              {vehicle.mileage.toLocaleString()} mi
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                {vehicle.status.replace('_', ' ')}
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
                    {filteredVehicles.map((vehicle) => (
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
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                            {vehicle.status.replace('_', ' ')}
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
                  {filteredVehicles.length === 0 && !loading && (
                    <div className="p-6 text-center text-gray-500">No vehicles found.</div>
                  )}
                </>
              )}
            </div>

            {selectedVehicle && (
              <div className="card-surface rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {selectedVehicle.photoUrl ? (
                      <img 
                        src={selectedVehicle.photoUrl} 
                        alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Car className="h-8 w-8 text-primary-700" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Vehicle details</p>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>VIN: <span className="font-semibold text-gray-900">{selectedVehicle.vin}</span></div>
                    <div>Plate: <span className="font-semibold text-gray-900">{selectedVehicle.licensePlate}</span></div>
                    <div>Mileage: <span className="font-semibold text-gray-900">{selectedVehicle.mileage.toLocaleString()} mi</span></div>
                    <div>Status: <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedVehicle.status)}`}>
                      {selectedVehicle.status.replace('_', ' ')}
                    </span></div>
                    <div>Last service: <span className="font-semibold text-gray-900">{selectedVehicle.lastServiceDate || 'N/A'}</span></div>
                    <div>Next due: <span className="font-semibold text-gray-900">{selectedVehicle.nextServiceDue || 'N/A'}</span></div>
                    <div className="col-span-2">Driver: <span className="font-semibold text-gray-900">{selectedVehicle.driverName || 'Unassigned'}</span></div>
                  </div>
                </div>
                <div className="md:w-64 space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Info className="h-4 w-4 text-primary-700" />
                    Quick actions
                  </div>
                  <button 
                    onClick={() => handleEditClick(selectedVehicle)}
                    className="btn-primary w-full px-4 py-2.5 text-sm"
                  >
                    Edit Vehicle
                  </button>
                  <button className="btn-secondary w-full px-4 py-2.5 text-sm">
                    Assign job
                  </button>
                  <button
                    className="w-full px-4 py-2.5 text-sm text-primary-700 font-semibold hover:bg-primary-50 rounded-xl transition-colors"
                    onClick={() => setSelectedVehicle(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {editingVehicle && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Vehicle</h2>
                    <button
                      onClick={() => {
                        setEditingVehicle(null)
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateVehicle} className="p-6 space-y-6">
                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle Photo
                      </label>
                      <div className="flex items-center gap-4">
                        {photoPreview ? (
                          <img 
                            src={photoPreview} 
                            alt="Preview" 
                            className="w-32 h-32 rounded-xl object-cover border border-gray-200"
                          />
                        ) : editingVehicle.photoUrl ? (
                          <img 
                            src={editingVehicle.photoUrl} 
                            alt="Current" 
                            className="w-32 h-32 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                            <Camera className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="hidden"
                            />
                            <span className="btn-secondary px-4 py-2 inline-flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              {photoPreview ? 'Change Photo' : 'Upload Photo'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-2 text-sm text-gray-700">
                        Make *
                        <input
                          required
                          value={editForm.make}
                          onChange={(e) => setEditForm({ ...editForm, make: e.target.value })}
                          className="input-field py-2"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-gray-700">
                        Model *
                        <input
                          required
                          value={editForm.model}
                          onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                          className="input-field py-2"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-gray-700">
                        Year *
                        <input
                          required
                          type="number"
                          value={editForm.year}
                          onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                          className="input-field py-2"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-gray-700">
                        VIN *
                        <input
                          required
                          value={editForm.vin}
                          onChange={(e) => setEditForm({ ...editForm, vin: e.target.value })}
                          className="input-field py-2"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-gray-700">
                        License Plate *
                        <input
                          required
                          value={editForm.licensePlate}
                          onChange={(e) => setEditForm({ ...editForm, licensePlate: e.target.value })}
                          className="input-field py-2"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-gray-700">
                        Mileage
                        <input
                          type="number"
                          value={editForm.mileage}
                          onChange={(e) => setEditForm({ ...editForm, mileage: e.target.value })}
                          className="input-field py-2"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-gray-700">
                        Status *
                        <select
                          required
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                          className="input-field py-2"
                        >
                          <option value="active">Active</option>
                          <option value="in_service">In Service</option>
                          <option value="retired">Retired</option>
                        </select>
                      </label>
                      <label className="space-y-2 text-sm text-gray-700">
                        Driver
                        <select
                          value={editForm.driverId}
                          onChange={(e) => setEditForm({ ...editForm, driverId: e.target.value })}
                          className="input-field py-2"
                        >
                          <option value="">Unassigned</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} • {driver.phone || driver.email}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVehicle(null)
                          setPhotoFile(null)
                          setPhotoPreview(null)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updating || uploadingPhoto}
                        className="btn-primary px-6 py-2 flex items-center gap-2"
                      >
                        {updating || uploadingPhoto ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {uploadingPhoto ? 'Uploading...' : 'Saving...'}
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

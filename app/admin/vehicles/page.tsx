'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Car, Plus, Edit, Trash2, Search, Info } from 'lucide-react'
import { Vehicle } from '@/types'
import { getStatusColor } from '@/lib/utils'

export default function VehiclesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    vin: '',
    licensePlate: '',
    mileage: '',
  })

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

    loadVehicles()
  }, [router])

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
      })
      setFormOpen(false)
    } catch (err) {
      console.error('Error saving vehicle:', err)
      setError(err instanceof Error ? err.message : 'Failed to save vehicle')
    } finally {
      setSaving(false)
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
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Fleet</p>
                <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
                <p className="text-gray-600">Manage the fleet with responsive tables and tap-friendly cards.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormOpen(prev => !prev)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {formOpen ? 'Close Form' : 'Add Vehicle'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card-surface rounded-2xl p-4">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{vehicles.length}</p>
              </div>
              <div className="card-surface rounded-2xl p-4">
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-2xl font-semibold text-gray-900">{totalActive}</p>
              </div>
              <div className="card-surface rounded-2xl p-4">
                <p className="text-xs text-gray-500">In Service</p>
                <p className="text-2xl font-semibold text-gray-900">{totalService}</p>
              </div>
              <div className="card-surface rounded-2xl p-4">
                <p className="text-xs text-gray-500">Retired</p>
                <p className="text-2xl font-semibold text-gray-900">{totalRetired}</p>
              </div>
            </div>

            {formOpen && (
              <div className="card-surface p-4 rounded-2xl">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm text-gray-700">
                    Make *
                    <input
                      required
                      placeholder="Make"
                      value={form.make}
                      onChange={(e) => setForm({ ...form, make: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    Model *
                    <input
                      required
                      placeholder="Model"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
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
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    VIN *
                    <input
                      required
                      placeholder="VIN"
                      value={form.vin}
                      onChange={(e) => setForm({ ...form, vin: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    License Plate *
                    <input
                      required
                      placeholder="License Plate"
                      value={form.licensePlate}
                      onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    Mileage
                    <input
                      type="number"
                      placeholder="Mileage"
                      value={form.mileage}
                      onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                    />
                  </label>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Vehicle'}
                    </button>
                  </div>
                </form>
              </div>
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

            <div className="card-surface rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-600">Loading vehicles...</div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            License Plate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mileage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVehicles.map((vehicle) => (
                          <tr
                            key={vehicle.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Car className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                  </div>
                                  <div className="text-sm text-gray-500">{vehicle.vin}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vehicle.licensePlate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {vehicle.mileage.toLocaleString()} mi
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                                {vehicle.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-primary-600 hover:text-primary-900">
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <Trash2 className="h-5 w-5" />
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
                      </button>
                    ))}
                    {filteredVehicles.length === 0 && !loading && (
                      <div className="p-6 text-center text-gray-500">No vehicles found.</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {selectedVehicle && (
              <div className="card-surface rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary-700" />
                    </div>
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
                  </div>
                </div>
                <div className="md:w-64 space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Info className="h-4 w-4 text-primary-700" />
                    Quick actions
                  </div>
                  <button className="w-full px-3 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700">
                    Update status
                  </button>
                  <button className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                    Assign job
                  </button>
                  <button
                    className="w-full px-3 py-2 text-sm text-primary-700 font-semibold"
                    onClick={() => setSelectedVehicle(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

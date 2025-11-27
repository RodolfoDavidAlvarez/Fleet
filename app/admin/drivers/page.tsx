'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, Plus, Mail, Phone, Car, X, Edit, Trash2, LayoutGrid, List } from 'lucide-react'
import { User } from '@/types'

export default function DriversPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [drivers, setDrivers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [driverForm, setDriverForm] = useState({ name: '', email: '', phone: '' })
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const savedView = localStorage.getItem('driversViewMode')
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView)
    }
  }, [])

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('driversViewMode', mode)
  }

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

    const loadDrivers = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/drivers')
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || data.details || 'Failed to load drivers')
        }
        console.log('Drivers loaded:', data.drivers?.length || 0, data.drivers)
        setDrivers(data.drivers || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching drivers:', err)
        setError(err instanceof Error ? err.message : 'Failed to load drivers. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadDrivers()
  }, [router])

  const handleCreateDriver = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
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
      setFormOpen(false)
    } catch (err) {
      console.error('Error creating driver:', err)
      setError(err instanceof Error ? err.message : 'Failed to create driver')
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (driver: User) => {
    setEditingDriver(driver)
    setEditForm({
      name: driver.name,
      email: driver.email,
      phone: driver.phone || '',
    })
  }

  const handleUpdateDriver = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingDriver) return

    setUpdating(true)
    setError(null)

    try {
      const res = await fetch(`/api/drivers/${editingDriver.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update driver')
      }

      setDrivers(prev => prev.map(d => 
        d.id === editingDriver.id ? data.driver : d
      ))
      setEditingDriver(null)
    } catch (err) {
      console.error('Error updating driver:', err)
      setError(err instanceof Error ? err.message : 'Failed to update driver')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return

    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete driver')
      }

      setDrivers(prev => prev.filter(d => d.id !== driverId))
    } catch (err) {
      console.error('Error deleting driver:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete driver')
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
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
              <div>
                <p className="text-sm text-primary-600 font-semibold uppercase tracking-wide mb-1">TEAM</p>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">Drivers</h1>
                  <span className="text-2xl font-semibold text-primary-600">({drivers.length})</span>
                </div>
                <p className="text-gray-600">Manage driver assignments and vehicle assignments.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                  <button
                    onClick={() => toggleViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-sm text-primary-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => toggleViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-sm text-primary-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="List View"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
                <div className="card-surface px-4 py-3 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Total Drivers</p>
                  <p className="text-2xl font-semibold text-gray-900">{drivers.length}</p>
                </div>
                <button
                  onClick={() => setFormOpen((prev) => !prev)}
                  className="bg-primary-600 text-white px-5 py-3 rounded-lg hover:bg-primary-700 flex items-center gap-2 font-medium transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  {formOpen ? 'Close Form' : 'Add Driver'}
                </button>
              </div>
            </div>

            {formOpen && (
              <div className="card-surface rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm animate-in slide-in-from-top-4 duration-200">
                <div className="flex items-start justify-between mb-6 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Add New Driver</h2>
                    <p className="text-sm text-gray-600 mt-1">Create a driver profile to assign vehicles.</p>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={() => setFormOpen(false)}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateDriver} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                    <input
                      required
                      value={driverForm.name}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="e.g. Jamie Driver"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="email"
                      value={driverForm.email}
                      onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                      className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="e.g. driver@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                      className="input-field w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="e.g. +1 (555) 123-4567"
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-primary-900/20"
                    >
                      <Plus className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Create Driver Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-600">Loading drivers...</div>
              </div>
            ) : drivers.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-gray-500 text-lg">No drivers found.</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="card-surface rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase text-gray-500 tracking-wider">
                        <th className="px-6 py-4">Driver Profile</th>
                        <th className="px-6 py-4">Contact Details</th>
                        <th className="px-6 py-4">Role & Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {drivers.map((driver) => (
                        <tr 
                          key={driver.id} 
                          onClick={() => handleEditClick(driver)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 align-middle">
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold shadow-sm">
                                {driver.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{driver.name}</h3>
                                <p className="text-xs text-gray-500">ID: {driver.id.slice(0, 6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                {driver.email}
                              </div>
                              {driver.phone ? (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                  {driver.phone}
                                </div>
                              ) : (
                                <div className="flex items-center text-sm text-gray-400 italic">
                                  <Phone className="h-3.5 w-3.5 mr-2 opacity-50" />
                                  No phone
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                                {driver.role}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right align-middle">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(driver);
                              }}
                              className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="card-surface rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-3 rounded-full">
                          <Users className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Driver
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {driver.email}
                      </div>
                      {driver.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {driver.phone}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button 
                        onClick={() => router.push('/admin/vehicles')}
                        className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        <Car className="h-4 w-4 mr-2" />
                        View Vehicles
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditClick(driver)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteDriver(driver.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingDriver && (
              <div className="fixed inset-0 z-50 overflow-hidden">
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setEditingDriver(null)} />
                <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 translate-x-0 flex flex-col h-full">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Driver Profile</h2>
                      <p className="text-sm text-gray-500">Manage driver details and assignments</p>
                    </div>
                    <button onClick={() => setEditingDriver(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-700 mb-4 ring-4 ring-white shadow-md">
                        {editingDriver.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{editingDriver.name}</h3>
                      <span className="mt-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide border border-blue-100">
                        {editingDriver.role}
                      </span>
                    </div>

                    <form id="edit-driver-form" onSubmit={handleUpdateDriver} className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
                          Contact Information
                        </h4>
                        
                        <div className="space-y-3">
                          <label className="block">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">Full Name</span>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                required
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                placeholder="Jamie Driver"
                              />
                            </div>
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">Email Address</span>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                required
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                placeholder="driver@example.com"
                              />
                            </div>
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</span>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="pt-4">
                         <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                               <Car className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                               <h3 className="text-sm font-bold text-blue-900">Assigned Vehicles</h3>
                               <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                 Vehicle assignments are managed from the Fleet page. This driver currently has access to the fleet pool.
                               </p>
                               <button 
                                 type="button"
                                 onClick={() => router.push('/admin/vehicles')}
                                 className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                               >
                                 Manage Assignments →
                               </button>
                            </div>
                         </div>
                      </div>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteDriver(editingDriver.id)}
                      className="flex-1 px-4 py-2.5 border border-red-200 text-red-700 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                    <button
                      type="submit"
                      form="edit-driver-form"
                      disabled={updating}
                      className="flex-[2] btn-primary justify-center flex items-center gap-2 shadow-lg shadow-primary-900/10"
                    >
                      {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

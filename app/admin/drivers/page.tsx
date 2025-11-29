'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, Plus, Mail, Phone, X, Edit, Loader2, Save, Grid3x3, List, Search } from 'lucide-react'
import { User } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/toast'

export default function DriversPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [drivers, setDrivers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

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

    const loadDrivers = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/drivers')
        if (!res.ok) throw new Error('Failed to load drivers')
        const data = await res.json()
        setDrivers(data.drivers || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching drivers:', err)
        setError('Failed to load drivers. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadDrivers()
  }, [router])

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('drivers-view-mode')
    if (savedView === 'grid' || savedView === 'list') {
      setViewMode(savedView)
    }
  }, [])

  // Save view preference to localStorage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('drivers-view-mode', mode)
  }

  // Filter drivers based on search term
  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim()) {
      return drivers
    }
    const searchLower = searchTerm.toLowerCase().trim()
    return drivers.filter((driver) => {
      const name = (driver.name || '').toLowerCase()
      const email = (driver.email || '').toLowerCase()
      const phone = (driver.phone || '').toLowerCase()
      
      return (
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower)
      )
    })
  }, [drivers, searchTerm])

  const openEdit = (driver: User) => {
    setEditing(true)
    setEditForm({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      approval_status: driver.approval_status,
    })
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditForm({})
  }

  const saveDriver = async () => {
    if (!selectedDriver) return
    
    try {
      setSaving(true)
      const res = await fetch(`/api/drivers/${selectedDriver.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update driver')
      }

      const data = await res.json()
      const updatedDriver = data.driver || { ...selectedDriver, ...editForm }
      
      // Update the driver in the list
      setDrivers(prev => prev.map(d => d.id === selectedDriver.id ? updatedDriver : d))
      setSelectedDriver(updatedDriver)
      setEditing(false)
      setEditForm({})
      showToast('Driver updated successfully!', 'success')
    } catch (err) {
      console.error('Error updating driver:', err)
      showToast(err instanceof Error ? err.message : 'Failed to update driver', 'error')
    } finally {
      setSaving(false)
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
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Team</p>
                <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
                <p className="text-gray-600">Manage and view all registered drivers.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Driver
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-md relative">
                <div className="input-group">
                  <span className="input-group-icon input-group-icon-left">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search drivers by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-with-icon-left pr-12"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {searchTerm && (
                <div className="text-sm text-gray-600">
                  {filteredDrivers.length} {filteredDrivers.length === 1 ? 'driver' : 'drivers'} found
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading drivers...</div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDrivers.map((driver) => (
                      <motion.div
                        key={driver.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedDriver(driver)}
                        className="card-surface rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary-100 p-3 rounded-full">
                              <Users className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
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
                          <div className="text-sm text-gray-500">
                            Joined {new Date(driver.createdAt).toLocaleDateString()}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDriver(driver)
                            }}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    {filteredDrivers.length === 0 && (
                      <div className="p-6 text-center text-gray-500 col-span-full">
                        {searchTerm ? `No drivers found matching "${searchTerm}".` : 'No drivers found.'}
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    layout
                    className="space-y-3"
                  >
                    <AnimatePresence>
                      {filteredDrivers.map((driver, i) => (
                        <motion.div
                          key={driver.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          onClick={() => setSelectedDriver(driver)}
                          className="card-surface rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200/60 group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-lg shadow-sm flex-shrink-0">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                              <div className="md:col-span-2">
                                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                                  {driver.name}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 truncate max-w-[200px]" title={driver.email}>{driver.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                {driver.phone ? (
                                  <>
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700">{driver.phone}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-400">No phone</span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-500">
                                  {new Date(driver.createdAt).toLocaleDateString()}
                                </span>
                                <button 
                                  className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDriver(driver)
                                  }}
                                >
                                  View
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {filteredDrivers.length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        {searchTerm ? `No drivers found matching "${searchTerm}".` : 'No drivers found.'}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Driver Details Side Panel */}
      <AnimatePresence>
        {selectedDriver && (
          <motion.div 
            className="fixed inset-0 z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
              onClick={() => setSelectedDriver(null)} 
            />
            <motion.div 
              className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Driver Details</h2>
                    <p className="text-xs text-gray-500 font-mono">ID: {selectedDriver.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!editing && (
                    <button
                      onClick={() => openEdit(selectedDriver)}
                      className="btn btn-ghost btn-sm flex items-center gap-1.5"
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedDriver(null)
                      setEditing(false)
                      setEditForm({})
                    }}
                    className="btn btn-ghost btn-icon"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {/* Driver Info Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  {!editing ? (
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm">
                          <Users className="h-8 w-8 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{selectedDriver.name}</h3>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Name</span>
                        <input
                          className="input-field w-full"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    Contact Information
                  </h3>
                  {!editing ? (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                        <a 
                          href={`mailto:${selectedDriver.email}`}
                          className="text-base font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          {selectedDriver.email}
                        </a>
                      </div>
                      {selectedDriver.phone && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</p>
                          <a 
                            href={`tel:${selectedDriver.phone}`}
                            className="text-base font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-2"
                          >
                            <Phone className="h-4 w-4" />
                            {selectedDriver.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 space-y-4">
                      <label className="space-y-1.5 block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</span>
                        <input
                          type="email"
                          className="input-field w-full"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</span>
                        <input
                          type="tel"
                          className="input-field w-full"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Account Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    Account Information
                  </h3>
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined Date</p>
                      <p className="text-base font-bold text-gray-900">
                        {new Date(selectedDriver.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Edit Actions */}
                {editing && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex gap-3">
                      <button
                        onClick={cancelEdit}
                        className="btn btn-secondary flex-1"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveDriver}
                        className="btn btn-primary flex-1 flex items-center gap-2 justify-center"
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

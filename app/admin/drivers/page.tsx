'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, Plus, Mail, Phone, Car, X } from 'lucide-react'
import { User } from '@/types'

export default function DriversPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [drivers, setDrivers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [driverForm, setDriverForm] = useState({ name: '', email: '', phone: '' })

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

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
              <div>
                <p className="text-sm text-primary-600 font-semibold uppercase tracking-wide mb-1">TEAM</p>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Drivers</h1>
                <p className="text-gray-600">Manage driver assignments and vehicle assignments.</p>
              </div>
              <div className="flex items-center gap-4">
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
              <div className="card-surface rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">New driver</h2>
                    <p className="text-sm text-gray-600">Create a driver profile to assign vehicles.</p>
                  </div>
                  <button
                    className="text-gray-500 hover:text-gray-800"
                    onClick={() => setFormOpen(false)}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateDriver} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <input
                      required
                      value={driverForm.name}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Jamie Driver"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input
                      required
                      type="email"
                      value={driverForm.email}
                      onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="driver@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <input
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Driver'}
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
                      <div className="flex items-center text-sm text-gray-600">
                        <Car className="h-4 w-4 mr-2" />
                        View Vehicles
                      </div>
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

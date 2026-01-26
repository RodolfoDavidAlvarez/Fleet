'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, Plus, Mail, Phone, Wrench } from 'lucide-react'
import { Mechanic } from '@/types'
import { getStatusColor } from '@/lib/utils'

export default function MechanicsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const availableCount = mechanics.filter((m) => m.availability === 'available').length

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

    const loadMechanics = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/mechanics')
        if (!res.ok) throw new Error('Failed to load mechanics')
        const data = await res.json()
        
        // Filter to only show specific mechanics
        const allowedMechanics = ['Jose Catallenos', 'Alex Rosales', 'Jesus Davalos', 'Israel', 'Omero']
        const filteredMechanics = (data.mechanics || []).filter((mechanic: Mechanic) => 
          allowedMechanics.some(name => 
            mechanic.name.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(mechanic.name.toLowerCase())
          )
        )
        
        setMechanics(filteredMechanics)
        setError(null)
      } catch (err) {
        console.error('Error fetching mechanics:', err)
        setError('Failed to load mechanics. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadMechanics()
  }, [router])

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || 'admin'} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Team</p>
                <h1 className="text-3xl font-bold text-gray-900">Mechanics</h1>
                <p className="text-gray-600">Mobile-friendly cards for quick assignment decisions.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="card-surface p-3 rounded-xl text-sm">
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-lg font-semibold text-gray-900">{availableCount}</p>
                </div>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Mechanic
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading mechanics...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mechanics.map((mechanic) => (
                  <div
                    key={mechanic.id}
                    className="card-surface rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 p-3 rounded-full">
                          <Users className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{mechanic.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mechanic.availability)}`}>
                            {mechanic.availability}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {mechanic.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {mechanic.phone}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Specializations:</p>
                      <div className="flex flex-wrap gap-2">
                        {mechanic.specializations.map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <Wrench className="h-4 w-4 mr-2" />
                        {mechanic.currentJobs.length} active jobs
                      </div>
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
                {mechanics.length === 0 && (
                  <div className="p-6 text-center text-gray-500 col-span-full">
                    No mechanics found.
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

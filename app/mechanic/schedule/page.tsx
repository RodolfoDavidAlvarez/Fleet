'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Calendar, Clock, MapPin, Wrench, Grid3x3, List } from 'lucide-react'
import { Booking } from '@/types'
import { formatDate } from '@/lib/utils'

export default function SchedulePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const loadBookings = async (mechanicId?: string) => {
    try {
      const url = mechanicId 
        ? `/api/bookings?mechanicId=${encodeURIComponent(mechanicId)}`
        : '/api/bookings'
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setBookings(data.bookings || [])
      }
    } finally {
      setLoading(false)
    }
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
    // Only filter by mechanicId if user is a mechanic, otherwise show all bookings
    const mechanicId = parsedUser.role === 'mechanic' ? parsedUser.id : undefined
    loadBookings(mechanicId)

    // Load saved view preference
    const savedView = localStorage.getItem('scheduleViewMode')
    if (savedView === 'list' || savedView === 'grid') {
      setViewMode(savedView)
    }
  }, [router])

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('scheduleViewMode', mode)
  }

  const grouped = useMemo(() => {
    return bookings.reduce<Record<string, Booking[]>>((acc, booking) => {
      const key = booking.scheduledDate
      acc[key] = acc[key] ? [...acc[key], booking] : [booking]
      return acc
    }, {})
  }, [bookings])

  if (!user || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const dates = Object.keys(grouped).sort()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || 'mechanic'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Schedule</p>
                <h1 className="text-3xl font-bold text-gray-900">My week at a glance</h1>
                <p className="text-gray-600">Live bookings including driver repair requests.</p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="List view"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>

            {dates.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No bookings scheduled</div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dates.map((date) =>
                  grouped[date].map((slot, idx) => (
                    <div key={`${date}-${slot.id}-${idx}`} className="card-surface rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                          {formatDate(date)}
                        </span>
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{slot.serviceType}</p>
                      <div className="flex items-center text-sm text-gray-700 gap-2">
                        <Calendar className="h-4 w-4" />
                        {slot.scheduledTime}
                      </div>
                      <div className="flex items-center text-sm text-gray-700 gap-2">
                        <MapPin className="h-4 w-4" />
                        {slot.vehicleInfo || 'No vehicle info'}
                      </div>
                      {slot.repairRequestId && (
                        <div className="text-xs text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Repair request linked
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                {dates.map((date) =>
                  grouped[date].map((slot, idx) => (
                    <div
                      key={`${date}-${slot.id}-${idx}`}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                              {formatDate(date)}
                            </span>
                            <p className="text-lg font-semibold text-gray-900">{slot.serviceType}</p>
                            {slot.repairRequestId && (
                              <div className="text-xs text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-2 py-1 inline-flex items-center gap-1">
                                <Wrench className="h-3 w-3" />
                                Repair request
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{slot.scheduledTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{slot.vehicleInfo || 'No vehicle info'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Calendar, Clock, MapPin, Wrench } from 'lucide-react'
import { Booking } from '@/types'
import { formatDate } from '@/lib/utils'

export default function SchedulePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'mechanic') {
      router.push('/login')
      return
    }
    setUser(parsedUser)
    loadBookings()
  }, [router])

  const loadBookings = async () => {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      if (res.ok) {
        setBookings(data.bookings || [])
      }
    } finally {
      setLoading(false)
    }
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
      <Sidebar role="mechanic" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Schedule</p>
              <h1 className="text-3xl font-bold text-gray-900">My week at a glance</h1>
              <p className="text-gray-600">Live bookings including driver repair requests.</p>
            </div>

            {dates.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No bookings scheduled</div>
            ) : (
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
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

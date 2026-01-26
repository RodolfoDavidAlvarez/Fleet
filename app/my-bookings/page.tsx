'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Calendar, Phone, MapPin, Clock, ChevronRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns'

interface Booking {
  id: string
  customer_name: string
  customer_email?: string
  customer_phone: string
  service_type: string
  scheduled_date: string
  scheduled_time: string
  vehicle_info?: string
  notes?: string
  status: string
}

export default function MyBookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const bootstrapUser = async () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setAuthReady(true)
        return
      }

      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) {
          router.push('/login')
          return
        }
        const { user: profile } = await res.json()
        const normalizedUser = {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          name: profile.name,
        }
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        setUser(normalizedUser)
        setAuthReady(true)
      } catch (err) {
        router.push('/login')
      }
    }

    bootstrapUser()
  }, [router])

  const bookingsQuery = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load bookings')
      return data.bookings as Booking[]
    },
    enabled: authReady,
    staleTime: 30 * 1000, // 30 seconds
  })

  if (!authReady || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const bookings = bookingsQuery.data || []
  const isLoading = bookingsQuery.isLoading

  // Group bookings - filter out any with missing dates first
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  // Only process bookings that have a valid scheduled_date
  const validBookings = bookings.filter(b => b.scheduled_date && typeof b.scheduled_date === 'string')

  const todayBookings = validBookings.filter(b => b.scheduled_date === todayStr && b.status !== 'cancelled')
  const upcomingBookings = validBookings.filter(b => {
    try {
      const bookingDate = parseISO(b.scheduled_date)
      return bookingDate > today && b.status !== 'cancelled'
    } catch {
      return false
    }
  }).sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || ''))

  const tomorrowBookings = upcomingBookings.filter(b => {
    try {
      return isTomorrow(parseISO(b.scheduled_date))
    } catch {
      return false
    }
  })
  const thisWeekBookings = upcomingBookings.filter(b => {
    try {
      const d = parseISO(b.scheduled_date)
      return isThisWeek(d) && !isTomorrow(d)
    } catch {
      return false
    }
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-700',
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const BookingCard = ({ booking, highlight = false }: { booking: Booking; highlight?: boolean }) => (
    <div
      className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
        highlight ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-100'
      }`}
    >
      <div className="p-4">
        {/* Time and Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">{booking.scheduled_time || 'TBD'}</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>

        {/* Vehicle Info */}
        <div className="mb-3">
          <p className="font-medium text-gray-900">{booking.vehicle_info || 'Vehicle TBD'}</p>
          <p className="text-sm text-gray-500">{booking.service_type}</p>
        </div>

        {/* Customer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{booking.customer_name}</p>
          </div>
          <a
            href={`tel:${booking.customer_phone}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{booking.notes}</p>
          </div>
        )}
      </div>
    </div>
  )

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-8 px-4">
      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">{message}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard" className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold">My Bookings</h1>
          </div>
          <p className="text-blue-100 text-sm pl-8">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Today Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <h2 className="text-lg font-semibold text-gray-900">Today</h2>
                <span className="ml-auto text-sm text-gray-500">
                  {todayBookings.length} booking{todayBookings.length !== 1 ? 's' : ''}
                </span>
              </div>

              {todayBookings.length > 0 ? (
                <div className="space-y-3">
                  {todayBookings
                    .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))
                    .map(booking => (
                      <BookingCard key={booking.id} booking={booking} highlight />
                    ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No bookings today</p>
                  <p className="text-sm text-gray-400 mt-1">Enjoy your free time!</p>
                </div>
              )}
            </section>

            {/* Tomorrow Section */}
            {tomorrowBookings.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Tomorrow</h2>
                  <span className="ml-auto text-sm text-gray-500">
                    {tomorrowBookings.length} booking{tomorrowBookings.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {tomorrowBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </section>
            )}

            {/* This Week Section */}
            {thisWeekBookings.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">This Week</h2>
                  <span className="ml-auto text-sm text-gray-500">
                    {thisWeekBookings.length} booking{thisWeekBookings.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {thisWeekBookings.map(booking => {
                    let dateLabel = 'Date TBD'
                    try {
                      if (booking.scheduled_date) {
                        dateLabel = format(parseISO(booking.scheduled_date), 'EEEE, MMM d')
                      }
                    } catch {
                      dateLabel = booking.scheduled_date || 'Date TBD'
                    }
                    return (
                      <div key={booking.id}>
                        <p className="text-xs text-gray-400 mb-1 pl-1">
                          {dateLabel}
                        </p>
                        <BookingCard booking={booking} />
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Summary */}
            <section className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Upcoming Summary</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{todayBookings.length}</p>
                  <p className="text-xs text-blue-600">Today</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-700">{tomorrowBookings.length}</p>
                  <p className="text-xs text-gray-600">Tomorrow</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-700">{upcomingBookings.length}</p>
                  <p className="text-xs text-gray-600">This Week</p>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="space-y-2">
              <Link
                href="/admin/bookings"
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">View All Bookings</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Back to Dashboard</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-400">
        AgaveFleet
      </footer>
    </div>
  )
}

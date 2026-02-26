'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Calendar, Phone, MapPin, Clock, ChevronRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Booking {
  id: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  serviceType: string
  scheduledDate: string
  scheduledTime: string
  vehicleInfo?: string
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const bookings = bookingsQuery.data || []
  const isLoading = bookingsQuery.isLoading

  // Group bookings - filter out any with missing dates first
  // Use Arizona time (MST, UTC-7, no DST) to match the daily brief server logic
  const now = new Date()
  const mstOffset = -7 * 60 * 60 * 1000
  const today = new Date(now.getTime() + mstOffset + now.getTimezoneOffset() * 60 * 1000)
  const todayStr = format(today, 'yyyy-MM-dd')

  // Only process bookings that have a valid scheduled_date
  const validBookings = bookings.filter(b => b.scheduledDate && typeof b.scheduledDate === 'string')

  // Calculate tomorrow's date string in MST for reliable comparison
  const tomorrowMst = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowStr = format(tomorrowMst, 'yyyy-MM-dd')

  // Get the start and end of the current week (Sunday-Saturday) in MST
  const dayOfWeek = today.getDay()
  const weekStartMst = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
  const weekStartStr = format(weekStartMst, 'yyyy-MM-dd')
  const weekEndMst = new Date(weekStartMst.getTime() + 6 * 24 * 60 * 60 * 1000)
  const weekEndStr = format(weekEndMst, 'yyyy-MM-dd')

  const todayBookings = validBookings.filter(b => b.scheduledDate === todayStr && b.status !== 'cancelled')
  const upcomingBookings = validBookings.filter(b => {
    return b.scheduledDate > todayStr && b.status !== 'cancelled'
  }).sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduledDate || ''))

  const tomorrowBookings = upcomingBookings.filter(b => b.scheduledDate === tomorrowStr)
  const thisWeekBookings = upcomingBookings.filter(b => {
    return b.scheduledDate >= weekStartStr && b.scheduledDate <= weekEndStr && b.scheduledDate !== tomorrowStr
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

  const getStatusBorderColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'border-l-green-500',
      pending: 'border-l-yellow-400',
      in_progress: 'border-l-blue-500',
      completed: 'border-l-gray-300',
      cancelled: 'border-l-red-500',
    }
    return colors[status] || 'border-l-gray-300'
  }

  const BookingCard = ({ booking, highlight = false }: { booking: Booking; highlight?: boolean }) => (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden border-l-[3px] ${getStatusBorderColor(booking.status)} ${
        highlight ? 'ring-1 ring-slate-200' : ''
      }`}
    >
      <div className="p-4">
        {/* Time and Status Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xl font-extrabold tracking-tight text-gray-900">{booking.scheduledTime || 'TBD'}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getStatusBadge(booking.status)}`}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>

        {/* Vehicle Info */}
        <div className="mb-3">
          <p className="font-semibold text-gray-900 text-[15px]">{booking.vehicleInfo || 'Vehicle TBD'}</p>
          <p className="text-sm text-gray-400 mt-0.5">{booking.serviceType}</p>
        </div>

        {/* Customer + Call */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{booking.customerName}</p>
          <a
            href={`tel:${booking.customerPhone}`}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-600)] text-white rounded-lg text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 leading-relaxed">{booking.notes}</p>
          </div>
        )}
      </div>
    </div>
  )

  const EmptyState = ({ message }: { message: string }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
        <Calendar className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white sticky top-0 z-10">
        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative px-4 py-5">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/dashboard"
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">My Bookings</h1>
          </div>
          <p className="text-slate-400 text-sm pl-8">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm border-l-[3px] border-l-gray-200 p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-6 bg-gray-100 rounded w-16" />
                  <div className="h-5 bg-gray-100 rounded-full w-20" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-100 rounded w-24" />
                  <div className="h-9 bg-gray-100 rounded-lg w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Today Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-[15px] font-bold text-gray-900">Today</h2>
                </div>
                <span className="text-xs font-medium text-gray-400">
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-2.5">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">No bookings today</p>
                  <p className="text-xs text-gray-400 mt-0.5">Enjoy your free time</p>
                </div>
              )}
            </section>

            {/* Tomorrow Section */}
            {tomorrowBookings.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[15px] font-bold text-gray-900">Tomorrow</h2>
                  <span className="text-xs font-medium text-gray-400">
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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[15px] font-bold text-gray-900">This Week</h2>
                  <span className="text-xs font-medium text-gray-400">
                    {thisWeekBookings.length} booking{thisWeekBookings.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {thisWeekBookings.map(booking => {
                    let dateLabel = 'Date TBD'
                    try {
                      if (booking.scheduledDate) {
                        dateLabel = format(parseISO(booking.scheduledDate), 'EEEE, MMM d')
                      }
                    } catch {
                      dateLabel = booking.scheduledDate || 'Date TBD'
                    }
                    return (
                      <div key={booking.id}>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-1.5 pl-1">
                          {dateLabel}
                        </p>
                        <BookingCard booking={booking} />
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Summary Grid */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Summary</h3>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 text-center">
                  <p className="text-3xl font-extrabold tracking-tight text-slate-800">{todayBookings.length}</p>
                  <p className="text-[11px] font-medium text-gray-400 mt-0.5">Today</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 text-center">
                  <p className="text-3xl font-extrabold tracking-tight text-slate-800">{tomorrowBookings.length}</p>
                  <p className="text-[11px] font-medium text-gray-400 mt-0.5">Tomorrow</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 text-center">
                  <p className="text-3xl font-extrabold tracking-tight text-slate-800">{upcomingBookings.length}</p>
                  <p className="text-[11px] font-medium text-gray-400 mt-0.5">Upcoming</p>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="space-y-2">
              <Link
                href="/admin/bookings"
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">View All Bookings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">Back to Dashboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-[11px] text-gray-300">
        AgaveFleet
      </footer>
    </div>
  )
}

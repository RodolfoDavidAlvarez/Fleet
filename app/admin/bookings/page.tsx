'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Calendar, Clock, User, Phone, Mail, Wrench, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Booking } from '@/types'
import { getStatusColor, formatDate, formatDateTime } from '@/lib/utils'

export default function BookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

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

    const loadBookings = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/bookings')
        if (!res.ok) throw new Error('Failed to load bookings')
        const data = await res.json()
        setBookings(data.bookings || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching bookings:', err)
        setError('Failed to load bookings. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [router])

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const filteredBookings = statusFilter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter)

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
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
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Scheduling</p>
                <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
                <p className="text-gray-600">Manage all service appointments and bookings.</p>
              </div>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                New Booking
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} ({count})
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading bookings...</div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="card-surface rounded-xl p-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-500">
                      {statusFilter === 'all' 
                        ? 'No bookings have been created yet.'
                        : `No ${statusFilter.replace('_', ' ')} bookings found.`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="card-surface rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{booking.customerName}</h3>
                                <p className="text-sm text-gray-500">{booking.serviceType}</p>
                              </div>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                {booking.status.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-4 w-4 mr-2" />
                                {booking.customerEmail}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-4 w-4 mr-2" />
                                {booking.customerPhone}
                              </div>
                            </div>

                            {/* Schedule */}
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center text-gray-700">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span className="font-medium">{formatDate(booking.scheduledDate)}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <Clock className="h-4 w-4 mr-2" />
                                <span className="font-medium">{booking.scheduledTime}</span>
                              </div>
                            </div>

                            {/* Vehicle Info */}
                            {booking.vehicleInfo && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Wrench className="h-4 w-4 mr-2" />
                                {booking.vehicleInfo}
                              </div>
                            )}

                            {/* Notes */}
                            {booking.notes && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">{booking.notes}</p>
                              </div>
                            )}

                            {/* SMS & Compliance */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {booking.smsConsent && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  SMS Consent
                                </span>
                              )}
                              {booking.complianceAccepted && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  Compliance Accepted
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                          <span>Created {formatDateTime(booking.createdAt)}</span>
                          {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                            <span>Updated {formatDateTime(booking.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                    ))}
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

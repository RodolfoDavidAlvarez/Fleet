'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Search, Filter, Eye, RefreshCw, Info, Mail, Phone } from 'lucide-react'
import { Booking } from '@/types'
import { getStatusColor } from '@/lib/utils'

export default function BookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

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

    loadBookings()
  }, [router])

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

  const updateStatus = async (id: string, status: Booking['status']) => {
    setUpdatingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update booking')
      }
      setBookings(prev => prev.map(b => b.id === id ? data.booking : b))
      setSelectedBooking((prev) => prev && prev.id === id ? data.booking : prev)
    } catch (err) {
      console.error('Error updating booking:', err)
      setError(err instanceof Error ? err.message : 'Failed to update booking')
    } finally {
      setUpdatingId(null)
    }
  }


  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length
  const completedCount = bookings.filter((b) => b.status === 'completed').length

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || 'admin'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-primary-700 font-semibold uppercase tracking-[0.08em]">Bookings</p>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-gray-900">Service requests</h1>
                  <span className="px-3 py-1 text-xs font-semibold bg-primary-50 text-primary-700 rounded-full">
                    {bookings.length} total
                  </span>
                </div>
                <p className="text-sm text-gray-600">Compact tables with actions always in view.</p>
              </div>
              <button
                onClick={loadBookings}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 px-3 py-2 rounded-lg border border-primary-100 bg-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="card-surface rounded-xl p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Pending</p>
                <p className="text-xl font-semibold text-gray-900">{pendingCount}</p>
              </div>
              <div className="card-surface rounded-xl p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Confirmed</p>
                <p className="text-xl font-semibold text-gray-900">{confirmedCount}</p>
              </div>
              <div className="card-surface rounded-xl p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">Completed</p>
                <p className="text-xl font-semibold text-gray-900">{completedCount}</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="card-surface rounded-xl border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-600">Loading bookings...</div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-[34%]" />
                        <col className="w-[20%]" />
                        <col className="w-[16%]" />
                        <col className="w-[18%]" />
                        <col className="w-[12%]" />
                      </colgroup>
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Customer
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Service
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Date & Time
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredBookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <td className="px-4 py-3 align-top">
                              <div className="space-y-1">
                                <div className="text-sm font-semibold text-gray-900 leading-tight">{booking.customerName}</div>
                                <div className="text-xs text-gray-500 leading-tight">{booking.customerEmail}</div>
                                <div className="text-xs text-gray-500 leading-tight">{booking.customerPhone}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 align-top">
                              {booking.serviceType}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="text-sm text-gray-900 leading-tight">{booking.scheduledDate}</div>
                              <div className="text-xs text-gray-500 leading-tight">{booking.scheduledTime}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="space-y-2">
                                <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                  {booking.status.replace('_', ' ')}
                                </span>
                                <select
                                  value={booking.status}
                                  onChange={(e) => updateStatus(booking.id, e.target.value as Booking['status'])}
                                  className="w-full text-xs bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  disabled={updatingId === booking.id}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right sticky right-0 bg-white border-l border-gray-100 align-top">
                              <button
                                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-primary-700 hover:bg-primary-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedBooking(booking)
                                }}
                                aria-label="View booking"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className="w-full text-left p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{booking.customerName}</p>
                            <p className="text-sm text-gray-600">{booking.serviceType}</p>
                            <p className="text-xs text-gray-500">{booking.scheduledDate} • {booking.scheduledTime}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{booking.customerEmail}</p>
                        <p className="text-xs text-gray-500">{booking.customerPhone}</p>
                      </button>
                    ))}
                  </div>
                  {filteredBookings.length === 0 && !loading && (
                    <div className="p-6 text-center text-gray-500">No bookings found.</div>
                  )}
                </>
              )}
            </div>

            {selectedBooking && (
              <div className="card-surface rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Info className="h-5 w-5 text-primary-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Booking details</p>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedBooking.customerName}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>Service: <span className="font-semibold text-gray-900">{selectedBooking.serviceType}</span></div>
                    <div>Schedule: <span className="font-semibold text-gray-900">{selectedBooking.scheduledDate} • {selectedBooking.scheduledTime}</span></div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" /> {selectedBooking.customerEmail}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" /> {selectedBooking.customerPhone}
                    </div>
                    <div>Status: <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status.replace('_', ' ')}
                    </span></div>
                  </div>
                  {selectedBooking.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                      {selectedBooking.notes}
                    </div>
                  )}
                </div>
                <div className="md:w-64">
                  <select
                    value={selectedBooking.status}
                    onChange={(e) => updateStatus(selectedBooking.id, e.target.value as Booking['status'])}
                    disabled={updatingId === selectedBooking.id}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Calendar, Clock, MapPin, Wrench, Grid3x3, List, X, CalendarDays, ExternalLink, User, Phone, Mail, FileText, AlertCircle } from 'lucide-react'
import { Booking } from '@/types'
import { formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function SchedulePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

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
    if (savedView === 'list' || savedView === 'grid' || savedView === 'calendar') {
      setViewMode(savedView)
    }
  }, [router])

  const handleViewModeChange = (mode: 'grid' | 'list' | 'calendar') => {
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

  // Calendar view grouping - organize bookings by week
  const calendarData = useMemo(() => {
    const weeks: Record<string, Record<string, Booking[]>> = {}
    const dates = Object.keys(grouped).sort()

    dates.forEach(date => {
      const dateObj = new Date(date)
      const weekStart = new Date(dateObj)
      weekStart.setDate(dateObj.getDate() - dateObj.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeks[weekKey]) {
        weeks[weekKey] = {}
      }
      weeks[weekKey][date] = grouped[date]
    })

    return weeks
  }, [grouped])

  const navigateToRepairRequest = (repairRequestId: string) => {
    router.push(`/repairs?id=${repairRequestId}`)
  }

  if (!user || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const dates = Object.keys(grouped).sort()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || 'mechanic'} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
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
                <button
                  onClick={() => handleViewModeChange('calendar')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Calendar view"
                >
                  <CalendarDays className="h-5 w-5" />
                </button>
              </div>
            </div>

            {dates.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No bookings scheduled</div>
            ) : viewMode === 'calendar' ? (
              // Calendar View
              <div className="space-y-6">
                {Object.keys(calendarData).sort().map((weekKey) => {
                  const weekDates = Object.keys(calendarData[weekKey]).sort()
                  const weekStart = new Date(weekKey)
                  const weekEnd = new Date(weekStart)
                  weekEnd.setDate(weekStart.getDate() + 6)

                  return (
                    <div key={weekKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-5 py-3 border-b border-primary-200">
                        <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wider flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Week of {formatDate(weekKey)}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-gray-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => {
                          const currentDate = new Date(weekStart)
                          currentDate.setDate(weekStart.getDate() + dayIndex)
                          const dateKey = currentDate.toISOString().split('T')[0]
                          const dayBookings = calendarData[weekKey][dateKey] || []
                          const isToday = dateKey === new Date().toISOString().split('T')[0]

                          return (
                            <div key={day} className="bg-white min-h-[120px] p-3">
                              <div className={`text-xs font-semibold mb-2 ${isToday ? 'text-primary-700' : 'text-gray-600'}`}>
                                <div className="flex items-center justify-between">
                                  <span>{day}</span>
                                  <span className={`${isToday ? 'bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full' : ''}`}>
                                    {currentDate.getDate()}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {dayBookings.map((booking, idx) => (
                                  <button
                                    key={`${booking.id}-${idx}`}
                                    onClick={() => setSelectedBooking(booking)}
                                    className="w-full text-left p-2 rounded-lg bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors group"
                                  >
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Clock className="h-3 w-3 text-primary-600" />
                                      <span className="text-xs font-semibold text-primary-900">{booking.scheduledTime}</span>
                                    </div>
                                    <p className="text-xs text-gray-700 truncate">{booking.serviceType}</p>
                                    {booking.repairRequestId && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Wrench className="h-3 w-3 text-primary-600" />
                                        <span className="text-[10px] text-primary-700 font-medium">Repair</span>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dates.map((date) =>
                  grouped[date].map((slot, idx) => (
                    <button
                      key={`${date}-${slot.id}-${idx}`}
                      onClick={() => setSelectedBooking(slot)}
                      className="card-surface rounded-2xl p-4 space-y-2 text-left hover:shadow-lg transition-shadow"
                    >
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
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                {dates.map((date) =>
                  grouped[date].map((slot, idx) => (
                    <button
                      key={`${date}-${slot.id}-${idx}`}
                      onClick={() => setSelectedBooking(slot)}
                      className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
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
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Expandable Side Panel */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedBooking(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 35,
                mass: 0.8,
              }}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                    <p className="text-xs text-gray-500 font-mono">ID: {selectedBooking.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="btn btn-ghost btn-icon" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {/* Booking Info */}
                <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    Booking Information
                  </h3>
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Service Type</p>
                        <p className="text-lg font-bold text-gray-900">{selectedBooking.serviceType}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border-2 ${
                        selectedBooking.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                        selectedBooking.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        selectedBooking.status === 'confirmed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {selectedBooking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</p>
                        <p className="text-base font-bold text-gray-900">{formatDate(selectedBooking.scheduledDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Time</p>
                        <p className="text-base font-bold text-gray-900">{selectedBooking.scheduledTime}</p>
                      </div>
                      {selectedBooking.vehicleInfo && (
                        <div className="col-span-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Vehicle Info</p>
                          <p className="text-base font-bold text-gray-900">{selectedBooking.vehicleInfo}</p>
                        </div>
                      )}
                      {selectedBooking.notes && (
                        <div className="col-span-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                          <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {selectedBooking.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Customer Info */}
                <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    Customer Information
                  </h3>
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</p>
                      <p className="text-base font-bold text-gray-900">{selectedBooking.customerName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                        <a href={`tel:${selectedBooking.customerPhone}`} className="text-base font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedBooking.customerPhone}
                        </a>
                      </div>
                      {selectedBooking.customerEmail && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                          <a href={`mailto:${selectedBooking.customerEmail}`} className="text-base font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{selectedBooking.customerEmail}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Repair Request Info */}
                {selectedBooking.repairRequest && (
                  <section className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 p-5 shadow-md">
                    <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-orange-600" />
                      </div>
                      Linked Repair Request
                    </h3>
                    <div className="bg-white border border-orange-200 rounded-lg p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Request ID</p>
                          <p className="text-sm font-mono text-gray-900">{selectedBooking.repairRequestId?.slice(0, 8)}...</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedBooking.repairRequest.urgency && (
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                              selectedBooking.repairRequest.urgency === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                              selectedBooking.repairRequest.urgency === 'high' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                              selectedBooking.repairRequest.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                              'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {selectedBooking.repairRequest.urgency?.toUpperCase()}
                            </span>
                          )}
                          {selectedBooking.repairRequest.status && (
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                              selectedBooking.repairRequest.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                              selectedBooking.repairRequest.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {selectedBooking.repairRequest.status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedBooking.repairRequest.aiCategory && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AI Category</p>
                          <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {selectedBooking.repairRequest.aiCategory}
                          </span>
                        </div>
                      )}

                      {selectedBooking.repairRequest.description && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {selectedBooking.repairRequest.description}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigateToRepairRequest(selectedBooking.repairRequestId!)}
                        className="w-full btn btn-primary flex items-center gap-2 justify-center"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Full Repair Request
                      </button>
                    </div>
                  </section>
                )}

                {/* System Info */}
                <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    System Information
                  </h3>
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created</p>
                      <p className="text-sm font-bold text-gray-900">{formatDate(selectedBooking.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Updated</p>
                      <p className="text-sm font-bold text-gray-900">{formatDate(selectedBooking.updatedAt)}</p>
                    </div>
                    {selectedBooking.smsConsent !== undefined && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">SMS Consent</p>
                        <p className="text-sm font-bold text-gray-900">{selectedBooking.smsConsent ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {selectedBooking.complianceAccepted !== undefined && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Compliance</p>
                        <p className="text-sm font-bold text-gray-900">{selectedBooking.complianceAccepted ? 'Accepted' : 'Not Accepted'}</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

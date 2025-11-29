'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Calendar, Clock, User, Phone, Mail, Wrench, Plus, CheckCircle, XCircle, AlertCircle, Grid3x3, List, ChevronLeft, ChevronRight, X, Loader2, Search, Settings, Download } from 'lucide-react'
import { Booking } from '@/types'
import { getStatusColor, formatDate, formatDateTime } from '@/lib/utils'
import { exportBookings } from '@/lib/export-utils'

export default function BookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showNewBookingModal, setShowNewBookingModal] = useState(false)
  const [repairRequests, setRepairRequests] = useState<any[]>([])
  const [loadingRepairs, setLoadingRepairs] = useState(false)

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

    // Load repair requests for association
    const loadRepairRequests = async () => {
      try {
        setLoadingRepairs(true)
        const res = await fetch('/api/repair-requests?status=submitted,waiting_booking,triaged')
        if (res.ok) {
          const data = await res.json()
          setRepairRequests(data.requests || [])
        }
      } catch (err) {
        console.error('Error fetching repair requests:', err)
      } finally {
        setLoadingRepairs(false)
      }
    }
    loadRepairRequests()
  }, [router])

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('bookings-view-mode')
    if (savedView === 'list' || savedView === 'calendar') {
      setViewMode(savedView)
    }
  }, [])

  // Save view preference to localStorage
  const handleViewModeChange = (mode: 'list' | 'calendar') => {
    setViewMode(mode)
    localStorage.setItem('bookings-view-mode', mode)
  }

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

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  const formatDateString = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day)
    return date.toISOString().split('T')[0]
  }

  const getBookingsForDate = (dateString: string) => {
    return filteredBookings.filter(booking => {
      if (!booking.scheduledDate) return false
      const bookingDate = new Date(booking.scheduledDate).toISOString().split('T')[0]
      return bookingDate === dateString
    })
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    )
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = getDaysInMonth(currentMonth)

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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
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
                  <button
                    onClick={() => handleViewModeChange('calendar')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'calendar'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    aria-label="Calendar view"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => router.push('/admin/settings?tab=calendar')}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
                  aria-label="Booking settings"
                  title="Booking Settings"
                >
                  <Settings className="h-5 w-5 text-gray-600" />
                </button>
                <button 
                  onClick={() => exportBookings(filteredBookings)} 
                  className="btn btn-secondary flex items-center gap-2"
                  disabled={filteredBookings.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button 
                  onClick={() => setShowNewBookingModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Booking
                </button>
              </div>
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
            ) : viewMode === 'calendar' ? (
              <div className="space-y-6">
                {/* Calendar Header */}
                <div className="card-surface rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Week Days Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className={`text-center text-xs font-semibold py-2 ${
                          day === 'Sun' || day === 'Sat' ? 'text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                      }

                      const dateString = formatDateString(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day
                      )
                      const dayBookings = getBookingsForDate(dateString)
                      const today = isToday(day)

                      return (
                        <div
                          key={day}
                          className={`aspect-square rounded-lg border-2 p-1 min-h-[100px] ${
                            today
                              ? 'border-primary-400 bg-primary-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className={`text-sm font-medium mb-1 ${today ? 'text-primary-700' : 'text-gray-700'}`}>
                            {day}
                          </div>
                          <div className="space-y-1 overflow-y-auto max-h-[70px]">
                            {dayBookings.slice(0, 3).map((booking) => (
                              <div
                                key={booking.id}
                                className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate ${
                                  booking.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : booking.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : booking.status === 'confirmed'
                                    ? 'bg-purple-100 text-purple-700'
                                    : booking.status === 'cancelled'
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                                title={`${booking.customerName} - ${booking.serviceType} at ${booking.scheduledTime}`}
                              >
                                <div className="font-semibold truncate">{booking.scheduledTime}</div>
                                <div className="truncate">{booking.customerName}</div>
                              </div>
                            ))}
                            {dayBookings.length > 3 && (
                              <div className="text-xs text-gray-500 font-medium px-1">
                                +{dayBookings.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Bookings List for Selected Date (if any) */}
                {filteredBookings.length === 0 && (
                  <div className="card-surface rounded-xl p-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-500">
                      {statusFilter === 'all'
                        ? 'No bookings have been created yet.'
                        : `No ${statusFilter.replace('_', ' ')} bookings found.`}
                    </p>
                  </div>
                )}
              </div>
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

      {/* New Booking Modal */}
      {showNewBookingModal && (
        <NewBookingModal
          repairRequests={repairRequests}
          onClose={() => setShowNewBookingModal(false)}
          onSuccess={() => {
            setShowNewBookingModal(false)
            // Reload bookings
            const loadBookings = async () => {
              try {
                const res = await fetch('/api/bookings')
                if (res.ok) {
                  const data = await res.json()
                  setBookings(data.bookings || [])
                }
              } catch (err) {
                console.error('Error fetching bookings:', err)
              }
            }
            loadBookings()
          }}
        />
      )}
    </div>
  )
}

// New Booking Modal Component
function NewBookingModal({ 
  repairRequests, 
  onClose, 
  onSuccess 
}: { 
  repairRequests: any[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceType: '',
    scheduledDate: '',
    scheduledTime: '',
    vehicleInfo: '',
    notes: '',
    smsConsent: true,
    complianceAccepted: true,
    repairRequestId: '',
  })
  const [selectedRepairRequest, setSelectedRepairRequest] = useState<any>(null)
  const [repairSearch, setRepairSearch] = useState('')
  const [showRepairSelector, setShowRepairSelector] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [availability, setAvailability] = useState<any>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calendarSettings, setCalendarSettings] = useState({
    startTime: '06:00',
    endTime: '14:00',
    slotDuration: 30,
    slotBufferTime: 0,
    workingDays: [1, 2, 3, 4, 5],
  })

  // Load calendar settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/calendar/settings')
        const data = await res.json()
        if (data.settings) {
          setCalendarSettings({
            startTime: data.settings.startTime || '06:00',
            endTime: data.settings.endTime || '14:00',
            slotDuration: data.settings.slotDuration || 30,
            slotBufferTime: data.settings.slotBufferTime ?? 0,
            workingDays: data.settings.workingDays || [1, 2, 3, 4, 5],
          })
        }
      } catch (err) {
        console.error('Error loading calendar settings:', err)
      }
    }
    loadSettings()
  }, [])

  // Check availability when date is selected
  useEffect(() => {
    if (formData.scheduledDate) {
      checkAvailability(formData.scheduledDate)
    }
  }, [formData.scheduledDate, calendarSettings])

  const checkAvailability = async (date: string) => {
    setLoadingAvailability(true)
    try {
      const res = await fetch(`/api/calendar/availability?date=${date}`)
      const data = await res.json()
      if (res.ok) {
        setAvailability(data)
      }
    } catch (err) {
      console.error('Error checking availability:', err)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const getTimeSlots = () => {
    if (!availability?.availableSlots) {
      const slots = []
      const [startHour, startMin] = calendarSettings.startTime.split(':').map(Number)
      const [endHour, endMin] = calendarSettings.endTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      const totalSlotTime = calendarSettings.slotDuration + calendarSettings.slotBufferTime

      for (let minutes = startMinutes; minutes < endMinutes; minutes += totalSlotTime) {
        if (minutes + calendarSettings.slotDuration > endMinutes) break
        const hour = Math.floor(minutes / 60)
        const min = minutes % 60
        slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
      }
      return slots
    }
    return availability.availableSlots || []
  }

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  const formatDateString = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day)
    return date.toISOString().split('T')[0]
  }

  const isDateAvailable = (day: number) => {
    const date = formatDateString(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    const dayOfWeek = checkDate.getDay()
    return checkDate >= today && calendarSettings.workingDays.includes(dayOfWeek)
  }

  const isDateSelected = (day: number) => {
    if (!formData.scheduledDate) return false
    const date = formatDateString(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    return date === formData.scheduledDate
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      calendarMonth.getMonth() === today.getMonth() &&
      calendarMonth.getFullYear() === today.getFullYear()
    )
  }

  const handleDateClick = (day: number) => {
    if (!day || !isDateAvailable(day)) return
    const date = formatDateString(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    setFormData({ ...formData, scheduledDate: date, scheduledTime: '' })
  }

  const handleRepairRequestSelect = (repair: any) => {
    setSelectedRepairRequest(repair)
    setFormData({
      ...formData,
      repairRequestId: repair.id,
      customerName: repair.driverName || '',
      customerEmail: repair.driverEmail || '',
      customerPhone: repair.driverPhone || '',
      serviceType: repair.aiCategory || 'Repair Service',
      vehicleInfo: repair.vehicleIdentifier || '',
    })
    setShowRepairSelector(false)
    setRepairSearch('')
  }

  const filteredRepairRequests = repairRequests.filter((req) => {
    if (!repairSearch.trim()) return true
    const search = repairSearch.toLowerCase()
    return (
      req.driverName?.toLowerCase().includes(search) ||
      req.vehicleIdentifier?.toLowerCase().includes(search) ||
      req.description?.toLowerCase().includes(search) ||
      req.aiCategory?.toLowerCase().includes(search)
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.customerName || !formData.customerPhone || !formData.serviceType || !formData.scheduledDate || !formData.scheduledTime) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'confirmed',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      // Update repair request if associated
      if (formData.repairRequestId) {
        await fetch(`/api/repair-requests/${formData.repairRequestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: data.booking.id,
            scheduledDate: formData.scheduledDate,
            scheduledTime: formData.scheduledTime,
            status: 'scheduled',
          }),
        })
      }

      // Send confirmation
      await fetch(`/api/bookings/${data.booking.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
        }),
      })

      onSuccess()
    } catch (err) {
      console.error('Error creating booking:', err)
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = getDaysInMonth(calendarMonth)
  const timeSlots = getTimeSlots()

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Booking</h2>
                <p className="text-xs text-gray-500">Create a booking on behalf of a driver</p>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Repair Request Association */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary-600" />
                Associate with Repair Request (Optional)
              </h3>
              {selectedRepairRequest ? (
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedRepairRequest.driverName}</p>
                      <p className="text-sm text-gray-600">{selectedRepairRequest.vehicleIdentifier}</p>
                      <p className="text-xs text-gray-500 mt-1">{selectedRepairRequest.aiCategory}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRepairRequest(null)
                        setFormData({ ...formData, repairRequestId: '' })
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="input-group">
                    <span className="input-group-icon input-group-icon-left">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search repair requests by driver, vehicle, or issue..."
                      value={repairSearch}
                      onChange={(e) => {
                        setRepairSearch(e.target.value)
                        setShowRepairSelector(true)
                      }}
                      onFocus={() => setShowRepairSelector(true)}
                      className="input input-with-icon-left"
                    />
                  </div>
                  {showRepairSelector && filteredRepairRequests.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowRepairSelector(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredRepairRequests.map((req) => (
                        <button
                          key={req.id}
                          type="button"
                          onClick={() => handleRepairRequestSelect(req)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <p className="font-medium text-gray-900">{req.driverName}</p>
                          <p className="text-sm text-gray-600">{req.vehicleIdentifier}</p>
                          <p className="text-xs text-gray-500">{req.aiCategory}</p>
                        </button>
                      ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-primary-600" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5 block">
                  <span className="text-sm font-semibold text-gray-700">Name *</span>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-sm font-semibold text-gray-700">Phone *</span>
                  <input
                    type="tel"
                    required
                    className="input-field w-full"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </label>
                <label className="space-y-1.5 block md:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">Email</span>
                  <input
                    type="email"
                    className="input-field w-full"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </label>
              </div>
            </div>

            {/* Service & Vehicle */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary-600" />
                Service & Vehicle
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5 block">
                  <span className="text-sm font-semibold text-gray-700">Service Type *</span>
                  <input
                    type="text"
                    required
                    className="input-field w-full"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    placeholder="e.g., Oil Change, Brake Repair"
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-sm font-semibold text-gray-700">Vehicle Info</span>
                  <input
                    type="text"
                    className="input-field w-full"
                    value={formData.vehicleInfo}
                    onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
                    placeholder="e.g., License plate, VIN"
                  />
                </label>
              </div>
            </div>

            {/* Calendar & Time Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                Select Date & Time
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-xs font-semibold py-2 text-gray-700">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                      }
                      const available = isDateAvailable(day)
                      const selected = isDateSelected(day)
                      const today = isToday(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDateClick(day)}
                          disabled={!available}
                          className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                            selected
                              ? 'bg-primary-600 text-white'
                              : available
                              ? 'bg-primary-50 text-primary-800 hover:bg-primary-100'
                              : 'text-gray-300 cursor-not-allowed'
                          } ${today && !selected ? 'ring-2 ring-primary-300' : ''}`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Times</h4>
                  {loadingAvailability ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    </div>
                  ) : formData.scheduledDate ? (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {timeSlots.length > 0 ? (
                        timeSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setFormData({ ...formData, scheduledTime: time })}
                            className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                              formData.scheduledTime === time
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-4 text-gray-500 text-sm">
                          No available slots for this date
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Select a date to see available times
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Additional Notes</h3>
              <textarea
                className="input-field w-full min-h-[100px]"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information about this booking..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1 flex items-center gap-2 justify-center"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Create Booking
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

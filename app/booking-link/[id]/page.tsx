'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Clock, User, MessageSquare, CheckCircle, MapPin, Car } from 'lucide-react'

export default function BookingLinkPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [repairRequest, setRepairRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: searchParams.get('name') || '',
    phone: searchParams.get('phone') || '',
    date: '',
    time: '',
    notes: '',
  })

  const [calendarSettings, setCalendarSettings] = useState({
    maxBookingsPerWeek: 5,
    startTime: '06:00',
    endTime: '14:00',
    slotDuration: 30,
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  })
  const [availability, setAvailability] = useState<any>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  // Load calendar settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/calendar/settings')
        const data = await res.json()
        if (data.settings) {
          setCalendarSettings({
            maxBookingsPerWeek: data.settings.maxBookingsPerWeek || 5,
            startTime: data.settings.startTime || '06:00',
            endTime: data.settings.endTime || '14:00',
            slotDuration: data.settings.slotDuration || 30,
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
    if (formData.date) {
      checkAvailability(formData.date)
    }
  }, [formData.date, calendarSettings])

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

  // Generate time slots based on settings
  const getTimeSlots = () => {
    if (!availability?.availableSlots) {
      const slots = []
      const [startHour, startMin] = calendarSettings.startTime.split(':').map(Number)
      const [endHour, endMin] = calendarSettings.endTime.split(':').map(Number)
      
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      
      for (let minutes = startMinutes; minutes < endMinutes; minutes += calendarSettings.slotDuration) {
        const hour = Math.floor(minutes / 60)
        const min = minutes % 60
        slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
      }
      return slots
    }
    return availability.availableSlots
  }

  // Get available dates (next 7 days, only working days)
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 14; i++) { // Check next 2 weeks
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayOfWeek = date.getDay()
      // Only include working days
      if (calendarSettings.workingDays.includes(dayOfWeek)) {
        dates.push(date.toISOString().split('T')[0])
      }
    }
    return dates
  }

  useEffect(() => {
    const loadRepairRequest = async () => {
      try {
        const res = await fetch(`/api/repair-requests/${params.id}`)
        if (!res.ok) throw new Error('Failed to load repair request')
        const data = await res.json()
        setRepairRequest(data.request)
        if (data.request) {
          setFormData(prev => ({
            ...prev,
            name: prev.name || data.request.driverName,
            phone: prev.phone || data.request.driverPhone,
          }))
        }
      } catch (err) {
        console.error('Error loading repair request:', err)
        setError('Failed to load repair request details')
      } finally {
        setLoading(false)
      }
    }

    loadRepairRequest()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Create booking from repair request
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: repairRequest?.driverEmail || '',
          customerPhone: formData.phone,
          serviceType: repairRequest?.aiCategory || 'Repair Service',
          scheduledDate: formData.date,
          scheduledTime: formData.time,
          status: 'confirmed',
          notes: formData.notes,
          repairRequestId: params.id,
          vehicleInfo: repairRequest?.vehicleIdentifier || '',
          smsConsent: true,
          complianceAccepted: true,
        }),
      })

      const bookingData = await bookingRes.json()
      if (!bookingRes.ok) {
        throw new Error(bookingData.error || 'Failed to create booking')
      }

      // Update repair request with booking info
      await fetch(`/api/repair-requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingData.booking.id,
          scheduledDate: formData.date,
          scheduledTime: formData.time,
          status: 'scheduled',
        }),
      })

      // Trigger notifications (mechanic and confirmation SMS)
      await fetch(`/api/bookings/${bookingData.booking.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: formData.date,
          scheduledTime: formData.time,
        }),
      })

      setSubmitted(true)
    } catch (err) {
      console.error('Error scheduling appointment:', err)
      setError(err instanceof Error ? err.message : 'Failed to schedule appointment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Scheduled!</h2>
          <p className="text-gray-600 mb-4">
            Your repair appointment has been confirmed for:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="font-semibold text-gray-900">{formData.date}</p>
            <p className="text-gray-600">{formData.time}</p>
          </div>
          <p className="text-sm text-gray-500">
            You'll receive a confirmation SMS shortly. We'll see you then!
          </p>
        </div>
      </div>
    )
  }

  if (!repairRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-red-600">Repair request not found or expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Panel - Service Details (Calendly Style) */}
        <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-300 p-8 flex flex-col">
          {/* Logo or Branding */}
          <div className="mb-8">
             <img src="/images/AEC-Horizontal-Official-Logo-2020.png" alt="Agave Environmental Contracting" className="h-12 object-contain" />
          </div>
          
          <div className="flex-1">
             <div className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-2">
               <User className="h-4 w-4 text-gray-600" />
               <span>{repairRequest.driverName || 'Valued Driver'}</span>
             </div>
             
             <h1 className="text-2xl font-bold text-gray-900 mb-6">Vehicle Repair Service</h1>
             
             <div className="space-y-4 text-gray-700">
               <div className="flex items-start gap-3">
                 <Clock className="h-5 w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                 <div>
                   <p className="font-medium text-gray-900">30 min</p>
                 </div>
               </div>
               
               <div className="flex items-start gap-3">
                 <MapPin className="h-5 w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                 <div>
                   <p className="font-medium text-gray-900">Service Center</p>
                   <p className="text-sm text-gray-600">Agave Fleet HQ</p>
                 </div>
               </div>

               {repairRequest.vehicleIdentifier && (
                 <div className="flex items-start gap-3">
                   <Car className="h-5 w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                   <div>
                     <p className="font-medium text-gray-900">Vehicle</p>
                     <p className="text-sm text-gray-600">{repairRequest.vehicleIdentifier}</p>
                   </div>
                 </div>
               )}

               {repairRequest.description && (
                 <div className="flex items-start gap-3">
                   <MessageSquare className="h-5 w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                   <div>
                     <p className="font-medium text-gray-900">Issue Reported</p>
                     <p className="text-sm text-gray-600 line-clamp-3">{repairRequest.description}</p>
                   </div>
                 </div>
               )}
             </div>
          </div>
          
          <div className="mt-auto pt-6 text-xs text-gray-500">
            <p>© Agave Environmental Contracting</p>
          </div>
        </div>

        {/* Right Panel - Date & Time Selection */}
        <div className="w-full md:w-2/3 p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
             <h2 className="text-xl font-bold text-gray-900 mb-6">Select a Date & Time</h2>
             
             {error && (
               <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-900 px-4 py-3 rounded-lg text-sm font-medium">
                 {error}
               </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Select Date
                  </label>
                  <div className="inline-block border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm w-full focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200 transition-colors">
                    {/* Simple Custom Calendar UI or Date Input */}
                    <input 
                      type="date" 
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value, time: '' })}
                      className="w-full p-2 border-none focus:ring-0 text-lg font-medium text-gray-900 cursor-pointer bg-transparent"
                    />
                    <p className="text-xs text-gray-600 mt-2 font-medium">
                       Monday - Friday only
                    </p>
                  </div>
                  
                  {/* Additional Inputs that were in the previous form */}
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-gray-900 placeholder-gray-500"
                        placeholder="Any specific requests..."
                      />
                    </div>
                  </div>
                </div>

                {/* Time Slots Section */}
                <div className="lg:border-l lg:pl-8 border-gray-300">
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Select Time
                  </label>
                  
                  {!formData.date ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-600 bg-gray-50 rounded-lg border-2 border-dashed border-gray-400">
                       <Calendar className="h-8 w-8 mb-2 text-gray-500" />
                       <p className="text-sm font-medium">Choose a date first</p>
                    </div>
                  ) : loadingAvailability ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-700">
                      <div className="h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm font-medium">Checking availability...</p>
                    </div>
                  ) : getTimeSlots().length === 0 ? (
                     <div className="text-center p-4 bg-yellow-50 border-2 border-yellow-200 text-yellow-900 rounded-lg text-sm font-medium">
                       No slots available for this date.
                     </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {getTimeSlots().map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData({ ...formData, time })}
                          className={`w-full py-3 px-4 rounded-md border-2 text-center font-semibold transition-all ${
                            formData.time === time
                              ? 'border-primary-600 bg-primary-600 text-white shadow-md scale-[1.02]'
                              : 'border-primary-300 text-primary-800 hover:border-primary-600 hover:bg-primary-50 hover:shadow-sm bg-white'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {formData.time && (
                    <div className="mt-6 animate-fade-in">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gray-900 text-white py-3 rounded-md font-semibold text-sm shadow-lg hover:bg-black hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-900"
                      >
                        {submitting ? 'Confirming...' : 'Confirm Booking'}
                      </button>
                    </div>
                  )}
                </div>
             </div>
          </form>
        </div>
      </div>
    </div>
  )
}

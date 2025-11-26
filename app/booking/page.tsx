'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Car,
  CheckCircle,
  ArrowLeft,
  Wrench,
  ShieldCheck,
  Smartphone,
  MessageSquare,
} from 'lucide-react'

const serviceTypes = [
  'Oil Change',
  'Tire Rotation',
  'Brake Service',
  'Engine Repair',
  'Transmission Service',
  'Battery Replacement',
  'General Inspection',
  'Other',
]

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
]

export default function BookingPage() {
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
    complianceAccepted: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [submittedSnapshot, setSubmittedSnapshot] = useState<typeof formData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.serviceType || !formData.scheduledDate || !formData.scheduledTime) {
      setSubmitting(false)
      setError('Pick a service type, date, and time to continue.')
      return
    }

    if (!formData.complianceAccepted) {
      setSubmitting(false)
      setError('Please confirm SMS terms and compliance before booking.')
      return
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          serviceType: formData.serviceType,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
          vehicleInfo: formData.vehicleInfo,
          notes: formData.notes,
          smsConsent: formData.smsConsent,
          complianceAccepted: formData.complianceAccepted,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      setBookingId(data.booking.id)
      setSubmittedSnapshot(formData)
      setSubmitted(true)
    } catch (error) {
      console.error('Error creating booking:', error)
      setError(error instanceof Error ? error.message : 'Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-700">Confirmed</p>
              <h1 className="text-2xl font-bold text-gray-900">Your booking is locked in</h1>
              <p className="text-sm text-gray-600">You&apos;ll receive an SMS confirmation with next steps.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card-surface rounded-2xl p-4">
              <p className="text-xs text-gray-500">Booking ID</p>
              <p className="font-mono font-semibold text-gray-900 break-all">{bookingId}</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="text-xs text-gray-500">Service</p>
              <p className="font-semibold text-gray-900">{submittedSnapshot?.serviceType}</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="text-xs text-gray-500">Schedule</p>
              <p className="font-semibold text-gray-900">
                {submittedSnapshot?.scheduledDate} • {submittedSnapshot?.scheduledTime}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              {submittedSnapshot?.customerName} ({submittedSnapshot?.customerEmail}) • {submittedSnapshot?.customerPhone}
            </p>
            {submittedSnapshot?.vehicleInfo && (
              <p className="text-sm text-gray-600 mt-1">Vehicle: {submittedSnapshot.vehicleInfo}</p>
            )}
            <p className="text-xs text-gray-500 mt-3">
              SMS consent: {submittedSnapshot?.smsConsent ? 'opted in' : 'declined'} • Compliance acknowledged
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Link>
            <Link
              href="/compliance"
              className="inline-flex items-center text-gray-700 hover:text-gray-900 font-semibold"
            >
              Read SMS compliance
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-primary-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">FleetPro</span>
            </Link>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Link href="/compliance" className="text-gray-700 hover:text-primary-700">SMS Compliance</Link>
              <Link
                href="/"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md"
              >
                ← Back home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Service Request</p>
            <h1 className="text-3xl font-bold text-gray-900">Book a service with SMS clarity</h1>
            <p className="text-gray-600">We collect explicit consent and share clear HELP/STOP guidance with every SMS.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-primary-100 text-primary-700 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Consent-first messaging
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-wrap gap-3 mb-6 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 inline-flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile-optimized
              </span>
              <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                SMS confirmation
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                HELP/STOP supported
              </span>
            </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="mr-2 h-5 w-5 text-primary-600" />
                Customer Information
              </h2>
              
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    required
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    required
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Wrench className="mr-2 h-5 w-5 text-primary-600" />
                Service Details
              </h2>

              <div>
                <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  required
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a service</option>
                  {serviceTypes.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {serviceTypes.slice(0, 4).map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => setFormData({ ...formData, serviceType: service })}
                      className={`text-xs px-3 py-2 rounded-lg border ${
                        formData.serviceType === service
                          ? 'bg-primary-50 border-primary-200 text-primary-800'
                          : 'border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="vehicleInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Information
                </label>
                <input
                  type="text"
                  id="vehicleInfo"
                  name="vehicleInfo"
                  value={formData.vehicleInfo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 2022 Ford F-150, License: ABC-1234"
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary-600" />
                Schedule
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    required
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Time *
                  </label>
                  <select
                    id="scheduledTime"
                    name="scheduledTime"
                    required
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                  >
                    <option value="">Select a time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormData({ ...formData, scheduledTime: time })}
                        className={`text-xs px-3 py-2 rounded-lg border ${
                          formData.scheduledTime === time
                            ? 'bg-primary-50 border-primary-200 text-primary-800'
                            : 'border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="pt-6 border-t border-gray-200">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Any additional information about your service request..."
              />
            </div>

            <div className="pt-6 border-t border-gray-200 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  id="smsConsent"
                  name="smsConsent"
                  type="checkbox"
                  checked={formData.smsConsent}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
                <label htmlFor="smsConsent" className="text-sm text-gray-700">
                  Yes, send me SMS updates about this booking. Standard rates apply. Reply STOP to opt out, HELP for help.
                </label>
              </div>
              <div className="flex items-start gap-3">
                <input
                  id="complianceAccepted"
                  name="complianceAccepted"
                  type="checkbox"
                  checked={formData.complianceAccepted}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  required
                />
                <label htmlFor="complianceAccepted" className="text-sm text-gray-700">
                  I agree to the SMS terms, privacy handling, and understand I can opt out anytime. See our{' '}
                  <Link href="/compliance" className="text-primary-700 font-semibold">SMS compliance policy</Link>.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens next</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li>1) You&apos;ll get an SMS confirmation with HELP/STOP instructions.</li>
                <li>2) Admin assigns a mechanic and updates status in real-time.</li>
                <li>3) You can reply to adjust timing — we respect opt-out immediately.</li>
              </ul>
            </div>
            <div className="card-surface rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need a rush slot?</h3>
              <p className="text-sm text-gray-700 mb-3">Call dispatch and mention your booking ID after you submit.</p>
              <a href="tel:+15551234567" className="text-primary-700 font-semibold">+1 (555) 123-4567</a>
            </div>
            <div className="card-surface rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile ready</h3>
              <p className="text-sm text-gray-700">
                We built this flow to compress neatly on phones. Save this page to re-open your slot details on the go.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

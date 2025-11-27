'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { MessageSquare, Send, Users, Phone, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { User } from '@/types'

export default function NotificationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [drivers, setDrivers] = useState<User[]>([])
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [results, setResults] = useState<{ driverId: string; driverName: string; success: boolean; error?: string }[]>([])

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

    const loadDrivers = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/drivers')
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || data.details || 'Failed to load drivers')
        }
        // Filter drivers that have phone numbers
        const driversWithPhone = (data.drivers || []).filter((d: User) => d.phone && d.phone.trim() !== '')
        setDrivers(driversWithPhone)
        setError(null)
      } catch (err) {
        console.error('Error fetching drivers:', err)
        setError(err instanceof Error ? err.message : 'Failed to load drivers. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadDrivers()
  }, [router])

  const toggleDriver = (driverId: string) => {
    setSelectedDrivers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(driverId)) {
        newSet.delete(driverId)
      } else {
        newSet.add(driverId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedDrivers.size === drivers.length) {
      setSelectedDrivers(new Set())
    } else {
      setSelectedDrivers(new Set(drivers.map(d => d.id)))
    }
  }

  const handleSendSMS = async () => {
    if (selectedDrivers.size === 0) {
      setError('Please select at least one driver')
      return
    }

    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    setSending(true)
    setError(null)
    setSuccess(null)
    setResults([])

    try {
      const selectedDriversList = drivers.filter(d => selectedDrivers.has(d.id))
      const resultsList: { driverId: string; driverName: string; success: boolean; error?: string }[] = []

      // Send SMS to each selected driver
      for (const driver of selectedDriversList) {
        if (!driver.phone) {
          resultsList.push({
            driverId: driver.id,
            driverName: driver.name,
            success: false,
            error: 'No phone number available'
          })
          continue
        }

        try {
          const res = await fetch('/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: driver.phone,
              message: message.trim()
            })
          })

          const data = await res.json()
          if (res.ok) {
            resultsList.push({
              driverId: driver.id,
              driverName: driver.name,
              success: true
            })
          } else {
            resultsList.push({
              driverId: driver.id,
              driverName: driver.name,
              success: false,
              error: data.error || 'Failed to send SMS'
            })
          }
        } catch (err) {
          resultsList.push({
            driverId: driver.id,
            driverName: driver.name,
            success: false,
            error: err instanceof Error ? err.message : 'Network error'
          })
        }
      }

      setResults(resultsList)
      const successCount = resultsList.filter(r => r.success).length
      const failCount = resultsList.filter(r => !r.success).length

      if (successCount > 0) {
        setSuccess(`Successfully sent ${successCount} message${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`)
      } else {
        setError(`Failed to send all messages. ${failCount} error${failCount > 1 ? 's' : ''} occurred.`)
      }

      // Clear selection and message after successful send
      if (failCount === 0) {
        setSelectedDrivers(new Set())
        setMessage('')
      }
    } catch (err) {
      console.error('Error sending SMS:', err)
      setError(err instanceof Error ? err.message : 'Failed to send SMS notifications')
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || 'mechanic'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-primary-700 font-semibold uppercase tracking-wider">Communications</p>
                <h1 className="text-3xl font-bold text-gray-900">Send SMS Notifications</h1>
                <p className="text-sm text-gray-600 mt-1">Send messages to all drivers or select specific drivers.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-primary-200 rounded-full text-sm font-semibold text-primary-700 shadow-sm">
                <MessageSquare className="h-4 w-4" />
                SMS Notifications
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-r-lg shadow-sm">
                <p className="font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded-r-lg shadow-sm">
                <p className="font-medium">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Driver Selection Panel */}
              <div className="lg:col-span-1">
                <div className="card-surface rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Select Drivers</h2>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {selectedDrivers.size === drivers.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    </div>
                  ) : drivers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No drivers with phone numbers found.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {drivers.map((driver) => (
                        <label
                          key={driver.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedDrivers.has(driver.id)
                              ? 'bg-primary-50 border-primary-300'
                              : 'bg-white border-gray-200 hover:border-primary-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDrivers.has(driver.id)}
                            onChange={() => toggleDriver(driver.id)}
                            className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{driver.name}</p>
                            {driver.phone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {driver.phone}
                              </p>
                            )}
                          </div>
                          {selectedDrivers.has(driver.id) && (
                            <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0" />
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      {selectedDrivers.size} of {drivers.length} driver{drivers.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Panel */}
              <div className="lg:col-span-2">
                <div className="card-surface rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Compose Message</h2>
                    <p className="text-sm text-gray-600">Write your message below. It will be sent to all selected drivers.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message here..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      {message.length} character{message.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Ready to send</p>
                      <p className="text-xs mt-1">
                        {selectedDrivers.size > 0
                          ? `Will send to ${selectedDrivers.size} driver${selectedDrivers.size !== 1 ? 's' : ''}`
                          : 'Select at least one driver'}
                      </p>
                    </div>
                    <button
                      onClick={handleSendSMS}
                      disabled={sending || selectedDrivers.size === 0 || !message.trim()}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Send SMS
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Results Panel */}
                {results.length > 0 && (
                  <div className="card-surface rounded-xl p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Results</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {results.map((result) => (
                        <div
                          key={result.driverId}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {result.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{result.driverName}</p>
                              {result.error && (
                                <p className="text-xs text-red-600 mt-1">{result.error}</p>
                              )}
                            </div>
                          </div>
                          {result.success && (
                            <span className="text-xs font-medium text-green-700">Sent</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}





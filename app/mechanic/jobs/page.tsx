'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Wrench, Clock, Calendar, Smartphone } from 'lucide-react'
import { Job } from '@/types'
import { getStatusColor, formatDateTime } from '@/lib/utils'

export default function JobsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

    const loadJobs = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/jobs?mechanicId=${parsedUser.id}`)
        if (!res.ok) throw new Error('Failed to load jobs')
        const data = await res.json()
        setJobs(data.jobs || [])
        setError(null)
      } catch (error) {
        console.error('Error fetching jobs:', error)
        setError('Failed to load jobs. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [router])

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="mechanic" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Work orders</p>
                <h1 className="text-3xl font-bold text-gray-900">My jobs</h1>
                <p className="text-gray-600">Tap-friendly cards, live statuses, mobile-ready.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-primary-700">
                <Smartphone className="h-4 w-4" />
                Mobile ready
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading jobs...</div>
            ) : (
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="card-surface rounded-xl p-12 text-center">
                    <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No jobs assigned yet</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.id}
                      className="card-surface rounded-xl p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${
                            job.status === 'completed' ? 'bg-green-100' :
                            job.status === 'in_progress' ? 'bg-yellow-100' :
                            'bg-blue-100'
                          }`}>
                            <Wrench className={`h-6 w-6 ${
                              job.status === 'completed' ? 'text-green-600' :
                              job.status === 'in_progress' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Job #{job.id.slice(-6)}</h3>
                            <p className="text-sm text-gray-500">Booking ID: {job.bookingId}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                            {job.status.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            job.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            job.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.priority}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {job.startTime ? formatDateTime(job.startTime) : 'Not started'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {job.estimatedHours || 0} hours estimated
                        </div>
                        {job.totalCost && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">$</span>
                            {job.totalCost.toFixed(2)} total
                          </div>
                        )}
                      </div>

                      {job.notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{job.notes}</p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                          View Details
                        </button>
                        {job.status !== 'completed' && (
                          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                            Update Status
                          </button>
                        )}
                      </div>
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Wrench, Clock, CheckCircle, MessageSquare, Smartphone } from 'lucide-react'

export default function MechanicDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
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

    // Fetch jobs from API
    const loadJobs = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/jobs?mechanicId=${parsedUser.id}`)
        if (!res.ok) throw new Error('Failed to load jobs')
        const data = await res.json()
        setJobs(data.jobs || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError('Failed to load jobs. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [router])

  if (!user || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const myJobs = jobs.length
  const inProgress = jobs.filter(j => j.status === 'in_progress').length
  const completed = jobs.filter(j => j.status === 'completed').length

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="mechanic" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Mechanic</p>
                <h1 className="text-3xl font-bold text-gray-900">My dashboard</h1>
                <p className="text-gray-600">Mobile-first cards and quick status updates.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-primary-700">
                <Smartphone className="h-4 w-4" />
                Mobile ready
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Wrench className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{myJobs}</h3>
                <p className="text-sm text-gray-600">My Jobs</p>
              </div>

              <div className="card-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-700" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{inProgress}</h3>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>

              <div className="card-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-700" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{completed}</h3>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Job Queue */}
            <div className="card-surface rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Job Queue</h2>
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          job.status === 'completed' ? 'bg-green-100' :
                          job.status === 'in_progress' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          <Wrench className={`h-5 w-5 ${
                            job.status === 'completed' ? 'text-green-600' :
                            job.status === 'in_progress' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Job #{job.id.slice(-6)}</p>
                          <p className="text-sm text-gray-500">
                            Priority: <span className="capitalize">{job.priority}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {job.status.replace('_', ' ')}
                        </span>
                        <button className="text-primary-600 hover:text-primary-700 font-medium">
                          View Details
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          SMS
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

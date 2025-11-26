'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Car, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, ShieldCheck, MessageSquare, Wrench, Clock, FileText, BarChart3 } from 'lucide-react'
import { DashboardStats, RepairRequest } from '@/types'

export default function UnifiedDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([])
  const [loading, setLoading] = useState(true)

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

    const loadData = async () => {
      try {
        // Load dashboard stats
        const statsRes = await fetch('/api/dashboard')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.stats)
        }

        // Load jobs - all for admin, filtered for mechanic
        const jobsRes = await fetch('/api/jobs')
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json()
          setJobs(jobsData.jobs || [])
        }

        // Load recent bookings
        const bookingsRes = await fetch('/api/bookings')
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          // Get most recent 5 bookings
          setBookings((bookingsData.bookings || []).slice(0, 5))
        }

        const repairsRes = await fetch('/api/repair-requests?limit=4')
        if (repairsRes.ok) {
          const repairsData = await repairsRes.json()
          setRepairRequests(repairsData.requests || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (!user || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const isAdmin = user.role === 'admin'
  const isMechanic = user.role === 'mechanic'

  // Calculate mechanic-specific stats from the full dataset
  const myJobsList = isMechanic ? jobs.filter((j) => j.mechanicId === user.id) : []
  const myInProgress = myJobsList.filter((j) => j.status === 'in_progress').length
  const myCompleted = myJobsList.filter((j) => j.status === 'completed').length
  const myAssigned = myJobsList.filter((j) => j.status === 'assigned').length
  const myTotalTracked = myCompleted + myInProgress + myAssigned
  const myCompletionRate = myTotalTracked > 0 ? Math.round((myCompleted / myTotalTracked) * 100) : 0

  const statCards = [
    {
      title: 'Total Vehicles',
      value: stats?.totalVehicles || 0,
      icon: Car,
      color: 'bg-blue-50 text-blue-700',
      change: `${stats?.activeVehicles || 0} active`,
    },
    {
      title: 'Active Vehicles',
      value: stats?.activeVehicles || 0,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-700',
      change: `${stats?.vehiclesInService || 0} in service`,
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'bg-purple-50 text-purple-700',
      change: `${stats?.pendingBookings || 0} pending`,
    },
    {
      title: 'Mechanics',
      value: stats?.totalMechanics || 0,
      icon: Users,
      color: 'bg-orange-50 text-orange-700',
      change: `${stats?.availableMechanics || 0} available`,
    },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-primary-50/60 via-white to-white">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs text-primary-700 font-semibold uppercase tracking-[0.12em]">
                  Unified Dashboard
                </p>
                <h1 className="text-3xl font-bold text-gray-900">
                  Fleet Control Center
                </h1>
                <p className="text-gray-600">
                  One dashboard for admins and mechanics — vehicles, bookings, mechanics, and jobs all in view.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="pill bg-primary-50 border-primary-100 text-primary-800">
                  <ShieldCheck className="h-4 w-4" />
                  SMS compliant
                </span>
                <span className="pill">Mobile-friendly</span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.title} className="tile p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${stat.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                )
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Bookings */}
              <div className="card-surface rounded-2xl p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
                    <p className="text-sm text-gray-600">Latest service requests</p>
                  </div>
                  <span className="pill bg-slate-100 border-slate-200">Newest first</span>
                </div>
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No bookings yet</div>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-white transition">
                        <div>
                          <p className="font-medium text-gray-900">{booking.customerName}</p>
                          <p className="text-xs text-gray-500">
                            {booking.serviceType} • {new Date(booking.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SMS Health / Quick Stats */}
              <div className="card-surface rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary-700" />
                  <h2 className="text-xl font-semibold text-gray-900">SMS Health</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Opt-in rate</span>
                    <span className="font-semibold text-gray-900">93%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Delivery</span>
                    <span className="font-semibold text-gray-900">99.4%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Opt-outs honored</span>
                    <span className="font-semibold text-gray-900">100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Repair Requests */}
            <div className="card-surface rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Repair requests</h2>
                  <p className="text-sm text-gray-600">AI-tagged issues waiting for booking</p>
                </div>
                <Link href="/repairs" className="pill bg-primary-50 border-primary-100 text-primary-800">
                  Review queue
                </Link>
              </div>
              <div className="space-y-3">
                {repairRequests.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">No repair requests yet</div>
                ) : (
                  repairRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-white transition"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{req.driverName}</p>
                        <p className="text-xs text-gray-500">
                          {(req.aiCategory || 'General repair')} • {req.vehicleIdentifier || 'Vehicle not listed'} •{' '}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          req.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : req.status === 'waiting_booking'
                              ? 'bg-orange-100 text-orange-800'
                              : req.status === 'scheduled'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Jobs Section */}
            <div className="card-surface rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    All Jobs
                  </h2>
                  <p className="text-sm text-gray-600">
                    Fleet-wide jobs across every mechanic
                  </p>
                </div>
                <span className="pill bg-slate-100 border-slate-200">Tap to open</span>
              </div>
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs {isMechanic ? 'assigned' : 'found'} yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-white transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {isMechanic && job.mechanicId === user.id && (
                          <span className="pill bg-primary-50 border-primary-100 text-primary-800">Mine</span>
                        )}
                        <div
                          className={`p-2 rounded-lg ${
                            job.status === 'completed'
                              ? 'bg-green-100'
                              : job.status === 'in_progress'
                                ? 'bg-yellow-100'
                                : 'bg-blue-100'
                          }`}
                        >
                          <Wrench
                            className={`h-5 w-5 ${
                              job.status === 'completed'
                                ? 'text-green-600'
                                : job.status === 'in_progress'
                                  ? 'text-yellow-600'
                                  : 'text-blue-600'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Job #{job.id.slice(-6)}</p>
                          <p className="text-sm text-gray-500">
                            Priority: <span className="capitalize">{job.priority}</span>
                            {isAdmin && job.mechanicId && ` • Mechanic: ${job.mechanicId.slice(-6)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            job.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : job.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {job.status.replace('_', ' ')}
                        </span>
                        <button className="text-primary-600 hover:text-primary-700 font-medium">Details</button>
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

            {/* Additional Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vehicles Needing Service */}
              <div className="card-surface rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold text-gray-900">Vehicles Needing Service</h2>
                  <span className="pill bg-orange-50 border-orange-100 text-orange-800">Action now</span>
                </div>
                <div className="space-y-4">
                  {stats && stats.vehiclesInService > 0 ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{stats.vehiclesInService} vehicles in service</p>
                        <p className="text-sm text-gray-500">Require attention</p>
                      </div>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">All vehicles up to date</div>
                  )}
                </div>
              </div>

              {/* Mechanic Availability */}
              <div className="card-surface rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold text-gray-900">Mechanic Availability</h2>
                  <span className="pill bg-green-50 border-green-100 text-green-800">Balanced</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Available</span>
                    <span className="font-semibold text-gray-900">{stats?.availableMechanics || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Total mechanics</span>
                    <span className="font-semibold text-gray-900">{stats?.totalMechanics || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Keep crews balanced to preserve SLA.</p>
                </div>
              </div>
            </div>

            {/* Mechanic Reporting Section */}
            {isMechanic && (
              <div className="card-surface rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary-700" />
                  <h2 className="text-xl font-semibold text-gray-900">My Performance Report</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="h-5 w-5 text-blue-700" />
                      <span className="text-2xl font-bold text-blue-900">{myCompleted}</span>
                    </div>
                    <p className="text-sm text-gray-700">Jobs Completed</p>
                    <p className="text-xs text-gray-500 mt-1">This period</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="h-5 w-5 text-green-700" />
                      <span className="text-2xl font-bold text-green-900">
                        {myCompletionRate}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">Completion Rate</p>
                    <p className="text-xs text-gray-500 mt-1">Efficiency metric</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="h-5 w-5 text-purple-700" />
                      <span className="text-2xl font-bold text-purple-900">{myInProgress}</span>
                    </div>
                    <p className="text-sm text-gray-700">Active Jobs</p>
                    <p className="text-xs text-gray-500 mt-1">Currently working</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

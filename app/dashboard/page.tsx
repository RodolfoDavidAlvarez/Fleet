'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Car, Calendar, Users, CheckCircle, MessageSquare, Wrench, BarChart3, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
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
        const [statsRes, jobsRes, bookingsRes, repairsRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/jobs'),
          fetch('/api/bookings'),
          fetch('/api/repair-requests?limit=4'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.stats)
        }

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json()
          setJobs(jobsData.jobs || [])
        }

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          setBookings((bookingsData.bookings || []).slice(0, 5))
        }

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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--primary-200)] border-t-[var(--primary-500)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
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
      gradient: 'from-blue-500 to-blue-600',
      change: `${stats?.activeVehicles || 0} active`,
      trend: 'up',
    },
    {
      title: 'Active Vehicles',
      value: stats?.activeVehicles || 0,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      change: `${stats?.vehiclesInService || 0} in service`,
      trend: 'up',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      gradient: 'from-purple-500 to-purple-600',
      change: `${stats?.pendingBookings || 0} pending`,
      trend: 'stable',
    },
    {
      title: 'Mechanics',
      value: stats?.totalMechanics || 0,
      icon: Users,
      gradient: 'from-orange-500 to-orange-600',
      change: `${stats?.availableMechanics || 0} available`,
      trend: 'up',
    },
  ]

  return (
    <DashboardLayout userName={user.name} userRole={user.role}>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary-600)] mb-1">
                Unified dashboard
              </p>
              <h1 className="text-3xl font-bold text-gradient">
                Fleet Control Center
              </h1>
              <p className="text-muted mt-1">
                Real-time overview of your fleet operations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge badge-primary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={stat.title} className="card hover-lift group">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      {stat.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                      {stat.trend === 'down' && <TrendingUp className="h-4 w-4 text-danger-500 rotate-180" />}
                      {stat.trend === 'stable' && <div className="h-4 w-4 rounded-full bg-[var(--warning-500)]" />}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm font-medium text-muted">{stat.title}</p>
                    <p className="text-xs text-subtle">{stat.change}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            {/* Recent Bookings */}
            <div className="card animate-slide-up">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[var(--primary-500)]" />
                      Recent Bookings
                    </h2>
                    <p className="text-sm text-muted mt-1">Latest service requests</p>
                  </div>
                  <Link href="/admin/bookings" className="btn btn-ghost btn-sm">
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 text-muted">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No bookings yet</p>
                    </div>
                  ) : (
                    bookings.map((booking, idx) => (
                      <div
                        key={booking.id}
                        className="group flex items-center justify-between p-4 rounded-xl hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                            <span className="text-sm font-semibold text-[var(--primary-700)]">
                              {booking.customerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-sm text-muted">
                              {booking.serviceType} • {new Date(booking.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${
                          booking.status === 'completed' ? 'badge-success' :
                          booking.status === 'in_progress' ? 'badge-primary' :
                          booking.status === 'confirmed' ? 'badge-primary' :
                          'badge-warning'
                        }`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Repair Requests */}
            <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[var(--warning-500)]" />
                      Repair Requests
                    </h2>
                    <p className="text-sm text-muted mt-1">Issues waiting for booking</p>
                  </div>
                  <Link href="/repairs" className="btn btn-ghost btn-sm">
                    Review queue →
                  </Link>
                </div>
                <div className="space-y-3">
                  {repairRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No repair requests yet</p>
                    </div>
                  ) : (
                    repairRequests.map((req, idx) => (
                      <div
                        key={req.id}
                        className="group flex items-center justify-between p-4 rounded-xl hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--warning-100)] flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-[var(--warning-600)]" />
                          </div>
                          <div>
                            <p className="font-medium">{req.driverName}</p>
                            <p className="text-sm text-muted">
                              {(req.aiCategory || 'General repair')} • {req.vehicleIdentifier || 'Vehicle not listed'} •{' '}
                              {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${
                          req.status === 'completed' ? 'badge-success' :
                          req.status === 'waiting_booking' ? 'badge-warning' :
                          req.status === 'scheduled' ? 'badge-primary' :
                          'badge-primary'
                        }`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Jobs Section */}
            <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-[var(--primary-500)]" />
                      Active Jobs
                    </h2>
                    <p className="text-sm text-muted mt-1">Top assignments across the fleet</p>
                  </div>
                  <Link href="/mechanic/jobs" className="btn btn-ghost btn-sm">
                    Open board →
                  </Link>
                </div>
                {jobs.length === 0 ? (
                  <div className="text-center py-12 text-muted">
                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No jobs {isMechanic ? 'assigned' : 'available'} yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.slice(0, 5).map((job, idx) => (
                      <div
                        key={job.id}
                        className="group flex items-center justify-between p-4 rounded-xl hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] flex items-center justify-center">
                            <Wrench className="h-5 w-5 text-[var(--primary-600)]" />
                          </div>
                          <div>
                            <p className="font-medium">Job #{job.id.slice(-6)}</p>
                            <p className="text-sm text-muted">
                              Priority: <span className="capitalize font-medium text-[var(--text-primary)]">{job.priority}</span>
                              {isAdmin && job.mechanicId && ` • Mechanic: ${job.mechanicId.slice(-6)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isMechanic && job.mechanicId === user.id && (
                            <span className="badge badge-primary">
                              Assigned to you
                            </span>
                          )}
                          <span className={`badge ${
                            job.status === 'completed' ? 'badge-success' :
                            job.status === 'in_progress' ? 'badge-warning' :
                            'badge-primary'
                          }`}>
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Operational Health */}
            <div className="card animate-slide-left">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--success-100)] to-[var(--success-200)] flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-[var(--success-600)]" />
                  </div>
                  <h2 className="text-lg font-semibold">Operational Health</h2>
                </div>
                
                {/* Communication Metrics */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Communication</h3>
                    {[
                      { label: 'SMS opt-in', value: '93%', color: 'var(--success-500)' },
                      { label: 'Delivery rate', value: '99.4%', color: 'var(--success-500)' },
                      { label: 'Opt-outs honored', value: '100%', color: 'var(--primary-500)' },
                    ].map((metric, idx) => (
                      <div key={metric.label} className="flex items-center justify-between">
                        <span className="text-sm text-muted">{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{metric.value}</span>
                          <div className="w-16 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{ 
                                width: metric.value,
                                backgroundColor: metric.color,
                                animationDelay: `${idx * 100}ms`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="divider" />
                  
                  {/* Fleet Status */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Fleet Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                        <p className="text-2xl font-bold">{stats?.vehiclesInService || 0}</p>
                        <p className="text-xs text-muted">In Service</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                        <p className="text-2xl font-bold">{stats?.availableMechanics || 0}</p>
                        <p className="text-xs text-muted">Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Performance - Mechanic Only */}
            {isMechanic && (
              <div className="card animate-slide-left" style={{ animationDelay: '200ms' }}>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-[var(--primary-600)]" />
                    </div>
                    <h2 className="text-lg font-semibold">My Performance</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[var(--success-50)] to-[var(--success-100)] border border-[var(--success-200)]">
                      <p className="text-2xl font-bold text-[var(--success-700)]">{myCompleted}</p>
                      <p className="text-xs text-[var(--success-600)] font-medium">Completed</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[var(--primary-50)] to-[var(--primary-100)] border border-[var(--primary-200)]">
                      <p className="text-2xl font-bold text-[var(--primary-700)]">{myCompletionRate}%</p>
                      <p className="text-xs text-[var(--primary-600)] font-medium">Completion</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[var(--warning-50)] to-[var(--warning-100)] border border-[var(--warning-200)]">
                      <p className="text-2xl font-bold text-[var(--warning-700)]">{myInProgress}</p>
                      <p className="text-xs text-[var(--warning-600)] font-medium">In Progress</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-[var(--bg-tertiary)] text-center">
                    <p className="text-xs text-muted">Total assigned jobs: {myAssigned}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

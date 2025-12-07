'use client'

import Link from 'next/link'
import { useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import QuickActions from '@/components/dashboard/QuickActions'
import { Calendar, CheckCircle, MessageSquare, Wrench, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react'
import { DashboardStats, RepairRequest } from '@/types'
import { queryKeys } from '@/lib/query-client'
import { StatsCardSkeleton, ListSkeleton } from '@/components/ui/loading-optimized'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import { useAuth } from '@/components/providers/AuthProvider'

// Remove local skeletons - using optimized versions from loading-optimized.tsx

export default function UnifiedDashboard() {
  const queryClient = useQueryClient()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  // Auth is handled by AuthProvider - it will redirect if not authenticated
  const authReady = isAuthenticated && !!user

  // Optimized query functions with better caching
  const statsQuery = useQuery<{ stats: DashboardStats }>({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      const data: { stats: DashboardStats; error?: string } = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load dashboard stats.')
      }
      return data
    },
    enabled: authReady,
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't need constant updates
    refetchOnMount: false, // Don't refetch if data exists
    select: useCallback((data: { stats: DashboardStats }) => data, [])
  })

  const jobsQuery = useQuery<{ jobs: any[] }, Error, any[]>({
    queryKey: ['dashboard-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs')
      const data: { jobs: any[]; error?: string } = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load jobs.')
      }
      return data
    },
    enabled: authReady,
    staleTime: 3 * 60 * 1000, // 3 minutes for jobs
    refetchOnMount: false, // Don't refetch if data exists
    select: useCallback((data: { jobs: any[] }) => data.jobs.slice(0, 5), []) // Limit to 5 jobs
  })

  const repairsQuery = useQuery<{ requests: RepairRequest[] }, Error, RepairRequest[]>({
    queryKey: ['dashboard-repair-requests'],
    queryFn: async () => {
      const res = await fetch('/api/repair-requests?limit=4')
      const data: { requests: RepairRequest[]; error?: string } = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load repair requests.')
      }
      return data
    },
    enabled: authReady,
    staleTime: 30 * 1000, // 30 seconds for repairs
    select: useCallback((data: { requests: RepairRequest[] }) => data.requests, [])
  })

  // Memoized computed values for better performance
  const computedData = useMemo(() => {
    const stats = statsQuery.data?.stats || null
    const jobs = jobsQuery.data || []
    const bookings = stats?.recentBookings || []
    const repairRequests = repairsQuery.data || []

    const isInitialLoading =
      (statsQuery.isLoading && !stats) ||
      (jobsQuery.isLoading && jobs.length === 0) ||
      (repairsQuery.isLoading && repairRequests.length === 0)

    const isRefetching = statsQuery.isFetching || jobsQuery.isFetching || repairsQuery.isFetching
    const firstError = [statsQuery.error, jobsQuery.error, repairsQuery.error].find(Boolean) as Error | undefined

    return {
      stats,
      jobs,
      bookings,
      repairRequests,
      isInitialLoading,
      isRefetching,
      firstError,
      showStatsSkeleton: !stats && (statsQuery.isLoading || isInitialLoading),
      showBookingsSkeleton: bookings.length === 0 && (statsQuery.isLoading || isInitialLoading)
    }
  }, [
    statsQuery.data, 
    jobsQuery.data, 
    repairsQuery.data,
    statsQuery.isLoading,
    jobsQuery.isLoading, 
    repairsQuery.isLoading,
    statsQuery.isFetching,
    jobsQuery.isFetching,
    repairsQuery.isFetching,
    statsQuery.error,
    jobsQuery.error,
    repairsQuery.error
  ])

  // Derived last updated time from queries
  const lastUpdated = useMemo(() => {
    const times = [
      statsQuery.dataUpdatedAt,
      jobsQuery.dataUpdatedAt,
      repairsQuery.dataUpdatedAt
    ].filter(Boolean) as number[]
    
    if (times.length === 0) return null
    return new Date(Math.max(...times))
  }, [statsQuery.dataUpdatedAt, jobsQuery.dataUpdatedAt, repairsQuery.dataUpdatedAt])

  const {
    stats,
    jobs,
    bookings,
    repairRequests,
    isInitialLoading,
    isRefetching,
    firstError,
    showStatsSkeleton,
    showBookingsSkeleton
  } = computedData
  const showRepairsSkeleton = repairRequests.length === 0 && (repairsQuery.isLoading || isInitialLoading)
  const showJobsSkeleton = jobs.length === 0 && (jobsQuery.isLoading || isInitialLoading)

  // Optimized refresh handler
  const handleRefresh = useCallback(() => {
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-jobs'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-repair-requests'] })
    ]).catch(console.warn)
  }, [queryClient])

  // Show loading state while auth is being checked
  if (authLoading || !authReady || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-secondary)]">
        <div className="card p-6 flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Loading dashboard...</p>
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
      title: 'Urgent Repairs',
      value: stats?.urgentRepairRequests || 0,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-red-600',
      change: 'Requires attention',
      trend: (stats?.urgentRepairRequests || 0) > 0 ? 'down' : 'stable',
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
      title: 'Maintenance Cost',
      value: `$${(stats?.totalMaintenanceCost || 0).toLocaleString()}`,
      icon: Wrench,
      gradient: 'from-blue-500 to-blue-600',
      change: 'Total spent',
      trend: 'stable',
    },
    {
      title: 'Pending Bookings',
      value: stats?.pendingBookings || 0,
      icon: Calendar,
      gradient: 'from-purple-500 to-purple-600',
      change: `${stats?.totalBookings || 0} total`,
      trend: 'up',
    },
  ]

  return (
    <DashboardLayout userName={user.name} userRole={user.role as 'admin' | 'mechanic'}>
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
              {isRefetching && (
                <span className="inline-flex items-center gap-2 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full bg-[var(--primary-500)] animate-ping" />
                  Updating
                </span>
              )}
              <button
                onClick={handleRefresh}
                className="btn btn-secondary btn-sm"
                disabled={isRefetching}
                aria-label="Refresh dashboard data"
                aria-busy={isRefetching}
              >
                {isRefetching ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 border-2 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin" />
                    Refreshing
                  </span>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted mt-2">
              Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {firstError && (
          <div className="card border border-[var(--danger-200)] bg-[var(--danger-50)] text-[var(--danger-700)]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">Some data could not be refreshed: {firstError.message}</p>
              <span className="text-xs text-[var(--text-secondary)]">Retry shortly</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
          {showStatsSkeleton
            ? Array.from({ length: 4 }).map((_, idx) => <StatsCardSkeleton key={idx} />)
            : statCards.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div 
                    key={stat.title} 
                    className="card hover-lift group"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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

        {/* Charts Section */}
        {!showStatsSkeleton && stats && (
          <DashboardCharts stats={stats} />
        )}

        {/* Quick Actions */}
        {isAdmin && <QuickActions />}

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
                  {showBookingsSkeleton ? (
                    <ListSkeleton rows={4} />
                  ) : bookings.length === 0 ? (
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
                  {showRepairsSkeleton ? (
                    <ListSkeleton rows={3} />
                  ) : repairRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No repair requests yet</p>
                    </div>
                  ) : (
                    repairRequests.map((req, idx) => {
                      const infoLine = [
                        req.vehicleIdentifier || 'Vehicle not listed',
                        req.division,
                        req.vehicleType,
                      ].filter(Boolean).join(' • ')

                      const tagLine = [
                        req.makeModel,
                        req.aiCategory || 'General repair',
                      ].filter(Boolean).join(' • ')

                      const incident = req.incidentDate
                        ? new Date(req.incidentDate).toLocaleDateString()
                        : undefined

                      return (
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
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{req.driverName || 'Unassigned'}</p>
                                {req.isImmediate && (
                                  <span className="badge badge-danger">Immediate</span>
                                )}
                                {req.urgency && (
                                  <span className={`badge ${
                                    req.urgency === 'critical' ? 'badge-danger' :
                                    req.urgency === 'high' ? 'badge-warning' :
                                    req.urgency === 'medium' ? 'badge-primary' : 'badge'
                                  }`}>
                                    {req.urgency}
                                  </span>
                                )}
                              </div>
                              {infoLine && (
                                <p className="text-sm text-muted">{infoLine}</p>
                              )}
                              <p className="text-xs text-subtle">
                                {tagLine}
                                {incident ? ` • Incident: ${incident}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${
                              req.status === 'completed' ? 'badge-success' :
                              req.status === 'waiting_booking' ? 'badge-warning' :
                              req.status === 'scheduled' ? 'badge-primary' :
                              'badge-primary'
                            }`}>
                              {req.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      )
                    })
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
                  {isMechanic ? (
                    <Link href="/mechanic/schedule" className="btn btn-ghost btn-sm">
                      View schedule →
                    </Link>
                  ) : (
                    <Link href="/repairs" className="btn btn-ghost btn-sm">
                      View repairs →
                    </Link>
                  )}
                </div>
                {showJobsSkeleton ? (
                  <ListSkeleton rows={3} />
                ) : jobs.length === 0 ? (
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
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Fleet Status Breakdown</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {stats?.vehiclesByStatus && Object.entries(stats.vehiclesByStatus).length > 0 ? (
                        Object.entries(stats.vehiclesByStatus).map(([status, count]) => (
                          <div key={status} className="p-3 rounded-lg bg-[var(--bg-tertiary)]">
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs text-muted capitalize">{status.replace('_', ' ')}</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4 text-muted text-sm">
                          No status data available
                        </div>
                      )}
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

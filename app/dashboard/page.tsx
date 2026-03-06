'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import QuickActions from '@/components/dashboard/QuickActions'
import { Car, Calendar, Users, CheckCircle, MessageSquare, Wrench, BarChart3, TrendingUp, AlertTriangle, Clock, X, Sparkles } from 'lucide-react'
import { DashboardStats, RepairRequest } from '@/types'
import { queryKeys, prefetchQueries } from '@/lib/query-client'
import { StatsCardSkeleton, ListSkeleton } from '@/components/ui/loading-optimized'
import DashboardCharts from '@/components/dashboard/DashboardCharts'

// Remove local skeletons - using optimized versions from loading-optimized.tsx

export default function UnifiedDashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const bootstrapUser = async () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'mechanic') {
          router.push('/login')
          return
        }
        setUser(parsedUser)
        setAuthReady(true)
        return
      }

      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) {
          router.push('/login')
          return
        }
        const { user: profile } = await res.json()
        if (profile.role !== 'admin' && profile.role !== 'mechanic') {
          router.push('/login')
          return
        }
        const normalizedUser = {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          name: profile.name,
        }
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        setUser(normalizedUser)
        setAuthReady(true)
      } catch (err) {
        router.push('/login')
      }
    }

    bootstrapUser()
  }, [router])

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

  // Temporary banner — expires 7 days after deploy (Feb 26, 2026)
  const BANNER_EXPIRY = new Date('2026-03-05T23:59:59')
  const bannerExpired = new Date() > BANNER_EXPIRY
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('banner-feb26-dismissed') === '1'
  })
  const dismissBanner = useCallback(() => {
    setBannerDismissed(true)
    localStorage.setItem('banner-feb26-dismissed', '1')
  }, [])
  const showBanner = !bannerExpired && !bannerDismissed

  if (!authReady || !user) {
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
      accent: 'border-l-red-500',
    },
    {
      title: 'Active Vehicles',
      value: stats?.activeVehicles || 0,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      change: `${stats?.vehiclesInService || 0} in service`,
      trend: 'up',
      accent: 'border-l-emerald-500',
    },
    {
      title: 'Maintenance Cost',
      value: `$${(stats?.totalMaintenanceCost || 0).toLocaleString()}`,
      icon: Wrench,
      gradient: 'from-amber-500 to-amber-600',
      change: 'Total spent',
      trend: 'stable',
      accent: 'border-l-amber-500',
    },
    {
      title: 'Pending Bookings',
      value: stats?.pendingBookings || 0,
      icon: Calendar,
      gradient: 'from-slate-500 to-slate-600',
      change: `${stats?.totalBookings || 0} total`,
      trend: 'up',
      accent: 'border-l-slate-400',
    },
  ]

  return (
    <DashboardLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6 sm:space-y-8">
        {/* New Fixes Banner */}
        {showBanner && (
          <div className="animate-fade-in relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl shadow-black/20">
            {/* Accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-cyan-400 to-blue-500" />
            {/* Subtle grid texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative flex items-start gap-4 px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex-shrink-0 mt-0.5 hidden sm:block">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 ring-1 ring-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-emerald-400 sm:hidden" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">What&apos;s new</span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-white/95 leading-snug">System improvements deployed</p>
                <div className="mt-2.5 flex flex-col gap-1.5">
                  {[
                    'My Bookings now shows scheduled bookings correctly',
                    'Repairs & Service Records optimized for mobile',
                    'Service reports visible in repair request details',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400/80 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={dismissBanner}
                className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  Fleet Overview
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] text-xs font-mono font-medium text-[var(--text-tertiary)]">
                  <Clock className="h-3 w-3" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm text-[var(--text-tertiary)]">
                  {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading data...'}
                </p>
                {isRefetching && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--primary-600)] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-500)] animate-pulse" />
                    Syncing
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="btn btn-secondary btn-sm touch-target self-start sm:self-auto"
              disabled={isRefetching}
              aria-label="Refresh dashboard data"
              aria-busy={isRefetching}
            >
              {isRefetching ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 border-2 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin" />
                  <span className="hidden sm:inline">Refreshing</span>
                </span>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>

        {firstError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--danger-200)] bg-[var(--danger-50)] text-[var(--danger-700)]">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm font-medium flex-1">Some data could not be refreshed: {firstError.message}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mobile-stats-scroll stagger">
          {showStatsSkeleton
            ? Array.from({ length: 4 }).map((_, idx) => <StatsCardSkeleton key={idx} />)
            : statCards.map((stat, idx) => {
                const Icon = stat.icon
                const isUrgent = stat.title === 'Urgent Repairs' && typeof stat.value === 'number' && stat.value > 0
                return (
                  <div
                    key={stat.title}
                    className={`relative overflow-hidden rounded-lg border-l-[3px] ${stat.accent} border border-[var(--border)] transition-all duration-200 group ${
                      isUrgent
                        ? 'bg-gradient-to-br from-red-50 to-[var(--surface)] hover:shadow-lg hover:shadow-red-500/10'
                        : 'bg-[var(--surface)] hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          isUrgent ? 'text-red-500' : 'text-[var(--text-tertiary)]'
                        }`} />
                        <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                          isUrgent ? 'text-red-500' : 'text-[var(--text-tertiary)]'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                      <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-none font-mono ${
                        isUrgent ? 'text-red-600' : 'text-[var(--text-primary)]'
                      }`}>
                        {stat.value}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">{stat.title}</p>
                    </div>
                  </div>
                )
              })}
        </div>

        {/* Charts */}
        {!showStatsSkeleton && stats && (
          <DashboardCharts stats={stats} />
        )}

        {/* Quick Actions */}
        {isAdmin && <QuickActions />}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-5 lg:col-span-2">
            {/* Recent Bookings */}
            <div className="card animate-slide-up" style={{ animationDelay: '0ms' }}>
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-[var(--primary-500)]" />
                    <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Recent Bookings</h2>
                  </div>
                  <Link href="/admin/bookings" className="text-xs font-semibold text-[var(--primary-600)] hover:text-[var(--primary-700)] transition-colors">
                    View all &rarr;
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {showBookingsSkeleton ? (
                  <div className="p-5"><ListSkeleton rows={4} /></div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-tertiary)]">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No bookings yet</p>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between px-5 py-3.5 sm:px-6 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary-100)] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[var(--primary-700)]">
                            {booking.customerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{booking.customerName}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {booking.serviceType} &middot; {new Date(booking.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className={`badge text-[10px] ${
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

            {/* Repair Requests */}
            <div className="card animate-slide-up" style={{ animationDelay: '80ms' }}>
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-[var(--warning-500)]" />
                    <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Repair Requests</h2>
                    {repairRequests.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--warning-50)] text-[var(--warning-600)] border border-[var(--warning-500)]/20">
                        {repairRequests.length}
                      </span>
                    )}
                  </div>
                  <Link href="/repairs" className="text-xs font-semibold text-[var(--primary-600)] hover:text-[var(--primary-700)] transition-colors">
                    Review queue &rarr;
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {showRepairsSkeleton ? (
                  <div className="p-5"><ListSkeleton rows={3} /></div>
                ) : repairRequests.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-tertiary)]">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No repair requests</p>
                  </div>
                ) : (
                  repairRequests.map((req) => {
                    const infoLine = [
                      req.vehicleIdentifier || 'Vehicle not listed',
                      req.division,
                      req.vehicleType,
                    ].filter(Boolean).join(' \u00b7 ')

                    const tagLine = [
                      req.makeModel,
                      req.aiCategory || 'General repair',
                    ].filter(Boolean).join(' \u00b7 ')

                    const incident = req.incidentDate
                      ? new Date(req.incidentDate).toLocaleDateString()
                      : undefined

                    const urgencyAccent = req.urgency === 'critical' ? 'border-l-red-500' :
                      req.urgency === 'high' ? 'border-l-orange-400' :
                      req.urgency === 'medium' ? 'border-l-yellow-400' : 'border-l-transparent'

                    return (
                      <div
                        key={req.id}
                        className={`flex items-center justify-between px-5 py-3.5 sm:px-6 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer border-l-[3px] ${urgencyAccent}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{req.driverName || 'Unassigned'}</p>
                            {req.isImmediate && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">Immediate</span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{infoLine}</p>
                          <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                            {tagLine}
                            {incident ? ` \u00b7 ${incident}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          {req.urgency && (
                            <span className={`hidden sm:inline text-[10px] font-semibold uppercase tracking-wide ${
                              req.urgency === 'critical' ? 'text-red-500' :
                              req.urgency === 'high' ? 'text-orange-500' :
                              req.urgency === 'medium' ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-tertiary)]'
                            }`}>
                              {req.urgency}
                            </span>
                          )}
                          <span className={`badge text-[10px] ${
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

            {/* Active Jobs */}
            <div className="card animate-slide-up" style={{ animationDelay: '160ms' }}>
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wrench className="h-4 w-4 text-[var(--primary-500)]" />
                    <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Active Jobs</h2>
                  </div>
                  {isMechanic ? (
                    <Link href="/mechanic/schedule" className="text-xs font-semibold text-[var(--primary-600)] hover:text-[var(--primary-700)] transition-colors">
                      Schedule &rarr;
                    </Link>
                  ) : (
                    <Link href="/repairs" className="text-xs font-semibold text-[var(--primary-600)] hover:text-[var(--primary-700)] transition-colors">
                      All repairs &rarr;
                    </Link>
                  )}
                </div>
              </div>
              {showJobsSkeleton ? (
                <div className="p-5"><ListSkeleton rows={3} /></div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-tertiary)]">
                  <Wrench className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No jobs {isMechanic ? 'assigned' : 'available'} yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {jobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between px-5 py-3.5 sm:px-6 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                          <Wrench className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Job #{job.id.slice(-6)}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            <span className="capitalize">{job.priority}</span> priority
                            {isAdmin && job.mechanicId && ` \u00b7 Mech. ${job.mechanicId.slice(-6)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {isMechanic && job.mechanicId === user.id && (
                          <span className="badge badge-primary text-[10px]">You</span>
                        )}
                        <span className={`badge text-[10px] ${
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

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-5">
            {/* Operational Health */}
            <div className="card animate-slide-left">
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-4 w-4 text-[var(--success-600)]" />
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Operational Health</h2>
                </div>
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                {/* Communication */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Communication</h3>
                  {[
                    { label: 'SMS opt-in', value: '93%', color: 'var(--success-500)' },
                    { label: 'Delivery rate', value: '99.4%', color: 'var(--success-500)' },
                    { label: 'Opt-outs honored', value: '100%', color: 'var(--primary-500)' },
                  ].map((metric, idx) => (
                    <div key={metric.label} className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">{metric.label}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{metric.value}</span>
                        <div className="w-14 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
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

                <div className="h-px bg-[var(--border)]" />

                {/* Fleet Status */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Fleet Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {stats?.vehiclesByStatus && Object.entries(stats.vehiclesByStatus).length > 0 ? (
                      Object.entries(stats.vehiclesByStatus).map(([status, count]) => (
                        <div key={status} className="p-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
                          <p className="text-xl font-extrabold text-[var(--text-primary)] tabular-nums">{count}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] font-medium capitalize leading-tight mt-0.5">{status.replace('_', ' ')}</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 text-[var(--text-tertiary)] text-xs">
                        No status data
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* My Performance - Mechanic Only */}
            {isMechanic && (
              <div className="card animate-slide-left" style={{ animationDelay: '100ms' }}>
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="h-4 w-4 text-[var(--primary-500)]" />
                    <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">My Performance</h2>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
                      <p className="text-2xl font-extrabold text-[var(--success-600)] tabular-nums">{myCompleted}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] font-medium mt-0.5">Done</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
                      <p className="text-2xl font-extrabold text-[var(--primary-600)] tabular-nums">{myCompletionRate}%</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] font-medium mt-0.5">Rate</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
                      <p className="text-2xl font-extrabold text-[var(--warning-600)] tabular-nums">{myInProgress}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] font-medium mt-0.5">Active</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] text-center mt-3">{myAssigned} total assigned</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

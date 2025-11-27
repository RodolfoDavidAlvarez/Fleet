'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Wrench, Clock, Calendar, Smartphone } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Job } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'

const statusVariant: Record<string, string> = {
  completed: 'badge-success',
  in_progress: 'badge-warning',
  scheduled: 'badge-primary',
  assigned: 'badge-primary',
  confirmed: 'badge-primary',
  pending: 'badge-warning',
  cancelled: 'badge-danger',
}

const priorityVariant: Record<string, string> = {
  urgent: 'badge-danger',
  high: 'badge-warning',
  medium: 'badge-primary',
  low: 'badge',
}

function JobCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)]" />
          <div className="space-y-2">
            <div className="w-28 h-4 bg-[var(--bg-tertiary)] rounded" />
            <div className="w-20 h-3 bg-[var(--bg-tertiary)] rounded" />
          </div>
        </div>
        <div className="w-24 h-6 bg-[var(--bg-tertiary)] rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-4 bg-[var(--bg-tertiary)] rounded" />
        ))}
      </div>
    </div>
  )
}

export default function JobsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [authReady, setAuthReady] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const copy = useMemo(
    () => ({
      header: 'Work orders',
      title: 'My jobs',
      subtitle: 'Tap-friendly cards, live statuses, mobile-ready.',
    }),
    []
  )

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
    setAuthReady(true)
  }, [router])

  const jobsUrl =
    user?.role === 'mechanic' ? `/api/jobs?mechanicId=${user.id}` : '/api/jobs'

  const {
    data: jobs = [],
    isLoading,
    isFetching,
    error,
  } = useQuery<Job[]>({
    queryKey: ['jobs', user?.id, user?.role],
    queryFn: async () => {
      const res = await fetch(jobsUrl)
      const data: { jobs?: Job[]; error?: string; details?: string } = await res.json()

      if (!res.ok) {
        if (data.details && data.details.includes('SUPABASE_SERVICE_ROLE_KEY')) {
          throw new Error('Database configuration error: Missing SUPABASE_SERVICE_ROLE_KEY. Please check server logs and .env.local file.')
        }
        throw new Error(data.error || 'Failed to load jobs. Please try again.')
      }

      return (data.jobs || []) as Job[]
    },
    enabled: !!user,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const loading = isLoading || (isFetching && jobs.length === 0)
  const errorMessage = error instanceof Error ? error.message : null

  // Pagination logic
  const totalPages = Math.ceil(jobs.length / itemsPerPage)
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return jobs.slice(startIndex, endIndex)
  }, [jobs, currentPage, itemsPerPage])

  if (!authReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="card p-6 flex items-center gap-3">
          <div className="h-6 w-6 border-2 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Preparing your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userName={user.name} userRole={user.role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary-600)]">
              {copy.header}
            </p>
            <h1 className="text-3xl font-bold text-gradient">{copy.title}</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{copy.subtitle}</p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-full text-sm font-semibold text-[var(--primary-700)] shadow-sm">
            <Smartphone className="h-4 w-4" />
            Mobile ready
          </div>
        </div>

        {errorMessage && (
          <div className="card border border-[var(--danger-200)] bg-[var(--danger-50)] text-[var(--danger-700)]">
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, idx) => (
              <JobCardSkeleton key={idx} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--bg-tertiary)] mb-3">
                  <Wrench className="h-6 w-6 text-[var(--text-secondary)]" />
                </div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">No jobs assigned yet</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  New work orders will appear here when assigned.
                </p>
              </div>
            ) : (
              <>
                {paginatedJobs.map((job) => (
                <div key={job.id} className="card p-6 hover-lift">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${
                          job.status === 'completed'
                            ? 'from-[var(--success-50)] to-[var(--success-100)]'
                            : job.status === 'in_progress'
                              ? 'from-[var(--warning-50)] to-[var(--warning-100)]'
                              : 'from-[var(--primary-50)] to-[var(--primary-100)]'
                        } border border-[var(--border)]`}
                      >
                        <Wrench
                          className={`h-6 w-6 ${
                            job.status === 'completed'
                              ? 'text-[var(--success-600)]'
                              : job.status === 'in_progress'
                                ? 'text-[var(--warning-600)]'
                                : 'text-[var(--primary-600)]'
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                          Job #{job.id.slice(-6)}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          Booking ID: {job.bookingId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${statusVariant[job.status] || 'badge'}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      <span className={`badge ${priorityVariant[job.priority] || 'badge'}`}>
                        {job.priority}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[var(--primary-600)]" />
                      {job.startTime ? formatDateTime(job.startTime) : 'Not started'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[var(--primary-600)]" />
                      {job.estimatedHours || 0} hours estimated
                    </div>
                    {job.totalCost && (
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)] font-semibold">$</span>
                        {job.totalCost.toFixed(2)} total
                      </div>
                    )}
                  </div>

                  {job.notes && (
                    <div className="mb-4 p-3 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
                      <p className="text-sm">{job.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button className="btn btn-secondary btn-sm">View details</button>
                    {job.status !== 'completed' && (
                      <button className="btn btn-primary btn-sm">Update status</button>
                    )}
                  </div>
                </div>
              ))}
                {/* Pagination */}
                {jobs.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={jobs.length}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

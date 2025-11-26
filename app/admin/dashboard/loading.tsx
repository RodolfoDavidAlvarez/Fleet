import Spinner from '@/components/ui/Spinner'

export default function AdminDashboardLoading() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-primary-50/60 via-white to-white">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 animate-fade-in">
          <Spinner size="lg" />
          <p className="text-sm font-semibold text-gray-700 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    </div>
  )
}

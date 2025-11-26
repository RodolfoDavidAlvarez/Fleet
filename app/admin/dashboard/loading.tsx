import Spinner from '@/components/ui/Spinner'

export default function AdminDashboardLoading() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3 text-gray-700">
          <Spinner size="lg" />
          <p className="text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    </div>
  )
}

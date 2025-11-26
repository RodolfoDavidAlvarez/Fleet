import Spinner from '@/components/ui/Spinner'

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="flex flex-col items-center space-y-4 text-gray-700">
        <Spinner size="lg" />
        <p className="text-sm font-medium">Loading FleetPro...</p>
      </div>
    </div>
  )
}

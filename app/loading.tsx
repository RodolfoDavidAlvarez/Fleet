import Spinner from '@/components/ui/Spinner'
import { Zap } from 'lucide-react'

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 soft-grid">
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-200 rounded-full blur-2xl opacity-50 animate-pulse-slow" />
          <div className="relative bg-gradient-to-br from-primary-100 to-primary-200 p-6 rounded-2xl shadow-xl">
            <Zap className="h-12 w-12 text-primary-700 animate-bounce-subtle" />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Spinner size="lg" />
          <p className="text-sm font-semibold text-gray-700 animate-pulse">Loading FleetPro...</p>
        </div>
      </div>
    </div>
  )
}

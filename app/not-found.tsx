import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="card-surface rounded-3xl p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary-600">404</h1>
            <h2 className="text-2xl font-bold text-gray-900">Page not found</h2>
            <p className="text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 inline-flex items-center justify-center gap-2 font-semibold"
            >
              <Home className="h-4 w-4" />
              Go home
            </Link>
            <Link
              href="/booking"
              className="px-6 py-3 rounded-lg border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 inline-flex items-center justify-center gap-2 font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Book service
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}






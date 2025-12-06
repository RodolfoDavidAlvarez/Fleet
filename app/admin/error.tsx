'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home, Settings } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin section error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6 border border-gray-200">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Admin Error</h1>
            <p className="text-gray-600">
              Something went wrong in the admin section.
            </p>
            {process.env.NODE_ENV === 'development' && error.message && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-4 font-mono">
                {error.message}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 inline-flex items-center justify-center gap-2 font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 inline-flex items-center justify-center gap-2 font-semibold"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { ArrowRight, Wrench, Shield, Calendar, MessageSquare } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-primary-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">FleetPro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/booking"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Book Service
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Modern Fleet
            <span className="text-primary-600"> Management</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your fleet operations with our comprehensive management system.
            Built for admins, mechanics, and customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-all transform hover:scale-105 inline-flex items-center justify-center"
            >
              Book a Service
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 border-2 border-primary-600 transition-all inline-flex items-center justify-center"
            >
              Admin Login
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Admin Dashboard</h3>
            <p className="text-gray-600">
              Complete fleet overview with analytics, vehicle management, and booking oversight.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Wrench className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Mechanic Dashboard</h3>
            <p className="text-gray-600">
              Job queue, schedule management, and real-time status updates for your team.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">SMS Integration</h3>
            <p className="text-gray-600">
              Automated SMS notifications for bookings, reminders, and status updates via Twilio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


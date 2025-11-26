import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import {
  ArrowRight,
  Wrench,
  Calendar,
  LogIn,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 soft-grid flex flex-col" style={{ minHeight: '100vh' }}>
      <nav className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-primary-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative h-10 w-auto flex items-center">
              <Image
                src="/images/AEC-Horizontal-Official-Logo-2020.png"
                alt="AGAVE ENVIRONMENTAL CONTRACTING, INC."
                width={140}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-sm font-bold text-slate-900 uppercase tracking-wide hidden lg:block">Fleet System</span>
          </Link>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Link href="/compliance" className="text-slate-700 hover:text-primary-700">
              SMS Compliance
            </Link>
            <Link href="/login" className="text-slate-700 hover:text-primary-700 hidden sm:inline-flex">
              Admin / Mechanic
            </Link>
            <Link
              href="/booking"
              className="btn-primary px-5 py-2.5 inline-flex items-center gap-2 text-sm"
            >
              Book Service
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              AGAVE ENVIRONMENTAL CONTRACTING, INC.
            </h1>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto">
              Full-service landscape company serving HOA, commercial, and development properties in Phoenix, Arizona
            </p>
          </div>
          
          {/* Company Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
            <div className="card-surface rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary-700">1,280</p>
              <p className="text-sm text-slate-600">Clients</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary-700">6,210</p>
              <p className="text-sm text-slate-600">Projects</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary-700">99</p>
              <p className="text-sm text-slate-600">Awards</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary-700">35</p>
              <p className="text-sm text-slate-600">Years</p>
            </div>
          </div>
        </section>

        {/* Quick Actions for Administrators */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Fleet Management System</h2>
            <p className="text-slate-600">Administrative dashboard and service booking</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link
              href="/login"
              className="card-hover tile p-8 text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogIn className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Admin Dashboard</h3>
              <p className="text-slate-600">Access vehicles, bookings, mechanics, and analytics</p>
            </Link>

            <Link
              href="/booking"
              className="card-hover tile p-8 text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Book Service</h3>
              <p className="text-slate-600">Schedule vehicle maintenance and repairs</p>
            </Link>

            <Link
              href="/repair"
              className="card-hover tile p-8 text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench className="h-8 w-8 text-primary-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Repair Request</h3>
              <p className="text-slate-600">Submit a repair request with photos</p>
            </Link>

            <div className="card-surface tile p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Contact</h3>
              <div className="space-y-2 text-slate-600">
                <p className="text-sm">1634 N. 19th Ave.</p>
                <p className="text-sm">Phoenix, AZ 85009</p>
                <p className="text-sm mt-3">
                  <Phone className="h-4 w-4 inline mr-1" />
                  602-254-1464
                </p>
                <p className="text-sm">
                  <Mail className="h-4 w-4 inline mr-1" />
                  info@agave-inc.com
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

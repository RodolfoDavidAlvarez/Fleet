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
    <div className="min-h-screen bg-[var(--bg-secondary)] pattern-gradient flex flex-col">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[var(--surface)]/80 border-b border-[var(--border)]">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="relative h-6 w-auto flex items-center">
                <Image
                  src="/images/AEC-Horizontal-Official-Logo-2020.png"
                  alt="AGAVE ENVIRONMENTAL CONTRACTING, INC."
                  width={120}
                  height={24}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xs font-bold text-[var(--primary-600)] uppercase tracking-wide">Fleet Management</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/compliance" className="btn btn-ghost btn-sm hidden md:inline-flex">
              SMS Compliance
            </Link>
            <Link href="/login" className="btn btn-ghost btn-sm">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
            <Link href="/booking" className="btn btn-primary">
              Book Service
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="container py-20 space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-8 animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
              <span className="text-gradient">AGAVE ENVIRONMENTAL</span><br />
              <span className="text-gradient">CONTRACTING, INC.</span>
            </h1>
            <p className="text-xl text-muted max-w-3xl mx-auto leading-relaxed">
              Full-service landscape company serving HOA, commercial, and development properties in Phoenix, Arizona
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/booking" className="btn btn-primary btn-lg">
                Book Service Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg">
                <LogIn className="h-5 w-5" />
                Access Dashboard
              </Link>
            </div>
          </div>
          
          {/* Company Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 stagger">
            {[
              { value: '1,280', label: 'Clients', gradient: 'from-blue-500 to-blue-600' },
              { value: '6,210', label: 'Projects', gradient: 'from-emerald-500 to-emerald-600' },
              { value: '99', label: 'Awards', gradient: 'from-purple-500 to-purple-600' },
              { value: '35', label: 'Years', gradient: 'from-orange-500 to-orange-600' }
            ].map((stat, idx) => (
              <div key={stat.label} className="card hover-lift text-center p-6">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-sm">+</span>
                </div>
                <p className="text-3xl font-bold text-gradient mb-1">{stat.value}</p>
                <p className="text-sm text-muted font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Fleet Management Services */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-gradient">Fleet Management System</span>
            </h2>
            <p className="text-lg text-muted">Comprehensive vehicle management, service booking, and maintenance tracking for your fleet operations</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                href: '/login',
                icon: LogIn,
                title: 'Admin Dashboard',
                description: 'Access vehicles, bookings, mechanics, and analytics',
                gradient: 'from-blue-500 to-blue-600',
                delay: '0ms'
              },
              {
                href: '/booking',
                icon: Calendar,
                title: 'Book Service',
                description: 'Schedule vehicle maintenance and repairs',
                gradient: 'from-emerald-500 to-emerald-600',
                delay: '100ms'
              },
              {
                href: '/repair',
                icon: Wrench,
                title: 'Repair Request',
                description: 'Submit a repair request with photos',
                gradient: 'from-purple-500 to-purple-600',
                delay: '200ms'
              }
            ].map((service) => {
              const Icon = service.icon
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="card hover-lift group animate-slide-up"
                  style={{ animationDelay: service.delay }}
                >
                  <div className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--primary-600)] transition-colors">{service.title}</h3>
                    <p className="text-muted leading-relaxed">{service.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
          
          {/* Contact Card */}
          <div className="max-w-2xl mx-auto">
            <div className="card-glass p-8 text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-xl">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4 text-muted">
                <div className="space-y-2">
                  <p className="font-medium">Address</p>
                  <p className="text-sm">1634 N. 19th Ave.</p>
                  <p className="text-sm">Phoenix, AZ 85009</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm font-medium">602-254-1464</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm font-medium">info@agave-inc.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

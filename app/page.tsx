import Link from 'next/link'
import { ArrowRight, Wrench, Shield, Calendar, MessageSquare, Smartphone, BarChart3, CheckCircle2 } from 'lucide-react'

const highlights = [
  { title: 'Admin Control', description: 'Full fleet visibility, status changes, and analytics in one secure console.', icon: Shield },
  { title: 'Mechanic Velocity', description: 'Job queues, priority flags, and mobile-first job cards for technicians.', icon: Wrench },
  { title: 'SMS with Consent', description: 'Twilio-powered confirmations and updates with built-in compliance.', icon: MessageSquare },
  { title: 'Live Booking', description: 'Real-time availability with fast, friendly booking on any device.', icon: Calendar },
]

const stack = ['Next.js 14 App Router', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Recharts', 'Twilio SMS']

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-primary-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold text-slate-900">FleetPro</span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700 font-semibold">v2 UI</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Link href="/compliance" className="text-slate-700 hover:text-primary-700">
              SMS Compliance
            </Link>
            <Link href="/login" className="text-slate-700 hover:text-primary-700 hidden sm:inline-flex">
              Admin / Mechanic
            </Link>
            <Link
              href="/booking"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 inline-flex items-center"
            >
              Book Service
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        <section className="grid gap-10 lg:grid-cols-[1.3fr_1fr] items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-primary-100 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-primary-600" />
              <span className="text-xs font-semibold text-primary-700">Modernized experience • Mobile ready</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-primary-700 tracking-[0.08em] uppercase">Fleet Management System</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
                Orchestrate bookings, vehicles, and crews without friction.
              </h1>
              <p className="text-lg text-slate-700 max-w-2xl">
                A cohesive system for admins, mechanics, and customers — with realtime dashboards, mobile-first job flows,
                and SMS built for compliance.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Link
                href="/booking"
                className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 inline-flex items-center justify-center"
              >
                Book a service
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl font-semibold border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 inline-flex items-center justify-center"
              >
                Open dashboards
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {stack.map((item) => (
                <div key={item} className="card-surface rounded-xl px-3 py-2 text-center text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Live health</p>
                <h3 className="text-3xl font-bold text-slate-900">99.99%</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-700">
                <Smartphone className="h-5 w-5" />
                Mobile-first
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-surface rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Vehicles</p>
                <h4 className="text-2xl font-semibold text-slate-900">342</h4>
                <p className="text-xs text-green-600 font-semibold">+12 serviced this week</p>
              </div>
              <div className="card-surface rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Active Jobs</p>
                <h4 className="text-2xl font-semibold text-slate-900">48</h4>
                <p className="text-xs text-primary-700 font-semibold">14 in progress</p>
              </div>
              <div className="card-surface rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Bookings today</p>
                <h4 className="text-2xl font-semibold text-slate-900">27</h4>
                <p className="text-xs text-slate-600">Auto-confirm with SMS</p>
              </div>
              <div className="card-surface rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Compliance</p>
                <h4 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                  100%
                  <Shield className="h-5 w-5 text-green-600" />
                </h4>
                <p className="text-xs text-slate-600">Opt-in + HELP/STOP baked in</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ title, description, icon: Icon }) => (
            <div key={title} className="card-surface rounded-2xl p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary-700" />
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
            </div>
          ))}
        </section>

        <section className="card-surface rounded-3xl p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Dashboards</p>
              <h2 className="text-2xl font-bold text-slate-900">Admin + mechanic flows that stay in sync</h2>
              <p className="text-slate-700">Analytics for leaders, simplified work orders for crews, and mobile cards for the field.</p>
            </div>
            <Link href="/login" className="inline-flex items-center text-primary-700 font-semibold">
              See the consoles
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-primary-50 p-5 border border-primary-100">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-5 w-5 text-primary-700" />
                <h4 className="font-semibold text-primary-900">Admin HQ</h4>
              </div>
              <p className="text-sm text-primary-800">
                Vehicles, bookings, mechanics, analytics, and SMS status baked into one view.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="h-5 w-5 text-slate-800" />
                <h4 className="font-semibold text-slate-900">Mechanic mobile</h4>
              </div>
              <p className="text-sm text-slate-700">
                Job cards that collapse on small screens, quick status updates, and schedules.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-5 w-5 text-slate-800" />
                <h4 className="font-semibold text-slate-900">Customer clarity</h4>
              </div>
              <p className="text-sm text-slate-700">
                Fast booking, consent-first SMS, and frictionless confirmations on any device.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

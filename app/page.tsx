import Link from 'next/link'
import {
  ArrowRight,
  Wrench,
  Shield,
  Calendar,
  MessageSquare,
  Smartphone,
  BarChart3,
  CheckCircle2,
  Zap,
  Gauge,
} from 'lucide-react'

const signals = [
  { title: '60s booking', hint: 'Consent captured', icon: Calendar },
  { title: 'Live dispatch', hint: 'Assign in one tap', icon: Wrench },
  { title: 'SMS compliant', hint: 'HELP/STOP baked in', icon: MessageSquare },
  { title: '99.99% uptime', hint: 'Ready for ops', icon: Shield },
]

const flow = [
  { title: 'Book', detail: 'Pick slot, capture consent, confirm instantly.', icon: Calendar },
  { title: 'Assign', detail: 'Route to a mechanic with capacity-aware queues.', icon: Wrench },
  { title: 'Update', detail: 'Dashboards + SMS stay in sync without extra clicks.', icon: MessageSquare },
]

const consoles = [
  {
    title: 'Admin console',
    blurb: 'Bookings, vehicles, mechanics, and SMS controls in one line of sight.',
    href: '/login',
    icon: BarChart3,
    tag: 'Ops lead',
  },
  {
    title: 'Mechanic lane',
    blurb: 'Mobile-first cards with quick status chips and a light job queue.',
    href: '/login',
    icon: Smartphone,
    tag: 'Crew',
  },
  {
    title: 'Compliance ready',
    blurb: 'Consent-first defaults with HELP/STOP language pre-wired.',
    href: '/compliance',
    icon: Shield,
    tag: 'Trust',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 soft-grid">
      <nav className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-primary-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-primary-700 font-semibold uppercase tracking-[0.14em]">FleetPro</p>
              <p className="text-sm font-semibold text-slate-900">Fast fleet control</p>
            </div>
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
        <section className="grid gap-10 lg:grid-cols-[1.25fr_1fr] items-center">
          <div className="space-y-6">
            <div className="pill">
              <CheckCircle2 className="h-4 w-4 text-primary-700" />
              Built to feel fast
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-primary-700 tracking-[0.14em] uppercase">Fleet system</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
                Keep vehicles, crews, and customers in motion.
              </h1>
              <p className="text-lg text-slate-700 max-w-2xl">
                Action-first screens, short copy, and mobile-friendly cards so everyone moves quicker.
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
              {signals.map(({ title, hint, icon: Icon }) => (
                <div key={title} className="tile px-3 py-3 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-primary-700" />
                    <span className="text-xs font-semibold text-primary-800">{title}</span>
                  </div>
                  <p className="text-xs text-slate-600">{hint}</p>
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
                <Gauge className="h-5 w-5" />
                Instant updates
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-surface rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Vehicles online</p>
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

        <section className="card-surface rounded-3xl p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">How it moves</p>
              <h2 className="text-2xl font-bold text-slate-900">Straightforward flow, zero fluff</h2>
              <p className="text-slate-700">Each step is a small, focused screen with smart defaults.</p>
            </div>
            <Link href="/booking" className="inline-flex items-center text-primary-700 font-semibold">
              Try the booking
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {flow.map(({ title, detail, icon: Icon }) => (
              <div key={title} className="rounded-2xl bg-white p-5 border border-gray-200 hover:border-primary-200 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-700" />
                  </div>
                  <h4 className="font-semibold text-slate-900">{title}</h4>
                </div>
                <p className="text-sm text-slate-700">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {consoles.map(({ title, blurb, icon: Icon, href, tag }) => (
            <Link
              key={title}
              href={href}
              className="tile p-5 hover:shadow-lg transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-primary-700 font-semibold">{tag}</p>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                </div>
              </div>
              <p className="text-sm text-slate-700 flex-1">{blurb}</p>
              <span className="mt-4 inline-flex items-center text-primary-700 font-semibold text-sm">
                Open
                <ArrowRight className="h-4 w-4 ml-1" />
              </span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}

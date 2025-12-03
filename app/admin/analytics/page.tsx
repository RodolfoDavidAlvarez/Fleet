'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from 'recharts'
import { BarChart3, Clock, ShieldCheck } from 'lucide-react'

const bookingsData = [
  { name: 'Mon', bookings: 22, completions: 18 },
  { name: 'Tue', bookings: 27, completions: 22 },
  { name: 'Wed', bookings: 30, completions: 25 },
  { name: 'Thu', bookings: 24, completions: 20 },
  { name: 'Fri', bookings: 36, completions: 30 },
  { name: 'Sat', bookings: 18, completions: 16 },
  { name: 'Sun', bookings: 14, completions: 12 },
]

const statusMix = [
  { name: 'Completed', value: 64 },
  { name: 'In Progress', value: 18 },
  { name: 'Pending', value: 9 },
  { name: 'Cancelled', value: 4 },
]

export default function AnalyticsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin' && parsedUser.role !== 'mechanic') {
      router.push('/login')
      return
    }
    setUser(parsedUser)
  }, [router])

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || 'admin'} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Analytics</p>
                <h1 className="text-3xl font-bold text-gray-900">Performance overview</h1>
                <p className="text-gray-600">Bookings, completions, and SMS compliance posture.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-primary-700">
                <ShieldCheck className="h-4 w-4" />
                SMS compliant
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-surface p-4 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Avg response</p>
                <p className="text-2xl font-semibold text-gray-900">12m</p>
                <p className="text-xs text-green-700 font-semibold">-3m vs last week</p>
              </div>
              <div className="card-surface p-4 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Completion rate</p>
                <p className="text-2xl font-semibold text-gray-900">92%</p>
                <p className="text-xs text-green-700 font-semibold">+5% vs last week</p>
              </div>
              <div className="card-surface p-4 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">SMS delivery</p>
                <p className="text-2xl font-semibold text-gray-900">99.4%</p>
                <p className="text-xs text-gray-600">Consent-first with HELP/STOP copy</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card-surface p-6 rounded-2xl lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Bookings vs completions</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bookingsData}>
                      <defs>
                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <Tooltip />
                      <Area type="monotone" dataKey="bookings" stroke="#0284c7" fillOpacity={1} fill="url(#colorBookings)" />
                      <Area type="monotone" dataKey="completions" stroke="#16a34a" fillOpacity={1} fill="url(#colorCompletions)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card-surface p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-primary-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Status mix</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusMix} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={90} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 8, 8]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

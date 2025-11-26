'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Calendar, Clock, MapPin } from 'lucide-react'

const schedule = [
  { day: 'Mon', job: 'Brake Service', time: '09:00', location: 'Bay 2' },
  { day: 'Mon', job: 'Diagnostic', time: '13:00', location: 'Bay 1' },
  { day: 'Tue', job: 'Oil Change', time: '10:00', location: 'Bay 3' },
  { day: 'Wed', job: 'Tire Rotation', time: '11:30', location: 'Bay 1' },
  { day: 'Thu', job: 'Engine Repair', time: '14:00', location: 'Bay 4' },
  { day: 'Fri', job: 'Inspection', time: '08:30', location: 'Mobile' },
]

export default function SchedulePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'mechanic') {
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
      <Sidebar role="mechanic" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Schedule</p>
              <h1 className="text-3xl font-bold text-gray-900">My week at a glance</h1>
              <p className="text-gray-600">Mobile-friendly cards for quick day planning.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedule.map((slot, idx) => (
                <div key={`${slot.day}-${idx}`} className="card-surface rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">{slot.day}</span>
                    <Clock className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{slot.job}</p>
                  <div className="flex items-center text-sm text-gray-700 gap-2">
                    <Calendar className="h-4 w-4" />
                    {slot.time}
                  </div>
                  <div className="flex items-center text-sm text-gray-700 gap-2">
                    <MapPin className="h-4 w-4" />
                    {slot.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

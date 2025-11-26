'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Car,
  Calendar,
  Users,
  BarChart3,
  Wrench,
  LogOut,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role: 'admin' | 'mechanic'
}

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/drivers', label: 'Drivers', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

const mechanicLinks = [
  { href: '/mechanic/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mechanic/jobs', label: 'My Jobs', icon: Wrench },
  { href: '/mechanic/schedule', label: 'Schedule', icon: Calendar },
]

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const links = role === 'admin' ? adminLinks : mechanicLinks

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div className="h-screen w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-[0.12em]">FleetPro</p>
              <p className="text-sm font-semibold text-slate-900">Fast control</p>
            </div>
          </div>
          <span className="pill text-[11px] px-2 py-1 bg-primary-50 border-primary-100 text-primary-800">
            {role}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-xl border transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-800 border-primary-100 shadow-sm'
                  : 'text-slate-700 border-transparent hover:border-slate-200 hover:bg-slate-50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

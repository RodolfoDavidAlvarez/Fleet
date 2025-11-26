'use client'

import Link from 'next/link'
import Image from 'next/image'
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

const unifiedLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
  { href: '/repairs', label: 'Repairs', icon: Wrench },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/drivers', label: 'Drivers', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/mechanic/jobs', label: 'My Jobs', icon: Wrench },
  { href: '/mechanic/schedule', label: 'Schedule', icon: Calendar },
]

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const links = unifiedLinks

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div className="h-screen w-64 bg-white/95 backdrop-blur-sm border-r border-slate-200/80 flex flex-col shadow-lg shadow-slate-900/5">
      <div className="p-6 border-b border-slate-200/80 bg-gradient-to-br from-white to-primary-50/30">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex flex-col gap-1 hover:opacity-80 transition-opacity">
            <div className="relative h-10 w-auto flex items-center">
              <Image
                src="/images/AEC-Horizontal-Official-Logo-2020.png"
                alt="AGAVE ENVIRONMENTAL CONTRACTING, INC."
                width={120}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Fleet System</p>
          </Link>
          <span className="pill text-[11px] px-2.5 py-1 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200 text-primary-800 shadow-sm">
            {role}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link, index) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-200 group',
                'animate-slide-up',
                isActive
                  ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-800 border-primary-200 shadow-md shadow-primary-500/10 scale-[1.02]'
                  : 'text-slate-700 border-transparent hover:border-primary-100 hover:bg-gradient-to-r hover:from-slate-50 hover:to-primary-50/30 hover:shadow-sm hover:scale-[1.01]'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon className={cn(
                'h-5 w-5 transition-transform duration-200',
                isActive ? 'text-primary-700 scale-110' : 'text-slate-500 group-hover:text-primary-600 group-hover:scale-110'
              )} />
              <span className={cn(
                'font-semibold transition-colors',
                isActive ? 'text-primary-900' : 'group-hover:text-primary-800'
              )}>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/80 bg-gradient-to-t from-white to-slate-50/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-700 border-2 border-slate-200 hover:border-red-200 hover:bg-red-50/50 hover:text-red-700 transition-all duration-200 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] group"
        >
          <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </div>
  )
}

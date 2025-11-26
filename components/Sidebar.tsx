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
  Settings,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role: 'admin' | 'mechanic'
}

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/admin/mechanics', label: 'Mechanics', icon: Users },
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
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Wrench className="h-6 w-6 text-primary-400" />
          <span className="text-xl font-bold">FleetPro</span>
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
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}


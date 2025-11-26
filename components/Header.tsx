'use client'

import { Bell, Search, User } from 'lucide-react'

interface HeaderProps {
  userName: string
  userRole: string
}

export default function Header({ userName, userRole }: HeaderProps) {
  return (
    <header className="bg-white/85 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <span className="hidden md:inline-flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-[0.12em]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Find vehicles, bookings, or mechanics"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span className="pill text-xs bg-primary-50 border-primary-100 text-primary-800">99.9% uptime</span>
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

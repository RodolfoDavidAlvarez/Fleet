'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bell, Search, User } from 'lucide-react'

interface HeaderProps {
  userName: string
  userRole: string
}

export default function Header({ userName, userRole }: HeaderProps) {
  return (
    <header className="glass border-b border-slate-200/80 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity mr-4">
        <div className="relative h-8 w-auto flex items-center">
          <Image
            src="/images/AEC-Horizontal-Official-Logo-2020.png"
            alt="AGAVE ENVIRONMENTAL CONTRACTING, INC."
            width={100}
            height={32}
            className="object-contain"
            priority
          />
        </div>
        <span className="text-sm font-bold text-slate-900 uppercase tracking-wide hidden md:block">Fleet System</span>
      </Link>
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <span className="hidden md:inline-flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-[0.12em] px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
          Live
        </span>
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
          <input
            type="text"
            placeholder="Find vehicles, bookings, or mechanics"
            className="input-field pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className="pill text-xs bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200 text-primary-800 shadow-sm">
          99.9% uptime
        </span>
        <button className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 group">
          <Bell className="h-5 w-5 group-hover:animate-bounce-subtle" />
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white shadow-sm animate-pulse"></span>
        </button>

        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200/80">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center shadow-sm ring-2 ring-primary-50 transition-all duration-200 hover:scale-105 hover:shadow-md">
            <User className="h-5 w-5 text-primary-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 capitalize font-medium">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

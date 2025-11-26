'use client'

import { Bell, Search, User, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  userName: string
  userRole: string
  onMenuClick?: () => void
}

export default function Header({ userName, userRole, onMenuClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="surface-primary border-b border-[var(--border)] h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden btn-ghost btn-icon"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search bar */}
        <div className="flex-1 max-w-2xl">
          <div className="input-group">
            <span className="input-group-icon input-group-icon-left">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search vehicles, bookings, mechanics..."
              className="input input-with-icon-left"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Status indicator */}
        <div className="hidden lg:flex items-center">
          <span className="badge badge-success animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            Operational
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn-ghost btn-icon relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-danger-500 rounded-full animate-bounce"></span>
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 card card-glass animate-slide-down">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                <div className="p-3 hover:bg-[var(--surface-hover)] rounded-lg cursor-pointer transition-colors">
                  <p className="text-sm font-medium">New booking request</p>
                  <p className="text-xs text-muted mt-1">Vehicle #1234 - 2 minutes ago</p>
                </div>
                <div className="p-3 hover:bg-[var(--surface-hover)] rounded-lg cursor-pointer transition-colors">
                  <p className="text-sm font-medium">Maintenance completed</p>
                  <p className="text-xs text-muted mt-1">Vehicle #5678 - 1 hour ago</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pl-3 hover:bg-[var(--surface-hover)] rounded-full transition-colors"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-muted capitalize">{userRole}</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)] rounded-full flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-white" />
            </div>
          </button>

          {/* User dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 card card-glass animate-slide-down">
              <div className="p-2">
                <button className="w-full text-left p-3 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-sm">
                  Profile Settings
                </button>
                <button className="w-full text-left p-3 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-sm">
                  Preferences
                </button>
                <div className="divider my-1"></div>
                <button className="w-full text-left p-3 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-sm text-danger-600">
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

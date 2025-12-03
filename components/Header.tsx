'use client'

import { Bell, User, Menu, CheckCircle, AlertCircle, Settings } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  userName: string
  userRole: string
  userEmail?: string
  onMenuClick?: () => void
}

export default function Header({ userName, userRole, userEmail, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'New booking request', detail: 'Vehicle #1234 • 2 minutes ago', unread: true },
    { id: 'n2', title: 'Maintenance completed', detail: 'Vehicle #5678 • 1 hour ago', unread: true },
    { id: 'n3', title: 'Driver updated documents', detail: 'Compliance portal • 3 hours ago', unread: false },
  ])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-danger-500 text-[10px] text-white flex items-center justify-center shadow">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 card card-glass animate-slide-down">
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[var(--primary-600)] hover:text-[var(--primary-700)] font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id)}
                    className="w-full text-left p-3 hover:bg-[var(--surface-hover)] rounded-lg transition-colors flex items-start gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${n.unread ? 'bg-[var(--primary-100)] text-[var(--primary-700)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                      {n.unread ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                      <p className="text-xs text-muted mt-1">{n.detail}</p>
                    </div>
                  </button>
                ))}
                {notifications.length === 0 && (
                  <div className="p-3 text-sm text-muted">You are all caught up.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-xs text-muted capitalize">{userRole}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)] rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              aria-label="User menu"
            >
              <User className="h-4 w-4 text-white" />
            </button>
            {/* Dropdown menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 card card-glass animate-slide-down shadow-xl z-20">
                  {/* User info section */}
                  {userEmail && (
                    <div className="p-3 border-b border-[var(--border)]">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{userName}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 break-all">{userEmail}</p>
                      <p className="text-xs text-muted capitalize mt-1">{userRole}</p>
                    </div>
                  )}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        router.push('/admin/settings')
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left"
                    >
                      <Settings className="h-4 w-4 text-[var(--text-secondary)]" />
                      <span className="text-sm text-[var(--text-primary)]">Settings</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

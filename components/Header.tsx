'use client'

import { Bell, Search, User, Menu, CheckCircle, AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  userName: string
  userRole: string
  onMenuClick?: () => void
}

export default function Header({ userName, userRole, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'New booking request', detail: 'Vehicle #1234 • 2 minutes ago', unread: true },
    { id: 'n2', title: 'Maintenance completed', detail: 'Vehicle #5678 • 1 hour ago', unread: true },
    { id: 'n3', title: 'Driver updated documents', detail: 'Compliance portal • 3 hours ago', unread: false },
  ])
  const [activeSuggestion, setActiveSuggestion] = useState(0)

  const searchIndex = useMemo(
    () => [
      { id: 'v1', label: 'Truck 12 • Brake pads due', type: 'vehicle' },
      { id: 'v2', label: 'Truck 44 • Oil change scheduled', type: 'vehicle' },
      { id: 'b1', label: 'Booking #B-1042 • Inspection', type: 'booking' },
      { id: 'b2', label: 'Booking #B-1048 • Tire rotation', type: 'booking' },
      { id: 'm1', label: 'Mechanic: John Smith • Available', type: 'mechanic' },
      { id: 'm2', label: 'Mechanic: Ana Rodriguez • In progress', type: 'mechanic' },
    ],
    []
  )

  const filteredSearch = useMemo(() => {
    if (!searchTerm) return searchIndex.slice(0, 4)
    return searchIndex
      .filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5)
  }, [searchIndex, searchTerm])

  useEffect(() => {
    setActiveSuggestion(0)
  }, [searchTerm])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  const handleSuggestionClick = (type: string) => {
    switch (type) {
      case 'vehicle':
        router.push('/admin/vehicles')
        break
      case 'booking':
        router.push('/admin/bookings')
        break
      case 'mechanic':
        router.push('/admin/drivers')
        break
      default:
        break
    }
    setShowSuggestions(false)
    setSearchTerm('')
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSearch.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion((prev) => Math.min(prev + 1, filteredSearch.length - 1))
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion((prev) => Math.max(prev - 1, 0))
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const item = filteredSearch[activeSuggestion]
      if (item) {
        handleSuggestionClick(item.type)
      }
    }

    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
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

        {/* Search bar */}
        <div className="flex-1 max-w-2xl relative">
          <div className="input-group">
            <span className="input-group-icon input-group-icon-left">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search vehicles, bookings, mechanics..."
              value={searchTerm}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="input input-with-icon-left pr-12"
            />
            {searchTerm && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  setSearchTerm('')
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Clear
              </button>
            )}
          </div>

          {showSuggestions && (
            <div className="absolute top-12 left-0 w-full card card-glass animate-slide-down shadow-xl">
              <div className="p-3 flex items-center justify-between text-xs text-muted uppercase tracking-[0.1em]">
                <span>Quick find</span>
                <span className="text-[var(--primary-600)] font-semibold">Live</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {filteredSearch.map((item, idx) => (
                  <button
                    key={item.id}
                    onMouseDown={() => handleSuggestionClick(item.type)}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors cursor-pointer ${
                      activeSuggestion === idx ? 'bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-semibold uppercase text-[var(--text-secondary)]">
                        {item.type.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                        <p className="text-xs text-[var(--text-secondary)] capitalize">{item.type}</p>
                      </div>
                    </div>
                    <span className="text-[var(--primary-600)] text-xs font-semibold">View</span>
                  </button>
                ))}
                {filteredSearch.length === 0 && (
                  <div className="px-4 py-3 text-sm text-[var(--text-secondary)]">No matches yet</div>
                )}
              </div>
            </div>
          )}
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
          <div className="w-9 h-9 bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)] rounded-full flex items-center justify-center shadow-sm">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}

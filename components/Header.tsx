'use client'

import { Bell, User, Menu, CheckCircle, AlertCircle, Settings, Users, Calendar, LogOut, Edit2, Bug } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BugReportDialog from './BugReportDialog'

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
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showBugReportDialog, setShowBugReportDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'New booking request', detail: 'Vehicle #1234 • 2 minutes ago', unread: true },
    { id: 'n2', title: 'Maintenance completed', detail: 'Vehicle #5678 • 1 hour ago', unread: true },
    { id: 'n3', title: 'Driver updated documents', detail: 'Compliance portal • 3 hours ago', unread: false },
  ])
  const [profileData, setProfileData] = useState({
    name: userName,
    email: userEmail || '',
    phone: ''
  })

  const unreadCount = notifications.filter((n) => n.unread).length

  // Load user data from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [])

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleLogout = async () => {
    try {
      // Call logout API endpoint for proper session cleanup
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.clear()
      
      // Force redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: still clear storage and redirect
      localStorage.clear()
      window.location.href = '/login'
    }
  }

  const handleProfileUpdate = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Get current user ID from localStorage
      const userData = localStorage.getItem('user')
      if (!userData) {
        throw new Error('User not found')
      }
      const user = JSON.parse(userData)

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Update localStorage with new data
      const updatedUser = { ...user, ...profileData }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSuccess('Profile updated successfully')
      setTimeout(() => {
        setSuccess(null)
        setShowProfileModal(false)
        // Refresh the page to reflect changes
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-3 -ml-2 rounded-lg text-white hover:bg-slate-800 active:bg-slate-800 transition-colors touch-manipulation"
          aria-label="Toggle menu"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 lg:gap-3">
        {/* Status indicator */}
        <div className="hidden lg:flex items-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Operational
          </span>
        </div>

        {/* Divider */}
        <div className="hidden lg:block h-6 w-px bg-slate-700" />

        {/* Bug Report Button */}
        <div className="relative">
          <button
            onClick={() => setShowBugReportDialog(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors relative group"
            aria-label="Report an issue"
            title="Report an issue"
          >
            <Bug className="h-5 w-5 transition-colors duration-200" />
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl animate-slide-down">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
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
                    className="w-full text-left p-3 hover:bg-slate-700/50 rounded-lg transition-colors flex items-start gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${n.unread ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                      {n.unread ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.detail}</p>
                    </div>
                  </button>
                ))}
                {notifications.length === 0 && (
                  <div className="p-3 text-sm text-slate-400">You are all caught up.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-slate-700" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold leading-tight text-white">{userName}</p>
            <p className="text-[11px] text-slate-400 capitalize">{userRole}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center cursor-pointer ring-2 ring-amber-500/30 hover:ring-amber-500/50 transition-all duration-200"
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
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl animate-slide-down z-20">
                  {/* User info section */}
                  {userEmail && (
                    <button
                      onClick={() => {
                        setShowProfileModal(true)
                        setShowUserMenu(false)
                      }}
                      className="w-full p-3 border-b border-slate-700 hover:bg-slate-700/50 transition-colors text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{userName}</p>
                          <p className="text-xs text-slate-400 mt-0.5 break-all">{userEmail}</p>
                          <p className="text-xs text-slate-500 capitalize mt-1">{userRole}</p>
                        </div>
                        <Edit2 className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  )}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        router.push('/admin/settings?tab=users')
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                    >
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-200">Users</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push('/admin/settings?tab=notifications')
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                    >
                      <Bell className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-200">Notification Recipients</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push('/admin/settings?tab=calendar')
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                    >
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-200">Calendar Settings</span>
                    </button>
                  </div>
                  {/* Logout button */}
                  <div className="p-2 border-t border-slate-700">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 rounded-lg transition-colors text-left group"
                    >
                      <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-400" />
                      <span className="text-sm text-slate-200 font-medium group-hover:text-red-400">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Edit Sidebar */}
      {showProfileModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[100] transition-opacity"
            onClick={() => {
              setShowProfileModal(false)
              setError(null)
              setSuccess(null)
              // Reset form data
              const userData = localStorage.getItem('user')
              if (userData) {
                const user = JSON.parse(userData)
                setProfileData({
                  name: user.name || '',
                  email: user.email || '',
                  phone: user.phone || ''
                })
              }
            }}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                  <button
                    onClick={() => {
                      setShowProfileModal(false)
                      setError(null)
                      setSuccess(null)
                      // Reset form data
                      const userData = localStorage.getItem('user')
                      if (userData) {
                        const user = JSON.parse(userData)
                        setProfileData({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || ''
                        })
                      }
                    }}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    disabled={saving}
                  >
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-slate-400">Update your personal information</p>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {error && (
                  <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg animate-fade-in">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-300 text-sm font-medium">{error}</p>
                    </div>
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-lg animate-fade-in">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-emerald-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-emerald-300 text-sm font-medium">{success}</p>
                    </div>
                  </div>
                )}

                {/* Profile Preview */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Current Profile</p>
                      <p className="text-lg font-bold text-white capitalize">{userRole}</p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-500 transition-all"
                      placeholder="Enter your full name"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">This name will be displayed across the application</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-500 transition-all"
                      placeholder="your.email@example.com"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Used for notifications and account recovery</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-slate-500 transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Optional - for SMS notifications and contact</p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-300">Profile Update</p>
                      <p className="text-xs text-amber-400/70 mt-1">Changes will be reflected immediately after saving. The page will refresh automatically.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-slate-800 bg-slate-950">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowProfileModal(false)
                      setError(null)
                      setSuccess(null)
                      // Reset form data
                      const userData = localStorage.getItem('user')
                      if (userData) {
                        const user = JSON.parse(userData)
                        setProfileData({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || ''
                        })
                      }
                    }}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-slate-300 bg-slate-800 border-2 border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileUpdate}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={saving || !profileData.name || !profileData.email}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bug Report Dialog */}
      <BugReportDialog
        isOpen={showBugReportDialog}
        onClose={() => setShowBugReportDialog(false)}
        onSuccess={() => {
          // Optionally refresh bug reports list or show success notification
        }}
      />
    </header>
  )
}

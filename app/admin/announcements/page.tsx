'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { 
  Bell, 
  XCircle,
  Megaphone,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'mechanic' | 'customer' | 'driver'
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNotificationForm, setShowNotificationForm] = useState(false)
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    recipientIds: [] as string[],
    recipientRoles: [] as string[],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    setUser(parsedUser)
    loadUsers()
    loadNotifications()
  }, [router])

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (!res.ok) throw new Error('Failed to load notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error('Error loading notifications:', err)
    }
  }

  const handleCreateNotification = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create notification')
      }
      await loadNotifications()
      setNotificationForm({
        title: '',
        message: '',
        type: 'info',
        recipientIds: [],
        recipientRoles: [],
      })
      setShowNotificationForm(false)
      showToast('Announcement created successfully', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create notification', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete notification')
      }
      await loadNotifications()
      showToast('Announcement deleted successfully', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete notification', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!user || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
                <p className="text-gray-600">Manage system-wide announcements and alerts</p>
              </div>
              <button
                onClick={() => setShowNotificationForm(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Megaphone className="w-4 h-4" />
                <span>New Announcement</span>
              </button>
            </div>


            {/* Announcements List */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No announcements yet</h3>
                        <p className="text-gray-500 mt-1">Create an announcement to notify users.</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                notification.type === 'error' ? 'bg-red-100 text-red-800' :
                                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                notification.type === 'success' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {notification.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>
                                {notification.recipient_roles?.length > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <span className="font-medium">Roles:</span>
                                    <span>{notification.recipient_roles.join(', ')}</span>
                                  </span>
                                )}
                                {notification.recipient_ids?.length > 0 && (
                                  <span className="ml-2">Users: {notification.recipient_ids.length}</span>
                                )}
                              </span>
                              <span>
                                {new Date(notification.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete announcement"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Create Notification Modal */}
      {showNotificationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Announcement</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  rows={4}
                  placeholder="Announcement message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send to Roles</label>
                <div className="space-y-2">
                  {['admin', 'mechanic', 'driver', 'customer'].map((role) => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationForm.recipientRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNotificationForm({
                              ...notificationForm,
                              recipientRoles: [...notificationForm.recipientRoles, role],
                            })
                          } else {
                            setNotificationForm({
                              ...notificationForm,
                              recipientRoles: notificationForm.recipientRoles.filter((r) => r !== role),
                            })
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send to Specific Users</label>
                <select
                  multiple
                  value={notificationForm.recipientIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                    setNotificationForm({ ...notificationForm, recipientIds: selected })
                  }}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  size={5}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple users</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNotificationForm(false)
                  setNotificationForm({
                    title: '',
                    message: '',
                    type: 'info',
                    recipientIds: [],
                    recipientRoles: [],
                  })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotification}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                disabled={saving || !notificationForm.title || !notificationForm.message}
              >
                {saving ? 'Creating...' : 'Send Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

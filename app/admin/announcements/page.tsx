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
  MessageSquare,
  Smartphone,
  Save,
  Edit,
  Trash2,
  Plus,
  Layout,
  Send,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'mechanic' | 'customer' | 'driver'
}

interface Template {
  id: string
  name: string
  title: string
  message: string
  type: string
  channel: string
  recipient_roles: string[]
  is_active: boolean
  use_count: number
  last_used_at: string | null
  created_at: string
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'templates'>('send')
  const [showNotificationForm, setShowNotificationForm] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    channel: 'in_app',
    recipientIds: [] as string[],
    recipientRoles: [] as string[],
    templateId: null as string | null,
  })
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    type: 'info',
    channel: 'in_app',
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
    loadTemplates()
  }, [router])

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error loading users:', err)
      showToast('Failed to load users', 'error')
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

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/announcement-templates')
      if (!res.ok) throw new Error('Failed to load templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err) {
      console.error('Error loading templates:', err)
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
        channel: 'in_app',
        recipientIds: [],
        recipientRoles: [],
        templateId: null,
      })
      setShowNotificationForm(false)
      showToast('Announcement sent successfully', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send announcement', 'error')
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

  const handleSaveTemplate = async () => {
    setSaving(true)
    try {
      const url = editingTemplate
        ? '/api/admin/announcement-templates'
        : '/api/admin/announcement-templates'

      const res = await fetch(url, {
        method: editingTemplate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate ? { ...templateForm, id: editingTemplate.id } : templateForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save template')
      }

      await loadTemplates()
      setTemplateForm({
        name: '',
        title: '',
        message: '',
        type: 'info',
        channel: 'in_app',
        recipientRoles: [],
      })
      setShowTemplateForm(false)
      setEditingTemplate(null)
      showToast(`Template ${editingTemplate ? 'updated' : 'created'} successfully`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save template', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/announcement-templates?id=${templateId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete template')
      }
      await loadTemplates()
      showToast('Template deleted successfully', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete template', 'error')
    } finally {
      setSaving(false)
    }
  }

  const useTemplate = (template: Template) => {
    setNotificationForm({
      ...notificationForm,
      title: template.title,
      message: template.message,
      type: template.type,
      channel: template.channel,
      recipientRoles: template.recipient_roles,
      templateId: template.id,
    })
    setShowNotificationForm(true)
  }

  const editTemplate = (template: Template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      title: template.title,
      message: template.message,
      type: template.type,
      channel: template.channel,
      recipientRoles: template.recipient_roles,
    })
    setShowTemplateForm(true)
  }

  const getSmsCharCount = (text: string) => {
    return text.length
  }

  const getSmsSegmentCount = (text: string) => {
    const length = text.length
    if (length === 0) return 0
    if (length <= 160) return 1
    return Math.ceil(length / 153)
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
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
                <p className="text-gray-600">Manage announcements with SMS and template support</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setEditingTemplate(null)
                    setTemplateForm({
                      name: '',
                      title: '',
                      message: '',
                      type: 'info',
                      channel: 'in_app',
                      recipientRoles: [],
                    })
                    setShowTemplateForm(true)
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Layout className="w-4 h-4" />
                  <span>New Template</span>
                </button>
                <button
                  onClick={() => setShowNotificationForm(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Send Announcement</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('send')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'send'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Quick Send</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'templates'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Layout className="w-4 h-4" />
                    <span>Templates ({templates.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <span>History ({notifications.length})</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Quick Send Tab */}
            {activeTab === 'send' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Send Announcement</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Use templates for faster sending, or create a custom announcement below.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.filter(t => t.is_active).slice(0, 6).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => useTemplate(template)}
                      className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${
                          template.channel === 'sms' ? 'bg-green-100 text-green-800' :
                          template.channel === 'both' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {template.channel === 'sms' && <Smartphone className="w-3 h-3" />}
                          {template.channel === 'both' && <><MessageSquare className="w-3 h-3" /><Smartphone className="w-3 h-3" /></>}
                          {template.channel === 'in_app' && <MessageSquare className="w-3 h-3" />}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{template.message}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>Used {template.use_count} times</span>
                        <span className="capitalize">{template.type}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setShowNotificationForm(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 text-gray-600 hover:text-primary-600 transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Create Custom Announcement</span>
                  </button>
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                {templates.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
                    <p className="text-gray-500 mb-4">Create templates to send announcements faster.</p>
                    <button
                      onClick={() => setShowTemplateForm(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Create Your First Template
                    </button>
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              template.type === 'error' ? 'bg-red-100 text-red-800' :
                              template.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              template.type === 'success' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {template.type}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${
                              template.channel === 'sms' ? 'bg-green-100 text-green-800' :
                              template.channel === 'both' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {template.channel === 'sms' && <><Smartphone className="w-3 h-3" /><span>SMS</span></>}
                              {template.channel === 'both' && <><MessageSquare className="w-3 h-3" /><Smartphone className="w-3 h-3" /><span>Both</span></>}
                              {template.channel === 'in_app' && <><MessageSquare className="w-3 h-3" /><span>In-App</span></>}
                            </span>
                            {!template.is_active && (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{template.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {template.recipient_roles.length > 0 && (
                              <span>Roles: {template.recipient_roles.join(', ')}</span>
                            )}
                            <span>Used {template.use_count} times</span>
                            {template.last_used_at && (
                              <span>Last used: {new Date(template.last_used_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => useTemplate(template)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Use template"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => editTemplate(template)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit template"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete template"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No announcements yet</h3>
                      <p className="text-gray-500 mt-1">Send your first announcement to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
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
                                {notification.channel && (
                                  <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${
                                    notification.channel === 'sms' ? 'bg-green-100 text-green-800' :
                                    notification.channel === 'both' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {notification.channel === 'sms' && <Smartphone className="w-3 h-3" />}
                                    {notification.channel === 'both' && <><MessageSquare className="w-3 h-3" /><Smartphone className="w-3 h-3" /></>}
                                    {notification.channel === 'in_app' && <MessageSquare className="w-3 h-3" />}
                                    <span className="capitalize">{notification.channel.replace('_', ' ')}</span>
                                  </span>
                                )}
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
                                {notification.sms_sent_count > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <Smartphone className="w-3 h-3" />
                                    <span>SMS sent: {notification.sms_sent_count}</span>
                                  </span>
                                )}
                                <span>{new Date(notification.created_at).toLocaleString()}</span>
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Send Notification Modal */}
      {showNotificationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Announcement</h3>
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
                {(notificationForm.channel === 'sms' || notificationForm.channel === 'both') && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      SMS: {getSmsCharCount(notificationForm.title + '\n\n' + notificationForm.message)} characters, {getSmsSegmentCount(notificationForm.title + '\n\n' + notificationForm.message)} segment(s)
                    </span>
                    {getSmsSegmentCount(notificationForm.title + '\n\n' + notificationForm.message) > 1 && (
                      <span className="text-yellow-600">Multiple segments will be charged separately</span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                  <select
                    value={notificationForm.channel}
                    onChange={(e) => setNotificationForm({ ...notificationForm, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  >
                    <option value="in_app">In-App Only</option>
                    <option value="sms">SMS Only</option>
                    <option value="both">Both (In-App + SMS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send to Roles</label>
                <div className="grid grid-cols-2 gap-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Send to Specific Users (Optional)</label>
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
                    channel: 'in_app',
                    recipientIds: [],
                    recipientRoles: [],
                    templateId: null,
                  })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotification}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                disabled={saving || !notificationForm.title || !notificationForm.message}
              >
                <Send className="w-4 h-4" />
                <span>{saving ? 'Sending...' : 'Send Announcement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  placeholder="e.g., Fleet Maintenance Alert"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={templateForm.message}
                  onChange={(e) => setTemplateForm({ ...templateForm, message: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  rows={4}
                  placeholder="Template message"
                />
                {(templateForm.channel === 'sms' || templateForm.channel === 'both') && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      SMS: {getSmsCharCount(templateForm.title + '\n\n' + templateForm.message)} characters, {getSmsSegmentCount(templateForm.title + '\n\n' + templateForm.message)} segment(s)
                    </span>
                    {getSmsSegmentCount(templateForm.title + '\n\n' + templateForm.message) > 1 && (
                      <span className="text-yellow-600">Consider shortening for single segment</span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                  <select
                    value={templateForm.channel}
                    onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  >
                    <option value="in_app">In-App Only</option>
                    <option value="sms">SMS Only</option>
                    <option value="both">Both (In-App + SMS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Roles</label>
                <div className="grid grid-cols-2 gap-2">
                  {['admin', 'mechanic', 'driver', 'customer'].map((role) => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={templateForm.recipientRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTemplateForm({
                              ...templateForm,
                              recipientRoles: [...templateForm.recipientRoles, role],
                            })
                          } else {
                            setTemplateForm({
                              ...templateForm,
                              recipientRoles: templateForm.recipientRoles.filter((r) => r !== role),
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
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTemplateForm(false)
                  setEditingTemplate(null)
                  setTemplateForm({
                    name: '',
                    title: '',
                    message: '',
                    type: 'info',
                    channel: 'in_app',
                    recipientRoles: [],
                  })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                disabled={saving || !templateForm.name || !templateForm.title || !templateForm.message}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Save Template')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

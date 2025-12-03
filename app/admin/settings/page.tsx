"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, Bell, CheckCircle, Clock, Send, Edit, Calendar, UserPlus } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "mechanic" | "customer" | "driver";
  phone?: string;
  approval_status: "pending_approval" | "approved";
  last_seen_at?: string;
  isOnline?: boolean;
  created_at: string;
  notify_on_repair?: boolean;
}

function AdminSettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Get active tab from URL, default to 'users'
  const tabParam = searchParams.get('tab');
  const activeTab: "users" | "notifications" | "calendar" = 
    (tabParam === 'calendar' || tabParam === 'notifications' || tabParam === 'users') 
      ? tabParam 
      : 'users';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [calendarSettings, setCalendarSettings] = useState({
    maxBookingsPerWeek: 5,
    startTime: "06:00",
    endTime: "14:00",
    slotDuration: 30,
    slotBufferTime: 0,
    workingDays: [1, 2, 3, 4, 5],
    advanceBookingWindow: 0,
    advanceBookingUnit: "days" as "hours" | "days",
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "driver",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    // Check approval status for admin access
    if (parsedUser.approval_status !== "approved") {
      router.push("/dashboard");
      return;
    }
    setUser(parsedUser);
    loadUsers();
    loadCalendarSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadCalendarSettings = async () => {
    try {
      const res = await fetch("/api/calendar/settings");
      const data = await res.json();
      if (data.settings) {
        setCalendarSettings({
          maxBookingsPerWeek: data.settings.maxBookingsPerWeek || 5,
          startTime: data.settings.startTime || "06:00",
          endTime: data.settings.endTime || "14:00",
          slotDuration: data.settings.slotDuration || 30,
          slotBufferTime: data.settings.slotBufferTime ?? 0,
          workingDays: data.settings.workingDays || [1, 2, 3, 4, 5],
          advanceBookingWindow: data.settings.advanceBookingWindow ?? 0,
          advanceBookingUnit: data.settings.advanceBookingUnit || "days",
        });
      }
    } catch (err) {
      console.error("Error loading calendar settings:", err);
    }
  };

  const handleSaveCalendarSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/calendar/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calendarSettings),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save calendar settings");
      }
      setSuccess("Calendar settings saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save calendar settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite user");
      }
      setSuccess(`Invitation sent to ${inviteForm.email}. They'll show up here as pending after they register.`);
      setShowInviteModal(false);
      setInviteForm({ email: "", role: "driver" });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setSaving(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateUser = async (
    userId: string, 
    updates: { role?: string; approval_status?: string; approvalStatus?: string; notifyOnRepair?: boolean }
  ) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: any = { userId };
      
      if (updates.role) {
        payload.role = updates.role;
      }
      if (updates.approvalStatus || updates.approval_status) {
        payload.approvalStatus = updates.approvalStatus || updates.approval_status;
      }
      if (typeof updates.notifyOnRepair === 'boolean') {
        payload.notifyOnRepair = updates.notifyOnRepair;
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }
      await loadUsers();
      setEditingUser(null);
      if (updates.notifyOnRepair !== undefined) {
        setSuccess("Notification preferences updated");
      } else {
        setSuccess("User updated successfully");
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async (userId: string, email: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/users/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send password reset");
      }
      setSuccess(`Password reset email sent to ${email}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send password reset");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "mechanic":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "driver":
        return "bg-green-100 text-green-800 border-green-200";
      case "customer":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getApprovalBadge = (status: string) => {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Pending Approval
      </span>
    );
  };

  if (!user || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Settings</h1>
              <p className="text-gray-600">Manage users and notifications</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => {
                    router.push('/admin/settings?tab=users', { scroll: false });
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "users"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Users</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    router.push('/admin/settings?tab=notifications', { scroll: false });
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "notifications"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notification Recipients</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    router.push('/admin/settings?tab=calendar', { scroll: false });
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "calendar"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Calendar Settings</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Users Management</h2>
                      <p className="text-sm text-gray-600 mt-1">Manage user accounts, roles, and approvals</p>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Invite User</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repair Alerts</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Online</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...users]
                        .sort((a, b) => {
                          // Sort pending users first
                          if (a.approval_status === "pending_approval" && b.approval_status !== "pending_approval") return -1;
                          if (a.approval_status !== "pending_approval" && b.approval_status === "pending_approval") return 1;
                          return 0;
                        })
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                <div className="text-sm text-gray-500">{u.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{getApprovalBadge(u.approval_status)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(u.role)}`}
                              >
                                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={u.notify_on_repair || false}
                                  onChange={(e) => handleUpdateUser(u.id, { notifyOnRepair: e.target.checked })}
                                  className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                                />
                                <span className="text-sm text-gray-600">SMS/Email</span>
                              </label>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {u.isOnline ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                  Online
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                                  Offline
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setEditingUser(u)}
                                  className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="Edit user"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handlePasswordReset(u.id, u.email)}
                                  className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Send password reset"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Calendar Settings Tab */}
            {activeTab === "calendar" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Booking Calendar Settings</h2>
                  <p className="text-sm text-gray-600 mt-1">Configure available time slots and booking limits</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Bookings Per Week</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={calendarSettings.maxBookingsPerWeek}
                      onChange={(e) =>
                        setCalendarSettings({
                          ...calendarSettings,
                          maxBookingsPerWeek: parseInt(e.target.value) || 5,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum number of bookings allowed per week (default: 5)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        value={calendarSettings.startTime}
                        onChange={(e) =>
                          setCalendarSettings({
                            ...calendarSettings,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                      />
                      <p className="text-xs text-gray-500 mt-1">Earliest booking time (default: 06:00)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="time"
                        value={calendarSettings.endTime}
                        onChange={(e) =>
                          setCalendarSettings({
                            ...calendarSettings,
                            endTime: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                      />
                      <p className="text-xs text-gray-500 mt-1">Latest booking time (default: 14:00)</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slot Duration (minutes)</label>
                    <select
                      value={calendarSettings.slotDuration}
                      onChange={(e) =>
                        setCalendarSettings({
                          ...calendarSettings,
                          slotDuration: parseInt(e.target.value) || 30,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                      <option value="120">120 minutes</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Duration of each booking slot (e.g., 30 minutes)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buffer Time Between Slots (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="5"
                      value={calendarSettings.slotBufferTime}
                      onChange={(e) =>
                        setCalendarSettings({
                          ...calendarSettings,
                          slotBufferTime: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Gap/buffer time between slots (like Calendly).
                      {calendarSettings.slotBufferTime > 0
                        ? ` Example: With ${calendarSettings.slotDuration}-min slots and ${calendarSettings.slotBufferTime}-min buffer, slots will be ${calendarSettings.slotDuration + calendarSettings.slotBufferTime} minutes apart.`
                        : " Set to 0 for back-to-back slots (no gap)."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
                    <div className="space-y-2">
                      {[
                        { value: 0, label: "Sunday" },
                        { value: 1, label: "Monday" },
                        { value: 2, label: "Tuesday" },
                        { value: 3, label: "Wednesday" },
                        { value: 4, label: "Thursday" },
                        { value: 5, label: "Friday" },
                        { value: 6, label: "Saturday" },
                      ].map((day) => (
                        <label key={day.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={calendarSettings.workingDays.includes(day.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCalendarSettings({
                                  ...calendarSettings,
                                  workingDays: [...calendarSettings.workingDays, day.value],
                                });
                              } else {
                                setCalendarSettings({
                                  ...calendarSettings,
                                  workingDays: calendarSettings.workingDays.filter((d) => d !== day.value),
                                });
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{day.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Days when bookings are available (default: Monday - Friday)</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Advance Booking Window</label>
                    <p className="text-xs text-gray-600 mb-3">
                      How far in advance users must book. For example, if set to 2 days, users can only book appointments 2 or more days in the
                      future.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="365"
                          value={calendarSettings.advanceBookingWindow}
                          onChange={(e) =>
                            setCalendarSettings({
                              ...calendarSettings,
                              advanceBookingWindow: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                        />
                        <p className="text-xs text-gray-500 mt-1">Number (e.g., 2)</p>
                      </div>
                      <div>
                        <select
                          value={calendarSettings.advanceBookingUnit}
                          onChange={(e) =>
                            setCalendarSettings({
                              ...calendarSettings,
                              advanceBookingUnit: e.target.value as "hours" | "days",
                            })
                          }
                          className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                        >
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Unit</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {calendarSettings.advanceBookingWindow === 0
                        ? "Users can book immediately (no advance notice required)"
                        : `Users must book at least ${calendarSettings.advanceBookingWindow} ${calendarSettings.advanceBookingUnit} in advance`}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSaveCalendarSettings}
                      disabled={saving}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Calendar Settings"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Recipients Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Notification Recipients</h2>
                    <p className="text-sm text-gray-600 mt-1">Select users who should receive system alerts and repair requests via SMS/Email.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receive Alerts</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users
                          .filter((u) => u.role === "admin" || u.role === "mechanic")
                          .map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                  <div className="text-sm text-gray-500">{u.email}</div>
                                  {u.phone && <div className="text-xs text-gray-400">{u.phone}</div>}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(u.role)}`}
                                >
                                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={u.notify_on_repair || false}
                                    onChange={(e) => handleUpdateUser(u.id, { notifyOnRepair: e.target.checked })}
                                    className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                                  />
                                  <span className="text-sm text-gray-600">{u.notify_on_repair ? "Enabled" : "Disabled"}</span>
                                </label>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Invite User</h3>
              <p className="text-sm text-gray-600 mt-1">Send an invitation email to a new user</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                >
                  <option value="admin">Admin</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="driver">Driver</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                disabled={saving || !inviteForm.email}
              >
                {saving ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <p className="text-sm text-gray-600 mt-1">
                {editingUser.name} ({editingUser.email})
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                >
                  <option value="admin">Admin</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="driver">Driver</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
                <select
                  value={editingUser.approval_status}
                  onChange={(e) => setEditingUser({ ...editingUser, approval_status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                >
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleUpdateUser(editingUser.id, {
                    role: editingUser.role,
                    approvalStatus: editingUser.approval_status,
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    }>
      <AdminSettingsPageContent />
    </Suspense>
  );
}

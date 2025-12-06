"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Plus, X, Mail, MessageSquare } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface NotificationType {
  id: string;
  name: string;
  channel: "sms" | "email";
  category: "driver" | "admin" | "system";
  description: string;
  templateEn?: string;
  templateEs?: string;
}

// Real notifications actually being sent in the codebase
const NOTIFICATIONS: NotificationType[] = [
  // Driver SMS Notifications
  {
    id: "sms_repair_submission",
    name: "Repair Request Submission",
    channel: "sms",
    category: "driver",
    description: "Sent to driver when they submit a repair request",
    templateEn: "Repair request received (#${details.requestId}). Your request has been submitted and will be reviewed soon.",
    templateEs: "Solicitud de reparación recibida (#${details.requestId}). Su solicitud ha sido enviada y será revisada pronto.",
  },
  {
    id: "sms_repair_booking_link",
    name: "Repair Booking Link",
    channel: "sms",
    category: "driver",
    description: "Sent to driver with booking link when repair is scheduled",
    templateEn: "Book your repair (#${details.requestId}): ${details.link}\\nIssue: ${details.issueSummary}",
    templateEs: "Agenda tu reparación (#${details.requestId}): ${details.link}\\nMotivo: ${details.issueSummary}",
  },
  {
    id: "sms_service_record_status",
    name: "Service Status Update",
    channel: "sms",
    category: "driver",
    description: "Sent to driver when service record status changes (completed, ready for pickup, etc.)",
    templateEn: "${driverName}, your repair request is completed and ready for pickup.",
    templateEs: "${driverName}, su solicitud de reparación está completada y lista para recoger.",
  },
  // Admin SMS Notifications
  {
    id: "sms_admin_new_repair",
    name: "New Repair Request Alert",
    channel: "sms",
    category: "admin",
    description: "Sent to admins when a new repair request is submitted",
  },
  // Driver Email Notifications
  {
    id: "email_repair_submission",
    name: "Repair Request Confirmation",
    channel: "email",
    category: "driver",
    description: "Sent to driver confirming repair request submission",
  },
  {
    id: "email_repair_booking_link",
    name: "Repair Booking Link",
    channel: "email",
    category: "driver",
    description: "Sent to driver with booking link and repair details",
  },
  // Admin Email Notifications
  {
    id: "email_admin_new_booking",
    name: "New Booking Alert",
    channel: "email",
    category: "admin",
    description: "Sent to admins when a new booking is created",
  },
  {
    id: "email_admin_new_repair",
    name: "New Repair Request Alert",
    channel: "email",
    category: "admin",
    description: "Sent to admins when a new repair request is submitted",
  },
  // System Email Notifications
  {
    id: "email_onboarding",
    name: "Admin Onboarding Invitation",
    channel: "email",
    category: "system",
    description: "Sent when inviting a new admin to join the system",
  },
  {
    id: "email_password_reset",
    name: "Password Reset",
    channel: "email",
    category: "system",
    description: "Sent when user requests a password reset",
  },
  {
    id: "email_account_approved",
    name: "Account Approved",
    channel: "email",
    category: "system",
    description: "Sent when an admin approves a user account",
  },
];

export function NotificationsSection() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [notificationSubTab, setNotificationSubTab] = useState<"admin" | "driver">("admin");
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateEdits, setTemplateEdits] = useState<Record<string, { en: string; es: string }>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Load admin users with phone numbers
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      return data.users || [];
    },
  });

  const adminUsers = (usersData || []).filter((user: User) => user.role === "admin");

  // Load notification assignments
  const {
    data: assignmentsData,
    refetch: refetchAssignments,
    isLoading: assignmentsLoading,
  } = useQuery({
    queryKey: ["notification-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notification-assignments");
      if (!res.ok) throw new Error("Failed to load assignments");
      const data = await res.json();
      console.log("Loaded notification assignments:", data.assignments);
      return data.assignments || {};
    },
  });

  // Load message templates
  const {
    data: templatesData,
    refetch: refetchTemplates,
    isLoading: templatesLoading,
  } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notification-templates");
      if (!res.ok) throw new Error("Failed to load templates");
      const data = await res.json();
      console.log("Loaded notification templates:", data.templates);
      return data.templates || {};
    },
  });

  const isLoading = usersLoading || assignmentsLoading || templatesLoading;

  const saveAssignment = useCallback(
    async (notificationType: string, adminUserIds: string[]) => {
      try {
        const res = await fetch("/api/admin/notification-assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationType, adminUserIds }),
        });
        if (!res.ok) throw new Error("Failed to save assignment");
        await refetchAssignments();
        setSuccess("Assignment saved successfully");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save assignment");
      }
    },
    [refetchAssignments]
  );

  const saveTemplate = useCallback(
    async (notificationId: string) => {
      try {
        setSaving(true);
        setError(null);
        const template = templateEdits[notificationId];
        if (!template) {
          throw new Error("No template to save");
        }
        const res = await fetch("/api/admin/notification-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationType: notificationId,
            messageEn: template.en,
            messageEs: template.es,
          }),
        });
        if (!res.ok) throw new Error("Failed to save template");
        await refetchTemplates();
        setSuccess("Template saved successfully");
        setEditingTemplate(null);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save template");
      } finally {
        setSaving(false);
      }
    },
    [templateEdits, refetchTemplates]
  );

  const addAdminToNotification = async (notificationId: string, adminId: string) => {
    const current = assignmentsData?.[notificationId] || [];
    await saveAssignment(notificationId, [...current, adminId]);
  };

  const removeAdminFromNotification = async (notificationId: string, adminId: string) => {
    const current = assignmentsData?.[notificationId] || [];
    await saveAssignment(
      notificationId,
      current.filter((id: string) => id !== adminId)
    );
  };

  const filteredNotifications = NOTIFICATIONS.filter((n) =>
    notificationSubTab === "admin" ? n.category === "admin" || n.category === "system" : n.category === "driver"
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
          <p className="text-sm text-gray-600 mt-1">Configure who receives notifications and customize message templates</p>
        </div>

        {(error || success) && (
          <div className={`mb-4 p-3 rounded-lg ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{error || success}</div>
        )}

        {isLoading && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">Loading notification settings...</p>
          </div>
        )}

        {/* Sub-tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setNotificationSubTab("admin")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                notificationSubTab === "admin"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Admin Notifications ({NOTIFICATIONS.filter((n) => n.category === "admin" || n.category === "system").length})
            </button>
            <button
              onClick={() => setNotificationSubTab("driver")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                notificationSubTab === "driver"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Driver Notifications ({NOTIFICATIONS.filter((n) => n.category === "driver").length})
            </button>
          </nav>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const isExpanded = expandedCard === notification.id;
            const assignedAdmins = assignmentsData?.[notification.id] || [];
            const template = templatesData?.[notification.id];

            return (
              <div key={notification.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Card Header */}
                <button
                  onClick={() => setExpandedCard(isExpanded ? null : notification.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    {notification.channel === "email" ? (
                      <Mail className="w-5 h-5 text-blue-500" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-green-500" />
                    )}
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{notification.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            notification.category === "driver"
                              ? "bg-purple-100 text-purple-800"
                              : notification.category === "admin"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {notification.category.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{notification.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.category === "admin" && assignedAdmins.length > 0 && (
                      <span className="text-sm text-gray-500">{assignedAdmins.length} assigned</span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${notification.channel === "email" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                    >
                      {notification.channel.toUpperCase()}
                    </span>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {notification.category === "admin" && (
                      <div className="space-y-4">
                        {/* Message Preview */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Message Preview</h5>
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
                              {notification.id === "sms_admin_new_repair" &&
                                "New repair request #[REQUEST_ID]\nDriver: [DRIVER_NAME] ([PHONE])\nUrgency: [URGENCY]"}
                              {notification.id === "email_admin_new_booking" &&
                                "New booking created:\n\nCustomer: [CUSTOMER_NAME]\nEmail: [CUSTOMER_EMAIL]\nPhone: [CUSTOMER_PHONE]\nService: [SERVICE_TYPE]\nDate: [DATE] at [TIME]\nVehicle: [VEHICLE_INFO]"}
                              {notification.id === "email_admin_new_repair" &&
                                "New repair request submitted:\n\nRequest ID: [REQUEST_ID]\nDriver: [DRIVER_NAME]\nPhone: [DRIVER_PHONE]\nEmail: [DRIVER_EMAIL]\nUrgency: [URGENCY]\nSummary: [SUMMARY]\nVehicle: [VEHICLE_ID]"}
                            </p>
                          </div>
                        </div>

                        {/* Assigned Admins */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Assigned Admins</h5>
                          <div className="space-y-2">
                            {assignedAdmins.length === 0 ? (
                              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
                                No admins assigned yet. Select an admin below to receive these notifications.
                              </div>
                            ) : (
                              assignedAdmins.map((adminId: string) => {
                                const admin = adminUsers.find((u: User) => u.id === adminId);
                                if (!admin) return null;
                                return (
                                  <div key={adminId} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                    <div>
                                      <p className="font-medium text-gray-900">{admin.name}</p>
                                      <p className="text-sm text-gray-600">{admin.email}</p>
                                      {admin.phone && <p className="text-sm text-gray-500">{admin.phone}</p>}
                                    </div>
                                    <button
                                      onClick={() => removeAdminFromNotification(notification.id, adminId)}
                                      className="text-red-600 hover:text-red-800 p-2"
                                      title="Remove admin"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                e.currentTarget.setAttribute("data-dropdown-top", String(rect.bottom + window.scrollY));
                                e.currentTarget.setAttribute("data-dropdown-left", String(rect.left + window.scrollX));
                                e.currentTarget.setAttribute("data-dropdown-width", String(rect.width));
                                setOpenDropdown(openDropdown === notification.id ? null : notification.id);
                              }}
                              className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-left text-sm font-medium text-gray-700 hover:border-primary-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors flex items-center justify-between"
                              id={`dropdown-button-${notification.id}`}
                            >
                              <span className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-primary-600" />
                                Add Admin
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-gray-500 transition-transform ${openDropdown === notification.id ? "rotate-180" : ""}`}
                              />
                            </button>

                            {openDropdown === notification.id &&
                              (() => {
                                const button = document.getElementById(`dropdown-button-${notification.id}`);
                                const rect = button?.getBoundingClientRect();
                                return (
                                  <>
                                    <div className="fixed inset-0 z-[100]" onClick={() => setOpenDropdown(null)} />
                                    <div
                                      className="fixed z-[101] bg-white border-2 border-gray-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
                                      style={{
                                        top: rect ? `${rect.bottom + 8}px` : "0px",
                                        left: rect ? `${rect.left}px` : "0px",
                                        width: rect ? `${rect.width}px` : "auto",
                                      }}
                                    >
                                      {adminUsers.filter((u: User) => !assignedAdmins.includes(u.id)).length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">No admins available</div>
                                      ) : (
                                        adminUsers
                                          .filter((u: User) => !assignedAdmins.includes(u.id))
                                          .map((admin: User) => (
                                            <button
                                              key={admin.id}
                                              type="button"
                                              onClick={() => {
                                                addAdminToNotification(notification.id, admin.id);
                                                setOpenDropdown(null);
                                              }}
                                              className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-primary-50"
                                            >
                                              <div className="font-medium text-gray-900 text-sm">{admin.name}</div>
                                              <div className="text-xs text-gray-600 mt-0.5">{admin.email}</div>
                                              {admin.phone && <div className="text-xs text-primary-600 mt-0.5 font-medium">📱 {admin.phone}</div>}
                                            </button>
                                          ))
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {notification.category === "driver" && notification.templateEn && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">Message Templates</h5>
                          {editingTemplate === notification.id ? (
                            <div className="flex gap-2">
                              <button onClick={() => setEditingTemplate(null)} className="btn btn-ghost btn-sm">
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  saveTemplate(notification.id);
                                }}
                                className="btn btn-primary btn-sm"
                                disabled={saving}
                              >
                                {saving ? "Saving..." : "Save"}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setEditingTemplate(notification.id)} className="btn btn-secondary btn-sm">
                              Edit
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">English</label>
                          <textarea
                            value={
                              editingTemplate === notification.id
                                ? (templateEdits[notification.id]?.en ?? template?.en ?? notification.templateEn)
                                : template?.en || notification.templateEn
                            }
                            onChange={(e) => {
                              if (editingTemplate === notification.id) {
                                setTemplateEdits({
                                  ...templateEdits,
                                  [notification.id]: {
                                    ...(templateEdits[notification.id] || template || { en: notification.templateEn, es: notification.templateEs }),
                                    en: e.target.value,
                                  },
                                });
                              }
                            }}
                            readOnly={editingTemplate !== notification.id}
                            className={`w-full p-3 border-2 rounded-lg text-sm font-mono ${
                              editingTemplate === notification.id
                                ? "bg-white border-primary-300 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                : "bg-gray-50 border-gray-300 text-gray-800"
                            }`}
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Spanish</label>
                          <textarea
                            value={
                              editingTemplate === notification.id
                                ? (templateEdits[notification.id]?.es ?? template?.es ?? notification.templateEs)
                                : template?.es || notification.templateEs
                            }
                            onChange={(e) => {
                              if (editingTemplate === notification.id) {
                                setTemplateEdits({
                                  ...templateEdits,
                                  [notification.id]: {
                                    ...(templateEdits[notification.id] || template || { en: notification.templateEn, es: notification.templateEs }),
                                    es: e.target.value,
                                  },
                                });
                              }
                            }}
                            readOnly={editingTemplate !== notification.id}
                            className={`w-full p-3 border-2 rounded-lg text-sm font-mono ${
                              editingTemplate === notification.id
                                ? "bg-white border-primary-300 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                : "bg-gray-50 border-gray-300 text-gray-800"
                            }`}
                            rows={4}
                          />
                        </div>
                      </div>
                    )}

                    {notification.category === "system" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900 font-medium mb-2">System Notification</p>
                        <p className="text-sm text-blue-700">
                          This notification is automatically sent by the system. It cannot be customized or assigned to specific admins.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

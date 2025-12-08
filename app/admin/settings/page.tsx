"use client";

import { useEffect, useState, Suspense, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { NotificationsSection } from "./notifications-section";
import { Users, Bell, CheckCircle, Clock, Send, Edit, Calendar, UserPlus, Trash2, Mail, ChevronDown, X, Plus, Search } from "lucide-react";
import { queryKeys } from "@/lib/query-client";

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
  admin_invited?: boolean;
  hasAuthAccount?: boolean;
}

function AdminSettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Get active tab from URL, default to 'users'
  const tabParam = searchParams.get("tab");
  const activeTab: "users" | "notifications" | "calendar" =
    tabParam === "calendar" || tabParam === "notifications" || tabParam === "users" ? tabParam : "users";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [showResendDialog, setShowResendDialog] = useState<User | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "admin", // Default to admin for admin onboarding
  });
  const [contactSearch, setContactSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);

  // Load users with React Query for caching
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to load users");
      }
      const data = await res.json();
      return data.users || [];
    },
    staleTime: 30 * 1000, // 30 seconds - refresh more frequently to update online status
    refetchOnMount: true, // Always refetch to get latest online status
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds to update online status
    placeholderData: (prev) => prev ?? [],
    retry: 1,
  });
  // Filter to show only admin users
  const adminUsers = (usersData || []).filter((user: User) => user.role === "admin");

  // Categorize notifications by recipient type
  const isAdminNotification = (id: string) => {
    return id.includes("admin") || id.includes("mechanic") || id.includes("password") || id.includes("invitation") || id.includes("account_approved");
  };

  const isDriverNotification = (id: string) => {
    return id.includes("repair") || id.includes("service_record") || id.includes("booking");
  };

  // Default message templates for driver notifications (matching actual code in lib/twilio.ts and lib/email.ts)
  const defaultDriverTemplates: Record<string, { en: string; es: string }> = {
    sms_repair_submission: {
      en: "Repair request received (#${details.requestId}). Your request has been submitted and will be reviewed soon.",
      es: "Solicitud de reparación recibida (#${details.requestId}). Su solicitud ha sido enviada y será revisada pronto.",
    },
    sms_repair_booking_link: {
      en: "Book your repair (#${details.requestId}): ${details.link}\nIssue: ${details.issueSummary}${details.suggestedSlot ? `\nSuggested: ${details.suggestedSlot}` : ''}",
      es: "Agenda tu reparación (#${details.requestId}): ${details.link}\nMotivo: ${details.issueSummary}${details.suggestedSlot ? `\nSugerencia: ${details.suggestedSlot}` : ''}",
    },
    sms_repair_completion: {
      en: "Repair completed (#${details.requestId}). ${details.summary}${details.totalCost ? `\nTotal: $${details.totalCost.toFixed(2)}` : ''}",
      es: "Reparación completada (#${details.requestId}). ${details.summary}${details.totalCost ? `\nTotal: $${details.totalCost.toFixed(2)}` : ''}",
    },
    sms_service_record_status: {
      en: "${driverName}, your repair request is completed and ready for pickup.",
      es: "${driverName}, su solicitud de reparación está completada y lista para recoger.",
    },
    email_repair_submission: {
      en: "Hello ${details.driverName},\n\nWe have received your repair request:\n\nRequest ID: ${details.requestId}\nSummary: ${details.summary}\nUrgency: ${details.urgency}\n\nWe will contact you soon.\n\nThank you for using FleetPro!",
      es: "Hola ${details.driverName},\n\nHemos recibido su solicitud de reparación:\n\nID de Solicitud: ${details.requestId}\nResumen: ${details.summary}\nUrgencia: ${details.urgency}\n\nNos pondremos en contacto con usted pronto.\n\nGracias por usar FleetPro!",
    },
    email_repair_booking_link: {
      en: "Hello ${details.driverName},\n\nPlease schedule your repair using the following link:\n\nRequest ID: ${details.requestId}\nIssue: ${details.issueSummary}\nSuggested Time: ${details.suggestedSlot}\n\n[Schedule Now] → ${details.link}",
      es: "Hola ${details.driverName},\n\nPor favor, agende su reparación usando el siguiente enlace:\n\nID de Solicitud: ${details.requestId}\nMotivo: ${details.issueSummary}\nSugerencia: ${details.suggestedSlot}\n\n[Agendar Ahora] → ${details.link}",
    },
    email_repair_completion: {
      en: "Hello ${details.driverName},\n\nYour repair has been completed:\n\nRequest ID: ${details.requestId}\nSummary: ${details.summary}\nTotal Cost: $${details.totalCost}\n\nThank you for using FleetPro!",
      es: "Hola ${details.driverName},\n\nSu reparación ha sido completada:\n\nID de Solicitud: ${details.requestId}\nResumen: ${details.summary}\nCosto Total: $${details.totalCost}\n\nGracias por usar FleetPro!",
    },
  };

  // Load notification assignments from database
  const { data: assignmentsData } = useQuery({
    queryKey: ["notification-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notification-assignments");
      if (!res.ok) throw new Error("Failed to load assignments");
      const data = await res.json();
      return data.assignments || {};
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load message templates from database
  const { data: templatesData } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notification-templates");
      if (!res.ok) throw new Error("Failed to load templates");
      const data = await res.json();
      return data.templates || {};
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize assignments and templates from database
  useEffect(() => {
    if (assignmentsData) {
      setNotificationAssignments(assignmentsData);
    }
  }, [assignmentsData]);

  useEffect(() => {
    if (templatesData) {
      // Merge with defaults for any missing templates
      setDriverMessageTemplates({ ...defaultDriverTemplates, ...templatesData });
    } else if (Object.keys(driverMessageTemplates).length === 0) {
      setDriverMessageTemplates(defaultDriverTemplates);
    }
  }, [templatesData]);

  // Define all notification types in the system
  const notificationTypes = [
    // Email Notifications
    {
      id: "email_booking_confirmation",
      name: "Booking Confirmation Email",
      type: "email",
      category: "booking",
      description: "Sent to customer when a new booking is created",
      channel: "email",
    },
    {
      id: "email_booking_reminder",
      name: "Booking Reminder Email",
      type: "email",
      category: "booking",
      description: "Reminder sent to customer before appointment",
      channel: "email",
    },
    {
      id: "email_booking_status_update",
      name: "Booking Status Update Email",
      type: "email",
      category: "booking",
      description: "Sent to customer when booking status changes",
      channel: "email",
    },
    {
      id: "email_job_completion",
      name: "Job Completion Email",
      type: "email",
      category: "booking",
      description: "Sent to customer when job is completed",
      channel: "email",
    },
    {
      id: "email_repair_submission",
      name: "Repair Request Submission Email",
      type: "email",
      category: "repair",
      description: "Sent to driver when repair request is submitted (Bilingual)",
      channel: "email",
    },
    {
      id: "email_repair_booking_link",
      name: "Repair Booking Link Email",
      type: "email",
      category: "repair",
      description: "Sent to driver with booking link when repair is scheduled (Bilingual)",
      channel: "email",
    },
    {
      id: "email_repair_completion",
      name: "Repair Completion Email",
      type: "email",
      category: "repair",
      description: "Sent to driver when repair is completed (Bilingual)",
      channel: "email",
    },
    {
      id: "email_admin_new_booking",
      name: "Admin Notification - New Booking",
      type: "email",
      category: "admin",
      description: "Sent to admins when a new booking is created",
      channel: "email",
    },
    {
      id: "email_admin_new_repair",
      name: "Admin Notification - New Repair Request",
      type: "email",
      category: "admin",
      description: "Sent to admins when a repair request is submitted",
      channel: "email",
    },
    {
      id: "email_mechanic_assignment",
      name: "Mechanic Assignment Email",
      type: "email",
      category: "admin",
      description: "Sent to mechanic when job is assigned",
      channel: "email",
    },
    {
      id: "email_password_reset",
      name: "Password Reset Email",
      type: "email",
      category: "system",
      description: "Sent when password reset is requested",
      channel: "email",
    },
    {
      id: "email_invitation",
      name: "Invitation Email (Admin Onboarding)",
      type: "email",
      category: "system",
      description: "Sent to new admin when invited to join",
      channel: "email",
    },
    {
      id: "email_account_approved",
      name: "Account Approved Email",
      type: "email",
      category: "system",
      description: "Sent when admin approves a user account",
      channel: "email",
    },
    // SMS Notifications
    {
      id: "sms_booking_confirmation",
      name: "Booking Confirmation SMS",
      type: "sms",
      category: "booking",
      description: "Sent to customer when a new booking is created",
      channel: "sms",
    },
    {
      id: "sms_booking_reminder",
      name: "Booking Reminder SMS",
      type: "sms",
      category: "booking",
      description: "Reminder sent to customer before appointment",
      channel: "sms",
    },
    {
      id: "sms_booking_status_update",
      name: "Booking Status Update SMS",
      type: "sms",
      category: "booking",
      description: "Sent to customer when booking status changes",
      channel: "sms",
    },
    {
      id: "sms_job_completion",
      name: "Job Completion SMS",
      type: "sms",
      category: "booking",
      description: "Sent to customer when job is completed",
      channel: "sms",
    },
    {
      id: "sms_repair_submission",
      name: "Repair Request Submission SMS",
      type: "sms",
      category: "repair",
      description: "Sent to driver when repair request is submitted (Bilingual)",
      channel: "sms",
    },
    {
      id: "sms_admin_new_repair",
      name: "Admin Notification SMS (Repair Request)",
      type: "sms",
      category: "admin",
      description: "Sent to admins when a repair request is submitted",
      channel: "sms",
    },
    {
      id: "sms_repair_booking_link",
      name: "Repair Booking Link SMS",
      type: "sms",
      category: "repair",
      description: "Sent to driver with booking link when repair is scheduled (Bilingual)",
      channel: "sms",
    },
    {
      id: "sms_repair_completion",
      name: "Repair Completion SMS",
      type: "sms",
      category: "repair",
      description: "Sent to driver when repair is completed (Bilingual)",
      channel: "sms",
    },
    {
      id: "sms_service_record_status",
      name: "Service Record Status Update SMS",
      type: "sms",
      category: "repair",
      description: "Sent to driver when service record status is updated (Bilingual)",
      channel: "sms",
    },
  ];

  // State to track which admins are assigned to each notification type
  const [notificationAssignments, setNotificationAssignments] = useState<Record<string, string[]>>({});
  // State to track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Save notification assignment to database
  const saveNotificationAssignment = useCallback(
    async (notificationType: string, adminUserIds: string[]) => {
      try {
        const res = await fetch("/api/admin/notification-assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationType, adminUserIds }),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to save assignment");
        }
        // Invalidate query to refresh
        queryClient.invalidateQueries({ queryKey: ["notification-assignments"] });
      } catch (err) {
        console.error("Error saving notification assignment:", err);
        setError(err instanceof Error ? err.message : "Failed to save assignment");
      }
    },
    [queryClient]
  );

  // Save message template to database
  const saveMessageTemplate = useCallback(
    async (notificationType: string, messageEn: string, messageEs: string) => {
      try {
        const res = await fetch("/api/admin/notification-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationType, messageEn, messageEs }),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to save template");
        }
        // Invalidate query to refresh
        queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
        return true;
      } catch (err) {
        console.error("Error saving message template:", err);
        setError(err instanceof Error ? err.message : "Failed to save template");
        return false;
      }
    },
    [queryClient]
  );
  // Sub-tab for notifications (admin vs driver)
  const [notificationSubTab, setNotificationSubTab] = useState<"admin" | "driver">("admin");
  // State for driver notification message templates
  const [driverMessageTemplates, setDriverMessageTemplates] = useState<Record<string, { en: string; es: string }>>({});
  // State for editing message templates
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  // Load calendar settings with React Query
  const { data: calendarSettingsData } = useQuery({
    queryKey: queryKeys.calendarSettings,
    queryFn: async () => {
      const res = await fetch("/api/calendar/settings");
      const data = await res.json();
      return (
        data.settings || {
          maxBookingsPerWeek: 5,
          startTime: "06:00",
          endTime: "14:00",
          slotDuration: 30,
          slotBufferTime: 0,
          workingDays: [1, 2, 3, 4, 5],
          advanceBookingWindow: 0,
          advanceBookingUnit: "days",
        }
      );
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes - settings rarely change
    refetchOnMount: false, // Don't refetch if data exists
  });
  // Initialize calendar settings state
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

  // Track if we've initialized from query data to prevent infinite loop
  const initializedRef = useRef<string | null>(null);

  // Update calendar settings when data loads - only once per data version
  useEffect(() => {
    if (calendarSettingsData) {
      // Create a stable key from the data to detect actual changes
      const dataKey = JSON.stringify({
        maxBookingsPerWeek: calendarSettingsData.maxBookingsPerWeek,
        startTime: calendarSettingsData.startTime,
        endTime: calendarSettingsData.endTime,
        slotDuration: calendarSettingsData.slotDuration,
        slotBufferTime: calendarSettingsData.slotBufferTime,
        workingDays: calendarSettingsData.workingDays,
        advanceBookingWindow: calendarSettingsData.advanceBookingWindow,
        advanceBookingUnit: calendarSettingsData.advanceBookingUnit,
      });

      // Only update if this is new data
      if (initializedRef.current !== dataKey) {
        initializedRef.current = dataKey;
        setCalendarSettings({
          maxBookingsPerWeek: calendarSettingsData.maxBookingsPerWeek || 5,
          startTime: calendarSettingsData.startTime || "06:00",
          endTime: calendarSettingsData.endTime || "14:00",
          slotDuration: calendarSettingsData.slotDuration || 30,
          slotBufferTime: calendarSettingsData.slotBufferTime ?? 0,
          workingDays: calendarSettingsData.workingDays || [1, 2, 3, 4, 5],
          advanceBookingWindow: calendarSettingsData.advanceBookingWindow ?? 0,
          advanceBookingUnit: calendarSettingsData.advanceBookingUnit || "days",
        });
      }
    }
  }, [calendarSettingsData]);

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

    // Send heartbeat to update online status
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/auth/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parsedUser.id }),
        });
      } catch (error) {
        // Silently fail - heartbeat is not critical
      }
    };

    // Send heartbeat immediately and then every 2 minutes
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 2 * 60 * 1000);

    return () => clearInterval(heartbeatInterval);
  }, [router]);

  // Mutation for saving calendar settings
  const saveCalendarSettingsMutation = useMutation({
    mutationFn: async (settings: typeof calendarSettings) => {
      const res = await fetch("/api/calendar/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save calendar settings");
      }
      return res.json();
    },
    onSuccess: async (responseData) => {
      // Reset initialization flag so new data can be loaded after save
      initializedRef.current = null;
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendarSettings });
      await queryClient.refetchQueries({ queryKey: queryKeys.calendarSettings });
      // Also update local state immediately with the response data
      if (responseData?.settings) {
        setCalendarSettings({
          maxBookingsPerWeek: responseData.settings.maxBookingsPerWeek ?? 5,
          startTime: responseData.settings.startTime || "06:00",
          endTime: responseData.settings.endTime || "14:00",
          slotDuration: responseData.settings.slotDuration ?? 30,
          slotBufferTime: responseData.settings.slotBufferTime ?? 0,
          workingDays: responseData.settings.workingDays || [1, 2, 3, 4, 5],
          advanceBookingWindow: responseData.settings.advanceBookingWindow ?? 0,
          advanceBookingUnit: responseData.settings.advanceBookingUnit || "days",
        });
      }
      setSuccess("Calendar settings saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to save calendar settings");
    },
  });

  const handleSaveCalendarSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await saveCalendarSettingsMutation.mutateAsync(calendarSettings);
    } finally {
      setSaving(false);
    }
  };

  // Search for existing contacts
  const handleContactSearch = useCallback(async (query: string) => {
    setContactSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search through all users (not just admins)
      const allUsers = usersData || [];
      const results = allUsers.filter((u: User) =>
        u.role !== 'admin' && // Exclude existing admins
        (u.name?.toLowerCase().includes(query.toLowerCase()) ||
         u.email?.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5); // Limit to 5 results
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [usersData]);

  const handleSelectContact = (contact: User) => {
    setSelectedContact(contact);
    setInviteForm({ ...inviteForm, email: contact.email });
    setContactSearch("");
    setSearchResults([]);
  };

  const handleInviteUser = () => {
    // Show confirmation dialog first
    if (!inviteForm.email.trim()) {
      setError("Please enter an email address");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmSendInvitation = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    setShowConfirmDialog(false);

    try {
      // If promoting an existing user, update their role first
      if (selectedContact) {
        const updateRes = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedContact.id, role: "admin" }),
        });
        if (!updateRes.ok) {
          const updateData = await updateRes.json();
          throw new Error(updateData.error || "Failed to update user role");
        }
      }

      // Send invitation email
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inviteForm, role: "admin" }), // Force admin role
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send onboarding email");
      }

      const successMsg = selectedContact
        ? `${selectedContact.name} has been promoted to Admin. Onboarding email sent to ${inviteForm.email}.`
        : `Onboarding email sent to ${inviteForm.email}. They'll appear here for approval after they register.`;

      setSuccess(successMsg);
      setShowInviteModal(false);
      setInviteForm({ email: "", role: "admin" });
      setSelectedContact(null);
      setContactSearch("");
      setSearchResults([]);
      refetchUsers(); // Refresh the list
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send onboarding email");
    } finally {
      setSaving(false);
    }
  };

  // Mutation for updating users
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
  });

  const handleUpdateUser = useCallback(
    async (userId: string, updates: { role?: string; approval_status?: string; approvalStatus?: string; notifyOnRepair?: boolean }) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        const payload: any = {};

        if (updates.role) {
          payload.role = updates.role;
        }
        if (updates.approvalStatus || updates.approval_status) {
          payload.approvalStatus = updates.approvalStatus || updates.approval_status;
        }
        if (typeof updates.notifyOnRepair === "boolean") {
          payload.notifyOnRepair = updates.notifyOnRepair;
        }

        await updateUserMutation.mutateAsync({ userId, updates: payload });
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
    },
    [updateUserMutation]
  );

  const handleResendOnboarding = async () => {
    if (!showResendDialog || !resendEmail.trim()) {
      setError("Please enter a valid email address");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim(), role: "admin" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send onboarding email");
      }

      setSuccess(`Onboarding email sent to ${resendEmail.trim()}`);
      setShowResendDialog(null);
      setResendEmail("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send onboarding email");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (!userToDelete) return;

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setSuccess(`Admin ${userToDelete.name} has been deleted successfully.`);
      setShowDeleteDialog(null);
      refetchUsers(); // Refresh the list
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleting(false);
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

  const getAccountStatusBadge = (user: User) => {
    // Check if user has an auth account
    if (!user.hasAuthAccount) {
      // User doesn't have an account yet - show "Invitation Sent" if invited
      if (user.admin_invited) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Send className="w-3 h-3 mr-1" />
            Invitation Sent
          </span>
        );
      }
      // Not invited yet - show "No Account"
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          <Clock className="w-3 h-3 mr-1" />
          No Account
        </span>
      );
    }

    // User has an auth account - check approval status
    if (user.approval_status === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }

    // Has account but pending approval
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Pending Approval
      </span>
    );
  };

  if (!user || usersLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} />
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
                    router.push("/admin/settings?tab=users", { scroll: false });
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "users"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>admin</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    router.push("/admin/settings?tab=notifications", { scroll: false });
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
                    router.push("/admin/settings?tab=calendar", { scroll: false });
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

            {/* Admin Users Tab */}
            {activeTab === "users" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Admin Management</h2>
                      <p className="text-sm text-gray-600 mt-1">Manage admin accounts and send onboarding invitations</p>
                    </div>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Send Onboarding Email to New Admin</span>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Online</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersError ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <div className="text-red-600 mb-2">
                              <p className="font-medium">Error loading users</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {usersError instanceof Error ? usersError.message : "Failed to load users"}
                              </p>
                            </div>
                            <button
                              onClick={() => refetchUsers()}
                              className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                            >
                              Retry
                            </button>
                          </td>
                        </tr>
                      ) : adminUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="font-medium">No admins found</p>
                            <p className="text-sm mt-1">Admins will appear here once they register after receiving an invitation</p>
                          </td>
                        </tr>
                      ) : (
                        [...adminUsers]
                          .sort((a, b) => {
                            // Priority: 1. Invitation Sent (no account), 2. Pending Approval, 3. Active
                            const getPriority = (user: User) => {
                              if (!user.hasAuthAccount && user.admin_invited) return 0; // Invitation Sent
                              if (!user.hasAuthAccount) return 1; // No Account
                              if (user.approval_status === "pending_approval") return 2; // Pending Approval
                              return 3; // Active
                            };
                            return getPriority(a) - getPriority(b);
                          })
                          .map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                  <div className="text-sm text-gray-500">{u.email}</div>
                                  {u.phone && <div className="text-sm text-gray-400 mt-1">{u.phone}</div>}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{getAccountStatusBadge(u)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingRoleId === u.id ? (
                                  <select
                                    value={u.role}
                                    onChange={(e) => {
                                      handleUpdateUser(u.id, { role: e.target.value });
                                      setEditingRoleId(null);
                                    }}
                                    onBlur={() => setEditingRoleId(null)}
                                    autoFocus
                                    className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="mechanic">Mechanic</option>
                                    <option value="driver">Driver</option>
                                    <option value="customer">Customer</option>
                                  </select>
                                ) : (
                                  <span
                                    onClick={() => setEditingRoleId(u.id)}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(u.role)} cursor-pointer hover:opacity-80 transition-opacity`}
                                    title="Click to edit role"
                                  >
                                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {u.isOnline ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                    Online
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                                    Offline
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setShowResendDialog(u);
                                      setResendEmail(u.email);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Resend onboarding email"
                                    disabled={saving}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteDialog(u)}
                                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete admin"
                                    disabled={deleting}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
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
            {activeTab === "notifications" && <NotificationsSection />}
          </div>
        </main>
        <Footer />
      </div>

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Onboarding Email to New Admin</h3>
              <p className="text-sm text-gray-600 mt-1">Search for an existing contact or enter a new email address</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Search existing contacts */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Existing Contacts</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => handleContactSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="Search by name or email..."
                  />
                </div>
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{contact.name}</p>
                            <p className="text-sm text-gray-500">{contact.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(contact.role)}`}>
                            {contact.role}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searching && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    Searching...
                  </div>
                )}
                {contactSearch.length >= 2 && searchResults.length === 0 && !searching && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No contacts found
                  </div>
                )}
              </div>

              {/* Selected Contact Info */}
              {selectedContact && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedContact.name}</p>
                      <p className="text-sm text-gray-600">{selectedContact.email}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Current role: <span className="font-medium">{selectedContact.role}</span> → Will be promoted to <span className="font-medium">Admin</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedContact(null);
                        setInviteForm({ ...inviteForm, email: "" });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Email Entry */}
              {!selectedContact && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Or Enter Email Manually</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                    placeholder="admin@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">They will receive an email with a link to register as an admin</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteForm({ email: "", role: "admin" });
                  setSelectedContact(null);
                  setContactSearch("");
                  setSearchResults([]);
                }}
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
                {saving ? "Sending..." : selectedContact ? "Send & Promote to Admin" : "Send Onboarding Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[101]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedContact ? "Confirm Promotion to Admin" : "Confirm Send Onboarding Email"}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                {selectedContact
                  ? "Are you sure you want to promote this user to admin and send them an onboarding email?"
                  : "Are you sure you want to send an onboarding email to:"}
              </p>
              <div className={`rounded-lg p-4 mb-4 ${selectedContact ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
                {selectedContact ? (
                  <>
                    <p className="font-medium text-gray-900">{selectedContact.name}</p>
                    <p className="text-sm text-gray-600">{selectedContact.email}</p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      {selectedContact.role.charAt(0).toUpperCase() + selectedContact.role.slice(1)} → Admin
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">{inviteForm.email}</p>
                    <p className="text-xs text-gray-500 mt-1">They will receive an email with a registration link</p>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {selectedContact
                  ? "Their role will be changed to Admin and they will receive an onboarding email to create their login."
                  : "After they register, they will appear in the admin section for approval."}
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={confirmSendInvitation}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Sending..." : selectedContact ? "Yes, Promote & Send" : "Yes, Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend Onboarding Email Dialog */}
      {showResendDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[101]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Resend Onboarding Email</h3>
              <p className="text-sm text-gray-600 mt-1">Send onboarding invitation to this admin</p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium"
                  placeholder="admin@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">You can edit the email address before sending</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Admin:</strong> {showResendDialog.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">They will receive an email with a registration link to create their account.</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowResendDialog(null);
                  setResendEmail("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleResendOnboarding}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                disabled={saving || !resendEmail.trim()}
              >
                {saving ? "Sending..." : "Send Onboarding Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[101]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete Admin</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete this admin? This action cannot be undone.</p>
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-gray-900">{showDeleteDialog.name}</p>
                <p className="text-xs text-gray-600 mt-1">{showDeleteDialog.email}</p>
              </div>
              <p className="text-sm text-red-600 font-medium">⚠️ Warning: This will permanently delete the admin account and all associated data.</p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteDialog)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      }
    >
      <AdminSettingsPageContent />
    </Suspense>
  );
}

"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  BadgeCheck,
  Camera,
  CheckCircle,
  ClipboardList,
  Loader2,
  Send,
  Wrench,
  Search,
  X,
  Copy,
  Edit,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { RepairReport, RepairRequest } from "@/types";
import { formatDate } from "@/lib/utils";
import { useRepairs, useUpdateRepair, useSubmitRepairReport } from "@/hooks/use-repairs";
import { TableRowSkeleton } from "@/components/ui/loading-states";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import ServiceReportForm, { ServiceReportFormData } from "@/components/ServiceReportForm";
import Select from "@/components/ui/Select";

const statusStyles: Record<string, string> = {
  submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  triaged: "bg-blue-50 text-blue-700 border-blue-200",
  waiting_booking: "bg-orange-50 text-orange-700 border-orange-200",
  scheduled: "bg-purple-50 text-purple-700 border-purple-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function RepairsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [showSendLinkConfirm, setShowSendLinkConfirm] = useState<RepairRequest | null>(null);
  const [duplicatePhoneCheck, setDuplicatePhoneCheck] = useState<any[]>([]);

  // React Query Hooks
  const { data: requestsData, isLoading, isRefetching, refetch } = useRepairs();
  const requests = Array.isArray(requestsData) ? requestsData : [];
  const updateRepair = useUpdateRepair();
  const submitReportMutation = useSubmitRepairReport();

  // Side Panel & Edit States
  const [selected, setSelected] = useState<RepairRequest | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<RepairRequest>>({});

  // Report Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin" && parsedUser.role !== "mechanic") {
      router.push("/login");
      return;
    }
    setUser(parsedUser);
  }, [router]);

  const copyLink = useCallback(
    (link?: string) => {
      if (!link) return;
      navigator.clipboard.writeText(link);
      showToast("Link copied to clipboard", "success", 3000);
    },
    [showToast]
  );

  const getRepairFormLink = useCallback(() => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/repair`;
  }, []);

  const copyRepairFormLink = useCallback(() => {
    const link = getRepairFormLink();
    navigator.clipboard.writeText(link);
    showToast("Repair submission form link copied to clipboard!", "success", 3000);
  }, [getRepairFormLink, showToast]);

  const openRepairForm = useCallback(() => {
    window.open(getRepairFormLink(), "_blank");
  }, [getRepairFormLink]);

  const checkDuplicatePhone = useCallback(async (phone: string, excludeId: string) => {
    try {
      const res = await fetch("/api/repair-requests");
      if (res.ok) {
        const data = await res.json();
        const duplicates = (data.requests || []).filter((req: any) => req.driverPhone === phone && req.id !== excludeId && req.bookingLinkSentAt);
        setDuplicatePhoneCheck(duplicates);
        return duplicates.length > 0;
      }
    } catch (err) {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.error("Error checking duplicate phone:", err);
      }
    }
    return false;
  }, []);

  const handleSendLinkClick = useCallback(
    async (request: RepairRequest) => {
      if (!request.driverPhone) {
        showToast("No phone number available for this repair request.", "error");
        return;
      }

      // Check for duplicate phone numbers
      const hasDuplicates = await checkDuplicatePhone(request.driverPhone, request.id);

      // Show confirmation modal
      setShowSendLinkConfirm(request);
    },
    [checkDuplicatePhone, showToast]
  );

  const sendBookingLink = async (request: RepairRequest, confirmed: boolean = false, customPhone?: string) => {
    if (!confirmed) {
      handleSendLinkClick(request);
      return;
    }

    try {
      setSendingId(request.id);
      setShowSendLinkConfirm(null);

      // Use custom phone if provided, otherwise use request phone
      const phoneToUse = customPhone || request.driverPhone;

      if (!phoneToUse) {
        throw new Error("Phone number is required");
      }

      // Build request body, only including defined values
      const body: any = {};
      if (request.aiCategory) body.serviceType = request.aiCategory;
      if (request.scheduledDate) body.suggestedDate = request.scheduledDate;
      if (request.scheduledTime) body.suggestedTime = request.scheduledTime;
      if (customPhone && customPhone !== request.driverPhone) {
        body.customPhone = customPhone;
      }

      const res = await fetch(`/api/repair-requests/${request.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || data.details ? JSON.stringify(data.details || data.error) : "Failed to send link";
        throw new Error(errorMsg);
      }

      // If phone was changed, update the repair request
      if (customPhone && customPhone !== request.driverPhone) {
        try {
          await fetch(`/api/repair-requests/${request.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ driverPhone: customPhone }),
          });
        } catch (updateErr) {
          // Only log in development
          if (process.env.NODE_ENV === "development") {
            console.error("Error updating phone number:", updateErr);
          }
          // Don't fail the whole operation if phone update fails
        }
      }

      // Refetch to get updated status
      await refetch();
      if (selected && selected.id === request.id) {
        // Update selected with the response data which includes bookingLink and bookingLinkSentAt
        // The schedule endpoint returns the full updated request with bookingLink
        const updatedRequest = data.request || selected;
        // Ensure bookingLink is set from response if available (prioritize data.link)
        if (data.link) {
          updatedRequest.bookingLink = data.link;
        }
        // Update phone if it was changed
        if (customPhone) {
          updatedRequest.driverPhone = customPhone;
        }
        setSelected(updatedRequest);
      }

      // Handle success/warning messages based on SMS and email status
      if (data.warnings && data.warnings.length > 0) {
        showToast(`Link created but: ${data.warnings.join(", ")}`, "warning", 6000);
      } else if (data.smsSuccess && data.emailSuccess) {
        showToast("Booking link sent via SMS and email successfully.", "success");
      } else if (data.smsSuccess) {
        showToast("Booking link sent via SMS successfully.", "success");
      } else if (data.emailSuccess) {
        showToast("Booking link sent via email successfully.", "success");
      } else {
        showToast("Booking link created but delivery failed. Please check Twilio/email configuration.", "warning", 6000);
      }
      setDuplicatePhoneCheck([]);
    } catch (err) {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
      const errorMessage = err instanceof Error ? err.message : "Failed to send booking link";
      showToast(errorMessage, "error");
    } finally {
      setSendingId(null);
    }
  };

  const openReport = useCallback((request: RepairRequest) => {
    setReportModalOpen(true);
  }, []);

  const submitServiceReport = async (formData: ServiceReportFormData) => {
    if (!selected) return;

    // Create service record
    const serviceRecordPayload = {
      mechanicName: formData.mechanicName,
      serviceType: formData.serviceType,
      description: formData.description,
      cost: formData.totalCost ? Number(formData.totalCost) : formData.cost ? Number(formData.cost) : undefined,
      mileage: formData.mileage ? Number(formData.mileage) : undefined,
      status: formData.status,
      date: formData.date,
      repairRequestId: selected.id,
      notifyDriver: formData.notifyDriver ?? true,
      notificationStatus: formData.notificationStatus || "completed_ready_for_pickup",
    };

    try {
      // Create service record
      const serviceRes = await fetch("/api/service-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceRecordPayload),
      });

      if (!serviceRes.ok) {
        const error = await serviceRes.json();
        throw new Error(error.error || "Failed to create service record");
      }

      // Also submit repair report for backward compatibility
      const reportPayload = {
        summary: formData.description,
        laborHours: formData.laborHours ? Number(formData.laborHours) : undefined,
        laborCost: formData.laborCost ? Number(formData.laborCost) : undefined,
        partsCost: formData.partsCost ? Number(formData.partsCost) : undefined,
        totalCost: formData.totalCost ? Number(formData.totalCost) : undefined,
        status: "completed",
      };

      await submitReportMutation.mutateAsync({ requestId: selected.id, data: reportPayload });

      // Update repair request status
      await updateRepair.mutateAsync({
        id: selected.id,
        updates: { status: "completed" },
      });

      showToast("Service report submitted successfully!", "success");
      setReportModalOpen(false);

      // Redirect to service records page
      setTimeout(() => {
        router.push("/service-records");
      }, 1000);
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to submit service report:", error);
      }
      showToast(error instanceof Error ? error.message : "Failed to submit service report", "error");
    }
  };

  const openEdit = useCallback((req: RepairRequest) => {
    setEditing(true);
    setEditForm({
      description: req.description,
      urgency: req.urgency,
      status: req.status,
      driverName: req.driverName,
      driverPhone: req.driverPhone,
      vehicleIdentifier: req.vehicleIdentifier,
      odometer: req.odometer,
    });
  }, []);

  const submitEdit = useCallback(() => {
    if (!selected) return;
    updateRepair.mutate(
      { id: selected.id, updates: editForm },
      {
        onSuccess: (data) => {
          const updatedRequest = { ...selected, ...data.request };
          setSelected(updatedRequest);
          setEditing(false);
        },
      }
    );
  }, [selected, editForm, updateRepair]);

  const handleFilterChange = useCallback((status: string) => {
    setFilter(status);
  }, []);

  const handleRefreshClick = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRowClick = useCallback((req: RepairRequest) => {
    setSelected(req);
  }, []);

  const filteredRequests = useMemo(() => {
    if (!Array.isArray(requests)) {
      return [];
    }
    let list = requests;
    if (filter !== "all") {
      list = list.filter((r) => r.status === filter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.driverName?.toLowerCase().includes(s) ||
          r.vehicleIdentifier?.toLowerCase().includes(s) ||
          r.description?.toLowerCase().includes(s) ||
          r.aiCategory?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [filter, requests, search]);

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Repairs</p>
                <h1 className="text-3xl font-bold text-gray-900">Repair requests</h1>
                <p className="text-gray-600">Manage repair requests, triage issues, and schedule bookings.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyRepairFormLink} className="btn btn-secondary flex items-center gap-2" title="Copy repair submission form link">
                  <Copy className="h-4 w-4" />
                  Copy Form Link
                </button>
                <button onClick={openRepairForm} className="btn btn-primary flex items-center gap-2" title="Open repair submission form">
                  <FileText className="h-4 w-4" />
                  New Repair Request
                </button>
                <button
                  onClick={handleRefreshClick}
                  className="btn btn-secondary flex items-center gap-2"
                  disabled={isRefetching || isLoading}
                  title="Refresh repair requests"
                  aria-label="Refresh repair requests list"
                >
                  <Loader2 className={`h-4 w-4 ${isRefetching || isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
              <div
                className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 no-scrollbar"
                role="tablist"
                aria-label="Filter repair requests by status"
              >
                {["all", "submitted", "waiting_booking", "scheduled", "in_progress", "completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    role="tab"
                    aria-selected={filter === status}
                    aria-controls="repair-requests-table"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      filter === status ? "bg-gray-900 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm min-h-[400px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Driver & Vehicle</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Issue</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <ClipboardList className="h-12 w-12 mb-3 opacity-20" />
                            <p>No repair requests found.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence>
                        {filteredRequests.map((req, i) => (
                          <motion.tr
                            key={req.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{
                              duration: 0.3,
                              delay: Math.min(i * 0.03, 0.3),
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                            onClick={() => handleRowClick(req)}
                            className="group hover:bg-gray-50 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            role="button"
                            tabIndex={0}
                            aria-label={`View repair request from ${req.driverName}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleRowClick(req);
                              }
                            }}
                          >
                            <td className="px-6 py-4 align-top">
                              <div className="flex items-center gap-3">
                                {/* Compact thumbnail */}
                                {req.thumbUrls && req.thumbUrls.length > 0 ? (
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={req.thumbUrls[0]}
                                      alt=""
                                      className="h-10 w-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                                    />
                                    {req.thumbUrls.length > 1 && (
                                      <span className="absolute -bottom-1 -right-1 bg-gray-900 text-white text-[10px] font-medium px-1 py-0.5 rounded-full leading-none">
                                        +{req.thumbUrls.length - 1}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                    <Camera className="h-4 w-4 text-gray-300" />
                                  </div>
                                )}
                                <div className="space-y-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{req.driverName}</p>
                                  {req.vehicleIdentifier && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <Wrench className="h-3 w-3" /> {req.vehicleIdentifier}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="space-y-1 max-w-xs">
                                <div className="flex items-center gap-2">
                                  <span className="pill bg-primary-50 border-primary-100 text-primary-800 text-[10px] px-1.5 py-0.5 h-auto">
                                    {req.urgency}
                                  </span>
                                  {req.aiCategory && (
                                    <span className="pill bg-indigo-50 border-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 h-auto">
                                      {req.aiCategory}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-2">{req.description}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[req.status] || ""}`}>
                                {req.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 align-top text-sm text-gray-500">{formatDate(req.createdAt)}</td>
                            <td className="px-6 py-4 align-top text-right">
                              <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {req.bookingLinkSentAt && (
                                  <span
                                    className="text-xs text-green-600 flex items-center gap-1"
                                    title={`Sent on ${new Date(req.bookingLinkSentAt).toLocaleString()}`}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    Sent
                                  </span>
                                )}
                                {req.bookingLink && (
                                  <button onClick={() => copyLink(req.bookingLink)} className="btn btn-ghost btn-icon" title="Copy Booking Link">
                                    <Copy className="h-4 w-4" />
                                  </button>
                                )}
                                <button onClick={() => setSelected(req)} className="btn btn-ghost text-sm">
                                  View
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelected(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.8,
              }}
            >
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                    <p className="text-xs text-gray-500 font-mono">ID: {selected.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(null)} className="btn btn-ghost btn-icon" aria-label="Close">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {/* Header Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${
                          selected.urgency === "critical" || selected.urgency === "high"
                            ? "bg-gradient-to-br from-red-100 to-red-50 text-red-600"
                            : "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600"
                        }`}
                      >
                        <Wrench className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900">{selected.driverName}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{formatDate(selected.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border-2 ${statusStyles[selected.status]}`}>
                        {selected.status.replace("_", " ")}
                      </span>
                      {!editing && (
                        <button onClick={() => openEdit(selected)} className="btn btn-ghost btn-sm flex items-center gap-1.5">
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        selected.urgency === "critical"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : selected.urgency === "high"
                            ? "bg-orange-100 text-orange-700 border border-orange-200"
                            : selected.urgency === "medium"
                              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {selected.urgency?.toUpperCase() || "MEDIUM"}
                    </span>
                    {selected.aiCategory && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {selected.aiCategory}
                      </span>
                    )}
                  </div>
                </div>

                {!editing ? (
                  <>
                    {/* AI Analysis Section - Only for Mechanics */}
                    {(selected.aiSummary || selected.aiTags || selected.aiConfidence) && (
                      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-5 shadow-md">
                        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <BadgeCheck className="h-4 w-4 text-indigo-600" />
                          </div>
                          AI Analysis (For Mechanic Review)
                        </h3>
                        <div className="space-y-4">
                          {selected.aiSummary && (
                            <div>
                              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">AI Summary</p>
                              <div className="bg-white border border-indigo-200 rounded-lg p-4 text-sm text-gray-800 leading-relaxed">
                                {selected.aiSummary}
                              </div>
                            </div>
                          )}

                          {selected.aiTags && selected.aiTags.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">AI Tags</p>
                              <div className="flex flex-wrap gap-2">
                                {selected.aiTags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {selected.aiConfidence !== undefined && (
                            <div>
                              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">AI Confidence</p>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      selected.aiConfidence >= 0.8 ? "bg-green-500" : selected.aiConfidence >= 0.6 ? "bg-yellow-500" : "bg-orange-500"
                                    }`}
                                    style={{ width: `${selected.aiConfidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-gray-900 min-w-[3rem]">{(selected.aiConfidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Read Only View */}
                    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                          <ClipboardList className="h-4 w-4 text-primary-600" />
                        </div>
                        Issue Description
                      </h3>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-lg p-5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap shadow-inner">
                        {selected.description}
                      </div>
                    </section>

                    {selected.thumbUrls?.length > 0 && (
                      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Camera className="h-4 w-4 text-purple-600" />
                          </div>
                          Photos ({selected.thumbUrls.length})
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {selected.thumbUrls.map((url, i) => (
                            <a
                              key={i}
                              href={selected.photoUrls[i] || url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative flex-shrink-0"
                            >
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors z-10" />
                              <img
                                src={url}
                                alt={`Evidence ${i + 1}`}
                                className="h-32 w-32 rounded-xl object-cover border-2 border-gray-200 group-hover:border-primary-300 shadow-md group-hover:shadow-lg transition-all"
                              />
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                View Full
                              </div>
                            </a>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <Wrench className="h-4 w-4 text-green-600" />
                        </div>
                        Vehicle & Contact
                      </h3>
                      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</p>
                          <p className="text-base font-bold text-gray-900">
                            {selected.vehicleIdentifier || <span className="text-gray-400 italic">Not specified</span>}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Odometer</p>
                          <p className="text-base font-bold text-gray-900">
                            {selected.odometer ? `${selected.odometer.toLocaleString()} mi` : <span className="text-gray-400 italic">—</span>}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</p>
                          <a
                            href={`tel:${selected.driverPhone}`}
                            className="text-base font-bold text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            {selected.driverPhone || <span className="text-gray-400 italic">—</span>}
                          </a>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
                          <p className="text-base font-bold text-gray-900">{selected.location || <span className="text-gray-400 italic">—</span>}</p>
                        </div>
                      </div>
                    </section>

                    {/* Booking Link Status */}
                    {selected.bookingLink && (
                      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Send className="h-4 w-4 text-blue-600" />
                          </div>
                          Booking Link
                        </h3>
                        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {selected.bookingLinkSentAt ? (
                                <>
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  <span className="text-sm font-semibold text-green-700">Link Sent</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                                  <span className="text-sm font-semibold text-yellow-700">Not Sent</span>
                                </>
                              )}
                            </div>
                            {selected.bookingLinkSentAt && (
                              <span className="text-xs text-gray-500">{new Date(selected.bookingLinkSentAt).toLocaleString()}</span>
                            )}
                          </div>

                          {/* Booking Link Display with Actions */}
                          <div className="pt-2 border-t border-blue-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Booking Link</p>
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-3">
                              <input
                                type="text"
                                readOnly
                                value={selected.bookingLink}
                                className="flex-1 text-sm font-mono text-gray-700 bg-transparent border-none outline-none"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => copyLink(selected.bookingLink)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Copy link"
                                >
                                  <Copy className="h-4 w-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => window.open(selected.bookingLink, "_blank")}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="h-4 w-4 text-gray-600" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {selected.scheduledDate && (
                            <div className="pt-2 border-t border-blue-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Scheduled</p>
                              <p className="text-sm font-bold text-gray-900">
                                {selected.scheduledDate} {selected.scheduledTime && `• ${selected.scheduledTime}`}
                              </p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-indigo-600" />
                        </div>
                        Actions
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleSendLinkClick(selected)}
                          disabled={sendingId === selected.id}
                          className={`btn flex-1 flex items-center gap-2 transition-all ${
                            sendingId === selected.id ? "btn-primary opacity-75 cursor-not-allowed" : "btn-primary"
                          }`}
                        >
                          {sendingId === selected.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : selected.bookingLinkSentAt ? (
                            <>
                              <Send className="h-4 w-4" />
                              Resend Booking Link
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send Booking Link
                            </>
                          )}
                        </button>
                        <button onClick={() => openReport(selected)} className="btn btn-secondary flex-1 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Submit Service Report
                        </button>
                      </div>
                      {selected.bookingLinkSentAt && (
                        <p className="mt-2 text-xs text-gray-500 text-center">Sent on {new Date(selected.bookingLinkSentAt).toLocaleString()}</p>
                      )}
                    </div>
                  </>
                ) : (
                  /* Edit Mode */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Driver Name</span>
                        <input
                          className="input-field w-full"
                          value={editForm.driverName || ""}
                          onChange={(e) => setEditForm({ ...editForm, driverName: e.target.value })}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Driver Phone</span>
                        <input
                          className="input-field w-full"
                          value={editForm.driverPhone || ""}
                          onChange={(e) => setEditForm({ ...editForm, driverPhone: e.target.value })}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Vehicle ID</span>
                        <input
                          className="input-field w-full"
                          value={editForm.vehicleIdentifier || ""}
                          onChange={(e) => setEditForm({ ...editForm, vehicleIdentifier: e.target.value })}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Odometer</span>
                        <input
                          type="number"
                          className="input-field w-full"
                          value={editForm.odometer || ""}
                          onChange={(e) => setEditForm({ ...editForm, odometer: Number(e.target.value) })}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Status</span>
                        <Select
                          value={editForm.status || "submitted"}
                          onChange={(value) => setEditForm({ ...editForm, status: value as any })}
                          options={[
                            { value: "submitted", label: "Submitted" },
                            { value: "triaged", label: "Triaged" },
                            { value: "waiting_booking", label: "Waiting Booking" },
                            { value: "scheduled", label: "Scheduled" },
                            { value: "in_progress", label: "In Progress" },
                            { value: "completed", label: "Completed" },
                            { value: "cancelled", label: "Cancelled" },
                          ]}
                          placeholder="Select status"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Urgency</span>
                        <Select
                          value={editForm.urgency || "medium"}
                          onChange={(value) => setEditForm({ ...editForm, urgency: value as any })}
                          options={[
                            { value: "low", label: "Low" },
                            { value: "medium", label: "Medium" },
                            { value: "high", label: "High" },
                            { value: "critical", label: "Critical" },
                          ]}
                          placeholder="Select urgency"
                        />
                      </label>
                    </div>
                    <label className="space-y-1.5 block">
                      <span className="text-sm font-semibold text-gray-700">Description</span>
                      <textarea
                        className="input-field w-full min-h-[120px]"
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </label>
                    <div className="flex gap-3">
                      <button onClick={() => setEditing(false)} className="btn btn-secondary flex-1" disabled={updateRepair.isPending}>
                        Cancel
                      </button>
                      <button
                        onClick={submitEdit}
                        className="btn btn-primary flex-1 flex items-center gap-2 justify-center"
                        disabled={updateRepair.isPending}
                      >
                        {updateRepair.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Save changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {reportModalOpen && selected && (
        <ServiceReportForm
          repairRequest={selected}
          onClose={() => setReportModalOpen(false)}
          onSubmit={submitServiceReport}
          isSubmitting={submitReportMutation.isPending || updateRepair.isPending}
        />
      )}

      {/* Send Link Confirmation Modal */}
      {showSendLinkConfirm && (
        <SendLinkConfirmationModal
          request={showSendLinkConfirm}
          duplicateRequests={duplicatePhoneCheck}
          isResend={!!showSendLinkConfirm.bookingLinkSentAt}
          onConfirm={(phoneNumber) => sendBookingLink(showSendLinkConfirm, true, phoneNumber)}
          onCancel={() => {
            setShowSendLinkConfirm(null);
            setDuplicatePhoneCheck([]);
          }}
          isSending={sendingId === showSendLinkConfirm.id}
          onPhoneChange={async (phone) => {
            if (phone && phone.trim()) {
              await checkDuplicatePhone(phone, showSendLinkConfirm.id);
            } else {
              setDuplicatePhoneCheck([]);
            }
          }}
        />
      )}
    </div>
  );
}

// Send Link Confirmation Modal Component
function SendLinkConfirmationModal({
  request,
  duplicateRequests,
  isResend,
  onConfirm,
  onCancel,
  isSending,
  onPhoneChange,
}: {
  request: RepairRequest;
  duplicateRequests: any[];
  isResend: boolean;
  onConfirm: (phoneNumber: string) => void;
  onCancel: () => void;
  isSending: boolean;
  onPhoneChange?: (phone: string) => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState(request.driverPhone || "");
  const hasDuplicates = duplicateRequests.length > 0;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePhoneChange = useCallback(
    (value: string) => {
      setPhoneNumber(value);

      // Debounce duplicate check - use ref to avoid re-renders
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (onPhoneChange && value.trim()) {
          onPhoneChange(value);
        }
      }, 300); // Reduced from 500ms to 300ms
    },
    [onPhoneChange]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleConfirm = () => {
    if (!phoneNumber.trim()) return;
    onConfirm(phoneNumber.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-sm border border-gray-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{isResend ? "Resend Link" : "Send Booking Link"}</h3>
            <button onClick={onCancel} disabled={isSending} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                disabled={isSending}
                className="input-field w-full"
                placeholder="Enter phone number"
              />
              {request.driverName && <p className="text-xs text-gray-500 mt-1">Driver: {request.driverName}</p>}
            </div>

            {/* Simple Warnings */}
            {hasDuplicates && (
              <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    Note: {duplicateRequests.length} other {duplicateRequests.length === 1 ? "link" : "links"} sent to this number
                  </p>
                </div>
              </div>
            )}

            {isResend && !hasDuplicates && (
              <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>Previously sent on {new Date(request.bookingLinkSentAt!).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
            <button onClick={onCancel} disabled={isSending} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSending || !phoneNumber.trim()}
              className="btn btn-primary flex-1 flex items-center gap-2 justify-center"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {isResend ? "Resend" : "Send"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

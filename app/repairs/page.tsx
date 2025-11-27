"use client";

import { useMemo, useState, useEffect } from "react";
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
} from "lucide-react";
import { RepairReport, RepairRequest } from "@/types";
import { formatDate } from "@/lib/utils";
import { useRepairs, useUpdateRepair, useSubmitRepairReport } from "@/hooks/use-repairs";
import { TableRowSkeleton } from "@/components/ui/loading-states";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";

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
  
  // React Query Hooks
  const { data: requests = [], isLoading, refetch } = useRepairs();
  const updateRepair = useUpdateRepair();
  const submitReportMutation = useSubmitRepairReport();
  
  // Side Panel & Edit States
  const [selected, setSelected] = useState<RepairRequest | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<RepairRequest>>({});

  // Report Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ summary: "", laborHours: "", laborCost: "", partsCost: "", totalCost: "" });
  const [reports, setReports] = useState<Record<string, RepairReport[]>>({});

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

  const copyLink = (link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    showToast("Link copied to clipboard", "success", 3000);
  };

  const getRepairFormLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/repair`;
  };

  const copyRepairFormLink = () => {
    const link = getRepairFormLink();
    navigator.clipboard.writeText(link);
    showToast("Repair submission form link copied to clipboard!", "success", 3000);
  };

  const openRepairForm = () => {
    window.open(getRepairFormLink(), '_blank');
  };

  const sendBookingLink = async (request: RepairRequest) => {
    try {
      setSendingId(request.id);
      // Build request body, only including defined values
      const body: any = {};
      if (request.aiCategory) body.serviceType = request.aiCategory;
      if (request.scheduledDate) body.suggestedDate = request.scheduledDate;
      if (request.scheduledTime) body.suggestedTime = request.scheduledTime;

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

      // Refetch to get updated status
      await refetch();
      if (selected && selected.id === request.id) {
        // Update selected with the response data which includes bookingLinkSentAt
        const updatedRequest = data.request || { ...selected, bookingLinkSentAt: new Date().toISOString() };
        setSelected(updatedRequest);
      }
      // Also update the request in the list if it's visible
      showToast("Booking link sent to driver.", "success");
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send booking link";
      showToast(errorMessage, "error");
    } finally {
      setSendingId(null);
    }
  };

  const openReport = async (request: RepairRequest) => {
    setReportForm({ summary: "", laborHours: "", laborCost: "", partsCost: "", totalCost: "" });
    setReportModalOpen(true);
    // Fetch reports if not already loaded
    if (!reports[request.id]) {
      const res = await fetch(`/api/repair-requests/${request.id}`);
      const data = await res.json();
      if (res.ok && data.reports) {
        setReports((prev) => ({ ...prev, [request.id]: data.reports }));
      }
    }
  };

  const submitReport = async () => {
    if (!selected) return;
    const payload = {
      summary: reportForm.summary,
      laborHours: reportForm.laborHours ? Number(reportForm.laborHours) : undefined,
      laborCost: reportForm.laborCost ? Number(reportForm.laborCost) : undefined,
      partsCost: reportForm.partsCost ? Number(reportForm.partsCost) : undefined,
      totalCost: reportForm.totalCost ? Number(reportForm.totalCost) : undefined,
      status: "completed",
    };

    submitReportMutation.mutate(
        { requestId: selected.id, data: payload },
        {
            onSuccess: (data) => {
                const updatedRequest = data.request || selected;
                setSelected(updatedRequest);
                setReports((prev) => ({
                    ...prev,
                    [selected.id]: data.report ? [data.report, ...(prev[selected.id] || [])] : prev[selected.id],
                }));
                setReportModalOpen(false);
            }
        }
    )
  };

  const openEdit = (req: RepairRequest) => {
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
  };

  const submitEdit = () => {
    if (!selected) return;
    updateRepair.mutate(
        { id: selected.id, updates: editForm },
        {
            onSuccess: (data) => {
                const updatedRequest = { ...selected, ...data.request };
                setSelected(updatedRequest);
                setEditing(false);
            }
        }
    )
  };

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (filter !== "all") {
      list = list.filter((r) => r.status === filter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(r => 
        r.driverName.toLowerCase().includes(s) ||
        r.vehicleIdentifier?.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
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
        <Header userName={user.name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Repairs</p>
                <h1 className="text-3xl font-bold text-gray-900">Repair requests</h1>
                <p className="text-gray-600">Manage repair requests, triage issues, and schedule bookings.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyRepairFormLink}
                  className="btn btn-secondary flex items-center gap-2"
                  title="Copy repair submission form link"
                >
                  <Copy className="h-4 w-4" />
                  Copy Form Link
                </button>
                <button
                  onClick={openRepairForm}
                  className="btn btn-primary flex items-center gap-2"
                  title="Open repair submission form"
                >
                  <FileText className="h-4 w-4" />
                  New Repair Request
                </button>
                <button
                  onClick={() => refetch()}
                  className="btn btn-secondary flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 no-scrollbar">
                {["all", "submitted", "waiting_booking", "scheduled", "in_progress", "completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: i * 0.05 }}
                                    onClick={() => setSelected(req)}
                                    className="group hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 align-top">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-gray-900">{req.driverName}</p>
                                        {req.vehicleIdentifier && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Wrench className="h-3 w-3" /> {req.vehicleIdentifier}
                                            </p>
                                        )}
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
                                    <td className="px-6 py-4 align-top text-sm text-gray-500">
                                    {formatDate(req.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 align-top text-right">
                                        <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {req.bookingLinkSentAt && (
                                                <span className="text-xs text-green-600 flex items-center gap-1" title={`Sent on ${new Date(req.bookingLinkSentAt).toLocaleString()}`}>
                                                    <CheckCircle className="h-3 w-3" />
                                                    Sent
                                                </span>
                                            )}
                                            {req.bookingLink && (
                                                <button 
                                                    onClick={() => copyLink(req.bookingLink)}
                                                    className="btn btn-ghost btn-icon"
                                                    title="Copy Booking Link"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setSelected(req)}
                                                className="btn btn-ghost text-sm"
                                            >
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
            >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setSelected(null)} />
            <motion.div 
                className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                    <button
                        onClick={() => setSelected(null)}
                        className="btn btn-ghost btn-icon"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {/* Header Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${
                                selected.urgency === 'critical' || selected.urgency === 'high' 
                                    ? 'bg-gradient-to-br from-red-100 to-red-50 text-red-600' 
                                    : 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600'
                            }`}>
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
                                <button
                                    onClick={() => openEdit(selected)}
                                    className="btn btn-ghost btn-sm flex items-center gap-1.5"
                                >
                                    <Edit className="h-4 w-4" /> Edit
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            selected.urgency === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                            selected.urgency === 'high' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            selected.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                            {selected.urgency?.toUpperCase() || 'MEDIUM'}
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
                                        alt={`Evidence ${i+1}`} 
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
                                <p className="text-base font-bold text-gray-900">{selected.vehicleIdentifier || <span className="text-gray-400 italic">Not specified</span>}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Odometer</p>
                                <p className="text-base font-bold text-gray-900">{selected.odometer ? `${selected.odometer.toLocaleString()} mi` : <span className="text-gray-400 italic">—</span>}</p>
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
                                        <span className="text-xs text-gray-500">
                                            {new Date(selected.bookingLinkSentAt).toLocaleString()}
                                        </span>
                                    )}
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
                                onClick={() => sendBookingLink(selected)}
                                disabled={sendingId === selected.id || !!selected.bookingLinkSentAt}
                                className={`btn flex-1 flex items-center gap-2 transition-all ${
                                    selected.bookingLinkSentAt 
                                        ? 'btn-secondary opacity-75 cursor-not-allowed' 
                                        : sendingId === selected.id
                                        ? 'btn-primary opacity-75'
                                        : 'btn-primary'
                                }`}
                            >
                                {sendingId === selected.id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : selected.bookingLinkSentAt ? (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        Sent
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        {selected.bookingLink ? 'Resend Booking Link' : 'Send Booking Link'}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => openReport(selected)}
                                className="btn btn-secondary flex-1 flex items-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Complete & Report
                            </button>
                        </div>
                        {selected.bookingLinkSentAt && (
                            <p className="mt-2 text-xs text-gray-500 text-center">
                                Sent on {new Date(selected.bookingLinkSentAt).toLocaleString()}
                            </p>
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
                        <select
                            className="input-field w-full"
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                        >
                            <option value="submitted">Submitted</option>
                            <option value="triaged">Triaged</option>
                            <option value="waiting_booking">Waiting Booking</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        </label>
                        <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Urgency</span>
                        <select
                            className="input-field w-full"
                            value={editForm.urgency}
                            onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value as any })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
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
                        <button
                        onClick={() => setEditing(false)}
                        className="btn btn-secondary flex-1"
                        disabled={updateRepair.isPending}
                        >
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Report for</p>
                <h3 className="text-lg font-semibold text-gray-900">{selected.driverName}</h3>
              </div>
              <button 
                className="btn btn-ghost btn-icon" 
                onClick={() => setReportModalOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-gray-800">Summary</span>
              <textarea
                className="input-field"
                rows={3}
                value={reportForm.summary}
                onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-gray-800">Labor hours</span>
                <input
                  className="input-field"
                  value={reportForm.laborHours}
                  onChange={(e) => setReportForm({ ...reportForm, laborHours: e.target.value })}
                  placeholder="e.g. 2.5"
                />
              </label>
              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-gray-800">Labor cost</span>
                <input
                  className="input-field"
                  value={reportForm.laborCost}
                  onChange={(e) => setReportForm({ ...reportForm, laborCost: e.target.value })}
                  placeholder="USD"
                />
              </label>
              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-gray-800">Parts cost</span>
                <input
                  className="input-field"
                  value={reportForm.partsCost}
                  onChange={(e) => setReportForm({ ...reportForm, partsCost: e.target.value })}
                  placeholder="USD"
                />
              </label>
              <label className="space-y-2 block">
                <span className="text-sm font-semibold text-gray-800">Total cost</span>
                <input
                  className="input-field"
                  value={reportForm.totalCost}
                  onChange={(e) => setReportForm({ ...reportForm, totalCost: e.target.value })}
                  placeholder="USD"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={submitReport} 
                className="btn btn-primary flex-1 flex items-center gap-2 justify-center"
                disabled={submitReportMutation.isPending}
              >
                {submitReportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Save report
              </button>
              <button 
                onClick={() => setReportModalOpen(false)} 
                className="btn btn-secondary flex-1 flex items-center gap-2 justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

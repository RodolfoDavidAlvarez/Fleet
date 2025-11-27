"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { BadgeCheck, Calendar, Camera, CheckCircle, ClipboardList, Loader2, MapPin, Phone, Send, Wrench, Search, Filter, X, AlertTriangle, Car, User, Clock, FileText } from "lucide-react";
import { RepairReport, RepairRequest } from "@/types";
import { formatDate } from "@/lib/utils";
import { VehicleCardSkeleton } from "@/components/ui/loading-states";
import { Pagination } from "@/components/ui/pagination";

const statusStyles: Record<string, string> = {
  submitted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  triaged: "bg-blue-50 text-blue-700 border-blue-200",
  waiting_booking: "bg-orange-50 text-orange-700 border-orange-200",
  scheduled: "bg-purple-50 text-purple-700 border-purple-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

const urgencyStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

export default function RepairsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [sendingId, setSendingId] = useState<string | null>(null);
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
    loadRequests();
  }, [router]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/repair-requests");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setRequests(data.requests || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load repair requests");
    } finally {
      setLoading(false);
    }
  };

  const sendBookingLink = async (request: RepairRequest) => {
    try {
      setSendingId(request.id);
      const res = await fetch(`/api/repair-requests/${request.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: request.aiCategory,
          suggestedDate: request.scheduledDate,
          suggestedTime: request.scheduledTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send link");

      setRequests((prev) => prev.map((item) => (item.id === request.id ? { ...item, ...(data.request || item) } : item)));
      // Update selected request if open
      if (selectedRequest?.id === request.id) {
         setSelectedRequest({ ...selectedRequest, ...(data.request || request) });
      }
      alert("Booking link sent to driver.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to send booking link");
    } finally {
      setSendingId(null);
    }
  };

  const openReport = async () => {
    if (!selectedRequest) return;
    setReportForm({ summary: "", laborHours: "", laborCost: "", partsCost: "", totalCost: "" });
    setReportModalOpen(true);
    if (!reports[selectedRequest.id]) {
      const res = await fetch(`/api/repair-requests/${selectedRequest.id}`);
      const data = await res.json();
      if (res.ok && data.reports) {
        setReports((prev) => ({ ...prev, [selectedRequest.id]: data.reports }));
      }
    }
  };

  const submitReport = async () => {
    if (!selectedRequest) return;
    try {
      const payload = {
        summary: reportForm.summary,
        laborHours: reportForm.laborHours ? Number(reportForm.laborHours) : undefined,
        laborCost: reportForm.laborCost ? Number(reportForm.laborCost) : undefined,
        partsCost: reportForm.partsCost ? Number(reportForm.partsCost) : undefined,
        totalCost: reportForm.totalCost ? Number(reportForm.totalCost) : undefined,
        status: "completed",
      };
      const res = await fetch(`/api/repair-requests/${selectedRequest.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save report");
      setRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? (data.request || r) : r)));
      setReports((prev) => ({
        ...prev,
        [selectedRequest.id]: data.report ? [data.report, ...(prev[selectedRequest.id] || [])] : prev[selectedRequest.id],
      }));
      setReportModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit report");
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    // Status Filter
    if (filter !== "all") {
        filtered = filtered.filter((r) => r.status === filter);
    }

    // Search Filter
    if (search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter(r => 
            r.driverName?.toLowerCase().includes(s) ||
            r.vehicleIdentifier?.toLowerCase().includes(s) ||
            r.description?.toLowerCase().includes(s) ||
            r.aiCategory?.toLowerCase().includes(s)
        );
    }
    
    return filtered;
  }, [filter, search, requests]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, currentPage, itemsPerPage]);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      confirmed: 0,
      completed: 0
    };
    
    requests.forEach((req) => {
      if (req.status === 'submitted' || req.status === 'triaged') counts.pending++;
      else if (req.status === 'waiting_booking' || req.status === 'scheduled' || req.status === 'in_progress') counts.confirmed++;
      else if (req.status === 'completed') counts.completed++;
    });
    
    return counts;
  }, [requests]);

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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs text-primary-700 font-semibold uppercase tracking-[0.08em]">Maintenance</p>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Repair Requests</h1>
                  <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                    {requests.length} total
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Manage and triage driver-reported issues.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadRequests}
                  className="btn-secondary px-4 py-2 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Triage</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.pending}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">In Progress/Booked</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.confirmed}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.completed}</p>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1">
                    {["all", "submitted", "waiting_booking", "scheduled", "in_progress", "completed"].map((status) => (
                        <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                            filter === status 
                            ? "bg-gray-900 text-white shadow-md" 
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                        >
                        {status.replace("_", " ")}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
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

            {/* Content List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="space-y-4 p-6">
                        {[1,2,3].map(i => <VehicleCardSkeleton key={i} />)}
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <ClipboardList className="h-12 w-12 mb-3 opacity-20" />
                        <p>No repair requests found.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Request Details</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Photos</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle & Driver</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Urgency & Status</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedRequests.map((req) => (
                                <tr 
                                    key={req.id} 
                                    onClick={() => setSelectedRequest(req)}
                                    className="group hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                {req.aiCategory ? (
                                                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                        <BadgeCheck className="h-4 w-4" />
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 text-gray-500">
                                                        <Wrench className="h-4 w-4" />
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{req.aiCategory || "General Issue"}</p>
                                                <p className="text-sm text-gray-500 line-clamp-2 mt-0.5 max-w-xs">{req.description}</p>
                                                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {formatDate(req.createdAt)}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {req.division && (
                                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                            {req.division}
                                                        </span>
                                                    )}
                                                    {req.vehicleType && (
                                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            {req.vehicleType}
                                                        </span>
                                                    )}
                                                    {req.makeModel && (
                                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                                            {req.makeModel}
                                                        </span>
                                                    )}
                                                    {req.incidentDate && (
                                                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                                            Reported {formatDate(req.incidentDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        {req.photoUrls && req.photoUrls.length > 0 ? (
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex -space-x-2">
                                                    {(req.thumbUrls && req.thumbUrls.length > 0 ? req.thumbUrls : req.photoUrls).slice(0, 3).map((url, idx) => (
                                                        <div 
                                                            key={idx}
                                                            className="relative w-12 h-12 rounded-lg border-2 border-white overflow-hidden bg-gray-100 shadow-sm group/photo"
                                                        >
                                                            <img 
                                                                src={url} 
                                                                alt={`Photo ${idx + 1}`}
                                                                className="w-full h-full object-cover transition-transform duration-200 group-hover/photo:scale-110 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(req.photoUrls[idx] || url, '_blank');
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                {req.photoUrls.length > 3 && (
                                                    <span className="text-xs font-medium text-gray-500 ml-1">
                                                        +{req.photoUrls.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-50 border border-gray-200">
                                                <Camera className="h-5 w-5 text-gray-300" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900">{req.driverName}</span>
                                            </div>
                                            {req.vehicleIdentifier && (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Car className="h-3.5 w-3.5" />
                                                    <span className="text-xs">{req.vehicleIdentifier}</span>
                                                </div>
                                            )}
                                            {(req.location || req.division) && (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span className="text-xs truncate max-w-[180px]">{req.location || req.division}</span>
                                                </div>
                                            )}
                                            {req.driverPhone && (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    <span className="text-xs truncate max-w-[180px]">{req.driverPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col items-start gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[req.status] || "bg-gray-100 text-gray-700"}`}>
                                                {req.status.replace("_", " ")}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${urgencyStyles[req.urgency] || "bg-gray-100 text-gray-700"}`}>
                                                {req.urgency} Priority
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top text-right">
                                        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!loading && filteredRequests.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredRequests.length}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Slide-Over Drawer for Details */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedRequest(null)} />
            <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 translate-x-0 flex flex-col h-full">
                {/* Drawer Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Request Details</h2>
                        <p className="text-sm text-gray-500">ID: {selectedRequest.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedRequest(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${
                            selectedRequest.status === 'completed' ? 'bg-green-500' : 
                            selectedRequest.status === 'in_progress' ? 'bg-indigo-500' : 'bg-yellow-500'
                        }`} />
                        <span className="font-semibold text-gray-900 capitalize">{selectedRequest.status.replace('_', ' ')}</span>
                        {selectedRequest.isImmediate && (
                            <span className="ml-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                                <AlertTriangle className="h-3.5 w-3.5" /> Needs immediate attention
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${urgencyStyles[selectedRequest.urgency]}`}>
                            {selectedRequest.urgency} Priority
                        </span>
                        </div>
                    </div>

                    {/* Driver Information */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" /> Driver Information
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Name</p>
                                <p className="font-medium text-gray-900">{selectedRequest.driverName || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Phone</p>
                                <p className="font-medium text-gray-900">{selectedRequest.driverPhone || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                <p className="font-medium text-gray-900">{selectedRequest.driverEmail || '—'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Vehicle Context */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Car className="h-4 w-4" /> Vehicle Context
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Identifier</p>
                                <p className="font-medium text-gray-900">{selectedRequest.vehicleIdentifier || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Odometer</p>
                                <p className="font-medium text-gray-900">{selectedRequest.odometer ? `${selectedRequest.odometer.toLocaleString()} mi` : '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Location</p>
                                <p className="font-medium text-gray-900 truncate" title={selectedRequest.location}>{selectedRequest.location || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Make & Model</p>
                                <p className="font-medium text-gray-900">{selectedRequest.makeModel || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Vehicle Type</p>
                                <p className="font-medium text-gray-900">{selectedRequest.vehicleType || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Division</p>
                                <p className="font-medium text-gray-900">{selectedRequest.division || '—'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Timeline */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Timeline
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Reported</p>
                                <p className="font-medium text-gray-900">{selectedRequest.incidentDate ? formatDate(selectedRequest.incidentDate) : '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Logged</p>
                                <p className="font-medium text-gray-900">{selectedRequest.createdAt ? formatDate(selectedRequest.createdAt) : '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Status updated</p>
                                <p className="font-medium text-gray-900">{selectedRequest.updatedAt ? formatDate(selectedRequest.updatedAt) : '—'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Problem Description */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Description
                        </h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {selectedRequest.description}
                        </div>
                    </section>

                    {/* AI Analysis */}
                    {selectedRequest.aiCategory && (
                        <section>
                            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <BadgeCheck className="h-4 w-4 text-indigo-600" /> AI Analysis
                            </h3>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-white text-indigo-700 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100 shadow-sm">
                                        {selectedRequest.aiCategory}
                                    </span>
                                </div>
                                {selectedRequest.aiSummary && (
                                    <p className="text-sm text-indigo-800">{selectedRequest.aiSummary}</p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Photos */}
                    {selectedRequest.photoUrls && selectedRequest.photoUrls.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Camera className="h-4 w-4" /> Attached Evidence ({selectedRequest.photoUrls.length})
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {selectedRequest.photoUrls.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group cursor-pointer">
                                        <img 
                                            src={url} 
                                            alt={`Evidence ${idx}`} 
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onClick={() => window.open(url, '_blank')}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button 
                        onClick={() => sendBookingLink(selectedRequest)}
                        disabled={sendingId === selectedRequest.id}
                        className="flex-1 btn-secondary justify-center flex items-center gap-2"
                    >
                        {sendingId === selectedRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send Booking Link
                    </button>
                    <button 
                        onClick={openReport}
                        className="flex-1 btn-primary justify-center flex items-center gap-2"
                    >
                        <CheckCircle className="h-4 w-4" />
                        Complete & Report
                    </button>
                </div>
            </div>
        </div>
      )}

      {reportModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Final Report for</p>
                <h3 className="text-lg font-bold text-gray-900">{selectedRequest.driverName}</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1" onClick={() => setReportModalOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
                <label className="space-y-1.5 block">
                <span className="text-sm font-semibold text-gray-700">Resolution Summary</span>
                <textarea
                    className="input-field w-full min-h-[100px]"
                    placeholder="Describe the work performed..."
                    value={reportForm.summary}
                    onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                />
                </label>

                <div className="grid grid-cols-2 gap-4">
                <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Labor Hours</span>
                    <input
                    className="input-field w-full"
                    type="number"
                    value={reportForm.laborHours}
                    onChange={(e) => setReportForm({ ...reportForm, laborHours: e.target.value })}
                    placeholder="0.0"
                    />
                </label>
                <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Total Cost</span>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            className="input-field w-full pl-7"
                            type="number"
                            value={reportForm.totalCost}
                            onChange={(e) => setReportForm({ ...reportForm, totalCost: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                </label>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setReportModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={submitReport} className="flex-1 btn-primary py-2.5 justify-center flex items-center gap-2 shadow-lg shadow-primary-500/20">
                <CheckCircle className="h-4 w-4" /> Complete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

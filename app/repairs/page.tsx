"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  BadgeCheck, 
  Calendar, 
  Camera, 
  CheckCircle, 
  ClipboardList, 
  Loader2, 
  MapPin, 
  Phone, 
  Send, 
  Wrench,
  Search,
  X,
  Copy,
  Edit,
  Plus,
  Trash2,
  ExternalLink
} from "lucide-react";
import { RepairReport, RepairRequest } from "@/types";
import { formatDate } from "@/lib/utils";

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
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  
  // Side Panel & Edit States
  const [selected, setSelected] = useState<RepairRequest | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const copyLink = (link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    // Could add a toast here, but for now simple alert or just action is fine.
    // We'll trust the user sees it happened or maybe standard browser feedback?
    // Let's stick to a simple alert for confirmation for now if needed, or just nothing.
    alert("Link copied to clipboard"); 
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
      alert("Booking link sent to driver.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to send booking link");
    } finally {
      setSendingId(null);
    }
  };

  const openReport = async (request: RepairRequest) => {
    // If opening report, we keep selected item but open modal
    setReportForm({ summary: "", laborHours: "", laborCost: "", partsCost: "", totalCost: "" });
    setReportModalOpen(true);
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
    try {
      const payload = {
        summary: reportForm.summary,
        laborHours: reportForm.laborHours ? Number(reportForm.laborHours) : undefined,
        laborCost: reportForm.laborCost ? Number(reportForm.laborCost) : undefined,
        partsCost: reportForm.partsCost ? Number(reportForm.partsCost) : undefined,
        totalCost: reportForm.totalCost ? Number(reportForm.totalCost) : undefined,
        status: "completed",
      };
      const res = await fetch(`/api/repair-requests/${selected.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save report");
      
      const updatedRequest = data.request || selected;
      setRequests((prev) => prev.map((r) => (r.id === selected.id ? updatedRequest : r)));
      setSelected(updatedRequest); // Update selected view
      
      setReports((prev) => ({
        ...prev,
        [selected.id]: data.report ? [data.report, ...(prev[selected.id] || [])] : prev[selected.id],
      }));
      setReportModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit report");
    }
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
      location: req.location,
      odometer: req.odometer,
    });
  };

  const submitEdit = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/repair-requests/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update repair request");
      
      const updatedRequest = { ...selected, ...data.request };
      setRequests((prev) => prev.map((r) => (r.id === selected.id ? updatedRequest : r)));
      setSelected(updatedRequest);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update repair request");
    } finally {
      setSaving(false);
    }
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
              <button
                onClick={loadRequests}
                className="btn-secondary px-4 py-2 flex items-center gap-2"
              >
                <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

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
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
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
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Driver & Vehicle</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Issue</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.id}
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
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                {req.bookingLink && (
                                    <button 
                                        onClick={() => copyLink(req.bookingLink)}
                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        title="Copy Booking Link"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setSelected(req)}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline p-1.5"
                                >
                                    View
                                </button>
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Side Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setSelected(null)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 translate-x-0 flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Request Details</h2>
                <p className="text-sm text-gray-500">ID: {selected.id.slice(0, 8)}</p>
              </div>
              <div className="flex items-center gap-2">
                 {selected.bookingLink && (
                    <button 
                        onClick={() => copyLink(selected.bookingLink)}
                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                        <Copy className="h-3 w-3" /> Copy Link
                    </button>
                 )}
                 <button
                    onClick={() => setSelected(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Header Info */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${selected.urgency === 'critical' || selected.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selected.driverName}</p>
                  <p className="text-xs text-gray-500">{formatDate(selected.createdAt)}</p>
                </div>
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusStyles[selected.status]}`}>
                  {selected.status.replace("_", " ")}
                </span>
                {!editing && (
                  <button
                    onClick={() => openEdit(selected)}
                    className="ml-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </button>
                )}
              </div>

              {!editing ? (
                <>
                  {/* Read Only View */}
                  <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" /> Issue Description
                    </h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selected.description}
                    </div>
                  </section>
                  
                  {selected.thumbUrls?.length > 0 && (
                      <section>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Camera className="h-4 w-4" /> Photos
                        </h3>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {selected.thumbUrls.map((url, i) => (
                            <a key={i} href={selected.photoUrls[i] || url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`Evidence ${i+1}`} className="h-24 w-24 rounded-lg object-cover border hover:opacity-90 transition-opacity" />
                            </a>
                            ))}
                        </div>
                      </section>
                  )}

                  <section>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Wrench className="h-4 w-4" /> Vehicle & Contact
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                        <p className="font-medium text-gray-900">{selected.vehicleIdentifier || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Odometer</p>
                        <p className="font-medium text-gray-900">{selected.odometer ? `${selected.odometer.toLocaleString()} mi` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="font-medium text-gray-900">{selected.driverPhone || "—"}</p>
                      </div>
                      <div>
                         <p className="text-xs text-gray-500 mb-1">Location</p>
                         <p className="font-medium text-gray-900">{selected.location || "—"}</p>
                      </div>
                    </div>
                  </section>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                    <p className="text-sm font-bold text-gray-900">Actions</p>
                    <div className="flex gap-3">
                         <button
                            onClick={() => sendBookingLink(selected)}
                            disabled={sendingId === selected.id}
                            className="btn-primary flex-1 justify-center flex items-center gap-2"
                        >
                            {sendingId === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Resend Booking Link
                        </button>
                        <button
                            onClick={() => openReport(selected)}
                            className="btn-secondary flex-1 justify-center flex items-center gap-2"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Complete & Report
                        </button>
                    </div>
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
                      className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitEdit}
                      className="flex-1 btn-primary py-2.5 justify-center flex items-center gap-2 shadow-lg shadow-primary-500/20"
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Save changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {reportModalOpen && reportTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            {/* ... Report Modal Content (same as before) ... */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Report for</p>
                <h3 className="text-lg font-semibold text-gray-900">{selected?.driverName}</h3>
              </div>
              <button className="text-gray-500 hover:text-gray-800" onClick={() => setReportModalOpen(false)}>
                ✕
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
              <button onClick={submitReport} className="btn-primary flex-1 justify-center flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Save report
              </button>
              <button onClick={() => setReportModalOpen(false)} className="btn-secondary flex-1 justify-center flex items-center gap-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to keep typescript happy if I removed reportTarget but used selected
const reportTarget = {};
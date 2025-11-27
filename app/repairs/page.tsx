"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { BadgeCheck, Calendar, Camera, CheckCircle, ClipboardList, Loader2, MapPin, Phone, Send, Wrench } from "lucide-react";
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
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<RepairRequest | null>(null);
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
      alert("Booking link sent to driver.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to send booking link");
    } finally {
      setSendingId(null);
    }
  };

  const openReport = async (request: RepairRequest) => {
    setReportTarget(request);
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
    if (!reportTarget) return;
    try {
      const payload = {
        summary: reportForm.summary,
        laborHours: reportForm.laborHours ? Number(reportForm.laborHours) : undefined,
        laborCost: reportForm.laborCost ? Number(reportForm.laborCost) : undefined,
        partsCost: reportForm.partsCost ? Number(reportForm.partsCost) : undefined,
        totalCost: reportForm.totalCost ? Number(reportForm.totalCost) : undefined,
        status: "completed",
      };
      const res = await fetch(`/api/repair-requests/${reportTarget.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save report");
      setRequests((prev) => prev.map((r) => (r.id === reportTarget.id ? (data.request || r) : r)));
      setReports((prev) => ({
        ...prev,
        [reportTarget.id]: data.report ? [data.report, ...(prev[reportTarget.id] || [])] : prev[reportTarget.id],
      }));
      setReportModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit report");
    }
  };

  const filteredRequests = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [filter, requests]);

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
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Repairs</p>
                <h1 className="text-3xl font-bold text-gray-900">Repair requests</h1>
                <p className="text-gray-600">Mobile cards with AI tags, photos, and quick booking links.</p>
              </div>
              <button
                onClick={loadRequests}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 gap-2 pill"
              >
                <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

            <div className="flex flex-wrap gap-2">
              {["all", "submitted", "waiting_booking", "scheduled", "in_progress", "completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`pill ${filter === status ? "bg-primary-50 border-primary-200 text-primary-800" : ""}`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-600">Loading repair requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No repair requests found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRequests.map((req) => (
                  <div key={req.id} className="card-surface rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="pill bg-primary-50 border-primary-100 text-primary-800">
                          <Wrench className="h-4 w-4" />
                          {req.urgency}
                        </span>
                        {req.aiCategory && (
                          <span className="pill bg-indigo-50 border-indigo-100 text-indigo-800">
                            <BadgeCheck className="h-4 w-4" />
                            {req.aiCategory}
                          </span>
                        )}
                      </div>
                      <span className={`pill ${statusStyles[req.status] || ""}`}>{req.status.replace("_", " ")}</span>
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-gray-900">{req.driverName}</p>
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4" />
                        {req.driverPhone || "No phone"}
                      </div>
                      {req.vehicleIdentifier && (
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <ClipboardList className="h-4 w-4" />
                          {req.vehicleIdentifier}
                        </p>
                      )}
                      {req.location && (
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4" />
                          {req.location}
                        </p>
                      )}
                    </div>

                    <p className="text-sm text-gray-700">{req.description}</p>

                    {req.thumbUrls?.length > 0 && (
                      <div className="flex gap-2">
                        {req.thumbUrls.map((url) => (
                          <img key={url} src={url} alt="Evidence" className="h-16 w-16 rounded-lg object-cover border" />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> {formatDate(req.createdAt)}
                      </span>
                      {req.bookingLink && (
                        <a className="text-primary-700 font-semibold" href={req.bookingLink} target="_blank" rel="noreferrer">
                          Booking link
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => sendBookingLink(req)}
                        disabled={sendingId === req.id}
                        className="btn-primary flex-1 justify-center flex items-center gap-2"
                      >
                        {sendingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send booking link
                      </button>
                      <button
                        onClick={() => openReport(req)}
                        className="btn-secondary flex-1 justify-center flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Add report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {reportModalOpen && reportTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Report for</p>
                <h3 className="text-lg font-semibold text-gray-900">{reportTarget.driverName}</h3>
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

            {reports[reportTarget.id] && reports[reportTarget.id].length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Past reports
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {reports[reportTarget.id].map((rep) => (
                    <li key={rep.id} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {rep.summary}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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

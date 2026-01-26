"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Bug, Clock, CheckCircle, AlertCircle, XCircle, MessageSquare, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface BugReport {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  title: string;
  description: string;
  screenshot_url: string | null;
  status: "pending" | "in_progress" | "resolved" | "closed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  application_source: string;
}

export default function AdminBugReportsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin" && parsedUser.role !== "mechanic") {
      router.push("/dashboard");
      return;
    }
    if (parsedUser.approval_status !== "approved") {
      router.push("/dashboard");
      return;
    }
    setUser(parsedUser);
  }, [router]);

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ["admin-bug-reports"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bug-reports");
      if (!res.ok) throw new Error("Failed to fetch bug reports");
      const data = await res.json();
      return data.reports as BugReport[];
    },
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ reportId, status, adminNotes }: { reportId: string; status?: string; adminNotes?: string }) => {
      const res = await fetch("/api/admin/bug-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status, adminNotes }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bug-reports"] });
      setEditingNotes(null);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "closed":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      resolved: "bg-green-100 text-green-800 border-green-200",
      closed: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return styles[status] || styles.pending;
  };

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bug reports...</p>
        </div>
      </div>
    );
  }

  const pendingCount = reports?.filter((r) => r.status === "pending").length || 0;
  const inProgressCount = reports?.filter((r) => r.status === "in_progress").length || 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Bug className="w-8 h-8 text-red-500" />
                    Bug Reports
                  </h1>
                  <p className="text-gray-600 mt-1">Manage user-submitted bug reports and issues</p>
                </div>
                <div className="flex gap-3">
                  {pendingCount > 0 && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {pendingCount} pending
                    </span>
                  )}
                  {inProgressCount > 0 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {inProgressCount} in progress
                    </span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Error loading bug reports. Please try again.</p>
              </div>
            )}

            <div className="space-y-4">
              {reports?.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                  <Bug className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Bug Reports</h3>
                  <p className="text-gray-500">No bug reports have been submitted yet.</p>
                </div>
              ) : (
                reports?.map((report) => (
                  <div key={report.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(report.status)}
                            <h3 className="font-semibold text-gray-900">{report.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(report.status)}`}>
                              {report.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{report.user_name}</span>
                            <span>{report.user_email}</span>
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expandedId === report.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedId === report.id && (
                      <div className="border-t p-4 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                            <p className="text-gray-600 whitespace-pre-wrap bg-white p-3 rounded-lg border">
                              {report.description}
                            </p>

                            {report.screenshot_url && (
                              <div className="mt-4">
                                <h4 className="font-medium text-gray-700 mb-2">Screenshot</h4>
                                <a
                                  href={report.screenshot_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View Screenshot
                                </a>
                                <img
                                  src={report.screenshot_url}
                                  alt="Bug screenshot"
                                  className="mt-2 max-w-full max-h-64 rounded-lg border object-contain"
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Status</h4>
                            <select
                              value={report.status}
                              onChange={(e) => updateMutation.mutate({ reportId: report.id, status: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
                              disabled={updateMutation.isPending}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>

                            <div className="mt-4">
                              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Admin Notes
                              </h4>
                              {editingNotes === report.id ? (
                                <div>
                                  <textarea
                                    value={notesText}
                                    onChange={(e) => setNotesText(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
                                    rows={3}
                                    placeholder="Add notes about this bug..."
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => updateMutation.mutate({ reportId: report.id, adminNotes: notesText })}
                                      className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                                      disabled={updateMutation.isPending}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingNotes(null)}
                                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingNotes(report.id);
                                    setNotesText(report.admin_notes || "");
                                  }}
                                  className="w-full px-3 py-2 border rounded-lg bg-white cursor-pointer hover:bg-gray-50 min-h-[80px]"
                                >
                                  {report.admin_notes || <span className="text-gray-400">Click to add notes...</span>}
                                </div>
                              )}
                            </div>

                            <div className="mt-4 text-sm text-gray-500">
                              <p>Submitted: {new Date(report.created_at).toLocaleString()}</p>
                              {report.resolved_at && <p>Resolved: {new Date(report.resolved_at).toLocaleString()}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

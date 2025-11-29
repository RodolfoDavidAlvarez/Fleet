"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ServiceRecord, RepairRequest } from "@/types";
import { Wrench, ClipboardList, Plus, Loader2, Search, DollarSign, Gauge, Calendar, User, FileText, BadgeCheck, X, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useServiceRecords, useCreateServiceRecord, useUpdateServiceRecord } from "@/hooks/use-service-records";
import { exportServiceRecords } from "@/lib/export-utils";
import { TableRowSkeleton } from "@/components/ui/loading-states";
import { motion, AnimatePresence } from "framer-motion";
import ServiceReportForm, { ServiceReportFormData } from "@/components/ServiceReportForm";
import Select from "@/components/ui/Select";
import { Pagination } from "@/components/ui/pagination";

const statusLabels: Record<string, string> = {
  in_progress: "In Progress",
  open: "Open",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusStyles: Record<string, string> = {
  open: "bg-yellow-50 text-yellow-700 border-yellow-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function ServiceRecordsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // React Query Hooks
  const { data: records = [], isLoading, refetch } = useServiceRecords();
  const createRecord = useCreateServiceRecord();
  const updateRecord = useUpdateServiceRecord();

  const [repairOptions, setRepairOptions] = useState<RepairRequest[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ServiceRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editForm, setEditForm] = useState({
    mechanicName: "",
    serviceType: "",
    description: "",
    cost: "",
    mileage: "",
    status: "in_progress",
    date: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    setUser(parsed);
  }, [router]);

  useEffect(() => {
    if (user) {
      loadRepairs();
    }
  }, [user]);

  // Load items per page preference from localStorage
  useEffect(() => {
    const savedItemsPerPage = localStorage.getItem("service-records-items-per-page");
    if (savedItemsPerPage) {
      const parsed = parseInt(savedItemsPerPage, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setItemsPerPage(parsed);
      }
    }
  }, []);

  const loadRepairs = async () => {
    try {
      const res = await fetch("/api/repair-requests?limit=100");
      const data = await res.json();
      if (res.ok && data.requests) {
        setRepairOptions(data.requests);
      }
    } catch (err) {
      console.warn("Failed to load repair requests for options", err);
    }
  };

  const filtered = useMemo(() => {
    let list = records;
    if (filter !== "all") {
      list = list.filter((r) => (r.status || "in_progress") === filter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.serviceType?.toLowerCase().includes(s) ||
          r.description?.toLowerCase().includes(s) ||
          r.mechanicName?.toLowerCase().includes(s) ||
          r.vehicleIdentifier?.toLowerCase().includes(s) ||
          r.vehicleLabel?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [filter, search, records]);

  // Calculate pagination
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Reset to page 1 when items per page changes, filter changes, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, filter, search]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    localStorage.setItem("service-records-items-per-page", newItemsPerPage.toString());
  };

  const statusCounts = useMemo(() => {
    return records.reduce(
      (acc, r) => {
        const s = (r.status as string) || "in_progress";
        if (s === "completed") acc.completed++;
        else if (s === "cancelled") acc.cancelled++;
        else acc.active++;
        return acc;
      },
      { active: 0, completed: 0, cancelled: 0 }
    );
  }, [records]);

  const openCreate = () => {
    setCreateOpen(true);
  };

  const openEdit = (rec: ServiceRecord) => {
    setEditing(true);
    setEditForm({
      mechanicName: rec.mechanicName || "",
      serviceType: rec.serviceType || "",
      description: rec.description || "",
      cost: rec.cost !== undefined ? String(rec.cost) : "",
      mileage: rec.mileage !== undefined ? String(rec.mileage) : "",
      status: (rec.status as string) || "in_progress",
      date: rec.date || "",
    });
  };

  const submitEdit = async () => {
    if (!selected) return;
    const payload = {
      mechanicName: editForm.mechanicName,
      serviceType: editForm.serviceType,
      description: editForm.description,
      cost: editForm.cost ? Number(editForm.cost) : undefined,
      mileage: editForm.mileage ? Number(editForm.mileage) : undefined,
      status: editForm.status,
      date: editForm.date,
    };

    updateRecord.mutate(
      { id: selected.id, data: payload },
      {
        onSuccess: (data) => {
          setSelected({ ...selected, ...data.record });
          setEditing(false);
        },
      }
    );
  };

  const mechanicLabel = (name?: string) => {
    if (!name) return "—";
    try {
      const parsed = JSON.parse(name);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch (_) {
      // ignore parse errors
    }
    return name;
  };

  const submitServiceReport = async (formData: ServiceReportFormData) => {
    const payload = {
      mechanicName: formData.mechanicName,
      serviceType: formData.serviceType,
      description: formData.description,
      cost: formData.totalCost ? Number(formData.totalCost) : formData.cost ? Number(formData.cost) : undefined,
      mileage: formData.mileage ? Number(formData.mileage) : undefined,
      status: formData.status,
      date: formData.date,
      repairRequestId: formData.repairRequestId || undefined,
      notifyDriver: formData.notifyDriver ?? false,
      notificationStatus: formData.notificationStatus || "completed_ready_for_pickup",
    };

    createRecord.mutate(payload, {
      onSuccess: () => {
        setCreateOpen(false);
      },
    });
  };

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
                <p className="text-xs text-primary-700 font-semibold uppercase tracking-[0.08em]">Service</p>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Service Records</h1>
                  <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">{records.length} total</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Technician-completed repairs with mileage, cost, and status.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => exportServiceRecords(filtered)} 
                  className="btn-secondary px-4 py-2 flex items-center gap-2"
                  disabled={filtered.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button onClick={() => refetch()} className="btn-secondary px-4 py-2 flex items-center gap-2">
                  <Loader2 className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button onClick={openCreate} className="btn-primary px-4 py-2 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New service record
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <SummaryCard title="Active" value={statusCounts.active} tone="indigo" />
              <SummaryCard title="Completed" value={statusCounts.completed} tone="green" />
              <SummaryCard title="Cancelled" value={statusCounts.cancelled} tone="gray" />
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1">
                {["all", "open", "in_progress", "completed", "cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      filter === status ? "bg-gray-900 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {statusLabels[status] || status}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search service records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm min-h-[400px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Repair</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Mechanic</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Cost & Mileage</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <ClipboardList className="h-12 w-12 mb-3 opacity-20" />
                            <p>No service records yet.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence>
                        {paginatedRecords.map((rec, i) => (
                          <motion.tr
                            key={rec.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.05 }}
                            onClick={() => setSelected(rec)}
                            className="group hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Wrench className="h-4 w-4 text-gray-400" />
                                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{rec.serviceType || rec.makeModel || "Service"}</p>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{rec.description || "—"}</p>
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {rec.date ? formatDate(rec.date) : "—"}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900">{mechanicLabel(rec.mechanicName)}</span>
                                </div>
                                {rec.vehicleLabel && <p className="text-xs text-gray-500 truncate">{rec.vehicleLabel}</p>}
                                {rec.vehicleIdentifier && <p className="text-xs text-gray-500">ID: {rec.vehicleIdentifier}</p>}
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="space-y-1 text-sm text-gray-800">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{rec.cost !== undefined ? `$${rec.cost.toFixed(2)}` : "—"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Gauge className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{rec.mileage !== undefined ? `${rec.mileage.toLocaleString()} mi` : "—"}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  statusStyles[rec.status || "in_progress"] || "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {statusLabels[rec.status || "in_progress"] || rec.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 align-top text-right">
                              <button className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">View details</button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filtered.length}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemName="service records"
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setSelected(null)} />
            <motion.div
              className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Service details</h2>
                  <p className="text-sm text-gray-500">Record ID: {selected.id.slice(0, 8)}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selected.serviceType || "Service"}</p>
                    <p className="text-xs text-gray-500">{selected.date ? formatDate(selected.date) : "—"}</p>
                  </div>
                  <span
                    className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      statusStyles[selected.status || "in_progress"]
                    }`}
                  >
                    {statusLabels[selected.status || "in_progress"]}
                  </span>
                  {/* Edit disabled per requirements
                {!editing && (
                  <button
                    onClick={() => openEdit(selected)}
                    className="ml-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </button>
                )}
                */}
                </div>

                {!editing ? (
                  <>
                    <section>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" /> Mechanic
                      </h3>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Name</p>
                          <p className="font-medium text-gray-900">{mechanicLabel(selected.mechanicName)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                          <p className="font-medium text-gray-900">{selected.vehicleLabel || selected.vehicleIdentifier || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Division</p>
                          <p className="font-medium text-gray-900">{selected.division || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Type</p>
                          <p className="font-medium text-gray-900">{selected.vehicleType || "—"}</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Work performed
                      </h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {selected.description || "—"}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Gauge className="h-4 w-4" /> Costs & mileage
                      </h3>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Approx. cost</p>
                          <p className="font-medium text-gray-900">{selected.cost !== undefined ? `$${selected.cost.toFixed(2)}` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Mileage</p>
                          <p className="font-medium text-gray-900">
                            {selected.mileage !== undefined ? `${selected.mileage.toLocaleString()} mi` : "—"}
                          </p>
                        </div>
                      </div>
                    </section>
                  </>
                ) : (
                  <div className="space-y-6">{/* Edit form content (hidden but kept in code structure) */}</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {createOpen && (
        <ServiceReportForm
          repairOptions={repairOptions}
          onClose={() => setCreateOpen(false)}
          onSubmit={submitServiceReport}
          isSubmitting={createRecord.isPending}
        />
      )}
    </div>
  );
}

function SummaryCard({ title, value, tone }: { title: string; value: number; tone: "indigo" | "green" | "gray" }) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-emerald-500 to-emerald-600",
    gray: "from-gray-400 to-gray-500",
  };
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <span className={`h-2 w-10 rounded-full bg-gradient-to-r ${colors[tone]} opacity-70`} />
      </div>
    </div>
  );
}

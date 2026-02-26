"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ServiceRecord, RepairRequest } from "@/types";
import { Wrench, ClipboardList, Plus, Loader2, Search, DollarSign, Gauge, Calendar, User, FileText, BadgeCheck, X, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const [sortField, setSortField] = useState<"date" | "serviceType" | "mechanicName" | "cost" | "mileage" | "status">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
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

  const filtered = useMemo<ServiceRecord[]>(() => {
    let list: ServiceRecord[] = records;
    if (filter !== "all") {
      list = list.filter((r: ServiceRecord) => (r.status || "in_progress") === filter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (r: ServiceRecord) =>
          r.serviceType?.toLowerCase().includes(s) ||
          r.description?.toLowerCase().includes(s) ||
          r.mechanicName?.toLowerCase().includes(s) ||
          r.vehicleIdentifier?.toLowerCase().includes(s) ||
          r.vehicleLabel?.toLowerCase().includes(s)
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sortField) {
        case "date": {
          const da = a.date ? new Date(a.date).getTime() : 0;
          const db = b.date ? new Date(b.date).getTime() : 0;
          return (da - db) * dir;
        }
        case "cost":
          return ((a.cost ?? 0) - (b.cost ?? 0)) * dir;
        case "mileage":
          return ((a.mileage ?? 0) - (b.mileage ?? 0)) * dir;
        case "serviceType":
          return (a.serviceType || "").localeCompare(b.serviceType || "") * dir;
        case "mechanicName":
          return (a.mechanicName || "").localeCompare(b.mechanicName || "") * dir;
        case "status":
          return (a.status || "").localeCompare(b.status || "") * dir;
        default:
          return 0;
      }
    });
  }, [filter, search, records, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "date" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary-600" /> : <ArrowDown className="h-3 w-3 text-primary-600" />;
  };

  // Calculate pagination
  const paginatedRecords = useMemo<ServiceRecord[]>(() => {
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
      (acc: { active: number; completed: number; cancelled: number }, r: ServiceRecord) => {
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
      <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          <div className="max-w-7xl mx-auto space-y-3">
            {/* Compact header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Service Records</h1>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">{records.length} total</span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-full">{statusCounts.active} active</span>
                  <span className="hidden sm:inline px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-600 rounded-full">{statusCounts.completed} done</span>
                  {statusCounts.cancelled > 0 && (
                    <span className="hidden sm:inline px-2 py-0.5 text-xs font-semibold bg-gray-50 text-gray-500 rounded-full">{statusCounts.cancelled} cancelled</span>
                  )}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => exportServiceRecords(filtered)}
                  className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
                  disabled={filtered.length === 0}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
                <button onClick={() => refetch()} className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5">
                  <Loader2 className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button onClick={openCreate} className="btn-primary px-3 py-1.5 text-sm flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  New record
                </button>
              </div>
            </div>

            {/* Filters + Search in one compact bar */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-0.5 overflow-x-auto flex-1 no-scrollbar">
                {["all", "open", "in_progress", "completed", "cancelled"].map((status) => {
                  const count = status === "all" ? records.length : status === "completed" ? statusCounts.completed : status === "cancelled" ? statusCounts.cancelled : status === "open" ? records.filter((r: ServiceRecord) => r.status === "open").length : status === "in_progress" ? records.filter((r: ServiceRecord) => !r.status || r.status === "in_progress").length : 0;
                  return (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        filter === status ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                    >
                      {statusLabels[status] || "All"}
                      <span className={`text-[10px] ${filter === status ? "text-gray-300" : "text-gray-400"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Table with sortable columns */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort("date")}>
                        <span className="flex items-center gap-1">Date <SortIcon field="date" /></span>
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort("serviceType")}>
                        <span className="flex items-center gap-1">Repair <SortIcon field="serviceType" /></span>
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Vehicle</th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort("mechanicName")}>
                        <span className="flex items-center gap-1">Mechanic <SortIcon field="mechanicName" /></span>
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none text-right" onClick={() => toggleSort("cost")}>
                        <span className="flex items-center gap-1 justify-end">Cost <SortIcon field="cost" /></span>
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none text-right hidden md:table-cell" onClick={() => toggleSort("mileage")}>
                        <span className="flex items-center gap-1 justify-end">Mileage <SortIcon field="mileage" /></span>
                      </th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort("status")}>
                        <span className="flex items-center gap-1">Status <SortIcon field="status" /></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} columns={7} />)
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <ClipboardList className="h-10 w-10 mb-2 opacity-20" />
                            <p className="text-sm">No service records found.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence>
                        {paginatedRecords.map((rec, i) => (
                          <motion.tr
                            key={rec.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15, delay: i * 0.02 }}
                            onClick={() => setSelected(rec)}
                            className="group hover:bg-blue-50/50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-2.5 align-top whitespace-nowrap">
                              <span className="text-xs text-gray-500">{rec.date ? formatDate(rec.date) : "—"}</span>
                            </td>
                            <td className="px-4 py-2.5 align-top">
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">{rec.serviceType || rec.makeModel || "Service"}</p>
                              <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{rec.description || ""}</p>
                            </td>
                            <td className="px-4 py-2.5 align-top hidden lg:table-cell">
                              <p className="text-xs font-medium text-gray-700 truncate max-w-[140px]">{rec.vehicleLabel || "—"}</p>
                              {rec.vehicleIdentifier && <p className="text-[11px] text-gray-400">ID: {rec.vehicleIdentifier}</p>}
                            </td>
                            <td className="px-4 py-2.5 align-top">
                              <span className="text-sm text-gray-700">{mechanicLabel(rec.mechanicName)}</span>
                            </td>
                            <td className="px-4 py-2.5 align-top text-right whitespace-nowrap">
                              <span className="text-sm text-gray-800">{rec.cost !== undefined ? `$${rec.cost.toFixed(2)}` : "—"}</span>
                            </td>
                            <td className="px-4 py-2.5 align-top text-right whitespace-nowrap hidden md:table-cell">
                              <span className="text-xs text-gray-500">{rec.mileage !== undefined ? `${rec.mileage.toLocaleString()} mi` : "—"}</span>
                            </td>
                            <td className="px-4 py-2.5 align-top">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                  statusStyles[rec.status || "in_progress"] || "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {statusLabels[rec.status || "in_progress"] || rec.status}
                              </span>
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
                <div className="px-4 py-3 border-t border-gray-200">
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

      {/* Mobile FAB - New Service Record */}
      <button
        onClick={openCreate}
        className="sm:hidden fixed bottom-6 right-4 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform safe-area-inset-bottom"
        aria-label="New service record"
      >
        <Plus className="h-6 w-6" />
      </button>

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


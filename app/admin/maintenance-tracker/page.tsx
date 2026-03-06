"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Download,
  Search,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpDown,
  Gauge,
  Pencil,
  Check,
  XCircle,
  Plus,
  ExternalLink,
  CircleDot,
} from "lucide-react";
import { exportFleetRefresh } from "@/lib/export-utils";

interface FleetVehicle {
  id: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number | null;
  vin: string;
  licensePlate: string;
  status: string;
  department: string;
  vehicleType: string;
  currentMileage: number;
  lastServiceDate: string | null;
  lastServiceMileage: number | null;
  lastServiceType: string | null;
  milesSinceService: number | null;
  daysSinceService: number | null;
  maintenanceStatus: "overdue" | "due_soon" | "good" | "no_record";
  driverName: string;
  driverEmail: string;
  driverPhone: string;
}

interface FleetData {
  vehicles: FleetVehicle[];
  summary: {
    totalVehicles: number;
    overdueCount: number;
    dueSoonCount: number;
    goodCount: number;
    noRecordCount: number;
  };
}

type SortField = "maintenanceStatus" | "milesSinceService" | "daysSinceService" | "currentMileage" | "vehicleNumber" | "lastServiceDate" | "department";
type StatusFilter = "all" | "overdue" | "due_soon" | "good" | "no_record";

const SERVICE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Tire Replacement",
  "Brake Service",
  "Transmission Service",
  "Coolant Flush",
  "Air Filter",
  "Battery Replacement",
  "Belt / Hose Replacement",
  "Alignment",
  "Fluid Top-Off",
  "Inspection",
  "Repair",
  "Other",
];

const statusOrder = { overdue: 0, due_soon: 1, no_record: 2, good: 3 };

export default function MaintenanceTrackerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<FleetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("maintenanceStatus");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Inline mileage editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Log Service modal
  const [logVehicle, setLogVehicle] = useState<FleetVehicle | null>(null);
  const [logForm, setLogForm] = useState({ serviceTypes: ["Oil Change"] as string[], mileage: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [logSaving, setLogSaving] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/vehicles/maintenance-tracker")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    setUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveMileage = async (vehicleId: string) => {
    const mileage = parseInt(editValue.replace(/,/g, ""), 10);
    if (isNaN(mileage) || mileage < 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mileage }),
      });
      if (res.ok) {
        fetchData(); // Refresh to recalculate all statuses
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to update mileage:", err);
    }
    setSaving(false);
  };

  const handleLogService = async () => {
    if (!logVehicle || !user || logForm.serviceTypes.length === 0) return;
    setLogSaving(true);
    try {
      const mileage = logForm.mileage ? parseInt(logForm.mileage.replace(/,/g, ""), 10) : undefined;
      const serviceLabel = logForm.serviceTypes.join(", ");
      const res = await fetch("/api/service-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: logVehicle.id,
          serviceType: `Maintenance: ${serviceLabel}`,
          description: logForm.notes || `${serviceLabel} — logged from Maintenance Tracker`,
          mechanicName: user.name || "Admin",
          mileage: mileage && mileage > 0 ? mileage : undefined,
          date: logForm.date,
          status: "completed",
        }),
      });
      if (res.ok) {
        setLogVehicle(null);
        setLogForm({ serviceTypes: ["Oil Change"], mileage: "", date: new Date().toISOString().split("T")[0], notes: "" });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to log service:", err);
    }
    setLogSaving(false);
  };

  const departments = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.vehicles.map((v) => v.department).filter(Boolean))).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.vehicles;

    if (departmentFilter !== "all") {
      list = list.filter((v) => v.department === departmentFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((v) => v.maintenanceStatus === statusFilter);
    }

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (v) =>
          v.vehicleNumber.toLowerCase().includes(s) ||
          v.make.toLowerCase().includes(s) ||
          v.model.toLowerCase().includes(s) ||
          v.vin.toLowerCase().includes(s) ||
          v.driverName.toLowerCase().includes(s) ||
          v.department.toLowerCase().includes(s)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "maintenanceStatus":
          aVal = statusOrder[a.maintenanceStatus];
          bVal = statusOrder[b.maintenanceStatus];
          break;
        case "milesSinceService":
          aVal = a.milesSinceService ?? -1;
          bVal = b.milesSinceService ?? -1;
          break;
        case "daysSinceService":
          aVal = a.daysSinceService ?? -1;
          bVal = b.daysSinceService ?? -1;
          break;
        case "currentMileage":
          aVal = a.currentMileage;
          bVal = b.currentMileage;
          break;
        case "vehicleNumber":
          aVal = a.vehicleNumber;
          bVal = b.vehicleNumber;
          break;
        case "lastServiceDate":
          aVal = a.lastServiceDate || "";
          bVal = b.lastServiceDate || "";
          break;
        case "department":
          aVal = a.department;
          bVal = b.department;
          break;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [data, departmentFilter, statusFilter, searchTerm, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "vehicleNumber" || field === "department" ? "asc" : "desc");
    }
  };

  const getRowColor = (v: FleetVehicle) => {
    switch (v.maintenanceStatus) {
      case "overdue": return "bg-red-50/70";
      case "due_soon": return "bg-amber-50/70";
      case "no_record": return "bg-gray-50/50";
      default: return "";
    }
  };

  const getStatusBadge = (v: FleetVehicle) => {
    const mileLabel = v.milesSinceService !== null ? `${v.milesSinceService.toLocaleString()} mi` : null;
    const dayLabel = v.daysSinceService !== null ? `${v.daysSinceService}d ago` : null;
    const detail = [mileLabel, dayLabel].filter(Boolean).join(" · ");

    switch (v.maintenanceStatus) {
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
            <AlertTriangle className="h-3 w-3" />
            Overdue {detail && <span className="font-medium">· {detail}</span>}
          </span>
        );
      case "due_soon":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
            <Clock className="h-3 w-3" />
            Due Soon {detail && <span className="font-medium">· {detail}</span>}
          </span>
        );
      case "good":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
            <CheckCircle2 className="h-3 w-3" />
            Good {detail && <span className="font-medium">· {detail}</span>}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
            <CircleDot className="h-3 w-3" />
            No Record
          </span>
        );
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition-colors ${className || ""}`}
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? "text-primary-600" : "text-gray-300"}`} />
    </button>
  );

  if (!user) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || "admin"} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs text-primary-700 font-semibold uppercase tracking-[0.08em]">Fleet</p>
                <h1 className="text-2xl font-bold text-gray-900">Maintenance Tracker</h1>
                <p className="text-sm text-gray-500 mt-0.5">Track service status by mileage and time — click any vehicle to log service</p>
              </div>
              {data && (
                <button
                  onClick={() => exportFleetRefresh(filtered, departmentFilter)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export to Excel
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : data ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`bg-white rounded-xl border p-4 text-left transition-all ${statusFilter === "all" ? "border-primary-300 ring-1 ring-primary-200" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Fleet</p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1">{data.summary.totalVehicles}</p>
                  </button>
                  <button
                    onClick={() => setStatusFilter(statusFilter === "overdue" ? "all" : "overdue")}
                    className={`bg-white rounded-xl border p-4 text-left transition-all ${statusFilter === "overdue" ? "border-red-300 ring-1 ring-red-200" : "border-gray-200 hover:border-red-300"}`}
                  >
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Overdue</p>
                    <p className="text-3xl font-extrabold text-red-600 mt-1">{data.summary.overdueCount}</p>
                    <p className="text-[10px] text-red-400 mt-0.5">10K+ mi or 6+ months</p>
                  </button>
                  <button
                    onClick={() => setStatusFilter(statusFilter === "due_soon" ? "all" : "due_soon")}
                    className={`bg-white rounded-xl border p-4 text-left transition-all ${statusFilter === "due_soon" ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200 hover:border-amber-300"}`}
                  >
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Due Soon</p>
                    <p className="text-3xl font-extrabold text-amber-600 mt-1">{data.summary.dueSoonCount}</p>
                    <p className="text-[10px] text-amber-400 mt-0.5">7.5K+ mi or 4+ months</p>
                  </button>
                  <button
                    onClick={() => setStatusFilter(statusFilter === "good" ? "all" : "good")}
                    className={`bg-white rounded-xl border p-4 text-left transition-all ${statusFilter === "good" ? "border-green-300 ring-1 ring-green-200" : "border-gray-200 hover:border-green-300"}`}
                  >
                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Good</p>
                    <p className="text-3xl font-extrabold text-green-600 mt-1">{data.summary.goodCount}</p>
                  </button>
                  <button
                    onClick={() => setStatusFilter(statusFilter === "no_record" ? "all" : "no_record")}
                    className={`bg-white rounded-xl border p-4 text-left transition-all ${statusFilter === "no_record" ? "border-gray-400 ring-1 ring-gray-300" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">No Record</p>
                    <p className="text-3xl font-extrabold text-gray-500 mt-1">{data.summary.noRecordCount}</p>
                  </button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by #, make, model, VIN, driver..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap self-center">{filtered.length} vehicles</span>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/50">
                          <th className="px-4 py-3 text-left"><SortHeader field="vehicleNumber" label="Vehicle #" /></th>
                          <th className="px-4 py-3 text-left hidden sm:table-cell">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Make / Model</span>
                          </th>
                          <th className="px-4 py-3 text-left hidden lg:table-cell"><SortHeader field="department" label="Dept" /></th>
                          <th className="px-4 py-3 text-right"><SortHeader field="currentMileage" label="Current Mi" className="justify-end" /></th>
                          <th className="px-4 py-3 text-right hidden sm:table-cell"><SortHeader field="lastServiceDate" label="Last Service" className="justify-end" /></th>
                          <th className="px-4 py-3 text-left"><SortHeader field="maintenanceStatus" label="Status" /></th>
                          <th className="px-4 py-3 text-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                              <Gauge className="h-10 w-10 mx-auto mb-3 opacity-30" />
                              <p className="text-sm font-medium">No vehicles match your filters</p>
                            </td>
                          </tr>
                        ) : (
                          filtered.map((v) => (
                            <tr key={v.id} className={`${getRowColor(v)} hover:bg-gray-100/50 transition-colors`}>
                              {/* Vehicle # — clickable */}
                              <td className="px-4 py-3">
                                <Link
                                  href={`/admin/vehicles?search=${encodeURIComponent(v.vehicleNumber)}`}
                                  className="group inline-flex items-center gap-1 font-mono font-bold text-sm text-gray-900 hover:text-primary-600 transition-colors"
                                >
                                  {v.vehicleNumber || "—"}
                                  <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-primary-400 transition-colors" />
                                </Link>
                                <p className="text-xs text-gray-500 sm:hidden">{v.make} {v.model}</p>
                              </td>

                              {/* Make / Model */}
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className="text-sm text-gray-900">{v.year ? `${v.year} ` : ""}{v.make} {v.model}</span>
                                {v.lastServiceType && (
                                  <p className="text-[11px] text-gray-400 mt-0.5">Last: {v.lastServiceType}</p>
                                )}
                              </td>

                              {/* Department */}
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className="text-xs text-gray-600">{v.department || "—"}</span>
                              </td>

                              {/* Current Mileage — editable */}
                              <td className="px-4 py-3 text-right">
                                {editingId === v.id ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value.replace(/[^0-9,]/g, ""))}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveMileage(v.id);
                                        if (e.key === "Escape") setEditingId(null);
                                      }}
                                      autoFocus
                                      className="w-24 px-2 py-1 text-sm text-right font-semibold border border-primary-300 rounded-md focus:ring-2 focus:ring-primary-300 focus:outline-none"
                                    />
                                    <button onClick={() => handleSaveMileage(v.id)} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                                      <XCircle className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setEditingId(v.id); setEditValue(v.currentMileage > 0 ? v.currentMileage.toLocaleString() : ""); }}
                                    className="group/edit inline-flex items-center gap-1 text-sm font-semibold text-gray-900 tabular-nums hover:text-primary-600 transition-colors"
                                    title="Click to update mileage"
                                  >
                                    {v.currentMileage > 0 ? v.currentMileage.toLocaleString() : "—"}
                                    <Pencil className="h-3 w-3 text-gray-300 group-hover/edit:text-primary-400 transition-colors" />
                                  </button>
                                )}
                              </td>

                              {/* Last Service Date */}
                              <td className="px-4 py-3 text-right hidden sm:table-cell">
                                <span className="text-xs text-gray-600">{formatDate(v.lastServiceDate)}</span>
                                {v.daysSinceService !== null && (
                                  <p className="text-[11px] text-gray-400">{v.daysSinceService}d ago</p>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="px-4 py-3">{getStatusBadge(v)}</td>

                              {/* Log Service Button */}
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setLogVehicle(v);
                                    setLogForm({
                                      serviceTypes: ["Oil Change"],
                                      mileage: v.currentMileage > 0 ? v.currentMileage.toLocaleString() : "",
                                      date: new Date().toISOString().split("T")[0],
                                      notes: "",
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 border border-primary-200 transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                  Log Service
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
                    <span>Overdue — 10K+ mi or 6+ months</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
                    <span>Due Soon — 7.5K+ mi or 4+ months</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
                    <span>Good — under 7.5K mi and under 4 months</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
                    <span>No service record on file</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-gray-400">Failed to load maintenance data.</div>
            )}
          </div>
        </main>
      </div>

      {/* Log Service Modal */}
      {logVehicle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setLogVehicle(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-primary-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">Log Service</p>
                  <h3 className="text-lg font-bold mt-0.5">
                    Vehicle #{logVehicle.vehicleNumber}
                  </h3>
                  <p className="text-sm text-primary-200 mt-0.5">
                    {logVehicle.year ? `${logVehicle.year} ` : ""}{logVehicle.make} {logVehicle.model}
                  </p>
                </div>
                <button onClick={() => setLogVehicle(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Service Types — multi-select */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  What was done? <span className="text-gray-400 font-normal normal-case">(select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2.5">
                  {SERVICE_TYPES.map((t) => {
                    const checked = logForm.serviceTypes.includes(t);
                    return (
                      <label
                        key={t}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                          checked ? "bg-primary-50 text-primary-700 font-medium" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setLogForm((prev) => ({
                              ...prev,
                              serviceTypes: checked
                                ? prev.serviceTypes.filter((s) => s !== t)
                                : [...prev.serviceTypes, t],
                            }));
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        {t}
                      </label>
                    );
                  })}
                </div>
                {logForm.serviceTypes.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Select at least one service type</p>
                )}
              </div>

              {/* Date & Mileage Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Service Date</label>
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mileage at Service</label>
                  <input
                    type="text"
                    value={logForm.mileage}
                    onChange={(e) => setLogForm({ ...logForm, mileage: e.target.value.replace(/[^0-9,]/g, "") })}
                    placeholder={logVehicle.currentMileage > 0 ? logVehicle.currentMileage.toLocaleString() : "Enter mileage"}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notes <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                <textarea
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="Any additional details..."
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-300 focus:border-primary-300 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setLogVehicle(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogService}
                disabled={logSaving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {logSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Service Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

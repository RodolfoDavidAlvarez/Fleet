"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
  X,
  Filter,
  Loader2,
  TrendingUp,
  Mail,
  Minus,
  Save,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";

interface FieldStat {
  complete: number;
  missing: number;
  applicable: number;
  na: number;
  percentage: number;
}

interface VehicleDetail {
  id: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number | null;
  vin: string;
  licensePlate: string;
  mileage: number;
  status: string;
  department: string;
  driverName: string;
  driverId: string | null;
  vehicleType: string;
  completeness: number;
  requiredFields: number;
  requiredComplete: number;
  isComplete: boolean;
  missingFields: string[];
  missingFieldKeys: string[];
  fieldResults: Record<string, "pass" | "missing" | "na">;
}

interface ComplianceData {
  summary: {
    totalVehicles: number;
    completeRecords: number;
    incompleteRecords: number;
    overallCompleteness: number;
  };
  fieldStats: Record<string, FieldStat>;
  checkLabels: Record<string, string>;
  typeBreakdown: Record<string, { total: number; complete: number; incomplete: number }>;
  vehicles: VehicleDetail[];
}

const BAR_COLORS: Record<string, string> = {
  vehicleNumber: "bg-blue-500",
  make: "bg-indigo-500",
  model: "bg-violet-500",
  year: "bg-purple-500",
  vin: "bg-red-500",
  licensePlate: "bg-orange-500",
  mileage: "bg-amber-500",
  department: "bg-teal-500",
  driver: "bg-green-500",
};

// Map field keys to DB column names for updates
const FIELD_TO_DB: Record<string, string> = {
  vehicleNumber: "vehicle_number",
  make: "make",
  model: "model",
  year: "year",
  vin: "vin",
  licensePlate: "license_plate",
  mileage: "mileage",
  department: "department",
};

export default function CompliancePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState<string>("all");
  const [showComplete, setShowComplete] = useState<"all" | "complete" | "incomplete">("incomplete");
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    setUser(JSON.parse(userData));
  }, [router]);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/compliance")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = async (vehicleId: string, fieldKey: string, value: string) => {
    const dbCol = FIELD_TO_DB[fieldKey];
    if (!dbCol) return;

    setSavingField(`${vehicleId}-${fieldKey}`);
    try {
      let parsedValue: any = value;
      if (fieldKey === "year") parsedValue = parseInt(value) || null;
      if (fieldKey === "mileage") parsedValue = parseInt(value) || 0;

      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [dbCol]: parsedValue }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("Field updated", "success");
      fetchData(); // Refresh compliance data
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSavingField(null);
    }
  };

  const filteredVehicles = useMemo(() => {
    if (!data) return [];
    let list = data.vehicles;
    if (showComplete === "complete") list = list.filter((v) => v.isComplete);
    else if (showComplete === "incomplete") list = list.filter((v) => !v.isComplete);
    if (filterField !== "all") list = list.filter((v) => v.fieldResults[filterField] === "missing");
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter((v) =>
        v.vehicleNumber.toLowerCase().includes(s) ||
        v.make.toLowerCase().includes(s) ||
        v.model.toLowerCase().includes(s) ||
        v.vin.toLowerCase().includes(s) ||
        v.driverName.toLowerCase().includes(s) ||
        v.department.toLowerCase().includes(s)
      );
    }
    return list;
  }, [data, showComplete, filterField, searchTerm]);

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      const res = await fetch("/api/compliance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: ["rodolfo@bettersystems.ai"] }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast(`Report sent to ${result.sentCount} recipient(s)`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send report", "error");
    } finally {
      setSendingReport(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || "admin"} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-primary-700 font-semibold uppercase tracking-[0.08em]">Fleet</p>
                  <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
                </div>
                {data && (
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-green-200">
                      <CheckCircle2 className="h-3 w-3" /> {data.summary.completeRecords} Complete
                    </span>
                    <span className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-200">
                      <XCircle className="h-3 w-3" /> {data.summary.incompleteRecords} Need Work
                    </span>
                  </div>
                )}
              </div>
              {data && (
                <button
                  onClick={handleSendReport}
                  disabled={sendingReport}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {sendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send Report
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : data ? (
              <>
                {/* Score + Type Breakdown Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {/* Overall Score - Big */}
                  <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" stroke="#f3f4f6" strokeWidth="7" fill="none" />
                        <circle
                          cx="40" cy="40" r="34"
                          stroke={data.summary.overallCompleteness >= 80 ? "#22c55e" : data.summary.overallCompleteness >= 50 ? "#eab308" : "#ef4444"}
                          strokeWidth="7" fill="none"
                          strokeDasharray={`${(data.summary.overallCompleteness / 100) * 213.6} 213.6`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-extrabold text-gray-900">{data.summary.overallCompleteness}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Overall Completeness</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {data.summary.completeRecords} of {data.summary.totalVehicles} records fully complete
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">Requirements adjusted per vehicle type</p>
                    </div>
                  </div>

                  {/* Type Breakdown Cards */}
                  {Object.entries(data.typeBreakdown).map(([type, stats]) => {
                    const pct = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 100;
                    return (
                      <div key={type} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{type}</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-extrabold text-gray-900">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                          <div
                            className={`h-1.5 rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1.5">
                          {stats.complete}/{stats.total} complete
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Field Bars — Horizontal compact */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">Fields Needing Attention</h3>
                    {filterField !== "all" && (
                      <button onClick={() => setFilterField("all")} className="flex items-center gap-1 text-xs text-primary-600 font-semibold hover:underline">
                        <X className="h-3 w-3" /> Clear filter
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                    {Object.entries(data.fieldStats)
                      .filter(([, stat]) => stat.applicable > 0)
                      .sort(([, a], [, b]) => a.percentage - b.percentage)
                      .map(([key, stat]) => (
                        <button
                          key={key}
                          onClick={() => { setFilterField(filterField === key ? "all" : key); setShowComplete("incomplete"); }}
                          className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition-all text-left ${
                            filterField === key ? "bg-primary-50 ring-1 ring-primary-300" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-semibold text-gray-700 truncate">{data.checkLabels[key]}</span>
                              <span className="text-xs font-bold text-gray-900 ml-2">{stat.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${BAR_COLORS[key] || "bg-gray-500"}`} style={{ width: `${stat.percentage}%` }} />
                            </div>
                          </div>
                          {stat.missing > 0 && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {stat.missing}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                    {(["incomplete", "all", "complete"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setShowComplete(opt)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          showComplete === opt ? "bg-primary-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {opt === "all" ? `All (${data.summary.totalVehicles})` :
                         opt === "incomplete" ? `Need Work (${data.summary.incompleteRecords})` :
                         `Complete (${data.summary.completeRecords})`}
                      </button>
                    ))}
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
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap self-center">{filteredVehicles.length} vehicles</span>
                </div>

                {/* Vehicle Records */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {filteredVehicles.length === 0 ? (
                      <div className="px-4 py-12 text-center text-gray-400">
                        <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">
                          {showComplete === "complete" ? "No fully complete records." :
                           showComplete === "incomplete" ? "All records are complete!" : "No vehicles found."}
                        </p>
                      </div>
                    ) : (
                      filteredVehicles.map((v) => {
                        const isExpanded = expandedVehicle === v.id;
                        const isEditing = editingVehicle === v.id;

                        return (
                          <div key={v.id}>
                            {/* Row */}
                            <button
                              onClick={() => {
                                setExpandedVehicle(isExpanded ? null : v.id);
                                if (!isExpanded) {
                                  // Pre-fill edit values
                                  setEditValues({
                                    vehicleNumber: v.vehicleNumber,
                                    make: v.make,
                                    model: v.model,
                                    year: v.year?.toString() || "",
                                    vin: v.vin,
                                    licensePlate: v.licensePlate,
                                    mileage: v.mileage > 0 ? v.mileage.toString() : "",
                                    department: v.department,
                                  });
                                }
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isExpanded ? "bg-gray-50" : ""}`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Score Circle */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                                  v.completeness === 100 ? "bg-green-100 text-green-700" :
                                  v.completeness >= 70 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                }`}>
                                  {v.completeness}%
                                </div>

                                {/* Vehicle Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-sm text-gray-900">{v.vehicleNumber || "No ID"}</span>
                                    <span className="text-xs text-gray-500">{v.vehicleType}</span>
                                    {v.isComplete && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                                  </div>
                                  <p className="text-xs text-gray-600 truncate">
                                    {v.make && v.model ? `${v.year || ""} ${v.make} ${v.model}`.trim() : "Missing vehicle details"}
                                    {v.driverName && ` · ${v.driverName}`}
                                  </p>
                                </div>

                                {/* Missing fields badges */}
                                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                                  {v.missingFields.slice(0, 3).map((f) => (
                                    <span key={f} className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                      {f}
                                    </span>
                                  ))}
                                  {v.missingFields.length > 3 && (
                                    <span className="text-[10px] text-gray-500">+{v.missingFields.length - 3}</span>
                                  )}
                                  {v.isComplete && (
                                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                      All complete
                                    </span>
                                  )}
                                </div>

                                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                              </div>
                            </button>

                            {/* Expanded Detail with Inline Editing */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                                    {/* Toggle edit mode */}
                                    <div className="flex items-center justify-between mb-3">
                                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        {v.vehicleType} — {v.requiredComplete}/{v.requiredFields} required fields
                                      </p>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingVehicle(isEditing ? null : v.id);
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                          isEditing ? "bg-primary-100 text-primary-700" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                        }`}
                                      >
                                        <Pencil className="h-3 w-3" />
                                        {isEditing ? "Done Editing" : "Edit Fields"}
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {Object.entries(v.fieldResults).map(([key, status]) => {
                                        const label = data.checkLabels[key] || key;
                                        const isSaving = savingField === `${v.id}-${key}`;
                                        const canEdit = isEditing && FIELD_TO_DB[key] && status !== "na";

                                        // Get current value for display
                                        let displayValue = "";
                                        if (key === "vehicleNumber") displayValue = v.vehicleNumber;
                                        else if (key === "make") displayValue = v.make;
                                        else if (key === "model") displayValue = v.model;
                                        else if (key === "year") displayValue = v.year?.toString() || "";
                                        else if (key === "vin") displayValue = v.vin;
                                        else if (key === "licensePlate") displayValue = v.licensePlate;
                                        else if (key === "mileage") displayValue = v.mileage > 0 ? v.mileage.toLocaleString() : "";
                                        else if (key === "department") displayValue = v.department;
                                        else if (key === "driver") displayValue = v.driverName;

                                        return (
                                          <div
                                            key={key}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                                              status === "pass" ? "bg-green-50 border-green-200" :
                                              status === "na" ? "bg-gray-50 border-gray-200" :
                                              "bg-red-50 border-red-200"
                                            }`}
                                          >
                                            {status === "pass" ? (
                                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                            ) : status === "na" ? (
                                              <Minus className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                            ) : (
                                              <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                status === "pass" ? "text-green-600" : status === "na" ? "text-gray-400" : "text-red-600"
                                              }`}>
                                                {label} {status === "na" && "(N/A)"}
                                              </span>
                                              {canEdit && status === "missing" ? (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                  <input
                                                    type={key === "year" || key === "mileage" ? "number" : "text"}
                                                    value={editValues[key] || ""}
                                                    onChange={(e) => setEditValues({ ...editValues, [key]: e.target.value })}
                                                    onClick={(e) => e.stopPropagation()}
                                                    placeholder={`Enter ${label.toLowerCase()}`}
                                                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-primary-300 focus:border-primary-300 min-w-0"
                                                  />
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (editValues[key]?.trim()) saveField(v.id, key, editValues[key]);
                                                    }}
                                                    disabled={isSaving || !editValues[key]?.trim()}
                                                    className="p-1 text-primary-600 hover:bg-primary-100 rounded disabled:opacity-30"
                                                  >
                                                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                                  </button>
                                                </div>
                                              ) : displayValue ? (
                                                <p className="text-xs text-gray-700 truncate">{displayValue}</p>
                                              ) : null}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-gray-400">Failed to load compliance data.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

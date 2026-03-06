"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  List,
  Megaphone,
  Search,
  TrendingUp,
  Truck,
  User,
  X,
  XCircle,
  Camera,
  Wrench,
  Fuel,
  FileText,
  Calendar,
  LayoutGrid,
} from "lucide-react";

interface OverviewData {
  summary: {
    totalVehicles: number;
    inspectedLast90Days: number;
    overdueOrCritical: number;
    criticalIssues: number;
    complianceRate: number;
  };
  vehicles: any[];
  departments: string[];
  flaggedItems: any[];
  campaigns: any[];
  managerActivity: Record<string, number>;
}

function StatusBadge({ status }: { status: "green" | "yellow" | "red" }) {
  const config = {
    green: { bg: "bg-green-100", text: "text-green-700", label: "OK" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Due Soon" },
    red: { bg: "bg-red-100", text: "text-red-700", label: "Overdue" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      {status === "green" && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {status === "yellow" && <Clock className="h-3 w-3 mr-1" />}
      {status === "red" && <XCircle className="h-3 w-3 mr-1" />}
      {c.label}
    </span>
  );
}

function ConditionDot({ value }: { value: string }) {
  const colors: Record<string, string> = {
    good: "bg-green-500",
    fair: "bg-yellow-500",
    poor: "bg-orange-500",
    critical: "bg-red-500",
  };
  return (
    <span className={`inline-block w-3 h-3 rounded-full ${colors[value] || "bg-gray-300"}`} title={value} />
  );
}

function ConditionBadge({ label, value }: { label: string; value: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    good: { bg: "bg-green-100", text: "text-green-700" },
    fair: { bg: "bg-yellow-100", text: "text-yellow-700" },
    poor: { bg: "bg-orange-100", text: "text-orange-700" },
    critical: { bg: "bg-red-100", text: "text-red-700" },
  };
  const c = config[value] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${c.bg} ${c.text}`}>
        {value}
      </span>
    </div>
  );
}

function InspectionCard({ inspection, isExpanded, onToggle, showVehicleBadge }: { inspection: any; isExpanded: boolean; onToggle: () => void; showVehicleBadge?: boolean }) {
  const date = new Date(inspection.created_at);
  const hasCritical = ["tire_condition", "brake_condition", "fluid_levels", "body_condition"]
    .some(f => inspection[f] === "critical" || inspection[f] === "poor");
  const allGood = ["tire_condition", "brake_condition", "fluid_levels", "body_condition"]
    .every(f => inspection[f] === "good");

  return (
    <div className={`bg-white rounded-xl border transition-all ${hasCritical ? "border-red-200" : allGood ? "border-green-100" : "border-gray-100"} ${isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            hasCritical ? "bg-red-100" : allGood ? "bg-green-100" : "bg-yellow-100"
          }`}>
            {inspection.is_fuel_entry ? (
              <Fuel className={`h-4 w-4 ${hasCritical ? "text-red-600" : "text-blue-600"}`} />
            ) : hasCritical ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : allGood ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {showVehicleBadge && inspection.vehicle_number && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-gray-900 text-white">
                  #{inspection.vehicle_number}
                </span>
              )}
              <span className="font-semibold text-gray-900 text-sm">
                {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-xs text-gray-400">
                {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
            <div className="text-xs text-gray-500 truncate">
              {inspection.driver_name}
              {inspection.current_mileage && ` \u00B7 ${inspection.current_mileage.toLocaleString()} mi`}
              {hasCritical && <span className="text-red-500 font-semibold ml-1">Issues found</span>}
              {allGood && <span className="text-green-600 font-medium ml-1">All good</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <ConditionDot value={inspection.tire_condition} />
            <ConditionDot value={inspection.brake_condition} />
            <ConditionDot value={inspection.fluid_levels} />
            <ConditionDot value={inspection.body_condition} />
          </div>
          <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400 text-xs block">Driver</span>
              <span className="font-medium text-gray-900">{inspection.driver_name}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">Mileage</span>
              <span className="font-medium text-gray-900">
                {inspection.current_mileage ? `${inspection.current_mileage.toLocaleString()} mi` : "N/A"}
              </span>
            </div>
            {inspection.driver_phone && (
              <div>
                <span className="text-gray-400 text-xs block">Phone</span>
                <span className="font-medium text-gray-900">{inspection.driver_phone}</span>
              </div>
            )}
            {inspection.vehicle_number && (
              <div>
                <span className="text-gray-400 text-xs block">Vehicle #</span>
                <span className="font-medium text-gray-900">#{inspection.vehicle_number}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 text-xs block">Status</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                inspection.status === "reviewed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              }`}>
                {inspection.status}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vehicle Condition</h4>
            <ConditionBadge label="Tires" value={inspection.tire_condition} />
            <ConditionBadge label="Brakes" value={inspection.brake_condition} />
            <ConditionBadge label="Fluids" value={inspection.fluid_levels} />
            <ConditionBadge label="Body" value={inspection.body_condition} />
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">Lights Working</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                inspection.lights_working ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {inspection.lights_working ? "Yes" : "No"}
              </span>
            </div>
            {inspection.warning_lights_on && (
              <div className="mt-2 p-2 bg-red-50 rounded-lg">
                <div className="flex items-center gap-1 text-red-700 text-xs font-bold mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  Warning Lights ON
                </div>
                {inspection.warning_lights_description && (
                  <p className="text-xs text-red-600">{inspection.warning_lights_description}</p>
                )}
              </div>
            )}
          </div>

          {(inspection.last_oil_change_date || inspection.last_maintenance_date) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reported Maintenance</h4>
              {inspection.last_oil_change_date && (
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-gray-600">Last Oil Change</span>
                  <span className="font-medium text-gray-900">
                    {new Date(inspection.last_oil_change_date).toLocaleDateString()}
                    {inspection.last_oil_change_mileage && ` @ ${inspection.last_oil_change_mileage.toLocaleString()} mi`}
                  </span>
                </div>
              )}
              {inspection.last_maintenance_date && (
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-gray-600">Last Maintenance</span>
                  <span className="font-medium text-gray-900">
                    {new Date(inspection.last_maintenance_date).toLocaleDateString()}
                    {inspection.last_maintenance_type && ` (${inspection.last_maintenance_type})`}
                  </span>
                </div>
              )}
            </div>
          )}

          {inspection.is_fuel_entry && inspection.fuel_gallons && (
            <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
              <Fuel className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Fuel: {inspection.fuel_gallons} gallons
              </span>
            </div>
          )}

          {inspection.notes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Notes</h4>
              <p className="text-sm text-gray-700">{inspection.notes}</p>
            </div>
          )}

          {inspection.photo_urls && inspection.photo_urls.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Photos ({inspection.photo_urls.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {inspection.photo_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Inspection photo ${i + 1}`}
                      className="rounded-lg w-full h-20 object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InspectionsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "green" | "yellow" | "red">("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "Vehicle Inspection Required",
    description: "",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    frequency: "one_time",
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
  const [broadcastMode, setBroadcastMode] = useState<"all" | "select">("all");
  const [broadcastDriverSearch, setBroadcastDriverSearch] = useState("");
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
  const [allDrivers, setAllDrivers] = useState<any[]>([]);

  // Default to "feed" tab
  const [activeTab, setActiveTab] = useState<"vehicles" | "feed">("feed");

  // Detail panel state
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicleInspections, setVehicleInspections] = useState<any[]>([]);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);

  // Feed state
  const [feedInspections, setFeedInspections] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedDateFilter, setFeedDateFilter] = useState<string>("7");
  const [feedVehicleFilter, setFeedVehicleFilter] = useState<string>("all");
  const [feedDriverFilter, setFeedDriverFilter] = useState<string>("");
  const [feedExpandedId, setFeedExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") { router.push("/login"); return; }
    setUser(parsedUser);
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/inspections/overview");
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to load inspection data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user, fetchData]);

  // Fetch feed on mount (since it's the default tab)
  const fetchFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const res = await fetch(`/api/inspections?limit=200`);
      if (res.ok) {
        const result = await res.json();
        setFeedInspections(result.inspections || []);
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchFeed();
  }, [user, fetchFeed]);

  // Fetch inspections for selected vehicle
  const openVehicleDetail = useCallback(async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setExpandedInspection(null);
    setLoadingInspections(true);
    try {
      const res = await fetch(`/api/inspections?vehicle_id=${vehicle.id}&limit=50`);
      if (res.ok) {
        const result = await res.json();
        setVehicleInspections(result.inspections || []);
        if (result.inspections?.length > 0) {
          setExpandedInspection(result.inspections[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load vehicle inspections:", err);
    } finally {
      setLoadingInspections(false);
    }
  }, []);

  // Fetch all drivers when broadcast modal opens
  const openBroadcastModal = useCallback(async () => {
    setShowBroadcast(true);
    setBroadcastMode("all");
    setSelectedDriverIds(new Set());
    setBroadcastDriverSearch("");
    try {
      const res = await fetch("/api/drivers?approval_status=approved");
      if (res.ok) {
        const result = await res.json();
        setAllDrivers((result.drivers || result).filter((d: any) => d.phone));
      }
    } catch (err) {
      console.error("Failed to load drivers:", err);
    }
  }, []);

  const handleBroadcast = async () => {
    if (broadcastMode === "select" && selectedDriverIds.size === 0) return;
    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const payload: any = { ...broadcastForm };
      if (broadcastMode === "select") {
        payload.driverIds = Array.from(selectedDriverIds);
      }
      const res = await fetch("/api/inspections/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        setBroadcastResult(`Sent to ${result.sentCount}/${result.totalDrivers} drivers`);
        setShowBroadcast(false);
        fetchData();
      } else {
        setBroadcastResult(`Error: ${result.error}`);
      }
    } catch (err: any) {
      setBroadcastResult(`Error: ${err.message}`);
    } finally {
      setBroadcasting(false);
    }
  };

  // Filter feed inspections
  const filteredFeed = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const daysBack = feedDateFilter === "all" ? Infinity : parseInt(feedDateFilter) * dayMs;

    return feedInspections.filter((insp: any) => {
      const inspDate = new Date(insp.created_at).getTime();
      if (daysBack !== Infinity && now - inspDate > daysBack) return false;
      if (feedVehicleFilter !== "all" && insp.vehicle_number !== feedVehicleFilter) return false;
      if (feedDriverFilter && !(insp.driver_name || "").toLowerCase().includes(feedDriverFilter.toLowerCase())) return false;
      return true;
    });
  }, [feedInspections, feedDateFilter, feedVehicleFilter, feedDriverFilter]);

  // Unique vehicle numbers from feed
  const feedVehicleNumbers = useMemo(() => {
    const nums = new Set<string>();
    for (const insp of feedInspections) {
      if (insp.vehicle_number) nums.add(insp.vehicle_number);
    }
    return [...nums].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [feedInspections]);

  // Compute filtered + sorted vehicles
  const { sortedVehicles, deptCounts } = useMemo(() => {
    const allVehicles = data?.vehicles || [];

    const counts: Record<string, number> = {};
    for (const v of allVehicles) {
      const dept = v.department || "Unassigned";
      counts[dept] = (counts[dept] || 0) + 1;
    }

    const filtered = allVehicles.filter((v: any) => {
      const matchSearch =
        !search ||
        (v.vehicle_number || "").toLowerCase().includes(search.toLowerCase()) ||
        `${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase()) ||
        (v.department || "").toLowerCase().includes(search.toLowerCase()) ||
        (v.assignedDriver || "").toLowerCase().includes(search.toLowerCase()) ||
        (v.latestInspection?.driver_name || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || v.healthStatus === filterStatus;
      const matchDept =
        filterDept === "all" ||
        (filterDept === "Unassigned" ? !v.department : v.department === filterDept);
      return matchSearch && matchStatus && matchDept;
    });

    // Sort: red first, then yellow, then green
    // Within same status: vehicles with vehicle_number first, then by number
    const sorted = filtered.sort((a: any, b: any) => {
      const order = { red: 0, yellow: 1, green: 2 };
      const statusDiff = (order[a.healthStatus as keyof typeof order] ?? 3) - (order[b.healthStatus as keyof typeof order] ?? 3);
      if (statusDiff !== 0) return statusDiff;

      // Within same status: vehicles with make/model first
      const aHasInfo = a.make && a.model ? 0 : 1;
      const bHasInfo = b.make && b.model ? 0 : 1;
      if (aHasInfo !== bHasInfo) return aHasInfo - bHasInfo;

      // Then by vehicle_number numerically
      const aNum = parseInt(a.vehicle_number) || 99999;
      const bNum = parseInt(b.vehicle_number) || 99999;
      return aNum - bNum;
    });

    return { sortedVehicles: sorted, deptCounts: counts };
  }, [data, search, filterStatus, filterDept]);

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const departments = data?.departments || [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || "admin"} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userName={user.name}
          userRole={user.role}
          userEmail={user.email}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Page Title + Broadcast */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">
                  Fleet Accountability
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Vehicle Inspections
                </h1>
              </div>
              <button
                onClick={openBroadcastModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Megaphone className="h-4 w-4" />
                Broadcast Inspection
              </button>
            </div>

            {/* Compact Summary Row */}
            {data && (
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                  <Truck className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">Vehicles</span>
                  <span className="text-sm font-bold">{data.summary.totalVehicles}</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs text-gray-500">Inspected (90d)</span>
                  <span className="text-sm font-bold text-green-700">{data.summary.inspectedLast90Days}</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs text-gray-500">Overdue</span>
                  <span className="text-sm font-bold text-red-700">{data.summary.overdueOrCritical}</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs text-gray-500">Compliance</span>
                  <span className="text-sm font-bold text-blue-700">{data.summary.complianceRate}%</span>
                </div>
              </div>
            )}

            {/* Broadcast Result Toast */}
            {broadcastResult && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-sm flex items-center justify-between">
                <span>{broadcastResult}</span>
                <button onClick={() => setBroadcastResult(null)} className="text-blue-600 font-bold ml-2">
                  &times;
                </button>
              </div>
            )}

            {/* View Tabs — Recent Submissions first */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
              <button
                onClick={() => setActiveTab("feed")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === "feed"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="h-4 w-4" />
                Recent Submissions
                {filteredFeed.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {filteredFeed.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("vehicles")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === "vehicles"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Vehicles
              </button>
            </div>

            {/* ============== RECENT SUBMISSIONS TAB ============== */}
            {activeTab === "feed" && (
              <>
                {/* Feed Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={feedDriverFilter}
                      onChange={(e) => setFeedDriverFilter(e.target.value)}
                      placeholder="Search by driver name..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={feedVehicleFilter}
                      onChange={(e) => setFeedVehicleFilter(e.target.value)}
                      className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none appearance-none cursor-pointer"
                    >
                      <option value="all">All Vehicles</option>
                      {feedVehicleNumbers.map((num) => (
                        <option key={num} value={num}>#{num}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-1.5">
                    {[
                      { label: "Today", value: "1" },
                      { label: "7d", value: "7" },
                      { label: "30d", value: "30" },
                      { label: "90d", value: "90" },
                      { label: "All", value: "all" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFeedDateFilter(opt.value)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                          feedDateFilter === opt.value
                            ? "bg-gray-900 text-white"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feed List — all collapsed by default */}
                {loadingFeed ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full" />
                  </div>
                ) : filteredFeed.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No inspections found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {feedInspections.length > 0
                        ? "Try adjusting your filters"
                        : "No inspections have been submitted yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFeed.map((insp: any) => (
                      <InspectionCard
                        key={insp.id}
                        inspection={insp}
                        isExpanded={feedExpandedId === insp.id}
                        onToggle={() => setFeedExpandedId(feedExpandedId === insp.id ? null : insp.id)}
                        showVehicleBadge
                      />
                    ))}
                    <div className="text-center text-xs text-gray-400 py-2">
                      {filteredFeed.length} inspection{filteredFeed.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============== VEHICLES TAB ============== */}
            {activeTab === "vehicles" && (
              <>
                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search vehicle, driver, department..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                      className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none appearance-none cursor-pointer"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((d: string) => (
                        <option key={d} value={d}>
                          {d} ({deptCounts[d] || 0})
                        </option>
                      ))}
                      <option value="Unassigned">Unassigned ({deptCounts["Unassigned"] || 0})</option>
                    </select>
                  </div>

                  <div className="flex gap-1.5">
                    {(["all", "red", "yellow", "green"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                          filterStatus === s
                            ? "bg-gray-900 text-white"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {s === "all" ? "All" : s === "red" ? "Overdue" : s === "yellow" ? "Due Soon" : "OK"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full" />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Vehicle</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Dept</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">
                              <User className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                              Driver
                            </th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Current Mileage</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Inspection</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Condition</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedVehicles.map((v: any) => {
                            const driverName = v.assignedDriver || v.latestInspection?.driver_name || null;
                            const hasVehicleInfo = v.make && v.model;
                            return (
                              <tr
                                key={v.id}
                                onClick={() => openVehicleDetail(v)}
                                className={`border-b border-gray-50 hover:bg-blue-50/50 transition-colors cursor-pointer group ${
                                  selectedVehicle?.id === v.id ? "bg-blue-50" : ""
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <StatusBadge status={v.healthStatus} />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-bold text-gray-900">
                                    {v.vehicle_number ? `#${v.vehicle_number}` : <span className="text-gray-400 italic">No #</span>}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {hasVehicleInfo
                                      ? `${v.year || ""} ${v.make} ${v.model}`
                                      : <span className="text-gray-300 italic">No make/model</span>
                                    }
                                  </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                  {v.department ? (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                      {v.department}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 text-xs">&mdash;</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {driverName ? (
                                    <span className="text-gray-800 text-xs font-medium">{driverName}</span>
                                  ) : (
                                    <span className="text-gray-300 text-xs">No driver</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                                  {v.mileage ? `${v.mileage.toLocaleString()} mi` : <span className="text-gray-300">&mdash;</span>}
                                </td>
                                <td className="px-4 py-3">
                                  {v.latestInspection ? (
                                    <div>
                                      <div className="text-gray-900 font-medium text-xs">
                                        {v.daysSinceInspection === 0 ? "Today" : `${v.daysSinceInspection}d ago`}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {new Date(v.latestInspection.created_at).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-red-500 font-semibold text-xs">Never inspected</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                  {v.latestInspection ? (
                                    <div className="flex items-center gap-1.5">
                                      <ConditionDot value={v.latestInspection.tire_condition} />
                                      <ConditionDot value={v.latestInspection.brake_condition} />
                                      <ConditionDot value={v.latestInspection.fluid_levels} />
                                      <ConditionDot value={v.latestInspection.body_condition} />
                                      {v.latestInspection.warning_lights_on && (
                                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">&mdash;</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
                                </td>
                              </tr>
                            );
                          })}
                          {sortedVehicles.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                No vehicles match your filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
                      Showing {sortedVehicles.length} of {data?.summary.totalVehicles || 0} vehicles
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Vehicle Inspection Detail Slide-out Panel */}
      {selectedVehicle && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setSelectedVehicle(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    #{selectedVehicle.vehicle_number || "\u2014"}
                  </h2>
                  <StatusBadge status={selectedVehicle.healthStatus} />
                </div>
                <p className="text-sm text-gray-500">
                  {selectedVehicle.make && selectedVehicle.model
                    ? `${selectedVehicle.year || ""} ${selectedVehicle.make} ${selectedVehicle.model}`
                    : "No make/model"
                  }
                  {selectedVehicle.department && ` \u00B7 ${selectedVehicle.department}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-4 border-b border-gray-100 bg-white">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Current Mileage</div>
                  <div className="text-sm font-bold text-gray-900">
                    {selectedVehicle.mileage ? `${selectedVehicle.mileage.toLocaleString()} mi` : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Driver</div>
                  <div className="text-sm font-bold text-gray-900 truncate">
                    {selectedVehicle.assignedDriver || "None"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Inspections</div>
                  <div className="text-sm font-bold text-gray-900">
                    {selectedVehicle.inspectionCount || 0}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/admin/vehicles/${selectedVehicle.id}`)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Wrench className="h-3.5 w-3.5" />
                View Full Vehicle Record
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Inspection History
              </h3>

              {loadingInspections ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-3 border-gray-300 border-t-gray-900 rounded-full" />
                </div>
              ) : vehicleInspections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No inspections submitted</p>
                  <p className="text-gray-400 text-xs mt-1">This vehicle has never been inspected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleInspections.map((insp: any) => (
                    <InspectionCard
                      key={insp.id}
                      inspection={insp}
                      isExpanded={expandedInspection === insp.id}
                      onToggle={() => setExpandedInspection(expandedInspection === insp.id ? null : insp.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Broadcast Inspection Request</h2>
              <button onClick={() => setShowBroadcast(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={broadcastForm.dueDate}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, dueDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={broadcastForm.frequency}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, frequency: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  >
                    <option value="one_time">One Time</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              {/* Send To Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBroadcastMode("all")}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                      broadcastMode === "all"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    All Drivers ({allDrivers.length})
                  </button>
                  <button
                    onClick={() => setBroadcastMode("select")}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                      broadcastMode === "select"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Select Drivers {selectedDriverIds.size > 0 && `(${selectedDriverIds.size})`}
                  </button>
                </div>
              </div>

              {/* Driver Selection List */}
              {broadcastMode === "select" && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        value={broadcastDriverSearch}
                        onChange={(e) => setBroadcastDriverSearch(e.target.value)}
                        placeholder="Search drivers..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border-0 focus:ring-0 outline-none bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {allDrivers
                      .filter((d) =>
                        !broadcastDriverSearch ||
                        d.name?.toLowerCase().includes(broadcastDriverSearch.toLowerCase()) ||
                        d.phone?.includes(broadcastDriverSearch)
                      )
                      .map((driver) => (
                        <label
                          key={driver.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDriverIds.has(driver.id)}
                            onChange={() => {
                              const next = new Set(selectedDriverIds);
                              if (next.has(driver.id)) next.delete(driver.id);
                              else next.add(driver.id);
                              setSelectedDriverIds(next);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{driver.name}</p>
                            <p className="text-xs text-gray-500">{driver.phone}</p>
                          </div>
                        </label>
                      ))}
                    {allDrivers.filter((d) =>
                      !broadcastDriverSearch ||
                      d.name?.toLowerCase().includes(broadcastDriverSearch.toLowerCase())
                    ).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No drivers found</p>
                    )}
                  </div>
                  {selectedDriverIds.size > 0 && (
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{selectedDriverIds.size} selected</span>
                      <button
                        onClick={() => setSelectedDriverIds(new Set())}
                        className="text-xs text-red-500 font-medium hover:text-red-700"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowBroadcast(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                disabled={broadcasting || (broadcastMode === "select" && selectedDriverIds.size === 0)}
                className="flex-1 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Megaphone className="h-4 w-4" />
                {broadcasting ? "Sending..." : broadcastMode === "all" ? `Send to All (${allDrivers.length})` : `Send to ${selectedDriverIds.size} Drivers`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

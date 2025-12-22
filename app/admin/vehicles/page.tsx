"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Car,
  Plus,
  User as UserIcon,
  Wrench,
  Calendar,
  Gauge,
  X,
  Loader2,
  Save,
  Grid3x3,
  List,
  Search,
  UserPlus,
  FileText,
  Download,
  Truck,
  Box,
  Container,
  ArrowUpDown,
  Layers,
  Settings,
} from "lucide-react";
import { Vehicle } from "@/types";
import { getStatusColor, formatDate } from "@/lib/utils";
import { useVehicles, useCreateVehicle, useDrivers, useUpdateVehicle } from "@/hooks/use-vehicles";
import EditableStatus from "@/components/EditableStatus";
import EditableVehicleType from "@/components/EditableVehicleType";
import EditableTextField from "@/components/EditableTextField";
import EditableDepartment from "@/components/EditableDepartment";
import EditableDriver from "@/components/EditableDriver";
import ColumnConfigModal, { ColumnConfig } from "@/components/ColumnConfigModal";
import { VehicleCardSkeleton } from "@/components/ui/loading-states";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/ui/pagination";
import { exportVehicles } from "@/lib/export-utils";
import VehicleFilters, { VehicleFilters as VehicleFiltersType } from "@/components/VehicleFilters";

export default function VehiclesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const { data: vehicles = [], isLoading, error: vehiclesError } = useVehicles();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const { data: drivers = [], isLoading: driversLoading } = useDrivers();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
    licensePlate: "",
    mileage: 0,
    status: "operational" as any,
    vehicleNumber: "",
    vehicleType: "Vehicle" as "Vehicle" | "Equipment" | "Trailer",
    driverId: "" as string | undefined,
  });
  const activeCount = vehicles.filter((v) => v.status === "active" || v.status === "operational").length;
  const inServiceCount = vehicles.filter((v) => v.status === "in_service").length;
  const forSaleCount = vehicles.filter((v) => v.status === "for_sale").length;
  const idleCount = vehicles.filter((v) => v.status === "idle").length;
  const brokenDownCount = vehicles.filter((v) => v.status === "broken_down").length;
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<VehicleFiltersType>({
    department: "all",
    status: "all",
    vehicleType: "all",
    usageCategory: "all",
    daysSinceLastUse: "all",
  });
  const [sortBy, setSortBy] = useState<"make" | "year" | "status" | "vehicleType" | "department" | "mileage" | "lastUsedDate">("make");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<"none" | "status" | "vehicleType" | "department">("none");
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // Default column configuration
  const defaultColumns: ColumnConfig[] = [
    { id: "type", label: "Type", visible: true, order: 0, width: "w-32" },
    { id: "companyId", label: "Co. ID", visible: true, order: 1, width: "w-24" },
    { id: "make", label: "Make", visible: true, order: 2, width: "w-28" },
    { id: "model", label: "Model", visible: true, order: 3, width: "w-32" },
    { id: "year", label: "Year", visible: true, order: 4, width: "w-20" },
    { id: "vin", label: "VIN", visible: true, order: 5, width: "w-40" },
    { id: "plate", label: "Plate", visible: true, order: 6, width: "w-24" },
    { id: "department", label: "Dept", visible: true, order: 7, width: "w-36" },
    { id: "mileage", label: "Mileage", visible: false, order: 8, width: "w-28" },
    { id: "driver", label: "Driver", visible: true, order: 9, width: "w-44 min-w-[11rem]" },
    { id: "status", label: "Status", visible: true, order: 10, width: "w-28" },
  ];

  // Load column configuration from localStorage
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vehicles-column-config");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return defaultColumns;
        }
      }
    }
    return defaultColumns;
  });

  // Persist column configuration
  useEffect(() => {
    localStorage.setItem("vehicles-column-config", JSON.stringify(columns));
  }, [columns]);

  // Get visible columns sorted by order
  const visibleColumns = useMemo(() => {
    return [...columns].filter((col) => col.visible).sort((a, b) => a.order - b.order);
  }, [columns]);

  // Get unique departments from vehicles
  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => v.department).filter(Boolean))) as string[];
  }, [vehicles]);

  // Render cell content based on column type
  const renderCell = (column: ColumnConfig, vehicle: Vehicle) => {
    switch (column.id) {
      case "type":
        return (
          <EditableVehicleType
            vehicleType={vehicle.vehicleType}
            onUpdate={async (newType) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { vehicleType: newType },
              });
              showToast("Vehicle type updated successfully!", "success");
            }}
          />
        );
      case "companyId":
        return (
          <EditableTextField
            value={vehicle.vehicleNumber}
            onUpdate={async (value) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { vehicleNumber: value },
              });
              showToast("Vehicle number updated successfully!", "success");
            }}
            className="font-mono font-bold text-sm"
          />
        );
      case "make":
        return (
          <EditableTextField
            value={vehicle.make}
            onUpdate={async (value) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { make: value },
              });
              showToast("Make updated successfully!", "success");
            }}
            className="font-semibold text-sm"
          />
        );
      case "model":
        return (
          <div>
            <EditableTextField
              value={vehicle.model}
              onUpdate={async (value) => {
                await updateVehicle.mutateAsync({
                  id: vehicle.id,
                  updates: { model: value },
                });
                showToast("Model updated successfully!", "success");
              }}
              className="font-semibold text-sm"
            />
            {vehicle.year && <p className="text-xs text-gray-500 mt-0.5">{vehicle.year}</p>}
          </div>
        );
      case "year":
        return (
          <EditableTextField
            value={vehicle.year}
            type="number"
            onUpdate={async (value) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { year: parseInt(value) || undefined },
              });
              showToast("Year updated successfully!", "success");
            }}
            className="text-sm"
          />
        );
      case "vin":
        return (
          <EditableTextField
            value={vehicle.vin && !vehicle.vin.startsWith("AIRTABLE-") && !vehicle.vin.startsWith("FLEET-") ? vehicle.vin : ""}
            onUpdate={async (value) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { vin: value },
              });
              showToast("VIN updated successfully!", "success");
            }}
            className="font-mono text-xs"
            formatValue={(val) => (val && val.toString() ? val.toString() : "-")}
          />
        );
      case "plate":
        return (
          <EditableTextField
            value={vehicle.licensePlate}
            onUpdate={async (value) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { licensePlate: value },
              });
              showToast("License plate updated successfully!", "success");
            }}
            className="font-mono font-semibold text-sm"
          />
        );
      case "department":
        return (
          <EditableDepartment
            value={vehicle.department}
            onUpdate={async (value) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { department: value },
              });
              showToast("Department updated successfully!", "success");
            }}
            departments={uniqueDepartments}
          />
        );
      case "mileage":
        return (
          <EditableTextField
            value={vehicle.mileage}
            type="number"
            onUpdate={async (value) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { mileage: parseInt(value) || 0 },
              });
              showToast("Mileage updated successfully!", "success");
            }}
            className="text-sm"
            formatValue={(val) => (val ? `${val.toLocaleString()} mi` : "0 mi")}
          />
        );
      case "driver":
        return (
          <EditableDriver
            value={vehicle.driverId || null}
            onUpdate={async (value) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { driverId: value },
              });
              showToast("Driver updated successfully!", "success");
            }}
            drivers={drivers}
          />
        );
      case "status":
        return (
          <EditableStatus
            status={vehicle.status}
            onUpdate={async (newStatus) => {
              await updateVehicle.mutateAsync({
                id: vehicle.id,
                updates: { status: newStatus },
              });
              showToast("Status updated successfully!", "success");
            }}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    // Mechanics are treated as admins with full permissions
    if (parsedUser.role !== "admin" && parsedUser.role !== "mechanic") {
      router.push("/login");
      return;
    }
    setUser(parsedUser);
  }, [router]);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("vehicles-view-mode");
    if (savedView === "grid" || savedView === "list") {
      setViewMode(savedView);
    }
    const savedItemsPerPage = localStorage.getItem("vehicles-items-per-page");
    if (savedItemsPerPage) {
      const parsed = parseInt(savedItemsPerPage, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setItemsPerPage(parsed);
      }
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("vehicles-view-mode", mode);
  };

  // Filter vehicles based on search term and filters
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((vehicle) => {
        const make = (vehicle.make || "").toLowerCase();
        const model = (vehicle.model || "").toLowerCase();
        const vin = (vehicle.vin || "").toLowerCase();
        const licensePlate = (vehicle.licensePlate || "").toLowerCase();
        const vehicleNumber = (vehicle.vehicleNumber || "").toLowerCase();
        const year = vehicle.year?.toString() || "";
        const driverName = (vehicle.driverName || "").toLowerCase();

        return (
          make.includes(searchLower) ||
          model.includes(searchLower) ||
          vin.includes(searchLower) ||
          licensePlate.includes(searchLower) ||
          vehicleNumber.includes(searchLower) ||
          year.includes(searchLower) ||
          driverName.includes(searchLower) ||
          `${make} ${model}`.includes(searchLower)
        );
      });
    }

    // Apply department filter
    if (filters.department && filters.department !== "all") {
      filtered = filtered.filter((v) => v.department === filters.department);
    }

    // Apply status filter
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((v) => v.status === filters.status);
    }

    // Apply vehicle type filter
    if (filters.vehicleType && filters.vehicleType !== "all") {
      filtered = filtered.filter((v) => v.vehicleType === filters.vehicleType);
    }

    // Apply usage category filter
    if (filters.usageCategory && filters.usageCategory !== "all") {
      filtered = filtered.filter((v) => {
        const category = v.usageCategory?.toLowerCase().replace(/\s+/g, "_");
        switch (filters.usageCategory) {
          case "used_today":
            return category === "used_today";
          case "used_this_week":
            return category === "used_this_week" || category === "used_today" || category === "used_yesterday";
          case "used_this_month":
            return category === "used_this_month" || category === "used_this_week" || category === "used_today" || category === "used_yesterday";
          case "used_last_3_months":
            return (
              category === "used_in_last_3_months" ||
              category === "used_this_month" ||
              category === "used_this_week" ||
              category === "used_today" ||
              category === "used_yesterday"
            );
          case "used_last_6_months":
            return (
              category === "used_in_last_6_months" ||
              category === "used_in_last_3_months" ||
              category === "used_this_month" ||
              category === "used_this_week" ||
              category === "used_today" ||
              category === "used_yesterday"
            );
          case "long_idle":
            return category === "long_idle";
          case "never_tracked":
            return category === "never_tracked" || !v.lastUsedDate;
          default:
            return true;
        }
      });
    }

    // Apply days since last use filter
    if (filters.daysSinceLastUse && filters.daysSinceLastUse !== "all") {
      filtered = filtered.filter((v) => {
        if (!v.daysSinceLastUse && v.daysSinceLastUse !== 0) return false;
        const days = v.daysSinceLastUse;
        switch (filters.daysSinceLastUse) {
          case "0-7":
            return days >= 0 && days <= 7;
          case "8-30":
            return days >= 8 && days <= 30;
          case "31-90":
            return days >= 31 && days <= 90;
          case "91-180":
            return days >= 91 && days <= 180;
          case "181-365":
            return days >= 181 && days <= 365;
          case "365+":
            return days > 365;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "make":
          aValue = (a.make || "").toLowerCase();
          bValue = (b.make || "").toLowerCase();
          break;
        case "year":
          aValue = a.year || 0;
          bValue = b.year || 0;
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "vehicleType":
          aValue = a.vehicleType || "Vehicle";
          bValue = b.vehicleType || "Vehicle";
          break;
        case "department":
          aValue = (a.department || "").toLowerCase();
          bValue = (b.department || "").toLowerCase();
          break;
        case "mileage":
          aValue = a.mileage || 0;
          bValue = b.mileage || 0;
          break;
        case "lastUsedDate":
          aValue = a.lastUsedDate ? new Date(a.lastUsedDate).getTime() : 0;
          bValue = b.lastUsedDate ? new Date(b.lastUsedDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [vehicles, searchTerm, filters, sortBy, sortOrder]);

  // Group vehicles if groupBy is set
  const groupedVehicles = useMemo(() => {
    if (groupBy === "none") {
      return { "All Vehicles": filteredVehicles };
    }

    const groups: Record<string, Vehicle[]> = {};

    filteredVehicles.forEach((vehicle) => {
      let groupKey = "Unassigned";

      switch (groupBy) {
        case "status":
          groupKey = vehicle.status?.replace("_", " ") || "Unknown";
          break;
        case "vehicleType":
          groupKey = vehicle.vehicleType || "Vehicle";
          break;
        case "department":
          groupKey = vehicle.department || "Unassigned";
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(vehicle);
    });

    // Sort group keys
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });

    const sortedGroups: Record<string, Vehicle[]> = {};
    sortedGroupKeys.forEach((key) => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [filteredVehicles, groupBy]);

  // Calculate pagination (only if not grouped)
  const paginatedVehicles = useMemo(() => {
    if (groupBy !== "none") {
      return filteredVehicles; // Don't paginate when grouped
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVehicles.slice(startIndex, endIndex);
  }, [filteredVehicles, currentPage, itemsPerPage, groupBy]);

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  // Reset to page 1 when items per page changes, search term changes, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchTerm, filters]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    localStorage.setItem("vehicles-items-per-page", newItemsPerPage.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        driverId: formData.driverId || undefined,
      };
      await createVehicle.mutateAsync(submitData);
      setShowAddModal(false);
      setFormData({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        vin: "",
        licensePlate: "",
        mileage: 0,
        status: "operational",
        vehicleNumber: "",
        vehicleType: "Vehicle",
        driverId: "",
      });
      showToast("Vehicle added successfully!", "success");
    } catch (error) {
      console.error("Error creating vehicle:", error);
      showToast("Failed to add vehicle. Please try again.", "error");
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || "admin"} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-5">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
              {/* Title and Description */}
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em] mb-1">Fleet</p>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Vehicles</h1>
                <p className="text-gray-600 text-sm">Manage your fleet vehicles and their status.</p>
              </div>

              {/* Stats Cards Row - Compact */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="card-surface px-3.5 py-2 rounded-lg text-sm border-l-4 border-green-500 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Operational</p>
                  <p className="text-xl font-bold text-gray-900">{activeCount}</p>
                </div>
                <div className="card-surface px-3.5 py-2 rounded-lg text-sm border-l-4 border-yellow-500 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">In Service</p>
                  <p className="text-xl font-bold text-gray-900">{inServiceCount}</p>
                </div>
                {forSaleCount > 0 && (
                  <div className="card-surface px-3.5 py-2 rounded-lg text-sm border-l-4 border-purple-500 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">For Sale</p>
                    <p className="text-lg font-semibold text-gray-900">{forSaleCount}</p>
                  </div>
                )}
                {idleCount > 0 && (
                  <div className="card-surface px-3.5 py-2 rounded-lg text-sm border-l-4 border-orange-500 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Idle</p>
                    <p className="text-lg font-semibold text-gray-900">{idleCount}</p>
                  </div>
                )}
                {brokenDownCount > 0 && (
                  <div className="card-surface px-3.5 py-2 rounded-lg text-sm border-l-4 border-red-500 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Broken Down</p>
                    <p className="text-xl font-bold text-gray-900">{brokenDownCount}</p>
                  </div>
                )}
              </div>

              {/* Toolbar: Compact and Intuitive */}
              <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center">
                {/* Left: Filters & Search Group */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <VehicleFilters vehicles={vehicles} filters={filters} onFiltersChange={setFilters} />
                  </div>
                  <div className="flex-1 min-w-0 relative">
                    <div className="input-group">
                      <span className="input-group-icon input-group-icon-left">
                        <Search className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search vehicles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input input-with-icon-left pr-10 text-sm"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:scale-110 rounded transition-all duration-200"
                          title="Clear search"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: View Controls & Actions Group */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Sort - Compact Icon Button with Dropdown */}
                  <div className="relative">
                    <button
                      className="p-2 rounded-lg border border-gray-300 bg-white hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 hover:scale-105 group"
                      title={`Sort by ${sortBy.replace(/([A-Z])/g, " $1").trim()}`}
                      onMouseEnter={(e) => {
                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                        if (dropdown) {
                          dropdown.classList.remove("opacity-0", "invisible");
                          dropdown.classList.add("opacity-100", "visible");
                        }
                      }}
                      onMouseLeave={(e) => {
                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                        if (dropdown) {
                          setTimeout(() => {
                            if (!dropdown.matches(":hover")) {
                              dropdown.classList.add("opacity-0", "invisible");
                              dropdown.classList.remove("opacity-100", "visible");
                            }
                          }, 100);
                        }
                      }}
                    >
                      <ArrowUpDown className="h-4 w-4 text-gray-600 group-hover:text-primary-600 transition-all duration-200 group-hover:scale-110" />
                    </button>
                    <div
                      className="absolute right-0 top-full mt-1 opacity-0 invisible transition-all duration-200 z-50"
                      onMouseEnter={(e) => {
                        e.currentTarget.classList.remove("opacity-0", "invisible");
                        e.currentTarget.classList.add("opacity-100", "visible");
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.classList.add("opacity-0", "invisible");
                        e.currentTarget.classList.remove("opacity-100", "visible");
                      }}
                    >
                      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[160px]">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 mb-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="make">Sort by Make</option>
                          <option value="year">Sort by Year</option>
                          <option value="status">Sort by Status</option>
                          <option value="vehicleType">Sort by Type</option>
                          <option value="department">Sort by Department</option>
                          <option value="mileage">Sort by Mileage</option>
                          <option value="lastUsedDate">Sort by Last Used</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                          className="w-full px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between transition-colors"
                          title={sortOrder === "asc" ? "Ascending" : "Descending"}
                        >
                          <span>Order: {sortOrder === "asc" ? "Asc" : "Desc"}</span>
                          <span className="text-base">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Group - Compact Icon Button with Dropdown */}
                  <div className="relative">
                    <button
                      className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 group ${
                        groupBy !== "none"
                          ? "border-primary-400 bg-primary-50 text-primary-600"
                          : "border-gray-300 bg-white text-gray-600 hover:border-primary-400 hover:bg-primary-50"
                      }`}
                      title={groupBy !== "none" ? `Grouped by ${groupBy}` : "Group vehicles"}
                      onMouseEnter={(e) => {
                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                        if (dropdown) {
                          dropdown.classList.remove("opacity-0", "invisible");
                          dropdown.classList.add("opacity-100", "visible");
                        }
                      }}
                      onMouseLeave={(e) => {
                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                        if (dropdown) {
                          setTimeout(() => {
                            if (!dropdown.matches(":hover")) {
                              dropdown.classList.add("opacity-0", "invisible");
                              dropdown.classList.remove("opacity-100", "visible");
                            }
                          }, 100);
                        }
                      }}
                    >
                      <Layers className="h-4 w-4 transition-all duration-200 group-hover:scale-110" />
                    </button>
                    <div
                      className="absolute right-0 top-full mt-1 opacity-0 invisible transition-all duration-200 z-50"
                      onMouseEnter={(e) => {
                        e.currentTarget.classList.remove("opacity-0", "invisible");
                        e.currentTarget.classList.add("opacity-100", "visible");
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.classList.add("opacity-0", "invisible");
                        e.currentTarget.classList.remove("opacity-100", "visible");
                      }}
                    >
                      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[140px]">
                        <select
                          value={groupBy}
                          onChange={(e) => setGroupBy(e.target.value as any)}
                          className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="none">No Grouping</option>
                          <option value="status">Group by Status</option>
                          <option value="vehicleType">Group by Type</option>
                          <option value="department">Group by Department</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* View Mode Toggle - Compact */}
                  <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg border border-gray-200">
                    <button
                      onClick={() => handleViewModeChange("grid")}
                      className={`p-1.5 rounded-md transition-all duration-200 hover:scale-110 ${
                        viewMode === "grid" ? "bg-white text-primary-600 shadow-sm scale-105" : "text-gray-600 hover:text-gray-900"
                      }`}
                      aria-label="Grid view"
                      title="Grid view"
                    >
                      <Grid3x3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange("list")}
                      className={`p-1.5 rounded-md transition-all duration-200 hover:scale-110 ${
                        viewMode === "list" ? "bg-white text-primary-600 shadow-sm scale-105" : "text-gray-600 hover:text-gray-900"
                      }`}
                      aria-label="List view"
                      title="List view"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-6 bg-gray-300 mx-0.5" />

                  {/* Column Config (list view only) */}
                  {viewMode === "list" && (
                    <button
                      onClick={() => setShowColumnConfig(true)}
                      className="p-2 rounded-lg border border-gray-300 bg-white hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 hover:scale-105"
                      title="Configure columns"
                    >
                      <Settings className="h-4 w-4 text-gray-600 hover:text-primary-600 transition-all duration-200 hover:scale-110" />
                    </button>
                  )}

                  {/* Export - Compact Icon Button */}
                  <button
                    onClick={() => exportVehicles(filteredVehicles)}
                    disabled={filteredVehicles.length === 0}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:border-primary-400 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                    title="Export to CSV"
                  >
                    <Download className="h-4 w-4 text-gray-600 hover:text-primary-600 transition-all duration-200 hover:scale-110" />
                  </button>

                  {/* Add Vehicle - Primary Action */}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md flex items-center gap-1.5"
                    title="Add new vehicle"
                  >
                    <Plus className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                    <span className="text-sm font-medium hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>

              {/* Results Count - Compact */}
              {(searchTerm ||
                filters.status !== "all" ||
                filters.department !== "all" ||
                filters.vehicleType !== "all" ||
                filters.usageCategory !== "all" ||
                filters.daysSinceLastUse !== "all") && (
                <div className="text-xs text-gray-500 font-medium px-1">
                  Showing <span className="text-primary-600 font-semibold">{filteredVehicles.length}</span>{" "}
                  {filteredVehicles.length === 1 ? "vehicle" : "vehicles"}
                </div>
              )}
            </div>

            {vehiclesError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">Failed to load vehicles. Please try again.</div>
            )}

            {isLoading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {groupBy !== "none" ? (
                  // Grouped View
                  <div className="space-y-6">
                    {Object.entries(groupedVehicles).map(([groupName, groupVehicles]) => (
                      <div key={groupName} className="space-y-3">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                            {groupName} <span className="text-gray-500 font-normal">({groupVehicles.length})</span>
                          </h3>
                        </div>
                        {viewMode === "grid" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupVehicles.map((vehicle, i) => (
                              <motion.div
                                key={vehicle.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                                className="card-surface rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/60 group cursor-pointer"
                                onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                              >
                                <div className="flex items-start justify-between mb-5">
                                  <div className="flex items-start space-x-4 flex-1">
                                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                      <Car className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-primary-700 transition-colors">
                                        {vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : vehicle.vehicleNumber || vehicle.vin}
                                      </h3>
                                      {vehicle.year && <p className="text-sm font-medium text-gray-500">{vehicle.year}</p>}
                                    </div>
                                  </div>
                                  <span
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${getStatusColor(vehicle.status)}`}
                                  >
                                    {vehicle.status?.replace("_", " ")}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  {vehicle.licensePlate && (
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plate</p>
                                      <p className="text-sm font-bold text-gray-900 font-mono">{vehicle.licensePlate}</p>
                                    </div>
                                  )}
                                  {vehicle.vin && (
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">VIN</p>
                                      <p className="text-xs font-mono text-gray-900 truncate" title={vehicle.vin}>
                                        {vehicle.vin}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                                  {vehicle.mileage !== undefined && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="bg-primary-50 p-1.5 rounded-lg">
                                        <Gauge className="h-4 w-4 text-primary-600" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Mileage</p>
                                        <p className="text-sm font-semibold text-gray-900">{vehicle.mileage.toLocaleString()} mi</p>
                                      </div>
                                    </div>
                                  )}
                                  {vehicle.driverName && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="bg-primary-50 p-1.5 rounded-lg">
                                        <UserIcon className="h-4 w-4 text-primary-600" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Driver</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]" title={vehicle.driverName}>
                                          {vehicle.driverName}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between pt-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600 font-medium">
                                      {vehicle.serviceHistory?.length || 0} service {vehicle.serviceHistory?.length === 1 ? "record" : "records"}
                                    </span>
                                  </div>
                                  <button
                                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/admin/vehicles/${vehicle.id}`);
                                    }}
                                  >
                                    View Details
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="card-surface rounded-xl border border-gray-200 overflow-hidden">
                            <div className="divide-y divide-gray-100">
                              {groupVehicles.map((vehicle, i) => {
                                const VehicleTypeIcon =
                                  vehicle.vehicleType === "Trailer" ? Container : vehicle.vehicleType === "Equipment" ? Box : Truck;
                                const typeColor =
                                  vehicle.vehicleType === "Trailer"
                                    ? "text-orange-600 bg-orange-50"
                                    : vehicle.vehicleType === "Equipment"
                                      ? "text-purple-600 bg-purple-50"
                                      : "text-blue-600 bg-blue-50";
                                return (
                                  <motion.div
                                    key={vehicle.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: i * 0.02 }}
                                    className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                                  >
                                    <div className="hidden lg:flex items-center gap-3">
                                      {visibleColumns.map((column) => (
                                        <div key={column.id} className={column.width || "w-auto"}>
                                          {renderCell(column, vehicle)}
                                        </div>
                                      ))}
                                      <div className="w-16 text-right">
                                        <button
                                          className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/admin/vehicles/${vehicle.id}`);
                                          }}
                                        >
                                          View
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : viewMode === "grid" ? (
                  <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {paginatedVehicles.map((vehicle, i) => (
                        <motion.div
                          key={vehicle.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                          className="card-surface rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/60 group cursor-pointer"
                          onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                        >
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                <Car className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-primary-700 transition-colors">
                                  {vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : vehicle.vehicleNumber || vehicle.vin}
                                </h3>
                                {vehicle.year && <p className="text-sm font-medium text-gray-500">{vehicle.year}</p>}
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${getStatusColor(vehicle.status)}`}
                            >
                              {vehicle.status?.replace("_", " ")}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {vehicle.licensePlate && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plate</p>
                                <p className="text-sm font-bold text-gray-900 font-mono">{vehicle.licensePlate}</p>
                              </div>
                            )}
                            {vehicle.vin && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">VIN</p>
                                <p className="text-xs font-mono text-gray-900 truncate" title={vehicle.vin}>
                                  {vehicle.vin}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                            {vehicle.mileage !== undefined && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="bg-primary-50 p-1.5 rounded-lg">
                                  <Gauge className="h-4 w-4 text-primary-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Mileage</p>
                                  <p className="text-sm font-semibold text-gray-900">{vehicle.mileage.toLocaleString()} mi</p>
                                </div>
                              </div>
                            )}
                            {vehicle.driverName && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="bg-primary-50 p-1.5 rounded-lg">
                                  <UserIcon className="h-4 w-4 text-primary-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Driver</p>
                                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]" title={vehicle.driverName}>
                                    {vehicle.driverName}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {(vehicle.nextServiceDue || vehicle.lastServiceDate) && (
                            <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 space-y-2">
                              {vehicle.nextServiceDue && (
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-blue-600 font-medium">Next Service</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatDate(vehicle.nextServiceDue)}</p>
                                  </div>
                                </div>
                              )}
                              {vehicle.lastServiceDate && (
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                    <Wrench className="h-4 w-4 text-indigo-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-indigo-600 font-medium">Last Service</p>
                                    <p className="text-sm font-semibold text-gray-900">{formatDate(vehicle.lastServiceDate)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                              <span className="text-sm text-gray-600 font-medium">
                                {vehicle.serviceHistory?.length || 0} service {vehicle.serviceHistory?.length === 1 ? "record" : "records"}
                              </span>
                            </div>
                            <button
                              className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/vehicles/${vehicle.id}`);
                              }}
                            >
                              View Details
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {filteredVehicles.length === 0 && (
                      <div className="p-6 text-center text-gray-500 col-span-full">
                        {searchTerm ? `No vehicles found matching "${searchTerm}".` : "No vehicles found."}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="card-surface rounded-xl border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 hidden lg:block">
                      <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {visibleColumns.map((column) => (
                          <div key={column.id} className={column.width || "w-auto"}>
                            {column.label}
                          </div>
                        ))}
                        <div className="w-16"></div>
                      </div>
                    </div>
                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                      <AnimatePresence>
                        {paginatedVehicles.map((vehicle, i) => {
                          const VehicleTypeIcon = vehicle.vehicleType === "Trailer" ? Container : vehicle.vehicleType === "Equipment" ? Box : Truck;
                          const typeColor =
                            vehicle.vehicleType === "Trailer"
                              ? "text-orange-600 bg-orange-50"
                              : vehicle.vehicleType === "Equipment"
                                ? "text-purple-600 bg-purple-50"
                                : "text-blue-600 bg-blue-50";
                          return (
                            <motion.div
                              key={vehicle.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.02 }}
                              className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                              onClick={() => router.push(`/admin/vehicles/${vehicle.id}`)}
                            >
                              {/* Desktop View */}
                              <div className="hidden lg:flex items-center gap-3">
                                {visibleColumns.map((column) => (
                                  <div key={column.id} className={column.width || "w-auto"}>
                                    {renderCell(column, vehicle)}
                                  </div>
                                ))}
                                {/* Action */}
                                <div className="w-16 text-right">
                                  <button
                                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/admin/vehicles/${vehicle.id}`);
                                    }}
                                  >
                                    View
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Mobile/Tablet View */}
                              <div className="lg:hidden flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg flex-shrink-0 ${typeColor}`}>
                                  <VehicleTypeIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {vehicle.vehicleNumber && (
                                      <span className="font-mono font-bold text-primary-600 text-sm">{vehicle.vehicleNumber}</span>
                                    )}
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                      {vehicle.status?.replace("_", " ")}
                                    </span>
                                  </div>
                                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                                    {vehicle.make && vehicle.model
                                      ? `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ""}`
                                      : vehicle.vehicleNumber || "Unknown"}
                                  </h3>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                    {vehicle.department && (
                                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{vehicle.department}</span>
                                    )}
                                    {vehicle.licensePlate && <span className="font-mono">{vehicle.licensePlate}</span>}
                                    {vehicle.driverName && (
                                      <span className="flex items-center gap-1">
                                        <UserIcon className="h-3 w-3" />
                                        {vehicle.driverName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                    {filteredVehicles.length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        {searchTerm ? `No vehicles found matching "${searchTerm}".` : "No vehicles found."}
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination - Only show when not grouped */}
                {filteredVehicles.length > 0 && groupBy === "none" && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredVehicles.length}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Add New Vehicle</h2>
                      <p className="text-xs text-gray-500">Fill in the vehicle details below</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-icon" aria-label="Close">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                  {/* Basic Information */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Car className="h-4 w-4 text-primary-600" />
                      </div>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Make *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full"
                          value={formData.make}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                          placeholder="e.g., Ford"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Model *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="e.g., F-150"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Year *</span>
                        <input
                          type="number"
                          required
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          className="input-field w-full"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Company ID / Vehicle Number</span>
                        <input
                          type="text"
                          className="input-field w-full"
                          value={formData.vehicleNumber}
                          onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                          placeholder="e.g., 1582"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Type *</span>
                        <select
                          required
                          className="input-field w-full"
                          value={formData.vehicleType}
                          onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                        >
                          <option value="Vehicle">Vehicle (Truck, Car, Van)</option>
                          <option value="Equipment">Equipment (Loader, Mower, Gator)</option>
                          <option value="Trailer">Trailer (Flatbed, Cargo)</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Identification */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      Identification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">VIN *</span>
                        <input
                          type="text"
                          required
                          minLength={3}
                          className="input-field w-full font-mono"
                          value={formData.vin}
                          onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                          placeholder="Vehicle Identification Number"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">License Plate *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full font-mono"
                          value={formData.licensePlate}
                          onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                          placeholder="ABC-1234"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Status & Mileage */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Gauge className="h-4 w-4 text-indigo-600" />
                      </div>
                      Status & Mileage
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Status *</span>
                        <select
                          required
                          className="input-field w-full"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        >
                          <option value="operational">Operational</option>
                          <option value="active">Active</option>
                          <option value="in_service">In Service</option>
                          <option value="broken_down">Broken Down</option>
                          <option value="for_sale">For Sale</option>
                          <option value="idle">Idle</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="reserved">Reserved</option>
                          <option value="out_of_service">Out of Service</option>
                          <option value="retired">Retired</option>
                        </select>
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Mileage</span>
                        <input
                          type="number"
                          min="0"
                          className="input-field w-full"
                          value={formData.mileage}
                          onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Driver Assignment */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-purple-600" />
                      </div>
                      Driver Assignment
                    </h3>
                    <label className="space-y-1.5 block">
                      <span className="text-sm font-semibold text-gray-700">Assign Driver (Optional)</span>
                      <select
                        className="input-field w-full"
                        value={formData.driverId || ""}
                        onChange={(e) => setFormData({ ...formData, driverId: e.target.value || "" })}
                        disabled={driversLoading}
                      >
                        <option value="">No driver assigned</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} {driver.email ? `(${driver.email})` : ""}
                          </option>
                        ))}
                      </select>
                      {driversLoading && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading drivers...
                        </p>
                      )}
                      {!driversLoading && drivers.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">No drivers available. Add drivers first.</p>
                      )}
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="btn btn-secondary flex-1"
                      disabled={createVehicle.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1 flex items-center gap-2 justify-center"
                      disabled={createVehicle.isPending}
                    >
                      {createVehicle.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Add Vehicle
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Column Configuration Modal */}
      <ColumnConfigModal isOpen={showColumnConfig} onClose={() => setShowColumnConfig(false)} columns={columns} onColumnsChange={setColumns} />
    </div>
  );
}

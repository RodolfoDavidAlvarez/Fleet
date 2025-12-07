"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Users,
  Plus,
  Mail,
  Phone,
  X,
  Edit,
  Loader2,
  Save,
  Grid3x3,
  List,
  Search,
  Car,
  UserPlus,
  UserMinus,
  ChevronDown,
  Check,
  Download,
  ArrowUpDown,
  Layers,
  Settings,
} from "lucide-react";
import { User, Vehicle } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { useVehicles } from "@/hooks/use-vehicles";
import { Pagination } from "@/components/ui/pagination";
import { exportDrivers } from "@/lib/export-utils";
import EditableTextField from "@/components/EditableTextField";
import EditableRole from "@/components/EditableRole";
import EditableApprovalStatus from "@/components/EditableApprovalStatus";
import DriverFilters, { DriverFilters as DriverFiltersType } from "@/components/DriverFilters";
import DriverColumnConfigModal, { ColumnConfig } from "@/components/DriverColumnConfigModal";

export default function DriversPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [assignedVehicles, setAssignedVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [assigningVehicle, setAssigningVehicle] = useState(false);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const vehicleDropdownRef = useRef<HTMLDivElement>(null);
  const { data: allVehicles = [] } = useVehicles();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "driver" as "driver" | "mechanic",
    vehicleId: "",
  });
  const [creatingMember, setCreatingMember] = useState(false);
  const [isMemberVehicleDropdownOpen, setIsMemberVehicleDropdownOpen] = useState(false);
  const [memberVehicleSearch, setMemberVehicleSearch] = useState("");
  const memberVehicleDropdownRef = useRef<HTMLDivElement>(null);

  // New state for enhanced features
  const [filters, setFilters] = useState<DriverFiltersType>({
    role: "all",
    has_phone: "all",
    has_certification: "all",
    has_vehicle: "all",
  });
  const [sortBy, setSortBy] = useState<"name" | "role" | "email" | "phone" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<"none" | "role">("none");
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // Default column configuration for drivers
  const defaultColumns: ColumnConfig[] = [
    { id: "name", label: "Name", visible: true, order: 0, width: "w-48" },
    { id: "role", label: "Role", visible: true, order: 1, width: "w-24" },
    { id: "email", label: "Email", visible: true, order: 2, width: "flex-1" },
    { id: "phone", label: "Phone", visible: true, order: 3, width: "w-32" },
    { id: "certification", label: "Certification", visible: false, order: 4, width: "w-36" },
    { id: "language", label: "Language", visible: false, order: 5, width: "w-24" },
    { id: "joined", label: "Joined", visible: true, order: 6, width: "w-28" },
  ];

  // Load column configuration from localStorage with user-specific key
  const getUserSettingsKey = (key: string) => {
    return user?.id ? `${key}-user-${user.id}` : key;
  };

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        const saved = localStorage.getItem(`drivers-column-config-user-${parsedUser.id}`);
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {
            return defaultColumns;
          }
        }
      }
    }
    return defaultColumns;
  });

  // Persist column configuration
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`drivers-column-config-user-${user.id}`, JSON.stringify(columns));
    }
  }, [columns, user?.id]);

  // Get visible columns sorted by order
  const visibleColumns = useMemo(() => {
    return [...columns].filter((col) => col.visible).sort((a, b) => a.order - b.order);
  }, [columns]);

  // Update driver helper function
  const updateDriver = async (driverId: string, updates: Partial<User>) => {
    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to update driver" }));
        throw new Error(errorData.error || "Failed to update driver");
      }

      const data = await res.json();
      if (!data.driver) {
        throw new Error("Invalid response from server");
      }

      // Update the driver in the list
      setDrivers((prev) => prev.map((d) => (d.id === driverId ? data.driver : d)));
      return data.driver;
    } catch (error) {
      console.error("Error updating driver:", error);
      throw error;
    }
  };

  // Render cell content based on column type
  const renderCell = (column: ColumnConfig, driver: User) => {
    switch (column.id) {
      case "name":
        return (
          <EditableTextField
            value={driver.name}
            onUpdate={async (value) => {
              await updateDriver(driver.id, { name: value });
              showToast("Name updated successfully!", "success");
            }}
            className="font-semibold text-sm"
          />
        );
      case "role":
        return (
          <EditableRole
            role={driver.role}
            onUpdate={async (newRole) => {
              await updateDriver(driver.id, { role: newRole });
              showToast("Role updated successfully!", "success");
            }}
          />
        );
      case "email":
        return (
          <EditableTextField
            value={driver.email}
            onUpdate={async (value) => {
              await updateDriver(driver.id, { email: value });
              showToast("Email updated successfully!", "success");
            }}
            className="text-sm"
          />
        );
      case "phone":
        return (
          <EditableTextField
            value={driver.phone}
            onUpdate={async (value) => {
              await updateDriver(driver.id, { phone: value || undefined });
              showToast("Phone updated successfully!", "success");
            }}
            className="font-mono text-sm"
            placeholder="Add phone"
          />
        );
      case "certification":
        return (
          <EditableTextField
            value={driver.level_certification}
            onUpdate={async (value) => {
              await updateDriver(driver.id, { level_certification: value || undefined });
              showToast("Certification updated successfully!", "success");
            }}
            className="text-xs"
            placeholder="Add cert"
          />
        );
      case "language":
        return (
          <EditableTextField
            value={driver.preferred_language}
            onUpdate={async (value) => {
              await updateDriver(driver.id, { preferred_language: value || undefined });
              showToast("Language updated successfully!", "success");
            }}
            className="text-xs"
            placeholder="Add lang"
          />
        );
      case "joined":
        return <span className="text-xs text-gray-600">{new Date(driver.createdAt).toLocaleDateString()}</span>;
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
    if (parsedUser.role !== "admin") {
      router.push("/login");
      return;
    }
    setUser(parsedUser);

    const loadDrivers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/drivers");
        if (!res.ok) throw new Error("Failed to load drivers");
        const data = await res.json();
        setDrivers(data.drivers || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        setError("Failed to load drivers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDrivers();
    // Run once on mount; router object identity can change and cause loops
  }, []);

  // Load view preference from localStorage with user-specific key
  useEffect(() => {
    if (!user?.id) return;
    const savedView = localStorage.getItem(getUserSettingsKey("drivers-view-mode"));
    if (savedView === "grid" || savedView === "list") {
      setViewMode(savedView);
    }
    const savedItemsPerPage = localStorage.getItem(getUserSettingsKey("drivers-items-per-page"));
    if (savedItemsPerPage) {
      const parsed = parseInt(savedItemsPerPage, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setItemsPerPage(parsed);
      }
    }
  }, [user?.id]);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    if (user?.id) {
      localStorage.setItem(getUserSettingsKey("drivers-view-mode"), mode);
    }
  };

  // Filter drivers based on search term and filters
  const filteredDrivers = useMemo(() => {
    let filtered = drivers;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((driver) => {
        const name = (driver.name || "").toLowerCase();
        const email = (driver.email || "").toLowerCase();
        const phone = (driver.phone || "").toLowerCase();
        const role = (driver.role || "").toLowerCase();

        return name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower) || role.includes(searchLower);
      });
    }

    // Apply role filter
    if (filters.role && filters.role !== "all") {
      filtered = filtered.filter((d) => d.role === filters.role);
    }

    // Apply has_phone filter
    if (filters.has_phone && filters.has_phone !== "all") {
      filtered = filtered.filter((d) => (filters.has_phone === "yes" ? !!d.phone : !d.phone));
    }

    // Apply has_certification filter
    if (filters.has_certification && filters.has_certification !== "all") {
      filtered = filtered.filter((d) => (filters.has_certification === "yes" ? !!d.level_certification : !d.level_certification));
    }

    // Apply has_vehicle filter (based on allVehicles data)
    if (filters.has_vehicle && filters.has_vehicle !== "all") {
      const driversWithVehicles = new Set(allVehicles.filter((v) => v.driverId).map((v) => v.driverId));
      filtered = filtered.filter((d) => (filters.has_vehicle === "yes" ? driversWithVehicles.has(d.id) : !driversWithVehicles.has(d.id)));
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = (a.name || "").toLowerCase();
          bValue = (b.name || "").toLowerCase();
          break;
        case "role":
          aValue = a.role || "";
          bValue = b.role || "";
          break;
        case "email":
          aValue = (a.email || "").toLowerCase();
          bValue = (b.email || "").toLowerCase();
          break;
        case "phone":
          aValue = a.phone || "";
          bValue = b.phone || "";
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [drivers, searchTerm, filters, sortBy, sortOrder, allVehicles]);

  // Group drivers if groupBy is set
  const groupedDrivers = useMemo(() => {
    if (groupBy === "none") {
      return { "All Members": filteredDrivers };
    }

    const groups: Record<string, User[]> = {};

    filteredDrivers.forEach((driver) => {
      let groupKey = "Unassigned";

      switch (groupBy) {
        case "role":
          groupKey = driver.role ? driver.role.charAt(0).toUpperCase() + driver.role.slice(1) : "No Role";
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(driver);
    });

    // Sort group keys
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Unassigned" || a === "No Role") return 1;
      if (b === "Unassigned" || b === "No Role") return -1;
      return a.localeCompare(b);
    });

    const sortedGroups: Record<string, User[]> = {};
    sortedGroupKeys.forEach((key) => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [filteredDrivers, groupBy]);

  // Calculate pagination (only if not grouped)
  const paginatedDrivers = useMemo(() => {
    if (groupBy !== "none") {
      return filteredDrivers; // Don't paginate when grouped
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDrivers.slice(startIndex, endIndex);
  }, [filteredDrivers, currentPage, itemsPerPage, groupBy]);

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

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
    if (user?.id) {
      localStorage.setItem(getUserSettingsKey("drivers-items-per-page"), newItemsPerPage.toString());
    }
  };

  const openEdit = (driver: User) => {
    setEditing(true);
    setEditForm({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      role: driver.role,
      approval_status: driver.approval_status,
      level_certification: driver.level_certification,
      notes: driver.notes,
      preferred_language: driver.preferred_language,
    });
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm({});
  };

  const saveDriver = async () => {
    if (!selectedDriver) return;

    try {
      setSaving(true);

      // Clean up the form data: convert empty strings to undefined for optional fields
      const cleanedForm: any = {};
      Object.keys(editForm).forEach((key) => {
        const value = editForm[key as keyof typeof editForm];
        // Only include defined values, and convert empty strings to undefined for optional fields
        if (value !== undefined && value !== null) {
          if (typeof value === "string" && value.trim() === "" && key !== "name" && key !== "email") {
            // Allow empty strings for optional text fields (phone, notes, etc.)
            cleanedForm[key] = value === "" ? undefined : value;
          } else {
            cleanedForm[key] = value;
          }
        }
      });

      const updatedDriver = await updateDriver(selectedDriver.id, cleanedForm);

      setSelectedDriver(updatedDriver);
      setEditing(false);
      setEditForm({});
      showToast("Driver updated successfully!", "success");
    } catch (err) {
      console.error("Error updating driver:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update driver. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  // Create stable key from vehicles to detect actual changes (prevents infinite loops)
  const vehiclesKey = useMemo(() => allVehicles.map((v) => `${v.id}:${v.driverId}`).join(","), [allVehicles]);

  // Track previous key to prevent unnecessary updates
  const previousKeyRef = useRef<string>("");

  // Load vehicles assigned to the selected driver - only when data actually changes
  useEffect(() => {
    const currentKey = `${selectedDriver?.id || ""}:${vehiclesKey}`;

    // Only update if the key actually changed
    if (previousKeyRef.current !== currentKey) {
      previousKeyRef.current = currentKey;

      if (selectedDriver?.id) {
        setLoadingVehicles(true);
        const assigned = allVehicles.filter((v) => v.driverId === selectedDriver.id);
        setAssignedVehicles(assigned);
        setLoadingVehicles(false);
      } else {
        setAssignedVehicles([]);
      }
    }
  }, [selectedDriver?.id, vehiclesKey, allVehicles]);

  // Handle click outside for vehicle dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(event.target as Node)) {
        setIsVehicleDropdownOpen(false);
      }
      if (memberVehicleDropdownRef.current && !memberVehicleDropdownRef.current.contains(event.target as Node)) {
        setIsMemberVehicleDropdownOpen(false);
      }
    };

    if (isVehicleDropdownOpen || isMemberVehicleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVehicleDropdownOpen, isMemberVehicleDropdownOpen]);

  const assignVehicle = async () => {
    if (!selectedDriver || !selectedVehicleId) return;

    try {
      setAssigningVehicle(true);
      const res = await fetch(`/api/vehicles/${selectedVehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriver.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign vehicle");
      }

      // Reload assigned vehicles
      const assigned = allVehicles.filter((v) => v.driverId === selectedDriver.id);
      setAssignedVehicles(assigned);
      setShowVehicleSelector(false);
      setSelectedVehicleId("");
      setIsVehicleDropdownOpen(false);
      showToast("Vehicle assigned successfully!", "success");
    } catch (err) {
      console.error("Error assigning vehicle:", err);
      showToast(err instanceof Error ? err.message : "Failed to assign vehicle", "error");
    } finally {
      setAssigningVehicle(false);
    }
  };

  const unassignVehicle = async (vehicleId: string) => {
    if (!selectedDriver) return;

    try {
      setAssigningVehicle(true);
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unassign vehicle");
      }

      // Reload assigned vehicles
      const assigned = allVehicles.filter((v) => v.driverId === selectedDriver.id);
      setAssignedVehicles(assigned);
      showToast("Vehicle unassigned successfully!", "success");
    } catch (err) {
      console.error("Error unassigning vehicle:", err);
      showToast(err instanceof Error ? err.message : "Failed to unassign vehicle", "error");
    } finally {
      setAssigningVehicle(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) {
      return allVehicles;
    }
    const searchLower = vehicleSearch.toLowerCase();
    return allVehicles.filter((vehicle) => {
      const make = (vehicle.make || "").toLowerCase();
      const model = (vehicle.model || "").toLowerCase();
      const vin = (vehicle.vin || "").toLowerCase();
      const licensePlate = (vehicle.licensePlate || "").toLowerCase();
      const vehicleNumber = (vehicle.vehicleNumber || "").toLowerCase();

      return (
        make.includes(searchLower) ||
        model.includes(searchLower) ||
        vin.includes(searchLower) ||
        licensePlate.includes(searchLower) ||
        vehicleNumber.includes(searchLower) ||
        `${make} ${model}`.includes(searchLower)
      );
    });
  }, [allVehicles, vehicleSearch]);

  const filteredMemberVehicles = useMemo(() => {
    if (!memberVehicleSearch.trim()) {
      return allVehicles.filter((v) => !v.driverId); // Only show unassigned vehicles
    }
    const searchLower = memberVehicleSearch.toLowerCase();
    return allVehicles.filter((vehicle) => {
      if (vehicle.driverId) return false; // Exclude already assigned vehicles
      const make = (vehicle.make || "").toLowerCase();
      const model = (vehicle.model || "").toLowerCase();
      const vin = (vehicle.vin || "").toLowerCase();
      const licensePlate = (vehicle.licensePlate || "").toLowerCase();
      const vehicleNumber = (vehicle.vehicleNumber || "").toLowerCase();

      return (
        make.includes(searchLower) ||
        model.includes(searchLower) ||
        vin.includes(searchLower) ||
        licensePlate.includes(searchLower) ||
        vehicleNumber.includes(searchLower) ||
        `${make} ${model}`.includes(searchLower)
      );
    });
  }, [allVehicles, memberVehicleSearch]);

  // Count stats
  const driverCount = drivers.filter((d) => d.role === "driver").length;
  const mechanicCount = drivers.filter((d) => d.role === "mechanic").length;

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
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em] mb-1">Team</p>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Team Members</h1>
                <p className="text-gray-600 text-sm">Manage and view all registered team members including drivers, mechanics, and administrators.</p>
              </div>

              {/* Stats Cards Row - Compact */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="card-surface px-3.5 py-2 rounded-lg text-sm border-l-4 border-blue-500 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Total Members</p>
                  <p className="text-xl font-bold text-gray-900">{drivers.length}</p>
                </div>
                <div className="card-surface px-3.5 py-2 rounded-lg text-sm border-l-4 border-green-500 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Drivers</p>
                  <p className="text-xl font-bold text-gray-900">{driverCount}</p>
                </div>
                {mechanicCount > 0 && (
                  <div className="card-surface px-3.5 py-2 rounded-lg text-sm border-l-4 border-purple-500 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Mechanics</p>
                    <p className="text-xl font-bold text-gray-900">{mechanicCount}</p>
                  </div>
                )}
              </div>

              {/* Toolbar: Compact and Intuitive */}
              <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center">
                {/* Left: Filters & Search Group */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <DriverFilters drivers={drivers} filters={filters} onFiltersChange={setFilters} />
                  </div>
                  <div className="flex-1 min-w-0 relative">
                    <div className="input-group">
                      <span className="input-group-icon input-group-icon-left">
                        <Search className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search members..."
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
                          <option value="name">Sort by Name</option>
                          <option value="role">Sort by Role</option>
                          <option value="email">Sort by Email</option>
                          <option value="phone">Sort by Phone</option>
                          <option value="createdAt">Sort by Join Date</option>
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
                      title={groupBy !== "none" ? `Grouped by ${groupBy}` : "Group members"}
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
                      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[180px]">
                        <select
                          value={groupBy}
                          onChange={(e) => setGroupBy(e.target.value as any)}
                          className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="none">No Grouping</option>
                          <option value="role">Group by Role</option>
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
                    onClick={() => exportDrivers(filteredDrivers)}
                    disabled={filteredDrivers.length === 0}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:border-primary-400 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                    title="Export to CSV"
                  >
                    <Download className="h-4 w-4 text-gray-600 hover:text-primary-600 transition-all duration-200 hover:scale-110" />
                  </button>

                  {/* Add Member - Primary Action */}
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md flex items-center gap-1.5"
                    title="Add new member"
                  >
                    <Plus className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                    <span className="text-sm font-medium hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>

              {/* Results Count - Compact */}
              {(searchTerm ||
                filters.role !== "all" ||
                filters.has_phone !== "all" ||
                filters.has_certification !== "all" ||
                filters.has_vehicle !== "all") && (
                <div className="text-xs text-gray-500 font-medium px-1">
                  Showing <span className="text-primary-600 font-semibold">{filteredDrivers.length}</span>{" "}
                  {filteredDrivers.length === 1 ? "member" : "members"}
                </div>
              )}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

            {loading ? (
              <div className="p-8 text-center text-gray-600">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                Loading members...
              </div>
            ) : (
              <>
                {groupBy !== "none" ? (
                  // Grouped View
                  <div className="space-y-6">
                    {Object.entries(groupedDrivers).map(([groupName, groupDrivers]) => (
                      <div key={groupName} className="space-y-3">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                            {groupName} <span className="text-gray-500 font-normal">({groupDrivers.length})</span>
                          </h3>
                        </div>
                        {viewMode === "grid" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupDrivers.map((driver, i) => (
                              <motion.div
                                key={driver.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                                onClick={() => setSelectedDriver(driver)}
                                className="card-surface rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-primary-100 p-3 rounded-full">
                                      <Users className="h-6 w-6 text-primary-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                                      {driver.role && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                          {driver.role.charAt(0).toUpperCase() + driver.role.slice(1)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="h-4 w-4 mr-2" />
                                    {driver.email}
                                  </div>
                                  {driver.phone && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Phone className="h-4 w-4 mr-2" />
                                      {driver.phone}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                  <div className="text-sm text-gray-500">Joined {new Date(driver.createdAt).toLocaleDateString()}</div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDriver(driver);
                                    }}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                  >
                                    View Details
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="card-surface rounded-xl border border-gray-200 overflow-hidden">
                            <div className="divide-y divide-gray-100">
                              {groupDrivers.map((driver, i) => (
                                <motion.div
                                  key={driver.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: i * 0.02 }}
                                  onClick={() => setSelectedDriver(driver)}
                                  className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                                >
                                  <div className="hidden lg:flex items-center gap-3">
                                    {visibleColumns.map((column) => (
                                      <div key={column.id} className={column.width || "w-auto"}>
                                        {renderCell(column, driver)}
                                      </div>
                                    ))}
                                    <div className="w-16 text-right">
                                      <button
                                        className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedDriver(driver);
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
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : viewMode === "grid" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedDrivers.map((driver) => (
                        <motion.div
                          key={driver.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => setSelectedDriver(driver)}
                          className="card-surface rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-primary-100 p-3 rounded-full">
                                <Users className="h-6 w-6 text-primary-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                                {driver.role && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                    {driver.role.charAt(0).toUpperCase() + driver.role.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2" />
                              {driver.email}
                            </div>
                            {driver.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-4 w-4 mr-2" />
                                {driver.phone}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-500">Joined {new Date(driver.createdAt).toLocaleDateString()}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDriver(driver);
                              }}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      {paginatedDrivers.length === 0 && (
                        <div className="p-6 text-center text-gray-500 col-span-full">
                          {searchTerm ? `No team members found matching "${searchTerm}".` : "No team members found."}
                        </div>
                      )}
                    </div>
                    {/* Pagination */}
                    {filteredDrivers.length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          itemsPerPage={itemsPerPage}
                          totalItems={filteredDrivers.length}
                          onItemsPerPageChange={handleItemsPerPageChange}
                          itemName="drivers"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
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
                          {paginatedDrivers.map((driver, i) => (
                            <motion.div
                              key={driver.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.02 }}
                              onClick={() => setSelectedDriver(driver)}
                              className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                            >
                              {/* Desktop View */}
                              <div className="hidden lg:flex items-center gap-3">
                                {visibleColumns.map((column) => (
                                  <div key={column.id} className={column.width || "w-auto"}>
                                    {renderCell(column, driver)}
                                  </div>
                                ))}
                                {/* Action */}
                                <div className="w-16 text-right">
                                  <button
                                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDriver(driver);
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
                                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2.5 rounded-lg flex-shrink-0">
                                  <Users className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">{driver.name}</h3>
                                    {driver.role && (
                                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {driver.role.charAt(0).toUpperCase() + driver.role.slice(1)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {driver.email}
                                    </span>
                                    {driver.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {driver.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      {filteredDrivers.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                          {searchTerm ? `No team members found matching "${searchTerm}".` : "No team members found."}
                        </div>
                      )}
                    </div>

                    {/* Pagination - Only show when not grouped */}
                    {filteredDrivers.length > 0 && groupBy === "none" && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredDrivers.length}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        itemName="drivers"
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div className="fixed inset-0 z-50 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setShowAddMemberModal(false)} />
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
                      <UserPlus className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Add New Member</h2>
                      <p className="text-xs text-gray-500">Fill in the member details below</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setMemberFormData({ name: "", email: "", phone: "", role: "driver", vehicleId: "" });
                      setMemberVehicleSearch("");
                      setIsMemberVehicleDropdownOpen(false);
                    }}
                    className="btn btn-ghost btn-icon"
                    aria-label="Close"
                    disabled={creatingMember}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (creatingMember) return;

                    try {
                      setCreatingMember(true);

                      // Create the member
                      const res = await fetch("/api/drivers", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: memberFormData.name.trim(),
                          email: memberFormData.email.trim().toLowerCase(),
                          phone: memberFormData.phone.trim() || undefined,
                          role: memberFormData.role,
                          approval_status: "approved", // Auto-approve when added by admin
                        }),
                      });

                      if (!res.ok) {
                        const errorData = await res.json().catch(() => ({ error: "Failed to create member" }));
                        const errorMessage = errorData.error || errorData.details || "Failed to create member";
                        throw new Error(errorMessage);
                      }

                      const data = await res.json();
                      if (!data.driver) {
                        throw new Error("Invalid response from server");
                      }

                      const newMemberId = data.driver.id;

                      // Assign vehicle if selected
                      if (memberFormData.vehicleId) {
                        try {
                          const vehicleRes = await fetch(`/api/vehicles/${memberFormData.vehicleId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ driverId: newMemberId }),
                          });

                          if (!vehicleRes.ok) {
                            console.warn("Member created but vehicle assignment failed");
                            // Don't fail the whole operation if vehicle assignment fails
                          }
                        } catch (vehicleErr) {
                          console.error("Error assigning vehicle:", vehicleErr);
                          // Continue anyway - member was created successfully
                        }
                      }

                      // Reload drivers list and vehicles
                      const driversRes = await fetch("/api/drivers");
                      if (driversRes.ok) {
                        const driversData = await driversRes.json();
                        setDrivers(driversData.drivers || []);
                      }

                      setShowAddMemberModal(false);
                      setMemberFormData({ name: "", email: "", phone: "", role: "driver", vehicleId: "" });
                      setMemberVehicleSearch("");
                      setIsMemberVehicleDropdownOpen(false);
                      showToast("Member added successfully!", "success");
                    } catch (err) {
                      console.error("Error creating member:", err);
                      const errorMessage = err instanceof Error ? err.message : "Failed to add member. Please try again.";
                      showToast(errorMessage, "error");
                    } finally {
                      setCreatingMember(false);
                    }
                  }}
                  className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50"
                >
                  {/* Basic Information */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary-600" />
                      </div>
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Full Name *</span>
                        <input
                          type="text"
                          required
                          className="input-field w-full"
                          value={memberFormData.name}
                          onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                          placeholder="e.g., John Doe"
                          disabled={creatingMember}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Email Address *</span>
                        <input
                          type="email"
                          required
                          className="input-field w-full"
                          value={memberFormData.email}
                          onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                          placeholder="e.g., john@example.com"
                          disabled={creatingMember}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Phone Number</span>
                        <input
                          type="tel"
                          className="input-field w-full"
                          value={memberFormData.phone}
                          onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                          placeholder="e.g., +1 (555) 123-4567"
                          disabled={creatingMember}
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional - Phone number for contact purposes</p>
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Role *</span>
                        <select
                          required
                          className="input-field w-full"
                          value={memberFormData.role}
                          onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value as "driver" | "mechanic" })}
                          disabled={creatingMember}
                        >
                          <option value="driver">Driver</option>
                          <option value="mechanic">Mechanic</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Vehicle Assignment */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Car className="h-4 w-4 text-blue-600" />
                      </div>
                      Vehicle Assignment
                    </h3>
                    <label className="space-y-1.5 block">
                      <span className="text-sm font-semibold text-gray-700">Assign Vehicle (Optional)</span>
                      <div ref={memberVehicleDropdownRef} className="relative">
                        <button
                          type="button"
                          onClick={() => !creatingMember && setIsMemberVehicleDropdownOpen(!isMemberVehicleDropdownOpen)}
                          disabled={creatingMember}
                          className={`
                            w-full px-3 py-2.5 text-left bg-white border-2 border-gray-300 rounded-lg
                            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                            transition-all duration-200
                            flex items-center justify-between
                            ${creatingMember ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-gray-400 cursor-pointer"}
                            ${isMemberVehicleDropdownOpen ? "border-primary-500 ring-2 ring-primary-200" : ""}
                          `}
                        >
                          <span className={memberFormData.vehicleId ? "text-gray-900 font-medium" : "text-gray-500"}>
                            {memberFormData.vehicleId
                              ? allVehicles.find((v) => v.id === memberFormData.vehicleId)?.make +
                                " " +
                                allVehicles.find((v) => v.id === memberFormData.vehicleId)?.model +
                                " (" +
                                allVehicles.find((v) => v.id === memberFormData.vehicleId)?.licensePlate +
                                ")"
                              : "Select a vehicle (optional)"}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isMemberVehicleDropdownOpen ? "transform rotate-180" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {isMemberVehicleDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setIsMemberVehicleDropdownOpen(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                              >
                                <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                      type="text"
                                      placeholder="Search vehicles..."
                                      value={memberVehicleSearch}
                                      onChange={(e) => setMemberVehicleSearch(e.target.value)}
                                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                {filteredMemberVehicles.length === 0 ? (
                                  <div className="p-3 text-sm text-gray-500 text-center">
                                    {memberVehicleSearch ? "No vehicles found" : "No unassigned vehicles available"}
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMemberFormData({ ...memberFormData, vehicleId: "" });
                                        setIsMemberVehicleDropdownOpen(false);
                                        setMemberVehicleSearch("");
                                      }}
                                      className={`
                                        w-full px-3 py-2.5 text-left flex items-center justify-between
                                        transition-colors duration-150
                                        ${!memberFormData.vehicleId ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50 text-gray-900"}
                                      `}
                                    >
                                      <span className="text-sm font-medium">No vehicle</span>
                                      {!memberFormData.vehicleId && <Check className="h-4 w-4 text-primary-600 flex-shrink-0 ml-2" />}
                                    </button>
                                    {filteredMemberVehicles.map((vehicle) => (
                                      <button
                                        key={vehicle.id}
                                        type="button"
                                        onClick={() => {
                                          setMemberFormData({ ...memberFormData, vehicleId: vehicle.id });
                                          setIsMemberVehicleDropdownOpen(false);
                                          setMemberVehicleSearch("");
                                        }}
                                        className={`
                                          w-full px-3 py-2.5 text-left flex items-center justify-between
                                          transition-colors duration-150
                                          ${memberFormData.vehicleId === vehicle.id ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50 text-gray-900"}
                                        `}
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">
                                            {vehicle.make} {vehicle.model}
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">
                                            {vehicle.licensePlate} • {vehicle.vin}
                                          </div>
                                        </div>
                                        {memberFormData.vehicleId === vehicle.id && <Check className="h-4 w-4 text-primary-600 flex-shrink-0 ml-2" />}
                                      </button>
                                    ))}
                                  </>
                                )}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Only unassigned vehicles are shown. You can assign a vehicle after creation if needed.</p>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMemberModal(false);
                        setMemberFormData({ name: "", email: "", phone: "", role: "driver", vehicleId: "" });
                        setMemberVehicleSearch("");
                        setIsMemberVehicleDropdownOpen(false);
                      }}
                      className="btn btn-secondary flex-1"
                      disabled={creatingMember}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary flex-1 flex items-center gap-2 justify-center" disabled={creatingMember}>
                      {creatingMember ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Add Member
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

      {/* Driver Details Side Panel */}
      <AnimatePresence>
        {selectedDriver && (
          <motion.div className="fixed inset-0 z-50 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedDriver(null)} />
            <motion.div
              className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Team Member Details</h2>
                    <p className="text-xs text-gray-500 font-mono">ID: {selectedDriver.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!editing && (
                    <button onClick={() => openEdit(selectedDriver)} className="btn btn-ghost btn-sm flex items-center gap-1.5">
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedDriver(null);
                      setEditing(false);
                      setEditForm({});
                    }}
                    className="btn btn-ghost btn-icon"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {/* Driver Info Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  {!editing ? (
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm">
                          <Users className="h-8 w-8 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{selectedDriver.name}</h3>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Name</span>
                        <input className="input-field w-full" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                      </label>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    Contact Information
                  </h3>
                  {!editing ? (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                        <a
                          href={`mailto:${selectedDriver.email}`}
                          className="text-base font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          {selectedDriver.email}
                        </a>
                      </div>
                      {selectedDriver.phone && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</p>
                          <a
                            href={`tel:${selectedDriver.phone}`}
                            className="text-base font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-2"
                          >
                            <Phone className="h-4 w-4" />
                            {selectedDriver.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 space-y-4">
                      <label className="space-y-1.5 block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</span>
                        <input
                          type="email"
                          className="input-field w-full"
                          value={editForm.email || ""}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</span>
                        <input
                          type="tel"
                          className="input-field w-full"
                          value={editForm.phone || ""}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Account Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    Account Information
                  </h3>
                  {!editing ? (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</p>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedDriver.role ? selectedDriver.role.charAt(0).toUpperCase() + selectedDriver.role.slice(1) : "Not Set"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              selectedDriver.approval_status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {selectedDriver.approval_status ? selectedDriver.approval_status.replace("_", " ").toUpperCase() : "PENDING"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined Date</p>
                        <p className="text-base font-bold text-gray-900">
                          {new Date(selectedDriver.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      {selectedDriver.level_certification && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Certification</p>
                          <p className="text-sm text-gray-900">{selectedDriver.level_certification}</p>
                        </div>
                      )}
                      {selectedDriver.preferred_language && (
                        <div className="space-y-1 col-span-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preferred Language</p>
                          <p className="text-sm text-gray-900">{selectedDriver.preferred_language}</p>
                        </div>
                      )}
                      {selectedDriver.notes && (
                        <div className="space-y-1 col-span-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</p>
                          <p className="text-sm text-gray-900">{selectedDriver.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <label className="space-y-1.5 block">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</span>
                          <select
                            className="input-field w-full"
                            value={editForm.role || ""}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User["role"] })}
                          >
                            <option value="">Select Role</option>
                            <option value="driver">Driver</option>
                            <option value="mechanic">Mechanic</option>
                            <option value="admin">Admin</option>
                            <option value="customer">Customer</option>
                          </select>
                        </label>
                        <label className="space-y-1.5 block">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
                          <select
                            className="input-field w-full"
                            value={editForm.approval_status || ""}
                            onChange={(e) => setEditForm({ ...editForm, approval_status: e.target.value as User["approval_status"] })}
                          >
                            <option value="pending_approval">Pending Approval</option>
                            <option value="approved">Approved</option>
                          </select>
                        </label>
                      </div>
                      <label className="space-y-1.5 block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Certification Level</span>
                        <input
                          type="text"
                          className="input-field w-full"
                          value={editForm.level_certification || ""}
                          onChange={(e) => setEditForm({ ...editForm, level_certification: e.target.value })}
                          placeholder="e.g., CDL Class A, Forklift Certified"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preferred Language</span>
                        <input
                          type="text"
                          className="input-field w-full"
                          value={editForm.preferred_language || ""}
                          onChange={(e) => setEditForm({ ...editForm, preferred_language: e.target.value })}
                          placeholder="e.g., English, Spanish"
                        />
                      </label>
                      <label className="space-y-1.5 block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</span>
                        <textarea
                          className="input-field w-full"
                          rows={3}
                          value={editForm.notes || ""}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="Additional notes about this person"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Assigned Vehicles */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Car className="h-4 w-4 text-blue-600" />
                      </div>
                      Assigned Vehicles
                    </h3>
                    {!showVehicleSelector && (
                      <button onClick={() => setShowVehicleSelector(true)} className="btn btn-sm btn-secondary flex items-center gap-1.5">
                        <UserPlus className="h-3.5 w-3.5" />
                        Assign Vehicle
                      </button>
                    )}
                  </div>

                  {showVehicleSelector ? (
                    <div className="space-y-3">
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Select Vehicle</span>
                        <div ref={vehicleDropdownRef} className="relative">
                          <button
                            type="button"
                            onClick={() => !assigningVehicle && setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                            disabled={assigningVehicle}
                            className={`
                              w-full px-3 py-2.5 text-left bg-white border-2 border-gray-300 rounded-lg
                              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                              transition-all duration-200
                              flex items-center justify-between
                              ${assigningVehicle ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-gray-400 cursor-pointer"}
                              ${isVehicleDropdownOpen ? "border-primary-500 ring-2 ring-primary-200" : ""}
                            `}
                          >
                            <span className={selectedVehicleId ? "text-gray-900 font-medium" : "text-gray-500"}>
                              {selectedVehicleId
                                ? filteredVehicles.find((v) => v.id === selectedVehicleId)?.make +
                                  " " +
                                  filteredVehicles.find((v) => v.id === selectedVehicleId)?.model +
                                  " (" +
                                  filteredVehicles.find((v) => v.id === selectedVehicleId)?.licensePlate +
                                  ")"
                                : "Select a vehicle"}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isVehicleDropdownOpen ? "transform rotate-180" : ""}`}
                            />
                          </button>

                          <AnimatePresence>
                            {isVehicleDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsVehicleDropdownOpen(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                                >
                                  <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      <input
                                        type="text"
                                        placeholder="Search vehicles..."
                                        value={vehicleSearch}
                                        onChange={(e) => setVehicleSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                  {filteredVehicles.length === 0 ? (
                                    <div className="p-3 text-sm text-gray-500 text-center">No vehicles available</div>
                                  ) : (
                                    filteredVehicles.map((vehicle) => (
                                      <button
                                        key={vehicle.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedVehicleId(vehicle.id);
                                          setIsVehicleDropdownOpen(false);
                                        }}
                                        className={`
                                          w-full px-3 py-2.5 text-left flex items-center justify-between
                                          transition-colors duration-150
                                          ${selectedVehicleId === vehicle.id ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50 text-gray-900"}
                                        `}
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium truncate">
                                            {vehicle.make} {vehicle.model}
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">
                                            {vehicle.licensePlate} • {vehicle.vin}
                                          </div>
                                        </div>
                                        {selectedVehicleId === vehicle.id && <Check className="h-4 w-4 text-primary-600 flex-shrink-0 ml-2" />}
                                      </button>
                                    ))
                                  )}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={assignVehicle}
                          className="btn btn-primary btn-sm flex-1 flex items-center gap-1.5"
                          disabled={assigningVehicle || !selectedVehicleId}
                        >
                          {assigningVehicle ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <Save className="h-3.5 w-3.5" />
                              Assign
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowVehicleSelector(false);
                            setSelectedVehicleId("");
                            setIsVehicleDropdownOpen(false);
                            setVehicleSearch("");
                          }}
                          className="btn btn-secondary btn-sm"
                          disabled={assigningVehicle}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : loadingVehicles ? (
                    <div className="p-4 text-center text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading vehicles...
                    </div>
                  ) : assignedVehicles.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">No vehicles assigned to this driver</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignedVehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Car className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {vehicle.make} {vehicle.model} ({vehicle.year})
                              </h4>
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <p>License: {vehicle.licensePlate}</p>
                              {vehicle.vehicleNumber && <p>Vehicle #: {vehicle.vehicleNumber}</p>}
                            </div>
                          </div>
                          <button
                            onClick={() => unassignVehicle(vehicle.id)}
                            className="btn btn-sm btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 ml-3"
                            disabled={assigningVehicle}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit Actions */}
                {editing && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex gap-3">
                      <button onClick={cancelEdit} className="btn btn-secondary flex-1" disabled={saving}>
                        Cancel
                      </button>
                      <button onClick={saveDriver} className="btn btn-primary flex-1 flex items-center gap-2 justify-center" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Column Configuration Modal */}
      <DriverColumnConfigModal isOpen={showColumnConfig} onClose={() => setShowColumnConfig(false)} columns={columns} onColumnsChange={setColumns} />
    </div>
  );
}

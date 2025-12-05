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
} from "lucide-react";
import { User, Vehicle } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { useVehicles } from "@/hooks/use-vehicles";
import { Pagination } from "@/components/ui/pagination";
import { exportDrivers } from "@/lib/export-utils";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("drivers-view-mode");
    if (savedView === "grid" || savedView === "list") {
      setViewMode(savedView);
    }
    const savedItemsPerPage = localStorage.getItem("drivers-items-per-page");
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
    localStorage.setItem("drivers-view-mode", mode);
  };

  // Filter drivers based on search term
  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim()) {
      return drivers;
    }
    const searchLower = searchTerm.toLowerCase().trim();
    return drivers.filter((driver) => {
      const name = (driver.name || "").toLowerCase();
      const email = (driver.email || "").toLowerCase();
      const phone = (driver.phone || "").toLowerCase();
      const role = (driver.role || "").toLowerCase();

      return name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower) || role.includes(searchLower);
    });
  }, [drivers, searchTerm]);

  // Calculate pagination
  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDrivers.slice(startIndex, endIndex);
  }, [filteredDrivers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

  // Reset to page 1 when items per page changes or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchTerm]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    localStorage.setItem("drivers-items-per-page", newItemsPerPage.toString());
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

      const res = await fetch(`/api/drivers/${selectedDriver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to update driver" }));
        const errorMessage = errorData.error || errorData.details || "Failed to update driver";
        console.error("API Error:", errorData);
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.driver) {
        throw new Error("Invalid response from server");
      }

      const updatedDriver = data.driver;

      // Update the driver in the list
      setDrivers((prev) => prev.map((d) => (d.id === selectedDriver.id ? updatedDriver : d)));
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
    };

    if (isVehicleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVehicleDropdownOpen]);

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

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || "admin"} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Team</p>
                <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
                <p className="text-gray-600">Manage and view all registered team members including drivers, mechanics, and administrators.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
                  <button
                    onClick={() => handleViewModeChange("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid" ? "bg-white text-primary-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list" ? "bg-white text-primary-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => exportDrivers(filteredDrivers)}
                  className="btn btn-secondary flex items-center gap-2"
                  disabled={filteredDrivers.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Member
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-md relative">
                <div className="input-group">
                  <span className="input-group-icon input-group-icon-left">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search team members by name, email, phone, role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-with-icon-left pr-12"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {searchTerm && (
                <div className="text-sm text-gray-600">
                  {filteredDrivers.length} {filteredDrivers.length === 1 ? "member" : "members"} found
                </div>
              )}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading drivers...</div>
            ) : (
              <>
                {viewMode === "grid" ? (
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
                    <motion.div layout className="space-y-3">
                      <AnimatePresence>
                        {paginatedDrivers.map((driver, i) => (
                          <motion.div
                            key={driver.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.03 }}
                            onClick={() => setSelectedDriver(driver)}
                            className="card-surface rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200/60 group cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-lg shadow-sm flex-shrink-0">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                <div className="md:col-span-2">
                                  <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                                    {driver.name}
                                  </h3>
                                  {driver.role && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {driver.role.charAt(0).toUpperCase() + driver.role.slice(1)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-700 truncate max-w-[200px]" title={driver.email}>
                                    {driver.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {driver.phone ? (
                                    <>
                                      <Phone className="h-4 w-4 text-gray-400" />
                                      <span className="text-gray-700">{driver.phone}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">No phone</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs text-gray-500">{new Date(driver.createdAt).toLocaleDateString()}</span>
                                  <button
                                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {paginatedDrivers.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                          {searchTerm ? `No team members found matching "${searchTerm}".` : "No team members found."}
                        </div>
                      )}
                    </motion.div>
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
                )}
              </>
            )}
          </div>
        </main>
      </div>

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
                        <input
                          className="input-field w-full"
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
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
    </div>
  );
}

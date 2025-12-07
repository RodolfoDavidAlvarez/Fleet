"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  ArrowLeft,
  Save,
  Loader2,
  Car,
  X,
  Edit2,
  Calendar,
  Gauge,
  User as UserIcon,
  Building,
  Tag,
  FileText,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import { Vehicle, VehicleStatus } from "@/types";
import { useToast } from "@/components/ui/toast";
import { useUpdateVehicle, useDrivers } from "@/hooks/use-vehicles";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { motion, AnimatePresence } from "framer-motion";

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const vehicleId = params.id as string;
  const updateVehicle = useUpdateVehicle();
  const { data: drivers = [], isLoading: driversLoading } = useDrivers();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehicle>>({});
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const driverDropdownRef = useRef<HTMLDivElement>(null);

  // Load persisted driver search from localStorage
  useEffect(() => {
    if (vehicleId) {
      const persistedSearch = localStorage.getItem(`driver-search-${vehicleId}`);
      if (persistedSearch) {
        setDriverSearch(persistedSearch);
      }
    }
  }, [vehicleId]);

  // Persist driver search term
  useEffect(() => {
    if (vehicleId) {
      if (driverSearch) {
        localStorage.setItem(`driver-search-${vehicleId}`, driverSearch);
      } else {
        localStorage.removeItem(`driver-search-${vehicleId}`);
      }
    }
  }, [driverSearch, vehicleId]);

  // Fetch vehicle data
  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: [...queryKeys.vehicles, vehicleId],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${vehicleId}`);
      if (!response.ok) throw new Error("Failed to fetch vehicle");
      const data = await response.json();
      return data.vehicle;
    },
    enabled: !!vehicleId,
  });

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
  }, [router]);

  // Load persisted form data and editing state from localStorage
  useEffect(() => {
    if (vehicleId) {
      const storageKey = `vehicle-edit-${vehicleId}`;
      const persistedData = localStorage.getItem(storageKey);
      const persistedEditing = localStorage.getItem(`vehicle-editing-${vehicleId}`);

      if (persistedData) {
        try {
          const parsed = JSON.parse(persistedData);
          // Only restore if the vehicle ID matches and data exists
          if (parsed.vehicleId === vehicleId) {
            setFormData(parsed.formData);
            if (persistedEditing === "true") {
              setIsEditing(true);
            }
          }
        } catch (e) {
          console.error("Error parsing persisted form data:", e);
        }
      }
    }
  }, [vehicleId]);

  useEffect(() => {
    if (vehicle) {
      const storageKey = `vehicle-edit-${vehicleId}`;
      const persistedData = localStorage.getItem(storageKey);

      // Only reset form data if there's no persisted data or if persisted data is for a different vehicle
      if (!persistedData) {
        setFormData({
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin,
          licensePlate: vehicle.licensePlate,
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicle.vehicleType,
          status: vehicle.status,
          mileage: vehicle.mileage,
          department: vehicle.department,
          supervisor: vehicle.supervisor,
          tagExpiry: vehicle.tagExpiry,
          loanLender: vehicle.loanLender,
          firstAidFire: vehicle.firstAidFire,
          title: vehicle.title,
          lastServiceDate: vehicle.lastServiceDate,
          nextServiceDue: vehicle.nextServiceDue,
          lastUsedDate: vehicle.lastUsedDate,
          driverId: vehicle.driverId,
        });
      } else {
        // Merge persisted data with vehicle data to ensure we have all fields
        try {
          const parsed = JSON.parse(persistedData);
          if (parsed.vehicleId === vehicleId) {
            setFormData({
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              vin: vehicle.vin,
              licensePlate: vehicle.licensePlate,
              vehicleNumber: vehicle.vehicleNumber,
              vehicleType: vehicle.vehicleType,
              status: vehicle.status,
              mileage: vehicle.mileage,
              department: vehicle.department,
              supervisor: vehicle.supervisor,
              tagExpiry: vehicle.tagExpiry,
              loanLender: vehicle.loanLender,
              firstAidFire: vehicle.firstAidFire,
              title: vehicle.title,
              lastServiceDate: vehicle.lastServiceDate,
              nextServiceDue: vehicle.nextServiceDue,
              lastUsedDate: vehicle.lastUsedDate,
              driverId: vehicle.driverId,
              ...parsed.formData, // Override with persisted changes
            });
          }
        } catch (e) {
          // If parsing fails, use vehicle data
          setFormData({
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vin: vehicle.vin,
            licensePlate: vehicle.licensePlate,
            vehicleNumber: vehicle.vehicleNumber,
            vehicleType: vehicle.vehicleType,
            status: vehicle.status,
            mileage: vehicle.mileage,
            department: vehicle.department,
            supervisor: vehicle.supervisor,
            tagExpiry: vehicle.tagExpiry,
            loanLender: vehicle.loanLender,
            firstAidFire: vehicle.firstAidFire,
            title: vehicle.title,
            lastServiceDate: vehicle.lastServiceDate,
            nextServiceDue: vehicle.nextServiceDue,
            lastUsedDate: vehicle.lastUsedDate,
            driverId: vehicle.driverId,
          });
        }
      }
    }
  }, [vehicle, vehicleId]);

  // Filter drivers based on search
  const filteredDrivers = useMemo(() => {
    if (!driverSearch.trim()) return drivers;
    const searchLower = driverSearch.toLowerCase();
    return drivers.filter(
      (driver) =>
        driver.name?.toLowerCase().includes(searchLower) ||
        driver.email?.toLowerCase().includes(searchLower) ||
        driver.phone?.toLowerCase().includes(searchLower)
    );
  }, [drivers, driverSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (driverDropdownRef.current && !driverDropdownRef.current.contains(event.target as Node)) {
        setIsDriverDropdownOpen(false);
        // Don't clear search on close - keep it for next time
      }
    };

    if (isDriverDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDriverDropdownOpen]);

  // Cleanup: Clear old persisted data (older than 24 hours) on mount
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      keys.forEach((key) => {
        if (key.startsWith("vehicle-edit-") || key.startsWith("vehicle-editing-") || key.startsWith("driver-search-")) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed.timestamp && now - parsed.timestamp > maxAge) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            // If it's not JSON (like vehicle-editing-*), check if it's old by trying to parse timestamp
            // For simplicity, we'll just keep non-JSON items
          }
        }
      });
    } catch (e) {
      console.error("Error cleaning up old persisted data:", e);
    }
  }, []);

  // Persist form data to localStorage whenever it changes (while editing)
  useEffect(() => {
    if (isEditing && vehicleId && Object.keys(formData).length > 0) {
      const storageKey = `vehicle-edit-${vehicleId}`;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            vehicleId,
            formData,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.error("Error saving form data to localStorage:", e);
      }
    }
  }, [formData, isEditing, vehicleId]);

  // Persist editing state
  useEffect(() => {
    if (vehicleId) {
      if (isEditing) {
        localStorage.setItem(`vehicle-editing-${vehicleId}`, "true");
      } else {
        localStorage.removeItem(`vehicle-editing-${vehicleId}`);
        // Clear persisted form data when exiting edit mode
        const storageKey = `vehicle-edit-${vehicleId}`;
        localStorage.removeItem(storageKey);
      }
    }
  }, [isEditing, vehicleId]);

  // Get selected driver info
  const selectedDriver = useMemo(() => {
    if (!formData.driverId) return null;
    return drivers.find((d) => d.id === formData.driverId);
  }, [drivers, formData.driverId]);

  const handleSave = async () => {
    if (!vehicle) return;

    try {
      await updateVehicle.mutateAsync({
        id: vehicle.id,
        updates: formData,
      });
      setIsEditing(false);
      // Clear persisted data after successful save
      const storageKey = `vehicle-edit-${vehicleId}`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`vehicle-editing-${vehicleId}`);
      showToast("Vehicle updated successfully!", "success");
    } catch (error) {
      console.error("Error updating vehicle:", error);
      showToast("Failed to update vehicle. Please try again.", "error");
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar role={user?.role || "admin"} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header userName={user.name} userRole={user.role} userEmail={user.email} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar role={user?.role || "admin"} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header userName={user.name} userRole={user.role} userEmail={user.email} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <p className="text-gray-500">Vehicle not found</p>
                <button onClick={() => router.push("/admin/vehicles")} className="btn btn-primary mt-4">
                  Back to Vehicles
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role || "admin"} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push("/admin/vehicles")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Vehicles</span>
              </button>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Clear persisted data
                        const storageKey = `vehicle-edit-${vehicleId}`;
                        localStorage.removeItem(storageKey);
                        localStorage.removeItem(`vehicle-editing-${vehicleId}`);
                        // Reset form data to original vehicle data
                        if (vehicle) {
                          setFormData({
                            make: vehicle.make,
                            model: vehicle.model,
                            year: vehicle.year,
                            vin: vehicle.vin,
                            licensePlate: vehicle.licensePlate,
                            vehicleNumber: vehicle.vehicleNumber,
                            vehicleType: vehicle.vehicleType,
                            status: vehicle.status,
                            mileage: vehicle.mileage,
                            department: vehicle.department,
                            supervisor: vehicle.supervisor,
                            tagExpiry: vehicle.tagExpiry,
                            loanLender: vehicle.loanLender,
                            firstAidFire: vehicle.firstAidFire,
                            title: vehicle.title,
                            lastServiceDate: vehicle.lastServiceDate,
                            nextServiceDue: vehicle.nextServiceDue,
                            lastUsedDate: vehicle.lastUsedDate,
                            driverId: vehicle.driverId,
                          });
                        }
                      }}
                      className="btn btn-secondary"
                      disabled={updateVehicle.isPending}
                    >
                      Cancel
                    </button>
                    <button onClick={handleSave} className="btn btn-primary flex items-center gap-2" disabled={updateVehicle.isPending}>
                      {updateVehicle.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="btn btn-primary flex items-center gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit Vehicle
                  </button>
                )}
              </div>
            </div>

            {/* Vehicle Info Card */}
            <div className="card-surface rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-xl shadow-sm">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : vehicle.vehicleNumber || "Unknown Vehicle"}
                  </h1>
                  {vehicle.year && <p className="text-gray-600">{vehicle.year}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Basic Information
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Make</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.make || ""}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                          className="input-field w-full mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.make || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Model</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.model || ""}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          className="input-field w-full mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.model || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Year</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={formData.year || ""}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                          className="input-field w-full mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.year || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Vehicle Type</label>
                      {isEditing ? (
                        <select
                          value={formData.vehicleType || "Vehicle"}
                          onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                          className="input-field w-full mt-1"
                        >
                          <option value="Vehicle">Vehicle</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Trailer">Trailer</option>
                        </select>
                      ) : (
                        <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.vehicleType || "Vehicle"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</label>
                      {isEditing ? (
                        <select
                          value={formData.status || "operational"}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                          className="input-field w-full mt-1"
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
                      ) : (
                        <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.status?.replace("_", " ") || "-"}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Identification */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Identification
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">VIN</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.vin || ""}
                          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                          className="input-field w-full mt-1 font-mono"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 mt-1 font-mono">{vehicle.vin || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">License Plate</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.licensePlate || ""}
                          onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                          className="input-field w-full mt-1 font-mono"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 mt-1 font-mono">{vehicle.licensePlate || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Company ID / Vehicle Number</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.vehicleNumber || ""}
                          onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                          className="input-field w-full mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.vehicleNumber || "-"}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Mileage</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={formData.mileage || 0}
                          onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                          className="input-field w-full mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.mileage?.toLocaleString() || "0"} mi</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <Building className="h-4 w-4" />
                  Additional Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Department</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.department || ""}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="input-field w-full mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.department || "-"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Supervisor</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.supervisor || ""}
                        onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                        className="input-field w-full mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.supervisor || "-"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tag Expiry</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.tagExpiry || ""}
                        onChange={(e) => setFormData({ ...formData, tagExpiry: e.target.value })}
                        className="input-field w-full mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 mt-1">{vehicle.tagExpiry ? formatDate(vehicle.tagExpiry) : "-"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Used Date</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.lastUsedDate || ""}
                        onChange={(e) => setFormData({ ...formData, lastUsedDate: e.target.value })}
                        className="input-field w-full mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {vehicle.lastUsedDate ? formatDate(vehicle.lastUsedDate) : "Never tracked"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Driver Assignment */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <UserIcon className="h-4 w-4" />
                  Driver Assignment
                </h2>
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">Assigned Driver</label>
                  {isEditing ? (
                    <div ref={driverDropdownRef} className="relative">
                      <button
                        id="driver-dropdown-button"
                        type="button"
                        onClick={() => !driversLoading && setIsDriverDropdownOpen(!isDriverDropdownOpen)}
                        disabled={driversLoading}
                        className={`
                          w-full px-4 py-3 text-left bg-white border-2 border-gray-300 rounded-lg
                          focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                          transition-all duration-200
                          flex items-center justify-between
                          ${driversLoading ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-gray-400 cursor-pointer"}
                          ${isDriverDropdownOpen ? "border-primary-500 ring-2 ring-primary-200" : ""}
                        `}
                      >
                        {selectedDriver ? (
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
                              {selectedDriver.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{selectedDriver.name}</p>
                              {selectedDriver.email && <p className="text-xs text-gray-500 truncate">{selectedDriver.email}</p>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Select a driver...</span>
                        )}
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isDriverDropdownOpen ? "transform rotate-180" : ""}`}
                        />
                      </button>

                      <AnimatePresence>
                        {isDriverDropdownOpen &&
                          (() => {
                            const button = document.getElementById("driver-dropdown-button");
                            const rect = button?.getBoundingClientRect();
                            const viewportHeight = window.innerHeight;
                            const viewportWidth = window.innerWidth;
                            const spaceBelow = rect ? viewportHeight - rect.bottom : 0;
                            const spaceAbove = rect ? rect.top : 0;
                            const dropdownHeight = 320; // max-h-80 = 320px
                            const shouldOpenAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

                            // Calculate position, ensuring dropdown stays within viewport
                            let top = "0px";
                            let left = "0px";
                            let width = "auto";

                            if (rect) {
                              // Vertical positioning
                              if (shouldOpenAbove) {
                                const topPosition = rect.top - dropdownHeight - 8;
                                top = `${Math.max(8, topPosition)}px`; // Ensure at least 8px from top
                              } else {
                                top = `${Math.min(rect.bottom + 8, viewportHeight - dropdownHeight - 8)}px`; // Ensure it fits
                              }

                              // Horizontal positioning - ensure it doesn't go off screen
                              const dropdownWidth = Math.min(rect.width, viewportWidth - 16); // Leave 8px margin on each side
                              const leftPosition = Math.min(rect.left, viewportWidth - dropdownWidth - 8);
                              left = `${Math.max(8, leftPosition)}px`;
                              width = `${dropdownWidth}px`;
                            }

                            return (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDriverDropdownOpen(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: shouldOpenAbove ? 10 : -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: shouldOpenAbove ? 10 : -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="fixed z-20 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden"
                                  style={{
                                    top,
                                    left,
                                    width,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Search Input */}
                                  <div className="p-3 border-b border-gray-200 sticky top-0 bg-white z-10">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      <input
                                        type="text"
                                        placeholder="Search by name, email, or phone..."
                                        value={driverSearch}
                                        onChange={(e) => setDriverSearch(e.target.value)}
                                        onFocus={(e) => e.stopPropagation()}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        autoFocus
                                      />
                                    </div>
                                  </div>

                                  {/* Driver List */}
                                  <div className="max-h-60 overflow-y-auto">
                                    {driversLoading ? (
                                      <div className="p-4 text-center">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary-600 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Loading drivers...</p>
                                      </div>
                                    ) : filteredDrivers.length === 0 ? (
                                      <div className="p-4 text-sm text-gray-500 text-center">
                                        {driverSearch.trim() ? "No drivers found matching your search" : "No drivers available"}
                                      </div>
                                    ) : (
                                      <>
                                        {/* Option to clear selection */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setFormData({ ...formData, driverId: null });
                                            setIsDriverDropdownOpen(false);
                                            // Keep search term for next time
                                          }}
                                          className={`
                                        w-full px-4 py-2.5 text-left flex items-center justify-between
                                        transition-colors duration-150 border-b border-gray-100
                                        ${!formData.driverId ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50 text-gray-900"}
                                      `}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                              <UserIcon className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">No driver assigned</p>
                                              <p className="text-xs text-gray-500">Remove assignment</p>
                                            </div>
                                          </div>
                                          {!formData.driverId && <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />}
                                        </button>

                                        {/* Driver options */}
                                        {filteredDrivers.map((driver) => (
                                          <button
                                            key={driver.id}
                                            type="button"
                                            onClick={() => {
                                              setFormData({ ...formData, driverId: driver.id });
                                              setIsDriverDropdownOpen(false);
                                              // Keep search term for next time
                                            }}
                                            className={`
                                          w-full px-4 py-2.5 text-left flex items-center justify-between
                                          transition-colors duration-150 border-b border-gray-100 last:border-0
                                          ${formData.driverId === driver.id ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50 text-gray-900"}
                                        `}
                                          >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
                                                {driver.name
                                                  ?.split(" ")
                                                  .map((n) => n[0])
                                                  .join("")
                                                  .toUpperCase()
                                                  .slice(0, 2) || "?"}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{driver.name || "Unknown"}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                  {driver.email && <p className="text-xs text-gray-500 truncate">{driver.email}</p>}
                                                  {driver.phone && (
                                                    <p className="text-xs text-gray-500 truncate">
                                                      {driver.email && "•"} {driver.phone}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            {formData.driverId === driver.id && <Check className="h-4 w-4 text-primary-600 flex-shrink-0 ml-2" />}
                                          </button>
                                        ))}
                                      </>
                                    )}
                                  </div>
                                </motion.div>
                              </>
                            );
                          })()}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div>
                      {vehicle.driverName ? (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold shadow-sm">
                            {vehicle.driverName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{vehicle.driverName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {vehicle.driverEmail && <p className="text-xs text-gray-600 truncate">{vehicle.driverEmail}</p>}
                              {vehicle.driverPhone && (
                                <p className="text-xs text-gray-600 truncate">
                                  {vehicle.driverEmail && "•"} {vehicle.driverPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            No driver assigned
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

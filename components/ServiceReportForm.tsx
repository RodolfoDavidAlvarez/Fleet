"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, CheckCircle, Wrench, User, Calendar, AlertCircle, Search, Bell, ExternalLink, Plus, Mail, Phone } from "lucide-react";
import { RepairRequest } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/utils";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import { useToast } from "@/components/ui/toast";

interface ServiceReportFormProps {
  repairRequest?: RepairRequest;
  repairOptions?: RepairRequest[];
  onClose: () => void;
  onSubmit: (data: ServiceReportFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export interface ServiceReportFormData {
  mechanicName: string;
  serviceType: string;
  description: string;
  cost: string;
  mileage: string;
  laborHours?: string;
  laborCost?: string;
  partsCost?: string;
  totalCost?: string;
  status: string;
  date: string;
  repairRequestId?: string;
  notifyDriver?: boolean;
  notificationStatus?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "mechanic" | "customer" | "driver";
}

export default function ServiceReportForm({
  repairRequest: initialRepairRequest,
  repairOptions = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}: ServiceReportFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedRepairRequest, setSelectedRepairRequest] = useState<RepairRequest | undefined>(initialRepairRequest);
  const [repairSearch, setRepairSearch] = useState("");
  const [showRepairSelector, setShowRepairSelector] = useState(false);
  const [adminsAndMechanics, setAdminsAndMechanics] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddMechanicModal, setShowAddMechanicModal] = useState(false);
  const [creatingMechanic, setCreatingMechanic] = useState(false);
  const [mechanicError, setMechanicError] = useState<string | null>(null);
  const [newMechanic, setNewMechanic] = useState({ name: "", email: "", phone: "" });

  const [form, setForm] = useState<ServiceReportFormData>({
    mechanicName: "",
    serviceType: initialRepairRequest?.aiCategory || "",
    description: "",
    cost: "",
    mileage: initialRepairRequest?.odometer?.toString() || "",
    laborHours: "",
    laborCost: "",
    partsCost: "",
    totalCost: "",
    status: "completed",
    date: new Date().toISOString().split("T")[0],
    repairRequestId: initialRepairRequest?.id,
    notifyDriver: true, // Pre-selected by default
    notificationStatus: "completed_ready_for_pickup",
  });

  const loadAdminsAndMechanics = useCallback(async () => {
    try {
      setLoadingUsers(true);
      // Load both admins and mechanics - mechanics are treated as admins
      const res = await fetch("/api/admin/users?role=admin,mechanic");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      const approvedUsers = (data.users || []).filter((user: User & { approval_status?: string }) => user.approval_status === "approved");
      setAdminsAndMechanics(approvedUsers);
    } catch (err) {
      console.error("Error loading admins and mechanics:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch admins and mechanics on component mount
  useEffect(() => {
    loadAdminsAndMechanics();
  }, [loadAdminsAndMechanics]);

  // Update form when repair request is selected
  useEffect(() => {
    if (selectedRepairRequest) {
      setForm((prev) => ({
        ...prev,
        repairRequestId: selectedRepairRequest.id,
        mileage: selectedRepairRequest.odometer?.toString() || prev.mileage,
        serviceType: selectedRepairRequest.aiCategory || prev.serviceType,
      }));
    }
  }, [selectedRepairRequest]);

  const filteredRepairOptions = repairOptions.filter((req) => {
    if (!repairSearch.trim()) return true;
    const search = repairSearch.toLowerCase();
    return (
      req.driverName?.toLowerCase().includes(search) ||
      req.vehicleIdentifier?.toLowerCase().includes(search) ||
      req.description?.toLowerCase().includes(search) ||
      req.aiCategory?.toLowerCase().includes(search)
    );
  });

  // Auto-calculate total cost when parts/labor costs change
  useEffect(() => {
    const labor = parseFloat(form.laborCost || "0");
    const parts = parseFloat(form.partsCost || "0");
    const total = labor + parts;
    if (total > 0) {
      setForm((prev) => ({ ...prev, totalCost: total.toFixed(2), cost: total.toFixed(2) }));
    }
  }, [form.laborCost, form.partsCost]);

  const handleCreateMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingMechanic) return;

    setMechanicError(null);
    const name = newMechanic.name.trim();
    const email = newMechanic.email.trim().toLowerCase();
    const phone = newMechanic.phone.trim();

    if (!name || !email || !phone) {
      setMechanicError("Name, email, and phone are required.");
      return;
    }

    try {
      setCreatingMechanic(true);

      const userRes = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          role: "mechanic",
          approval_status: "approved",
        }),
      });
      const userData = await userRes.json().catch(() => ({}));
      if (!userRes.ok) {
        throw new Error(userData.error || userData.details || "Failed to create mechanic");
      }

      try {
        const mechRes = await fetch("/api/mechanics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            availability: "available",
            specializations: [],
          }),
        });
        if (!mechRes.ok) {
          const mechErr = await mechRes.json().catch(() => ({}));
          console.warn("Mechanic created in users table but failed to sync mechanics table:", mechErr.error || mechErr.details);
        }
      } catch (syncErr) {
        console.warn("Mechanic created in users table but sync to mechanics table failed:", syncErr);
      }

      await loadAdminsAndMechanics();
      setForm((prev) => ({ ...prev, mechanicName: name }));
      setShowAddMechanicModal(false);
      setNewMechanic({ name: "", email: "", phone: "" });
      showToast("Mechanic added and selected.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add mechanic";
      setMechanicError(message);
      showToast(message, "error");
    } finally {
      setCreatingMechanic(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mechanicName.trim()) {
      showToast("Please select who performed the work.", "error");
      return;
    }
    if (!form.description.trim()) {
      showToast("Please provide a description of the work performed.", "error");
      return;
    }
    await onSubmit(form);
  };

  const ADD_MECHANIC_OPTION = "__add_mechanic__";
  // Include both admins and mechanics - mechanics are treated as admins with full permissions
  const mechanicOptions = adminsAndMechanics
    .filter((user) => user.role === "admin" || user.role === "mechanic")
    .map((user) => ({
      value: user.name,
      label: `${user.name} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`,
    }));
  const mechanicSelectOptions = [...mechanicOptions, { value: ADD_MECHANIC_OPTION, label: "Add new mechanic" }];

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <motion.div
          className="absolute inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl flex flex-col h-full"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedRepairRequest ? "Submit Service Report" : "New Service Record"}</h2>
                <p className="text-xs text-gray-500 font-mono">{selectedRepairRequest ? selectedRepairRequest.driverName : "Log mechanic work"}</p>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
            {/* Repair Request Selector (only when creating from service records) */}
            {!initialRepairRequest && repairOptions.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-blue-600" />
                  </div>
                  Link to Repair Request (Optional)
                </h3>
                <div className="relative">
                  {!selectedRepairRequest ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          className="input-field w-full pl-9"
                          placeholder="Search repair requests..."
                          value={repairSearch}
                          onChange={(e) => {
                            setRepairSearch(e.target.value);
                            setShowRepairSelector(true);
                          }}
                          onFocus={() => setShowRepairSelector(true)}
                        />
                      </div>
                      {showRepairSelector && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowRepairSelector(false)} />
                          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredRepairOptions.length === 0 ? (
                              <div className="p-4 text-center text-sm text-gray-500">No repair requests found</div>
                            ) : (
                              filteredRepairOptions.slice(0, 10).map((req) => (
                                <button
                                  key={req.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRepairRequest(req);
                                    setShowRepairSelector(false);
                                    setRepairSearch("");
                                  }}
                                  className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">{req.driverName}</p>
                                      <p className="text-xs text-gray-500 truncate">{req.vehicleIdentifier || "No vehicle"}</p>
                                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{req.description}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                      <span className="text-xs text-gray-500">{formatDate(req.createdAt)}</span>
                                      {req.aiCategory && <span className="block text-xs text-indigo-600 mt-1">{req.aiCategory}</span>}
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <p className="text-sm font-semibold text-gray-900">Linked to Repair Request</p>
                          </div>
                          <p className="text-sm text-gray-700">{selectedRepairRequest.driverName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedRepairRequest.vehicleIdentifier && `Vehicle: ${selectedRepairRequest.vehicleIdentifier}`}
                            {selectedRepairRequest.aiCategory && ` • ${selectedRepairRequest.aiCategory}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRepairRequest(undefined);
                            setForm((prev) => ({ ...prev, repairRequestId: undefined }));
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Show Repair Request Details if linked */}
            {selectedRepairRequest && (
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-indigo-600" />
                    </div>
                    Related Repair Request
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/repairs?id=${selectedRepairRequest.id}`);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Details
                  </button>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Driver</p>
                      <p className="text-sm font-bold text-gray-900">{selectedRepairRequest.driverName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Vehicle</p>
                      <p className="text-sm font-bold text-gray-900">{selectedRepairRequest.vehicleIdentifier || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</p>
                      <p className="text-sm font-bold text-gray-900">{formatDate(selectedRepairRequest.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Odometer</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedRepairRequest.odometer ? `${selectedRepairRequest.odometer.toLocaleString()} mi` : "—"}
                      </p>
                    </div>
                  </div>
                  {selectedRepairRequest.description && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Issue Description</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{selectedRepairRequest.description}</p>
                    </div>
                  )}
                  {selectedRepairRequest.status && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                        {selectedRepairRequest.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  Service Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1.5 block">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Mechanic name <span className="text-red-500">*</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddMechanicModal(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add mechanic
                      </button>
                    </div>
                    {loadingUsers ? (
                      <div className="input-field w-full flex items-center justify-center py-2.5">
                        <span className="text-sm text-gray-500">Loading users...</span>
                      </div>
                    ) : mechanicOptions.length === 0 ? (
                      <div className="input-field w-full flex flex-col items-start gap-2 py-2.5 px-3 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-yellow-800 font-medium">
                          <AlertCircle className="h-4 w-4" />
                          No mechanics available
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddMechanicModal(true)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add a mechanic now
                        </button>
                      </div>
                    ) : (
                      <Select
                        value={form.mechanicName}
                        onChange={(value) => {
                          if (value === ADD_MECHANIC_OPTION) {
                            setShowAddMechanicModal(true);
                            return;
                          }
                          setForm({ ...form, mechanicName: value });
                        }}
                        options={mechanicSelectOptions}
                        placeholder="Who performed the work"
                      />
                    )}
                  </label>

                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">
                      Service type <span className="text-red-500">*</span>
                    </span>
                    <input
                      className="input-field w-full"
                      value={form.serviceType}
                      onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                      placeholder="Oil change, brakes, inspection..."
                      required
                    />
                  </label>

                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Date</span>
                    <DatePicker
                      value={form.date}
                      onChange={(value) => setForm({ ...form, date: value })}
                      placeholder="Select a date"
                      minDate={new Date().toISOString().split("T")[0]}
                    />
                  </label>

                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Mileage</span>
                    <input
                      className="input-field w-full"
                      type="text"
                      value={form.mileage ? parseInt(form.mileage || "0").toLocaleString() : ""}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/,/g, "");
                        if (numericValue === "" || /^\d+$/.test(numericValue)) {
                          setForm({ ...form, mileage: numericValue });
                        }
                      }}
                      placeholder="Current odometer reading"
                    />
                  </label>

                  {selectedRepairRequest && (
                    <>
                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Labor hours</span>
                        <input
                          className="input-field w-full"
                          type="number"
                          step="0.5"
                          value={form.laborHours}
                          onChange={(e) => setForm({ ...form, laborHours: e.target.value })}
                          placeholder="e.g. 2.5"
                        />
                      </label>

                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Parts cost</span>
                        <input
                          className="input-field w-full"
                          type="number"
                          step="0.01"
                          value={form.partsCost}
                          onChange={(e) => setForm({ ...form, partsCost: e.target.value })}
                          placeholder="USD"
                        />
                      </label>

                      <label className="space-y-1.5 block">
                        <span className="text-sm font-semibold text-gray-700">Total cost</span>
                        <input
                          className="input-field w-full"
                          type="number"
                          step="0.01"
                          value={form.totalCost}
                          onChange={(e) => setForm({ ...form, totalCost: e.target.value, cost: e.target.value })}
                          placeholder="USD"
                        />
                      </label>
                    </>
                  )}

                  {!selectedRepairRequest && (
                    <label className="space-y-1.5 block">
                      <span className="text-sm font-semibold text-gray-700">Approx. cost</span>
                      <input
                        className="input-field w-full"
                        type="number"
                        step="0.01"
                        value={form.cost}
                        onChange={(e) => setForm({ ...form, cost: e.target.value })}
                        placeholder="0.00"
                      />
                    </label>
                  )}

                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Status</span>
                    <Select
                      value={form.status}
                      onChange={(value) => setForm({ ...form, status: value })}
                      options={[
                        { value: "in_progress", label: "In Progress" },
                        { value: "completed", label: "Completed" },
                        { value: "cancelled", label: "Cancelled" },
                        { value: "open", label: "Open" },
                      ]}
                      placeholder="Select status"
                    />
                  </label>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  Work Performed & Notes
                </h3>
                <label className="space-y-1.5 block">
                  <span className="text-sm font-semibold text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </span>
                  <textarea
                    className="input-field w-full min-h-[120px]"
                    placeholder="Describe the work performed and findings..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </label>
              </section>

              {/* Driver Notification Section - Only show if repair request is linked */}
              {selectedRepairRequest && (
                <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    Driver Notification
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.notifyDriver}
                        onChange={(e) => setForm({ ...form, notifyDriver: e.target.checked })}
                        className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-gray-900">Notify the driver with status</span>
                        <p className="text-xs text-gray-500 mt-1">
                          Send SMS notification to {selectedRepairRequest.driverName} about the service status
                        </p>
                      </div>
                    </label>

                    {form.notifyDriver && (
                      <div className="pl-7">
                        <label className="space-y-1.5 block">
                          <span className="text-sm font-semibold text-gray-700">Notification Status</span>
                          <Select
                            value={form.notificationStatus || "completed_ready_for_pickup"}
                            onChange={(value) => setForm({ ...form, notificationStatus: value })}
                            options={[
                              { value: "completed_ready_for_pickup", label: "Completed - Ready for Pickup" },
                              { value: "completed", label: "Completed" },
                              { value: "on_hold", label: "On Hold" },
                              { value: "waiting_for_parts", label: "Waiting for Parts" },
                            ]}
                            placeholder="Select notification status"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <div className="flex gap-3 pt-2 border-t border-gray-200 bg-white rounded-xl p-5 shadow-sm sticky bottom-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2.5 justify-center flex items-center gap-2 shadow-lg shadow-primary-500/20 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {selectedRepairRequest ? "Submit Service Report" : "Save Record"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        <AnimatePresence>
          {showAddMechanicModal && (
            <motion.div
              className="fixed inset-0 z-[70] flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                  if (creatingMechanic) return;
                  setShowAddMechanicModal(false);
                  setMechanicError(null);
                  setNewMechanic({ name: "", email: "", phone: "" });
                }}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-primary-600 uppercase tracking-[0.08em]">Mechanic</p>
                    <h3 className="text-xl font-bold text-gray-900">Add mechanic on the fly</h3>
                    <p className="text-xs text-gray-500 mt-1">Creates an approved mechanic and makes them selectable immediately.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (creatingMechanic) return;
                      setShowAddMechanicModal(false);
                      setMechanicError(null);
                      setNewMechanic({ name: "", email: "", phone: "" });
                    }}
                    className="btn btn-ghost btn-icon"
                    aria-label="Close add mechanic modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {mechanicError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{mechanicError}</div>}

                <form onSubmit={handleCreateMechanic} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-1.5 block">
                      <span className="text-sm font-semibold text-gray-700">Full name</span>
                      <div className="relative">
                        <input
                          className="input-field w-full"
                          value={newMechanic.name}
                          onChange={(e) => setNewMechanic({ ...newMechanic, name: e.target.value })}
                          placeholder="Mechanic name"
                          required
                        />
                      </div>
                    </label>

                    <label className="space-y-1.5 block">
                      <span className="text-sm font-semibold text-gray-700">Phone</span>
                      <div className="relative">
                        <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          className="input-field w-full pl-10"
                          value={newMechanic.phone}
                          onChange={(e) => setNewMechanic({ ...newMechanic, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                          required
                        />
                      </div>
                    </label>
                  </div>

                  <label className="space-y-1.5 block">
                    <span className="text-sm font-semibold text-gray-700">Email</span>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        className="input-field w-full pl-10"
                        value={newMechanic.email}
                        onChange={(e) => setNewMechanic({ ...newMechanic, email: e.target.value })}
                        placeholder="name@company.com"
                        required
                      />
                    </div>
                  </label>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-gray-500">We mark the new mechanic as approved and sync them to the mechanics list.</p>
                    <button
                      type="submit"
                      className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold"
                      disabled={creatingMechanic}
                    >
                      {creatingMechanic ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Save & select
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

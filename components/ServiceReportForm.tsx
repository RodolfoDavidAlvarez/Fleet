"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, X, CheckCircle, Wrench, User, Calendar, AlertCircle, Search, Bell } from "lucide-react";
import { RepairRequest } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/utils";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";

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
  const [selectedRepairRequest, setSelectedRepairRequest] = useState<RepairRequest | undefined>(initialRepairRequest);
  const [repairSearch, setRepairSearch] = useState("");
  const [showRepairSelector, setShowRepairSelector] = useState(false);
  const [adminsAndMechanics, setAdminsAndMechanics] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

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

  // Fetch admins and mechanics on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await fetch("/api/admin/users?role=admin,mechanic");
        if (!res.ok) throw new Error("Failed to load users");
        const data = await res.json();
        // Filter to only approved users
        const approvedUsers = (data.users || []).filter(
          (user: User & { approval_status?: string }) => user.approval_status === "approved"
        );
        setAdminsAndMechanics(approvedUsers);
      } catch (err) {
        console.error("Error loading admins and mechanics:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mechanicName.trim()) {
      alert("Please select who performed the work.");
      return;
    }
    if (!form.description.trim()) {
      alert("Please provide a description of the work performed.");
      return;
    }
    await onSubmit(form);
  };

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
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-indigo-600" />
                  </div>
                  Repair Request Details
                </h3>
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
                    <span className="text-sm font-semibold text-gray-700">
                      Mechanic name <span className="text-red-500">*</span>
                    </span>
                    {loadingUsers ? (
                      <div className="input-field w-full flex items-center justify-center py-2.5">
                        <span className="text-sm text-gray-500">Loading users...</span>
                      </div>
                    ) : adminsAndMechanics.length === 0 ? (
                      <div className="input-field w-full flex flex-col items-start py-2.5 px-3 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
                        <span className="text-sm text-yellow-800 font-medium">No admins or mechanics available</span>
                        <span className="text-xs text-yellow-600 mt-1">Add users in Admin Settings → Users → Invite User</span>
                      </div>
                    ) : (
                      <Select
                        value={form.mechanicName}
                        onChange={(value) => setForm({ ...form, mechanicName: value })}
                        options={adminsAndMechanics.map((user) => ({
                          value: user.name,
                          label: `${user.name} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`,
                        }))}
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
                        <span className="text-sm font-semibold text-gray-700">Labor cost</span>
                        <input
                          className="input-field w-full"
                          type="number"
                          step="0.01"
                          value={form.laborCost}
                          onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
                          placeholder="USD"
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
      </motion.div>
    </AnimatePresence>
  );
}

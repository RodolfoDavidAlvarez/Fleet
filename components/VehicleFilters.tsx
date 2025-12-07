"use client";

import { useState, useEffect, useRef } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import Select from "@/components/ui/Select";
import { Vehicle, VehicleStatus } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export interface VehicleFilters {
  department?: string;
  status?: VehicleStatus | "all";
  vehicleType?: "Vehicle" | "Equipment" | "Trailer" | "all";
  usageCategory?: string | "all";
  daysSinceLastUse?: string | "all";
}

interface VehicleFiltersProps {
  vehicles: Vehicle[];
  filters: VehicleFilters;
  onFiltersChange: (filters: VehicleFilters) => void;
}

const STATUS_OPTIONS: { value: VehicleStatus | "all"; label: string; color?: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "operational", label: "Operational", color: "bg-green-100 text-green-800" },
  { value: "active", label: "Active", color: "bg-blue-100 text-blue-800" },
  { value: "in_service", label: "In Service", color: "bg-yellow-100 text-yellow-800" },
  { value: "broken_down", label: "Broken Down", color: "bg-red-100 text-red-800" },
  { value: "for_sale", label: "For Sale", color: "bg-purple-100 text-purple-800" },
  { value: "idle", label: "Idle", color: "bg-orange-100 text-orange-800" },
  { value: "upcoming", label: "Upcoming", color: "bg-indigo-100 text-indigo-800" },
  { value: "retired", label: "Retired", color: "bg-gray-100 text-gray-800" },
  { value: "maintenance", label: "Maintenance", color: "bg-amber-100 text-amber-800" },
  { value: "reserved", label: "Reserved", color: "bg-cyan-100 text-cyan-800" },
  { value: "out_of_service", label: "Out of Service", color: "bg-slate-100 text-slate-800" },
];

const USAGE_OPTIONS = [
  { value: "all", label: "All Usage" },
  { value: "used_today", label: "Used Today" },
  { value: "used_this_week", label: "Used This Week" },
  { value: "used_this_month", label: "Used This Month" },
  { value: "used_last_3_months", label: "Used Last 3 Months" },
  { value: "used_last_6_months", label: "Used Last 6 Months" },
  { value: "long_idle", label: "Long Idle (6+ months)" },
  { value: "never_tracked", label: "Never Tracked" },
];

const DAYS_SINCE_USE_OPTIONS = [
  { value: "all", label: "Any Time" },
  { value: "0-7", label: "Last 7 Days" },
  { value: "8-30", label: "8-30 Days" },
  { value: "31-90", label: "31-90 Days" },
  { value: "91-180", label: "91-180 Days" },
  { value: "181-365", label: "181-365 Days" },
  { value: "365+", label: "Over 1 Year" },
];

export default function VehicleFilters({ vehicles, filters, onFiltersChange }: VehicleFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Get unique departments from vehicles
  const departments = Array.from(new Set(vehicles.map((v) => v.department).filter(Boolean))).sort() as string[];

  const departmentOptions = [{ value: "all", label: "All Departments" }, ...departments.map((dept) => ({ value: dept, label: dept }))];

  const vehicleTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "Vehicle", label: "Vehicle" },
    { value: "Equipment", label: "Equipment" },
    { value: "Trailer", label: "Trailer" },
  ];

  const hasActiveFilters =
    (filters.department !== undefined && filters.department !== "all") ||
    (filters.status !== undefined && filters.status !== "all") ||
    (filters.vehicleType !== undefined && filters.vehicleType !== "all") ||
    (filters.usageCategory !== undefined && filters.usageCategory !== "all") ||
    (filters.daysSinceLastUse !== undefined && filters.daysSinceLastUse !== "all");

  const clearFilters = () => {
    onFiltersChange({
      department: "all",
      status: "all",
      vehicleType: "all",
      usageCategory: "all",
      daysSinceLastUse: "all",
    });
  };

  return (
    <div className="relative" ref={filterRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all duration-200 whitespace-nowrap
          ${
            hasActiveFilters
              ? "bg-primary-50 border-primary-300 text-primary-700 hover:bg-primary-100"
              : "bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
          }
        `}
      >
        <Filter className={`h-4 w-4 ${hasActiveFilters ? "text-primary-600" : "text-gray-500"}`} />
        <span className="text-sm font-semibold">Filters</span>
        {hasActiveFilters && (
          <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
            {
              [
                filters.department !== "all" && filters.department,
                filters.status !== "all" && filters.status,
                filters.vehicleType !== "all" && filters.vehicleType,
                filters.usageCategory !== "all" && filters.usageCategory,
                filters.daysSinceLastUse !== "all" && filters.daysSinceLastUse,
              ].filter(Boolean).length
            }
          </span>
        )}
        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/10 z-40"
              onClick={() => setIsExpanded(false)}
            />
            {/* Filter Panel */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 mt-2 w-[90vw] sm:w-[600px] lg:w-[800px] xl:w-[1000px] z-50 bg-white rounded-xl border-2 border-gray-200 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Filter Vehicles</h3>
                  <p className="text-xs text-gray-500">Refine your search by department, status, type, and usage</p>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                {/* Department Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Department</label>
                  <Select
                    value={filters.department || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, department: value })}
                    options={departmentOptions}
                    placeholder="All Departments"
                  />
                </div>

                {/* Status Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</label>
                  <Select
                    value={filters.status || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, status: value as VehicleStatus | "all" })}
                    options={STATUS_OPTIONS}
                    placeholder="All Statuses"
                  />
                </div>

                {/* Vehicle Type Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Type</label>
                  <Select
                    value={filters.vehicleType || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, vehicleType: value as any })}
                    options={vehicleTypeOptions}
                    placeholder="All Types"
                  />
                </div>

                {/* Usage Category Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Usage</label>
                  <Select
                    value={filters.usageCategory || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, usageCategory: value })}
                    options={USAGE_OPTIONS}
                    placeholder="All Usage"
                  />
                </div>

                {/* Days Since Last Use Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Days Since Use</label>
                  <Select
                    value={filters.daysSinceLastUse || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, daysSinceLastUse: value })}
                    options={DAYS_SINCE_USE_OPTIONS}
                    placeholder="Any Time"
                  />
                </div>
              </div>

              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Active Filters</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.department && filters.department !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Dept: {filters.department}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, department: "all" })}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filters.status && filters.status !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Status: {STATUS_OPTIONS.find((s) => s.value === filters.status)?.label}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, status: "all" })}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filters.vehicleType && filters.vehicleType !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Type: {filters.vehicleType}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, vehicleType: "all" })}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filters.usageCategory && filters.usageCategory !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Usage: {USAGE_OPTIONS.find((u) => u.value === filters.usageCategory)?.label}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, usageCategory: "all" })}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filters.daysSinceLastUse && filters.daysSinceLastUse !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Days: {DAYS_SINCE_USE_OPTIONS.find((d) => d.value === filters.daysSinceLastUse)?.label}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, daysSinceLastUse: "all" })}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

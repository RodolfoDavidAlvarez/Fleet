"use client";

import { useState, useEffect, useRef } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import Select from "@/components/ui/Select";
import { User } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export interface DriverFilters {
  role?: "driver" | "mechanic" | "admin" | "customer" | "all";
  approval_status?: "pending_approval" | "approved" | "all";
  has_phone?: "yes" | "no" | "all";
  has_certification?: "yes" | "no" | "all";
  has_vehicle?: "yes" | "no" | "all";
}

interface DriverFiltersProps {
  drivers: User[];
  filters: DriverFilters;
  onFiltersChange: (filters: DriverFilters) => void;
}

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "driver", label: "Driver" },
  { value: "mechanic", label: "Mechanic" },
  { value: "admin", label: "Admin" },
  { value: "customer", label: "Customer" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending_approval", label: "Pending Approval" },
];

const YES_NO_OPTIONS = [
  { value: "all", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default function DriverFilters({ drivers, filters, onFiltersChange }: DriverFiltersProps) {
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

  const hasActiveFilters =
    (filters.role !== undefined && filters.role !== "all") ||
    (filters.approval_status !== undefined && filters.approval_status !== "all") ||
    (filters.has_phone !== undefined && filters.has_phone !== "all") ||
    (filters.has_certification !== undefined && filters.has_certification !== "all") ||
    (filters.has_vehicle !== undefined && filters.has_vehicle !== "all");

  const clearFilters = () => {
    onFiltersChange({
      role: "all",
      approval_status: "all",
      has_phone: "all",
      has_certification: "all",
      has_vehicle: "all",
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
                filters.role !== "all" && filters.role,
                filters.approval_status !== "all" && filters.approval_status,
                filters.has_phone !== "all" && filters.has_phone,
                filters.has_certification !== "all" && filters.has_certification,
                filters.has_vehicle !== "all" && filters.has_vehicle,
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
              className="absolute top-full left-0 mt-2 w-[90vw] sm:w-[600px] lg:w-[800px] z-50 bg-white rounded-xl border-2 border-gray-200 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Filter Team Members</h3>
                  <p className="text-xs text-gray-500">Refine your search by role, status, and other criteria</p>
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
                {/* Role Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Role</label>
                  <Select
                    value={filters.role || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, role: value as any })}
                    options={ROLE_OPTIONS}
                    placeholder="All Roles"
                  />
                </div>

                {/* Status Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</label>
                  <Select
                    value={filters.approval_status || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, approval_status: value as any })}
                    options={STATUS_OPTIONS}
                    placeholder="All Statuses"
                  />
                </div>

                {/* Has Phone Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Has Phone</label>
                  <Select
                    value={filters.has_phone || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, has_phone: value as any })}
                    options={YES_NO_OPTIONS}
                    placeholder="All"
                  />
                </div>

                {/* Has Certification Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Has Certification</label>
                  <Select
                    value={filters.has_certification || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, has_certification: value as any })}
                    options={YES_NO_OPTIONS}
                    placeholder="All"
                  />
                </div>

                {/* Has Vehicle Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Has Vehicle</label>
                  <Select
                    value={filters.has_vehicle || "all"}
                    onChange={(value) => onFiltersChange({ ...filters, has_vehicle: value as any })}
                    options={YES_NO_OPTIONS}
                    placeholder="All"
                  />
                </div>
              </div>

              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Active Filters</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.role && filters.role !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Role: {ROLE_OPTIONS.find((r) => r.value === filters.role)?.label}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, role: "all" })}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filters.approval_status && filters.approval_status !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Status: {STATUS_OPTIONS.find((s) => s.value === filters.approval_status)?.label}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, approval_status: "all" })}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filters.has_phone && filters.has_phone !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Has Phone: {filters.has_phone === "yes" ? "Yes" : "No"}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, has_phone: "all" })}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filters.has_certification && filters.has_certification !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Has Certification: {filters.has_certification === "yes" ? "Yes" : "No"}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, has_certification: "all" })}
                          className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {filters.has_vehicle && filters.has_vehicle !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg border border-primary-200">
                        <span>Has Vehicle: {filters.has_vehicle === "yes" ? "Yes" : "No"}</span>
                        <button
                          onClick={() => onFiltersChange({ ...filters, has_vehicle: "all" })}
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

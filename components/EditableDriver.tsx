"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/types";

interface EditableDriverProps {
  value: string | null | undefined;
  onUpdate: (value: string | null) => Promise<void>;
  drivers: User[];
  className?: string;
}

export default function EditableDriver({ value, onUpdate, drivers, className = "" }: EditableDriverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter drivers based on search
  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim()) return drivers;
    const searchLower = searchTerm.toLowerCase();
    return drivers.filter(
      (driver) =>
        driver.name?.toLowerCase().includes(searchLower) ||
        driver.email?.toLowerCase().includes(searchLower) ||
        driver.phone?.toLowerCase().includes(searchLower)
    );
  }, [drivers, searchTerm]);

  // Get selected driver
  const selectedDriver = useMemo(() => {
    if (!value) return null;
    return drivers.find((d) => d.id === value);
  }, [drivers, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (driverId: string | null) => {
    if (driverId === value) {
      setIsOpen(false);
      return;
    }
    try {
      await onUpdate(driverId);
      setIsOpen(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to update driver:", error);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-2 py-1.5 text-left bg-white border rounded-md text-xs font-medium
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          transition-all duration-200
          flex items-center justify-between gap-1.5
          cursor-pointer shadow-sm overflow-hidden
          ${isOpen
            ? "border-primary-500 ring-2 ring-primary-200 bg-primary-50"
            : "border-gray-300 hover:border-primary-400 hover:bg-primary-50"
          }
          ${selectedDriver ? "text-gray-900" : "text-gray-500"}
        `}
      >
        {selectedDriver ? (
          <span className="truncate flex-1 min-w-0 text-xs">{selectedDriver.name}</span>
        ) : (
          <span className="text-xs flex-1 min-w-0">No driver</span>
        )}
        <ChevronDown
          className={`h-3 w-3 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "transform rotate-180 text-primary-600" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-20 w-64 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={(e) => e.stopPropagation()}
                    className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Driver List */}
              <div className="max-h-60 overflow-y-auto">
                {/* Option to clear selection */}
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={`
                    w-full px-3 py-2 text-left flex items-center justify-between
                    transition-colors duration-150 border-b border-gray-100
                    ${!value ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50 text-gray-900"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-medium">No driver assigned</span>
                  </div>
                  {!value && <Check className="h-3 w-3 text-primary-600 flex-shrink-0" />}
                </button>

                {/* Driver options */}
                {filteredDrivers.length === 0 ? (
                  <div className="p-3 text-xs text-gray-500 text-center">No drivers found</div>
                ) : (
                  filteredDrivers.map((driver) => (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => handleSelect(driver.id)}
                      className={`
                        w-full px-3 py-2 text-left flex items-center justify-between
                        transition-colors duration-150 border-b border-gray-100 last:border-0
                        ${value === driver.id ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50 text-gray-900"}
                      `}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
                          {driver.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{driver.name || "Unknown"}</p>
                          {driver.email && <p className="text-xs text-gray-500 truncate">{driver.email}</p>}
                        </div>
                      </div>
                      {value === driver.id && <Check className="h-3 w-3 text-primary-600 flex-shrink-0 ml-2" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

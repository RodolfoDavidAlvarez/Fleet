"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EditableDepartmentProps {
  value: string | undefined;
  onUpdate: (value: string | null) => Promise<void>;
  departments: string[];
  className?: string;
}

export default function EditableDepartment({ value, onUpdate, departments, className = "" }: EditableDepartmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique sorted departments
  const uniqueDepartments = useMemo(() => {
    const depts = Array.from(new Set([...departments, value].filter(Boolean))) as string[];
    return depts.sort();
  }, [departments, value]);

  // Filter departments based on search
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return uniqueDepartments;
    const searchLower = searchTerm.toLowerCase();
    return uniqueDepartments.filter((dept) => dept.toLowerCase().includes(searchLower));
  }, [uniqueDepartments, searchTerm]);

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

  const handleSelect = async (dept: string | null) => {
    if (dept === value) {
      setIsOpen(false);
      return;
    }
    try {
      await onUpdate(dept);
      setIsOpen(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to update department:", error);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-2.5 py-1.5 text-left bg-white border rounded-md text-xs font-medium
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          transition-all duration-200
          flex items-center justify-between gap-2
          cursor-pointer shadow-sm
          ${isOpen
            ? "border-primary-500 ring-2 ring-primary-200 bg-primary-50"
            : "border-gray-300 hover:border-primary-400 hover:bg-primary-50"
          }
          ${value ? "text-gray-900" : "text-gray-500"}
        `}
      >
        <span className="truncate flex-1">{value || "Select department..."}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "transform rotate-180 text-primary-600" : ""}`}
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
              className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={(e) => e.stopPropagation()}
                    className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Department List */}
              <div className="max-h-48 overflow-y-auto">
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
                  <span className="text-xs font-medium">No department</span>
                  {!value && <Check className="h-3 w-3 text-primary-600 flex-shrink-0" />}
                </button>

                {/* Department options */}
                {filteredDepartments.length === 0 ? (
                  <div className="p-3 text-xs text-gray-500 text-center">No departments found</div>
                ) : (
                  filteredDepartments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleSelect(dept)}
                      className={`
                        w-full px-3 py-2 text-left flex items-center justify-between
                        transition-colors duration-150 border-b border-gray-100 last:border-0
                        ${value === dept ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50 text-gray-900"}
                      `}
                    >
                      <span className="text-xs font-medium truncate">{dept}</span>
                      {value === dept && <Check className="h-3 w-3 text-primary-600 flex-shrink-0" />}
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

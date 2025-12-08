"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { VehicleStatus } from "@/types";
import { getStatusColor } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface EditableStatusProps {
  status: VehicleStatus;
  onUpdate: (newStatus: VehicleStatus) => Promise<void>;
  className?: string;
}

const STATUS_OPTIONS: VehicleStatus[] = [
  "operational",
  "active",
  "in_service",
  "broken_down",
  "for_sale",
  "idle",
  "upcoming",
  "retired",
  "maintenance",
  "reserved",
  "out_of_service",
];

export default function EditableStatus({ status, onUpdate, className = "" }: EditableStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (newStatus: VehicleStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(newStatus);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        className={`
          px-2.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap
          transition-all duration-200 flex items-center gap-1 max-w-full
          ${isOpen ? "ring-2 ring-primary-300 scale-105" : "hover:ring-2 hover:ring-primary-200 hover:scale-105"}
          ${getStatusColor(status)}
          ${isSaving ? "opacity-70 cursor-wait" : "cursor-pointer"}
        `}
        title="Click to change status"
      >
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
        ) : (
          <span className="truncate flex-1 min-w-0">{status.replace("_", " ")}</span>
        )}
        {!isSaving && <ChevronDown className={`h-2.5 w-2.5 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 mt-2 w-48 bg-white border-2 border-gray-200 rounded-lg shadow-xl overflow-hidden"
            >
              <div className="py-1 max-h-64 overflow-y-auto">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={`
                      w-full px-3 py-2 text-left text-xs font-medium
                      transition-colors duration-150 flex items-center justify-between
                      ${status === opt ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50 text-gray-900"}
                    `}
                  >
                    <span className="capitalize">{opt.replace("_", " ")}</span>
                    {status === opt && <Check className="h-3.5 w-3.5 text-primary-600" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}



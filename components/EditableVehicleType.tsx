"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Loader2, Truck, Container, Construction, HelpCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EditableVehicleTypeProps {
  vehicleType: "Vehicle" | "Equipment" | "Trailer" | undefined;
  onUpdate: (newType: "Vehicle" | "Equipment" | "Trailer") => Promise<void>;
  className?: string;
}

const TYPE_OPTIONS: {
  value: "Vehicle" | "Equipment" | "Trailer";
  label: string;
  icon: typeof Truck;
  color: string;
  bgColor: string;
}[] = [
  {
    value: "Vehicle",
    label: "Vehicle",
    icon: Truck,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    value: "Equipment",
    label: "Heavy Equipment",
    icon: Construction,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    value: "Trailer",
    label: "Trailer",
    icon: Container,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export default function EditableVehicleType({ vehicleType, onUpdate, className = "" }: EditableVehicleTypeProps) {
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

  const handleSelect = async (newType: "Vehicle" | "Equipment" | "Trailer") => {
    if (newType === vehicleType) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(newType);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update vehicle type:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentType = TYPE_OPTIONS.find((t) => t.value === (vehicleType || "Vehicle"));
  const TypeIcon = currentType?.icon || Truck;
  const typeColor = currentType?.color || "text-blue-600";
  const typeBgColor = currentType?.bgColor || "bg-blue-50";

  return (
    <div ref={dropdownRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        className={`
          px-2.5 py-1.5 rounded-md font-medium text-xs
          transition-all duration-200 flex items-center gap-2
          border shadow-sm
          ${isOpen ? "border-primary-500 ring-2 ring-primary-200 scale-105" : "border-gray-300 hover:border-primary-400 hover:bg-primary-50"}
          ${isSaving ? "opacity-70 cursor-wait" : "cursor-pointer"}
          ${typeBgColor}
        `}
        title="Click to change type"
      >
        {isSaving ? <Loader2 className={`h-4 w-4 animate-spin ${typeColor}`} /> : <TypeIcon className={`h-4 w-4 ${typeColor}`} />}
        <span className={`${typeColor} whitespace-nowrap`}>{currentType?.label || "Vehicle"}</span>
        {!isSaving && <ChevronDown className={`h-3.5 w-3.5 ${typeColor} transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />}
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
              className="absolute z-20 mt-2 w-56 bg-white border-2 border-gray-200 rounded-lg shadow-xl overflow-hidden"
            >
              <div className="py-1">
                {TYPE_OPTIONS.map((opt) => {
                  const OptionIcon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full px-3 py-2.5 text-left
                        transition-colors duration-150 flex items-center gap-3
                        ${vehicleType === opt.value ? "bg-primary-50" : "hover:bg-gray-50"}
                      `}
                    >
                      <div className={`p-1.5 rounded ${opt.bgColor}`}>
                        <OptionIcon className={`h-4 w-4 ${opt.color}`} />
                      </div>
                      <span className={`text-sm font-medium flex-1 ${vehicleType === opt.value ? "text-primary-900" : "text-gray-900"}`}>
                        {opt.label}
                      </span>
                      {vehicleType === opt.value && <Check className="h-4 w-4 text-primary-600" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

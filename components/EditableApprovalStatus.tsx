"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X as XIcon, Loader2 } from "lucide-react";

interface EditableApprovalStatusProps {
  status: "pending_approval" | "approved" | undefined;
  onUpdate: (newStatus: "pending_approval" | "approved") => Promise<void>;
  className?: string;
}

const STATUS_OPTIONS: Array<{ value: "pending_approval" | "approved"; label: string; color: string }> = [
  { value: "pending_approval", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
];

export default function EditableApprovalStatus({ status, onUpdate, className = "" }: EditableApprovalStatusProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"pending_approval" | "approved">(status || "pending_approval");
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setSelectedStatus(status || "pending_approval");
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, status]);

  const handleSave = async () => {
    if (selectedStatus === status) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(selectedStatus);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update approval status:", error);
      setSelectedStatus(status || "pending_approval"); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus(status || "pending_approval");
    setIsEditing(false);
  };

  const getStatusColor = (statusValue: string | undefined) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === statusValue);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (statusValue: string | undefined) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === statusValue);
    return option?.label || "Unknown";
  };

  if (isEditing) {
    return (
      <div ref={dropdownRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as "pending_approval" | "approved")}
            className="px-2 py-1 text-xs font-semibold rounded border-2 border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white"
            autoFocus
            disabled={isSaving}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Save"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Cancel"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all hover:ring-2 hover:ring-primary-200 ${getStatusColor(status)} ${className}`}
      title="Click to edit approval status"
    >
      {getStatusLabel(status)}
    </button>
  );
}

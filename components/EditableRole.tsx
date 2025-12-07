"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X as XIcon, Loader2 } from "lucide-react";

interface EditableRoleProps {
  role: "driver" | "mechanic" | "admin" | "customer" | undefined;
  onUpdate: (newRole: "driver" | "mechanic" | "admin" | "customer") => Promise<void>;
  className?: string;
}

const ROLE_OPTIONS: Array<{ value: "driver" | "mechanic" | "admin" | "customer"; label: string; color: string }> = [
  { value: "driver", label: "Driver", color: "bg-blue-100 text-blue-800" },
  { value: "mechanic", label: "Mechanic", color: "bg-purple-100 text-purple-800" },
  { value: "admin", label: "Admin", color: "bg-red-100 text-red-800" },
  { value: "customer", label: "Customer", color: "bg-green-100 text-green-800" },
];

export default function EditableRole({ role, onUpdate, className = "" }: EditableRoleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"driver" | "mechanic" | "admin" | "customer">(role || "driver");
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setSelectedRole(role || "driver");
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, role]);

  const handleSave = async () => {
    if (selectedRole === role) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(selectedRole);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update role:", error);
      setSelectedRole(role || "driver"); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(role || "driver");
    setIsEditing(false);
  };

  const getRoleColor = (roleValue: string | undefined) => {
    const option = ROLE_OPTIONS.find((opt) => opt.value === roleValue);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  if (isEditing) {
    return (
      <div ref={dropdownRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as "driver" | "mechanic" | "admin" | "customer")}
            className="px-2 py-1 text-xs font-semibold rounded border-2 border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white"
            autoFocus
            disabled={isSaving}
          >
            {ROLE_OPTIONS.map((opt) => (
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
      className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all hover:ring-2 hover:ring-primary-200 ${getRoleColor(role)} ${className}`}
      title="Click to edit role"
    >
      {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Not Set"}
    </button>
  );
}

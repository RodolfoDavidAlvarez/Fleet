"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";

interface EditableTextFieldProps {
  value: string | number | undefined;
  onUpdate: (value: string) => Promise<void>;
  placeholder?: string;
  type?: "text" | "number";
  className?: string;
  formatValue?: (value: string | number | undefined) => string;
}

export default function EditableTextField({
  value,
  onUpdate,
  placeholder = "Click to edit",
  type = "text",
  className = "",
  formatValue,
}: EditableTextFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(value?.toString() || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue === (value?.toString() || "")) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(trimmedValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update:", error);
      // Revert on error
      setEditValue(value?.toString() || "");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Auto-save on blur
    if (isEditing && !isSaving) {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 w-full ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full">
          <input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="px-2 py-1.5 text-xs border-2 border-primary-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white w-full shadow-sm"
            disabled={isSaving}
            placeholder={placeholder}
          />
          {isSaving && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 className="h-3 w-3 animate-spin text-primary-600" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const displayValue = formatValue ? formatValue(value) : value?.toString() || "-";

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        handleStartEdit();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative cursor-pointer hover:bg-primary-50 px-2 py-1 rounded-md
        transition-all duration-200 border border-transparent hover:border-primary-200
        inline-flex items-center gap-1 max-w-full
        ${className}
      `}
      title="Click to edit"
    >
      <span className="truncate flex-1 min-w-0">{displayValue}</span>
      {isHovered && <Pencil className="h-3 w-3 text-primary-500 opacity-60 transition-opacity flex-shrink-0" />}
    </span>
  );
}

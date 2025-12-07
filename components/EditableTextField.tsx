"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Loader2 } from "lucide-react";

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
    if (editValue === (value?.toString() || "")) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update:", error);
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
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="px-2 py-1 text-sm border-2 border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white min-w-[80px]"
          disabled={isSaving}
        />
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
          <X className="h-3 w-3" />
        </button>
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
      className={`cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${className}`}
      title="Click to edit"
    >
      {displayValue}
    </span>
  );
}

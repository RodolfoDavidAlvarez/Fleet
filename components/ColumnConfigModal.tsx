"use client";

import { useState, useEffect } from "react";
import { X, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  width?: string;
}

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export default function ColumnConfigModal({ isOpen, onClose, columns, onColumnsChange }: ColumnConfigModalProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  useEffect(() => {
    if (isOpen) {
      setLocalColumns([...columns]);
    }
  }, [isOpen, columns]);

  const handleToggleVisibility = (id: string) => {
    setLocalColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, visible: !col.visible } : col))
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newColumns = [...localColumns];
    [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
    // Update order values
    newColumns.forEach((col, i) => {
      col.order = i;
    });
    setLocalColumns(newColumns);
  };

  const handleMoveDown = (index: number) => {
    if (index === localColumns.length - 1) return;
    const newColumns = [...localColumns];
    [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    // Update order values
    newColumns.forEach((col, i) => {
      col.order = i;
    });
    setLocalColumns(newColumns);
  };

  const handleSave = () => {
    onColumnsChange(localColumns);
    onClose();
  };

  const handleReset = () => {
    const defaultColumns: ColumnConfig[] = [
      { id: "type", label: "Type", visible: true, order: 0, width: "w-12" },
      { id: "companyId", label: "Co. ID", visible: true, order: 1, width: "w-16" },
      { id: "make", label: "Make", visible: true, order: 2, width: "w-24" },
      { id: "model", label: "Model", visible: true, order: 3, width: "w-28" },
      { id: "year", label: "Year", visible: true, order: 4, width: "w-16" },
      { id: "vin", label: "VIN", visible: true, order: 5, width: "w-36" },
      { id: "plate", label: "Plate", visible: true, order: 6, width: "w-20" },
      { id: "department", label: "Dept", visible: true, order: 7, width: "w-28" },
      { id: "mileage", label: "Mileage", visible: false, order: 8, width: "w-24" },
      { id: "driver", label: "Driver", visible: true, order: 9, width: "flex-1" },
      { id: "status", label: "Status", visible: true, order: 10, width: "w-20" },
    ];
    setLocalColumns(defaultColumns);
  };

  const sortedColumns = [...localColumns].sort((a, b) => a.order - b.order);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Configure Columns</h2>
                <p className="text-xs text-gray-500 mt-1">Customize which columns to show and their order</p>
              </div>
              <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {sortedColumns.map((column, index) => (
                  <div
                    key={column.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <button
                      onClick={() => handleToggleVisibility(column.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {column.visible ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={`text-sm font-medium ${column.visible ? "text-gray-900" : "text-gray-500"}`}>
                        {column.label}
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sortedColumns.length - 1}
                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button onClick={handleReset} className="btn btn-secondary text-sm">
                Reset to Default
              </button>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

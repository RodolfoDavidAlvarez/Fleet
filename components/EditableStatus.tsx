'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, X as XIcon, Loader2 } from 'lucide-react'
import { VehicleStatus } from '@/types'
import { getStatusColor } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface EditableStatusProps {
  status: VehicleStatus
  onUpdate: (newStatus: VehicleStatus) => Promise<void>
  className?: string
}

const STATUS_OPTIONS: VehicleStatus[] = [
  'operational',
  'active',
  'in_service',
  'broken_down',
  'for_sale',
  'idle',
  'upcoming',
  'retired',
  'maintenance',
  'reserved',
  'out_of_service',
]

export default function EditableStatus({ status, onUpdate, className = '' }: EditableStatusProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus>(status)
  const [isSaving, setIsSaving] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEditing(false)
        setSelectedStatus(status)
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, status])

  const handleSave = async () => {
    if (selectedStatus === status) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onUpdate(selectedStatus)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update status:', error)
      setSelectedStatus(status) // Revert on error
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedStatus(status)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div ref={dropdownRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as VehicleStatus)}
            className="px-2 py-1 text-xs font-semibold rounded border-2 border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white"
            autoFocus
            disabled={isSaving}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Save"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
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
    )
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setIsEditing(true)
      }}
      className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all hover:ring-2 hover:ring-primary-200 ${getStatusColor(status)} ${className}`}
      title="Click to edit status"
    >
      {status.replace('_', ' ')}
    </button>
  )
}

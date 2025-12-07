'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, X as XIcon, Loader2, Truck, Box, Container } from 'lucide-react'

interface EditableVehicleTypeProps {
  vehicleType: 'Vehicle' | 'Equipment' | 'Trailer' | undefined
  onUpdate: (newType: 'Vehicle' | 'Equipment' | 'Trailer') => Promise<void>
  className?: string
}

const TYPE_OPTIONS: { value: 'Vehicle' | 'Equipment' | 'Trailer'; label: string; icon: typeof Truck }[] = [
  { value: 'Vehicle', label: 'Vehicle', icon: Truck },
  { value: 'Equipment', label: 'Equipment', icon: Box },
  { value: 'Trailer', label: 'Trailer', icon: Container },
]

export default function EditableVehicleType({ vehicleType, onUpdate, className = '' }: EditableVehicleTypeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedType, setSelectedType] = useState<'Vehicle' | 'Equipment' | 'Trailer'>(vehicleType || 'Vehicle')
  const [isSaving, setIsSaving] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEditing(false)
        setSelectedType(vehicleType || 'Vehicle')
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, vehicleType])

  const handleSave = async () => {
    if (selectedType === vehicleType) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onUpdate(selectedType)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update vehicle type:', error)
      setSelectedType(vehicleType || 'Vehicle') // Revert on error
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedType(vehicleType || 'Vehicle')
    setIsEditing(false)
  }

  const currentType = TYPE_OPTIONS.find(t => t.value === (vehicleType || 'Vehicle'))
  const TypeIcon = currentType?.icon || Truck
  const typeColor =
    vehicleType === 'Trailer'
      ? 'text-orange-600 bg-orange-50'
      : vehicleType === 'Equipment'
        ? 'text-purple-600 bg-purple-50'
        : 'text-blue-600 bg-blue-50'

  if (isEditing) {
    return (
      <div ref={dropdownRef} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'Vehicle' | 'Equipment' | 'Trailer')}
            className="px-2 py-1 text-xs font-semibold rounded border-2 border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white"
            autoFocus
            disabled={isSaving}
          >
            {TYPE_OPTIONS.map((opt) => (
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
      className={`p-2 rounded-lg w-fit transition-all hover:ring-2 hover:ring-primary-200 ${typeColor} ${className}`}
      title={`${vehicleType || 'Vehicle'} - Click to edit`}
    >
      <TypeIcon className="h-4 w-4" />
    </button>
  )
}

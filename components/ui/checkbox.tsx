import React from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', onCheckedChange, onChange, ...props }, ref) => (
    <div className="relative">
      <input
        type="checkbox"
        className={`peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary-600 data-[state=checked]:text-white ${className}`}
        ref={ref}
        onChange={(e) => {
          onChange?.(e)
          onCheckedChange?.(e.target.checked)
        }}
        {...props}
      />
      <Check className="absolute top-0 left-0 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
    </div>
  )
)
Checkbox.displayName = 'Checkbox'
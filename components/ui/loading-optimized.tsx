'use client'

import { memo } from 'react'

// Optimized table row skeleton
export const TableRowSkeleton = memo(function TableRowSkeleton({ 
  columns = 4,
  className = ""
}: { 
  columns?: number
  className?: string 
}) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{
            width: `${Math.random() * 40 + 60}%`,
            animationDelay: `${i * 100}ms`
          }} />
        </td>
      ))}
    </tr>
  )
})

// Optimized card skeleton
export const CardSkeleton = memo(function CardSkeleton({ 
  className = "",
  showAvatar = false,
  lines = 3
}: {
  className?: string
  showAvatar?: boolean
  lines?: number
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 animate-pulse ${className}`}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div 
              key={i}
              className="h-4 bg-gray-200 rounded"
              style={{
                width: i === lines - 1 ? '60%' : '100%',
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

// Optimized stats card skeleton
export const StatsCardSkeleton = memo(function StatsCardSkeleton({ 
  className = "" 
}: { 
  className?: string 
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        <div className="w-6 h-6 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-8 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-14 bg-gray-200 rounded" />
      </div>
    </div>
  )
})

// Optimized form skeleton
export const FormSkeleton = memo(function FormSkeleton({
  fields = 4,
  className = ""
}: {
  fields?: number
  className?: string
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div 
            className="h-4 w-20 bg-gray-200 rounded animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
          <div 
            className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 100 + 50}ms` }}
          />
        </div>
      ))}
      <div 
        className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"
        style={{ animationDelay: `${fields * 100}ms` }}
      />
    </div>
  )
})

// Optimized calendar skeleton
export const CalendarSkeleton = memo(function CalendarSkeleton({
  className = ""
}: {
  className?: string
}) {
  return (
    <div className={`bg-white rounded-2xl p-6 animate-pulse ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      </div>
      
      {/* Week days */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded" />
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div 
            key={i} 
            className="aspect-square bg-gray-200 rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 20}ms` }}
          />
        ))}
      </div>
    </div>
  )
})

// Optimized list skeleton with better performance
export const ListSkeleton = memo(function ListSkeleton({ 
  rows = 5, 
  className = "",
  showAvatar = true 
}: { 
  rows?: number
  className?: string
  showAvatar?: boolean 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center justify-between p-4 rounded-xl bg-gray-50 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            {showAvatar && (
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            )}
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  )
})

// Performance optimized spinner
export const Spinner = memo(function Spinner({
  size = 'md',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  return (
    <div 
      className={`border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
})

// Page loading skeleton with better UX
export const PageSkeleton = memo(function PageSkeleton({
  hasHeader = true,
  hasStats = false,
  hasList = true,
  className = ""
}: {
  hasHeader?: boolean
  hasStats?: boolean  
  hasList?: boolean
  className?: string
}) {
  return (
    <div className={`max-w-7xl mx-auto space-y-6 ${className}`}>
      {hasHeader && (
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      )}
      
      {hasStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      )}
      
      {hasList && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
          <ListSkeleton rows={6} />
        </div>
      )}
    </div>
  )
})
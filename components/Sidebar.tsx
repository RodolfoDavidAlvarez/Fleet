'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Car,
  Calendar,
  Users,
  Wrench,
  FileText,
  LogOut,
  Settings,
  X,
  ChevronRight,
  MessageSquare,
  Megaphone,
  Bug,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useMemo, useCallback } from 'react'

interface SidebarProps {
  role: 'admin' | 'mechanic'
  isOpen?: boolean
  onClose?: () => void
}

const unifiedLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
  { href: '/repairs', label: 'Repairs', icon: Wrench },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { href: '/service-records', label: 'Service Records', icon: FileText },
  { href: '/admin/drivers', label: 'Members', icon: Users },
]

const mechanicOnlyLinks = [
  { href: '/mechanic/notifications', label: 'Send SMS', icon: MessageSquare },
]

const adminOnlyLinks = [
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/bug-reports', label: 'Bug Reports', icon: Bug },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ role, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  
  // Memoize links to prevent recalculation on every render
  const links = useMemo(() => 
    role === 'admin' 
      ? [...unifiedLinks, ...adminOnlyLinks]
      : [...unifiedLinks, ...mechanicOnlyLinks],
    [role]
  )

  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    try {
      // Call logout API endpoint for proper session cleanup
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.clear()
      
      // Force redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: still clear storage and redirect
      localStorage.clear()
      window.location.href = '/login'
    }
  }, [])

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024 && onClose) {
      onClose()
    }
  }, [pathname, onClose])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:sticky top-0 h-screen flex flex-col surface-primary border-r border-[var(--border)] transition-all duration-300 z-[100]",
        collapsed ? "w-16" : "w-64",
        isOpen ? "left-0" : "-left-64 lg:left-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className={cn(
              "flex items-center gap-3 transition-all",
              collapsed && "justify-center"
            )}>
              {!collapsed ? (
                <div className="relative h-9 w-auto flex items-center">
                  <Image
                    src="/images/AEC-Horizontal-Official-Logo-2020.png"
                    alt="AGAVE ENVIRONMENTAL CONTRACTING, INC."
                    width={140}
                    height={36}
                    className="object-contain"
                    style={{ width: 'auto', height: '36px' }}
                    priority
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
              )}
            </Link>
            
            {/* Mobile close button */}
            <button 
              onClick={onClose}
              className="lg:hidden btn-ghost btn-icon btn-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {!collapsed && (
            <div className="flex items-center gap-2 mt-4">
              <div className={`h-2 w-2 rounded-full animate-pulse ${
                role === 'admin' ? 'bg-[var(--primary-500)]' : 'bg-[var(--success-500)]'
              }`}></div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {role === 'admin' ? 'Admin Console' : 'Mechanic Portal'}
              </p>
            </div>
          )}
        </div>

        {/* Collapse button - desktop only */}
        <button
          onClick={useCallback(() => setCollapsed(!collapsed), [collapsed])}
          className={cn(
            "hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-[var(--surface)] border border-[var(--border)] rounded-full items-center justify-center hover:bg-[var(--surface-hover)] transition-all",
            "shadow-sm z-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <ChevronRight className={cn(
            "h-3 w-3 transition-transform",
            collapsed ? "" : "rotate-180"
          )} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar relative z-10">
          {links.map((link) => {
            const Icon = link.icon
            // Extract base path without query params for matching (pathname doesn't include query params)
            const baseHref = link.href.split('?')[0]
            const isActive = pathname === baseHref
            
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  isActive
                    ? 'bg-gradient-to-r from-[var(--primary-50)] to-[var(--primary-100)] text-[var(--primary-700)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] hover:translate-x-1',
                  collapsed && 'justify-center'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] opacity-10 rounded-lg pointer-events-none" />
                )}
                
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 relative z-20 transition-transform group-hover:scale-110',
                  isActive ? 'text-[var(--primary-600)]' : ''
                )} />
                
                {!collapsed && (
                  <span className="truncate relative z-20">{link.label}</span>
                )}
                
                {isActive && !collapsed && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[var(--primary-500)] rounded-l-full z-20" />
                )}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                    {link.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)]">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
              "bg-[var(--surface)] hover:bg-[var(--danger-50)] hover:text-[var(--danger-600)]",
              "border border-[var(--border)] hover:border-[var(--danger-200)]",
              "group",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 transition-transform group-hover:scale-110" />
            {!collapsed && <span className="font-semibold">Logout</span>}
          </button>
        </div>
      </div>
    </>
  )
}

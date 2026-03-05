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
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useMemo, useCallback } from 'react'

interface SidebarProps {
  role: string
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
  { href: '/admin/inspections', label: 'Inspections', icon: ClipboardCheck },
  { href: '/admin/compliance', label: 'Compliance', icon: ShieldCheck },
]

const adminOnlyLinks = [
  { href: '/mechanic/notifications', label: 'Send SMS', icon: MessageSquare },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/bug-reports', label: 'Bug Reports', icon: Bug },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ role, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  
  // Memoize links to prevent recalculation on every render
  const links = useMemo(() =>
    [...unifiedLinks, ...adminOnlyLinks],
    []
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Only trigger on pathname change, not onClose reference changes

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — Industrial Dark */}
      <div className={cn(
        "fixed lg:sticky top-0 h-screen flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 z-[100]",
        collapsed ? "w-16" : "w-64",
        isOpen ? "left-0" : "-left-64 lg:left-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
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
                    className="object-contain brightness-0 invert"
                    style={{ width: 'auto', height: '36px' }}
                    priority
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!collapsed && (
            <div className="flex items-center gap-2 mt-4">
              <div className="h-2 w-2 rounded-full animate-pulse bg-amber-500"></div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-500">
                Admin Console
              </p>
            </div>
          )}
        </div>

        {/* Collapse button - desktop only */}
        <button
          onClick={useCallback(() => setCollapsed(!collapsed), [collapsed])}
          className={cn(
            "hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full items-center justify-center hover:bg-slate-700 transition-all",
            "shadow-sm z-10 focus:outline-none focus:ring-2 focus:ring-amber-500"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <ChevronRight className={cn(
            "h-3 w-3 text-slate-400 transition-transform",
            collapsed ? "" : "rotate-180"
          )} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto no-scrollbar relative z-10">
          {/* Main Navigation */}
          {!collapsed && (
            <div className="px-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Navigation</p>
            </div>
          )}
          <div className="space-y-0.5">
            {unifiedLinks.map((link) => {
              const Icon = link.icon
              const baseHref = link.href.split('?')[0]
              const isActive = pathname === baseHref

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isActive
                      ? 'bg-slate-900 text-white border-l-[3px] border-l-amber-500 pl-[9px]'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn(
                    'h-5 w-5 flex-shrink-0 relative z-20 transition-colors duration-200',
                    isActive ? 'text-amber-500' : 'group-hover:text-slate-200'
                  )} />

                  {!collapsed && (
                    <span className="truncate relative z-20">{link.label}</span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                      {link.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Section Divider */}
          <div className={cn("my-3", collapsed ? "px-2" : "px-3")}>
            <div className="border-t border-slate-800" />
          </div>

          {/* Role-specific links */}
          {!collapsed && (
            <div className="px-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Administration
              </p>
            </div>
          )}
          <div className="space-y-0.5">
            {adminOnlyLinks.map((link) => {
              const Icon = link.icon
              const baseHref = link.href.split('?')[0]
              const isActive = pathname === baseHref

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-500',
                    isActive
                      ? 'bg-slate-900 text-white border-l-[3px] border-l-amber-500 pl-[9px]'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn(
                    'h-5 w-5 flex-shrink-0 relative z-20 transition-colors duration-200',
                    isActive ? 'text-amber-500' : 'group-hover:text-slate-200'
                  )} />

                  {!collapsed && (
                    <span className="truncate relative z-20">{link.label}</span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                      {link.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
              "text-slate-400 hover:text-red-400 hover:bg-slate-900",
              "group",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="font-semibold text-sm">Logout</span>}
          </button>
        </div>
      </div>
    </>
  )
}

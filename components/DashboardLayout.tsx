'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'
import { useRealtimeSync } from '@/hooks/use-realtime-sync'

interface DashboardLayoutProps {
  children: React.ReactNode
  userName: string
  userRole: 'admin' | 'mechanic'
}

export default function DashboardLayout({ children, userName, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useRealtimeSync()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        role={userRole} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          userName={userName}
          userRole={userRole}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-secondary)] relative">
          <div className="absolute inset-0 opacity-[0.3] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="container py-6 relative z-10">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
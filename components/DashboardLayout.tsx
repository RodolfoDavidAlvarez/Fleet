'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'

interface DashboardLayoutProps {
  children: React.ReactNode
  userName: string
  userRole: 'admin' | 'mechanic'
}

export default function DashboardLayout({ children, userName, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
          <div className="absolute inset-0 pattern-dots opacity-[0.4] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
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
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Immediate redirect - check localStorage synchronously
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user && user.approval_status === 'approved') {
          router.replace('/dashboard')
          return
        }
      } catch (e) {
        // Invalid JSON, clear it
        localStorage.removeItem('user')
      }
    }
    // No valid user found, go to login
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-gray-900 font-semibold">Fleet Management System</p>
          <p className="text-gray-600 text-sm">Redirecting...</p>
        </div>
      </div>
    </div>
  )
}

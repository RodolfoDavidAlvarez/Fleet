'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Auth check error:', error)
          router.push('/login')
          return
        }
        
        if (user) {
          // Double-check by calling the auth API
          try {
            const response = await fetch('/api/auth/me', { cache: 'no-store' })
            if (response.ok) {
              const { user: profile } = await response.json()
              if (profile && profile.approval_status === 'approved') {
                router.push('/dashboard')
                return
              }
            }
          } catch (apiError) {
            console.error('Profile check failed:', apiError)
          }
        }
        
        // Default: redirect to login
        router.push('/login')
      } catch (error) {
        console.error('Auth redirect error:', error)
        router.push('/login')
      }
    }
    
    checkAuthAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}

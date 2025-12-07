'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'mechanic' | 'driver' | 'customer'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  approval_status?: string
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/',
]

// Routes that require specific roles
const ADMIN_ROUTES = ['/admin']
const MECHANIC_ROUTES = ['/mechanic']
const STAFF_ROUTES = ['/dashboard', '/repairs', '/vehicles']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  // Fetch user profile from our API
  const fetchUserProfile = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include'
      })

      if (!res.ok) {
        return null
      }

      const data = await res.json()
      return data.user as AuthUser
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      return null
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true

    try {
      const profile = await fetchUserProfile()
      if (profile) {
        setUser(profile)
        // Sync to localStorage for legacy compatibility
        localStorage.setItem('user', JSON.stringify({
          id: profile.id,
          email: profile.email,
          role: profile.role,
          name: profile.name,
          approval_status: profile.approval_status
        }))
      }
    } finally {
      isRefreshingRef.current = false
    }
  }, [fetchUserProfile])

  // Sign out handler
  const signOut = useCallback(async () => {
    try {
      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear local state
      setUser(null)
      setSession(null)
      localStorage.removeItem('user')

      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect even on error
      localStorage.removeItem('user')
      router.push('/login')
    }
  }, [supabase, router])

  // Schedule token refresh before expiration
  const scheduleTokenRefresh = useCallback((session: Session) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    if (!session.expires_at) return

    const expiresAt = session.expires_at * 1000 // Convert to milliseconds
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now

    // Refresh 5 minutes before expiry, or immediately if less than 5 minutes
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0)

    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error('Failed to refresh session:', error)
            await signOut()
          } else if (data.session) {
            setSession(data.session)
            scheduleTokenRefresh(data.session)
          }
        } catch (error) {
          console.error('Token refresh error:', error)
        }
      }, refreshTime)
    }
  }, [supabase, signOut])

  // Check if route requires authentication
  const isPublicRoute = useCallback((path: string) => {
    return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'))
  }, [])

  // Check role-based access
  const checkRouteAccess = useCallback((path: string, userRole: UserRole): boolean => {
    if (ADMIN_ROUTES.some(route => path.startsWith(route))) {
      return userRole === 'admin'
    }
    if (MECHANIC_ROUTES.some(route => path.startsWith(route))) {
      return userRole === 'mechanic' || userRole === 'admin'
    }
    if (STAFF_ROUTES.some(route => path.startsWith(route))) {
      return userRole === 'admin' || userRole === 'mechanic'
    }
    return true
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setIsLoading(false)
          }
          return
        }

        if (currentSession) {
          if (mounted) {
            setSession(currentSession)
            scheduleTokenRefresh(currentSession)
          }

          // Fetch user profile
          const profile = await fetchUserProfile()

          if (mounted) {
            if (profile) {
              setUser(profile)
              localStorage.setItem('user', JSON.stringify({
                id: profile.id,
                email: profile.email,
                role: profile.role,
                name: profile.name,
                approval_status: profile.approval_status
              }))
            } else {
              // Session exists but no profile - sign out
              await signOut()
            }
          }
        } else {
          // No session - check localStorage for stale data and clear it
          localStorage.removeItem('user')
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        console.log('Auth state changed:', event)

        switch (event) {
          case 'SIGNED_IN':
            if (newSession) {
              setSession(newSession)
              scheduleTokenRefresh(newSession)
              const profile = await fetchUserProfile()
              if (profile) {
                setUser(profile)
                localStorage.setItem('user', JSON.stringify({
                  id: profile.id,
                  email: profile.email,
                  role: profile.role,
                  name: profile.name,
                  approval_status: profile.approval_status
                }))
              }
            }
            break

          case 'SIGNED_OUT':
            setUser(null)
            setSession(null)
            localStorage.removeItem('user')
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current)
              refreshTimeoutRef.current = null
            }
            break

          case 'TOKEN_REFRESHED':
            if (newSession) {
              setSession(newSession)
              scheduleTokenRefresh(newSession)
            }
            break

          case 'USER_UPDATED':
            if (newSession) {
              setSession(newSession)
              await refreshUser()
            }
            break
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [supabase, fetchUserProfile, scheduleTokenRefresh, signOut, refreshUser])

  // Handle route protection
  useEffect(() => {
    if (isLoading) return

    const isPublic = isPublicRoute(pathname)

    if (!session && !isPublic) {
      // Not authenticated, redirect to login
      router.push('/login')
      return
    }

    if (session && user) {
      // Check role-based access
      if (!checkRouteAccess(pathname, user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'admin' || user.role === 'mechanic') {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      }
    }
  }, [isLoading, session, user, pathname, isPublicRoute, checkRouteAccess, router])

  // Refresh session on window focus (helps with tab switching)
  useEffect(() => {
    const handleFocus = async () => {
      if (session) {
        try {
          const { data, error } = await supabase.auth.getSession()
          if (error || !data.session) {
            // Session expired while tab was inactive
            await signOut()
          } else if (data.session.access_token !== session.access_token) {
            // Session was refreshed
            setSession(data.session)
            scheduleTokenRefresh(data.session)
          }
        } catch (error) {
          console.error('Session check on focus failed:', error)
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [session, supabase, signOut, scheduleTokenRefresh])

  // Refresh session periodically (every 10 minutes)
  useEffect(() => {
    if (!session) return

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error || !data.session) {
          await signOut()
        }
      } catch (error) {
        console.error('Periodic session check failed:', error)
      }
    }, 10 * 60 * 1000) // 10 minutes

    return () => clearInterval(interval)
  }, [session, supabase, signOut])

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

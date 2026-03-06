'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import {
  Wrench,
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  Navigation,
  Calendar,
  BarChart3,
  FileText,
  Shield,
  Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)

  useEffect(() => {
    try {
      if (searchParams.get('registered')) {
        showToast('Account created successfully. Please log in.', 'success')
      }
    } catch (err) {
      // Silently handle toast errors to prevent blank screen
      console.error('Toast error:', err)
    }
  }, [searchParams, showToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Rate limiting: prevent too many attempts
    if (attemptCount >= 5) {
      setError('Too many failed attempts. Please wait before trying again.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Input validation
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter both email and password')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        setAttemptCount(prev => prev + 1)
        throw error
      }

      const profileRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const profileJson = await profileRes.json()

      if (!profileRes.ok) {
        await supabase.auth.signOut()
        throw new Error(profileJson.error || 'Unable to load your account profile')
      }

      const profile = profileJson.user

      // Verify user account status
      if (profile.approval_status !== 'approved') {
        await supabase.auth.signOut()
        throw new Error('Your account is pending approval. Please contact an administrator.')
      }

      // Store user info in localStorage for legacy compatibility (if needed by other components)
      // But primarily we rely on cookies now.
      localStorage.setItem('user', JSON.stringify({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name || data.user.user_metadata?.name,
        approval_status: profile.approval_status
      }))

      // Reset attempt counter on success
      setAttemptCount(0)

      router.push('/dashboard')
      // Removed router.refresh() - causes unnecessary Fast Refresh and delays
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/60 w-full max-w-5xl overflow-hidden flex flex-col md:flex-row">

          {/* Accent gradient line - mobile only (top of card) */}
          <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 md:hidden" />

          {/* Left Side - Form */}
          <div className="w-full md:w-1/2 p-8 sm:p-10 md:p-14 flex flex-col justify-center">
            {/* Accent gradient line - desktop only (inside form column) */}
            <div className="hidden md:block h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 rounded-full mb-10 -mt-2" />

            {/* Logo / Brand Area */}
            <div className="mb-10">
              <div className="h-16 w-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/25">
                <Shield className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-500 text-base">
                Sign in to access your fleet dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-gray-500 block tracking-widest uppercase">
                  Email Address
                </label>
                <div className="input-group">
                  <span className="input-group-icon input-group-icon-left">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    required
                    className="input input-with-icon-left w-full border-2 border-gray-200 focus:border-primary-500 rounded-xl py-3 transition-colors duration-200"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 block tracking-widest uppercase">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="input-group relative">
                  <span className="input-group-icon input-group-icon-left">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="input input-with-icon-left input-with-icon-right w-full border-2 border-gray-200 focus:border-primary-500 rounded-xl py-3 transition-colors duration-200"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-lg p-1.5 cursor-pointer z-10"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center gap-2.5 py-3.5 text-base font-semibold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </button>

              {/* Register Link */}
              <div className="text-center text-sm text-gray-500 pt-2">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  Register here
                </Link>
              </div>
            </form>
          </div>

          {/* Right Side - Info Panel (CSS-only dark background with grid pattern) */}
          <div className="hidden md:flex w-1/2 relative items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 bg-[size:20px_20px] bg-[image:linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
            {/* Radial glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 p-10 lg:p-14 text-white space-y-10">
              {/* Panel Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Fleet Management</h2>
                    <p className="text-slate-400 text-sm font-medium">by Agave Environmental</p>
                  </div>
                </div>
                <p className="text-slate-300 text-base leading-relaxed">
                  Streamline your fleet operations with real-time tracking, automated scheduling, and comprehensive analytics.
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

              {/* Feature List with left accent borders */}
              <ul className="space-y-5">
                {[
                  { text: 'Real-time fleet tracking', desc: 'GPS location for 262+ vehicles', icon: Navigation },
                  { text: 'Maintenance scheduling', desc: 'Automated service reminders', icon: Calendar },
                  { text: 'Performance analytics', desc: 'Driver and vehicle insights', icon: BarChart3 },
                  { text: 'Comprehensive reporting', desc: 'Export-ready fleet reports', icon: FileText }
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <li key={i} className="flex items-start gap-4 group">
                      <div className="border-l-2 border-amber-500/60 group-hover:border-amber-400 pl-4 transition-colors duration-200">
                        <div className="flex items-center gap-3 mb-1">
                          <Icon className="h-4 w-4 text-amber-400 flex-shrink-0" />
                          <span className="text-white font-semibold text-sm">{item.text}</span>
                        </div>
                        <p className="text-slate-400 text-xs pl-7">{item.desc}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* Bottom trust badge */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-slate-400 text-xs">
                  Secure, encrypted access &middot; Role-based permissions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

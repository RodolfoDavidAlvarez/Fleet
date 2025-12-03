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
    if (searchParams.get('registered')) {
      showToast('Account created successfully. Please log in.', 'success')
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
      router.refresh() // Refresh to update server components with new cookie
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side - Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12">
            <div className="mb-8">
              <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-700 font-medium">Please sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                  <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900 block">Email Address</label>
                <div className="input-group">
                  <span className="input-group-icon input-group-icon-left">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    required
                    className="input input-with-icon-left w-full border-2 border-gray-300 focus:border-primary-500"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-900 block">Password</label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 underline"
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
                    className="input input-with-icon-left input-with-icon-right w-full border-2 border-gray-300 focus:border-primary-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded p-1 cursor-pointer z-10"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center gap-2 py-2.5"
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

              <div className="text-center text-sm text-gray-600 mt-4">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700 underline">
                  Register here
                </Link>
              </div>
            </form>
          </div>

          {/* Right Side - Image/Info */}
          <div className="hidden md:flex w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-gray-900/90 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1580273916550-e323be2ed5fa?auto=format&fit=crop&q=80" 
              alt="Fleet Management" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 p-12 text-white space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary-400" />
                  </div>
                  <h2 className="text-3xl font-bold">Fleet Management System</h2>
                </div>
                <p className="text-gray-300 text-lg">Streamline your operations with our comprehensive management solution.</p>
              </div>
              <ul className="space-y-4">
                {[
                  { text: 'Real-time fleet tracking', icon: Navigation },
                  { text: 'Automated maintenance scheduling', icon: Calendar },
                  { text: 'Driver performance analytics', icon: BarChart3 },
                  { text: 'Comprehensive reporting', icon: FileText }
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <li key={i} className="flex items-center gap-3 group">
                      <div className="h-10 w-10 rounded-xl bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/20 transition-all duration-200">
                        <Icon className="h-5 w-5 text-primary-400" />
                      </div>
                      <span className="text-gray-200 font-medium">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

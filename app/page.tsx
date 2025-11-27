'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { Wrench, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const defaultEmail = process.env.NODE_ENV === 'production' ? '' : 'admin@fleetpro.com'
  const defaultPassword = process.env.NODE_ENV === 'production' ? '' : 'admin123'

  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState(defaultPassword)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simple demo authentication
    // In production, use proper JWT authentication
    if (email === 'admin@fleetpro.com' && password === 'admin123') {
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'admin@fleetpro.com',
        name: 'Admin User',
        role: 'admin',
        approval_status: 'approved',
      }))
      router.push('/dashboard')
    } else if (email === 'mechanic@fleetpro.com' && password === 'mechanic123') {
      localStorage.setItem('user', JSON.stringify({
        id: '2',
        email: 'mechanic@fleetpro.com',
        name: 'John Smith',
        role: 'mechanic',
        approval_status: 'approved',
      }))
      router.push('/dashboard')
    } else {
      setError('Invalid email or password')
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[var(--primary-50)] via-[var(--bg-secondary)] to-[var(--bg-secondary)] flex flex-col p-4 overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -left-24 w-80 h-80 bg-[var(--primary-200)] opacity-40 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 w-96 h-96 bg-[var(--primary-300)] opacity-30 blur-3xl rounded-full" />
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full animate-scale-in">
          <div className="card-glass p-8 md:p-10">
            <div className="text-center mb-8 animate-slide-down">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-[var(--primary-600)] flex items-center justify-center shadow-xl mb-4">
                  <Wrench className="h-10 w-10 text-white" />
                </div>
                <div className="relative h-12 w-auto mb-2">
                  <Image
                    src="/images/AEC-Horizontal-Official-Logo-2020.png"
                    alt="AGAVE ENVIRONMENTAL CONTRACTING, INC."
                    width={180}
                    height={48}
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-[var(--primary-600)]">Fleet Management</p>
              </div>
              <h1 className="text-3xl font-bold text-gradient">Welcome Back</h1>
              <p className="text-muted mt-2">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
              {error && (
                <div className="bg-[var(--danger-50)] border border-[var(--danger-200)] text-[var(--danger-600)] px-4 py-3 rounded-lg animate-slide-up">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold">
                  Email Address
                </label>
                <div className="input-group">
                  <span className="input-group-icon input-group-icon-left">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input input-with-icon-left"
                    placeholder="admin@fleetpro.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold">
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-icon input-group-icon-left">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input input-with-icon-left input-with-icon-right"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn-ghost btn-icon btn-sm"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[var(--primary-600)] focus:ring-[var(--primary-500)]" />
                  <span>Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full btn-lg group"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <div className="card p-4 mb-4">
                <p className="text-sm font-semibold mb-3">Demo Credentials</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Admin:</span>
                    <code className="px-2 py-1 bg-[var(--bg-tertiary)] rounded">admin@fleetpro.com / admin123</code>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Mechanic:</span>
                    <code className="px-2 py-1 bg-[var(--bg-tertiary)] rounded">mechanic@fleetpro.com / mechanic123</code>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <Link 
                  href="/repair" 
                  className="inline-flex items-center gap-2 text-[var(--primary-600)] hover:text-[var(--primary-700)] text-sm font-medium transition-all hover:gap-3"
                >
                  <Wrench className="h-4 w-4" />
                  <span>Submit Repair Request</span>
                </Link>

                <p className="text-xs text-muted">
                  By signing in you agree to our{' '}
                  <Link href="/compliance" className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium underline underline-offset-2">
                    SMS compliance policy
                  </Link>
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

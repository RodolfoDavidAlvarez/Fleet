'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { Wrench, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        role: 'admin'
      }))
      router.push('/dashboard')
    } else if (email === 'mechanic@fleetpro.com' && password === 'mechanic123') {
      localStorage.setItem('user', JSON.stringify({
        id: '2',
        email: 'mechanic@fleetpro.com',
        name: 'John Smith',
        role: 'mechanic'
      }))
      router.push('/dashboard')
    } else {
      setError('Invalid email or password')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col p-4 soft-grid">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full animate-scale-in">
          <div className="card-surface rounded-3xl shadow-2xl p-8 border-2 border-primary-100/50">
          <div className="text-center mb-8 animate-slide-down">
            <div className="flex flex-col items-center mb-6">
              <div className="relative h-16 w-auto mb-3">
                <Image
                  src="/images/AEC-Horizontal-Official-Logo-2020.png"
                  alt="AGAVE ENVIRONMENTAL CONTRACTING, INC."
                  width={200}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>
              <p className="text-lg font-bold text-slate-900 uppercase tracking-wide">Fleet System</p>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Welcome back</h1>
            <p className="text-gray-600 font-medium">Admin and mechanic dashboards in one place.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm animate-slide-up">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors pointer-events-none z-10" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field pl-12 pr-4"
                  placeholder="admin@fleetpro.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors pointer-events-none z-10" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pl-12 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 focus:outline-none transition-colors p-1 rounded-lg hover:bg-gray-100 z-10"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <div className="bg-gradient-to-br from-gray-50 to-primary-50/30 border-2 border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Demo Credentials:</p>
              <div className="font-mono text-xs bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-1">
                <p className="text-gray-800"><span className="font-bold">Admin:</span> admin@fleetpro.com / admin123</p>
                <p className="text-gray-800"><span className="font-bold">Mechanic:</span> mechanic@fleetpro.com / mechanic123</p>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              By signing in you agree to our{' '}
              <Link href="/compliance" className="text-primary-700 font-semibold hover:text-primary-800 underline decoration-2 underline-offset-2 transition-colors">SMS compliance policy</Link>.
            </div>

            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors hover:gap-3">
                <span>←</span>
                <span>Back to home</span>
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

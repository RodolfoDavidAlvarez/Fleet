'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { User, Mail, Lock, Phone, UserPlus, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email')

  const [formData, setFormData] = useState({
    name: '',
    email: emailParam || '',
    password: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }))
    }
  }, [emailParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Redirect to login with success message
      // We can pass a query param to login page to show the success message
      router.push('/login?registered=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] flex items-center justify-center shadow-xl mb-4">
                  <UserPlus className="h-10 w-10 text-white" />
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
              <h1 className="text-3xl font-bold text-gradient">Create Account</h1>
              <p className="text-muted mt-2">Join the fleet management system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
              {error && (
                <div className="bg-[var(--danger-50)] border border-[var(--danger-200)] text-[var(--danger-600)] px-4 py-3 rounded-lg animate-slide-up">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold">
                  Full Name
                </label>
                <div className="input-group">
                  <span className="input-group-icon input-group-icon-left">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input input-with-icon-left"
                    placeholder="John Doe"
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="input input-with-icon-left"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold">
                  Phone Number
                </label>
                <div className="input-group">
                  <span className="input-group-icon input-group-icon-left">
                    <Phone className="h-5 w-5" />
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input input-with-icon-left"
                    placeholder="+1 (555) 000-0000"
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
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="input input-with-icon-left input-with-icon-right"
                    placeholder="Create a password"
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

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full btn-lg group"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    <span>Register</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium underline underline-offset-2">
                    Sign in
                  </Link>
                </p>

                <Link href="/" className="inline-flex items-center gap-2 text-[var(--primary-600)] hover:text-[var(--primary-700)] text-sm font-medium transition-all hover:gap-3">
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

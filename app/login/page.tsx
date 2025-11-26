'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wrench, Mail, Lock, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      router.push('/admin/dashboard')
    } else if (email === 'mechanic@fleetpro.com' && password === 'mechanic123') {
      localStorage.setItem('user', JSON.stringify({
        id: '2',
        email: 'mechanic@fleetpro.com',
        name: 'John Smith',
        role: 'mechanic'
      }))
      router.push('/mechanic/dashboard')
    } else {
      setError('Invalid email or password')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card-surface rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Wrench className="h-8 w-8 text-primary-600" />
            </div>
            <p className="text-sm text-primary-700 font-semibold uppercase tracking-[0.08em]">Fleet consoles</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">Admin and mechanic dashboards in one place.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="mb-2">Demo Credentials:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded">
              Admin: admin@fleetpro.com / admin123<br />
              Mechanic: mechanic@fleetpro.com / mechanic123
            </p>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            By signing in you agree to our{' '}
            <Link href="/compliance" className="text-primary-700 font-semibold">SMS compliance policy</Link>.
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

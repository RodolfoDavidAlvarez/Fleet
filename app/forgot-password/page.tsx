'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // First, find user by email to get userId
      const findUserRes = await fetch('/api/admin/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!findUserRes.ok) {
        throw new Error('Failed to process request')
      }

      const usersData = await findUserRes.json()
      const user = usersData.users?.find((u: any) => u.email.toLowerCase() === email.toLowerCase())

      if (!user) {
        // Don't reveal if user exists for security
        setSuccess('If an account exists with this email, a password reset link has been sent.')
        setLoading(false)
        return
      }

      // Send password reset email
      const res = await fetch('/api/admin/users/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send password reset email')
      }

      setSuccess(data.message || 'If an account exists with this email, a password reset link has been sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col p-4">
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <Mail className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Email Sent!</p>
                <p className="text-sm">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={loading || !!success}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : success ? (
                'Email Sent!'
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}





import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Reset password using token
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Find user by reset token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_reset_token, password_reset_token_expiry')
      .eq('password_reset_token', token)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (!user.password_reset_token_expiry || new Date(user.password_reset_token_expiry) < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_token_expiry: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Password has been reset successfully. You can now log in with your new password.'
    })
  } catch (error) {
    console.error('Error in POST /api/auth/reset-password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Verify reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Find user by reset token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_reset_token_expiry')
      .eq('password_reset_token', token)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid reset token' },
        { status: 200 }
      )
    }

    // Check if token is expired
    if (!user.password_reset_token_expiry || new Date(user.password_reset_token_expiry) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Reset token has expired' },
        { status: 200 }
      )
    }

    return NextResponse.json({ 
      valid: true,
      message: 'Token is valid'
    })
  } catch (error) {
    console.error('Error in GET /api/auth/reset-password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





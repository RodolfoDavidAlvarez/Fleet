import { NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createServerClient as createServiceRoleClient } from '@/lib/supabase'

export async function GET() {
  const authClient = createAuthClient()
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const serviceRole = createServiceRoleClient()
  const { data: profile, error: profileError } = await serviceRole
    .from('users')
    .select('id, email, name, role, approval_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile lookup error:', profileError)
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }

  if (profile.role === 'admin' && profile.approval_status !== 'approved') {
    return NextResponse.json({ error: 'Account pending approval' }, { status: 403 })
  }

  return NextResponse.json({
    user: {
      ...profile,
      name: profile.name || (user.user_metadata as any)?.name || user.email,
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get all users with their approval status and last_seen_at
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, phone, approval_status, last_seen_at, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Calculate online status (online if last_seen_at is within last 5 minutes)
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    const usersWithOnlineStatus = users?.map(user => ({
      ...user,
      isOnline: user.last_seen_at 
        ? new Date(user.last_seen_at) > fiveMinutesAgo 
        : false
    })) || []

    return NextResponse.json({ users: usersWithOnlineStatus })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user role or approval status
export async function PATCH(request: NextRequest) {
  try {
    const { userId, role, approvalStatus } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const updates: any = {}

    if (role) {
      if (!['admin', 'mechanic', 'customer', 'driver'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }
      updates.role = role
    }

    if (approvalStatus) {
      if (!['pending_approval', 'approved'].includes(approvalStatus)) {
        return NextResponse.json(
          { error: 'Invalid approval status' },
          { status: 400 }
        )
      }
      updates.approval_status = approvalStatus
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Error in PATCH /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH - Update bug report status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, admin_notes } = body

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin or mechanic (mechanics are treated as admins)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin' && userData?.role !== 'mechanic') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString()
      }
    }
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    // Update bug report
    const { data: bugReport, error: updateError } = await supabase
      .from('bug_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating bug report:', updateError)
      return NextResponse.json(
        { error: 'Failed to update bug report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      report: bugReport
    })
  } catch (error) {
    console.error('Error in PATCH /api/bug-reports/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Fetch single bug report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch bug report
    const { data: bugReport, error } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching bug report:', error)
      return NextResponse.json(
        { error: 'Bug report not found' },
        { status: 404 }
      )
    }

    // Check if user has access (either owner or admin/mechanic)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.role === 'admin' || userData?.role === 'mechanic'
    const isOwner = bugReport.user_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({ report: bugReport })
  } catch (error) {
    console.error('Error in GET /api/bug-reports/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

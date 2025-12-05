import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET - Load all notification assignments
export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('notification_assignments')
      .select('*')
    
    if (error) throw error
    
    // Convert array to object format for easier lookup
    const assignments: Record<string, string[]> = {}
    data?.forEach(row => {
      assignments[row.notification_type] = row.admin_user_ids || []
    })
    
    return NextResponse.json({ assignments })
  } catch (error: any) {
    console.error('Error loading notification assignments:', error)
    return NextResponse.json(
      { error: 'Failed to load notification assignments', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Save notification assignment for a specific type
export async function POST(request: NextRequest) {
  try {
    const { notificationType, adminUserIds } = await request.json()
    
    if (!notificationType) {
      return NextResponse.json(
        { error: 'notification Type is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerClient()
    
    // Upsert the assignment
    const { data, error } = await supabase
      .from('notification_assignments')
      .upsert({
        notification_type: notificationType,
        admin_user_ids: adminUserIds || [],
      }, {
        onConflict: 'notification_type'
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, assignment: data })
  } catch (error: any) {
    console.error('Error saving notification assignment:', error)
    return NextResponse.json(
      { error: 'Failed to save notification assignment', details: error.message },
      { status: 500 }
    )
  }
}



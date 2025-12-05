import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Add recipient to notification
export async function POST(request: NextRequest) {
  try {
    const { notificationId, userId } = await request.json()

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: 'Notification ID and user ID are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if recipient already exists
    const { data: existing } = await supabase
      .from('notification_recipients')
      .select('id')
      .eq('notification_id', notificationId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json({ message: 'Recipient already assigned' })
    }

    // Add recipient
    const { data, error } = await supabase
      .from('notification_recipients')
      .insert({
        notification_id: notificationId,
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding notification recipient:', error)
      }
      return NextResponse.json(
        { error: 'Failed to add recipient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ recipient: data })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in POST /api/admin/notifications/recipients:', error)
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove recipient from notification
export async function DELETE(request: NextRequest) {
  try {
    const { notificationId, userId } = await request.json()

    if (!notificationId || !userId) {
      return NextResponse.json(
        { error: 'Notification ID and user ID are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('notification_recipients')
      .delete()
      .eq('notification_id', notificationId)
      .eq('user_id', userId)

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error removing notification recipient:', error)
      }
      return NextResponse.json(
        { error: 'Failed to remove recipient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Recipient removed successfully' })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in DELETE /api/admin/notifications/recipients:', error)
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Get all notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // If userId is provided, get notifications for that user
    if (userId) {
      // Get notification IDs where user is a recipient
      const { data: recipientData, error: recipientError } = await supabase
        .from('notification_recipients')
        .select('notification_id')
        .eq('user_id', userId)

      if (recipientError) {
        console.error('Error fetching notification recipients:', recipientError)
        return NextResponse.json(
          { error: 'Failed to fetch notifications' },
          { status: 500 }
        )
      }

      const notificationIds = recipientData?.map((r) => r.notification_id) || []

      if (notificationIds.length === 0) {
        return NextResponse.json({ notifications: [] })
      }

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .in('id', notificationIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json(
          { error: 'Failed to fetch notifications' },
          { status: 500 }
        )
      }

      // Get recipients for each notification
      const notificationsWithRecipients = await Promise.all(
        (notifications || []).map(async (notification) => {
          const { data: recipients } = await supabase
            .from('notification_recipients')
            .select('*')
            .eq('notification_id', notification.id)

          return {
            ...notification,
            recipients: recipients || [],
          }
        })
      )

      return NextResponse.json({ notifications: notificationsWithRecipients })
    }

    // Get all notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get recipients for each notification
    const notificationsWithRecipients = await Promise.all(
      (notifications || []).map(async (notification) => {
        const { data: recipients } = await supabase
          .from('notification_recipients')
          .select('*')
          .eq('notification_id', notification.id)

        return {
          ...notification,
          recipients: recipients || [],
        }
      })
    )

    return NextResponse.json({ notifications: notificationsWithRecipients })
  } catch (error) {
    console.error('Error in GET /api/admin/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new notification
export async function POST(request: NextRequest) {
  try {
    const { title, message, type, recipientIds, recipientRoles, channel, templateId } = await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // If templateId is provided, update template usage stats
    if (templateId) {
      await supabase
        .from('announcement_templates')
        .update({
          last_used_at: new Date().toISOString(),
          use_count: supabase.rpc('increment', { row_id: templateId }),
        })
        .eq('id', templateId)
    }

    // Create notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type: type || 'info',
        channel: channel || 'in_app',
        template_id: templateId || null,
        recipient_ids: recipientIds || [],
        recipient_roles: recipientRoles || [],
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    // Collect all recipient user IDs
    let allRecipientIds: string[] = [...(recipientIds || [])]

    // If recipientRoles are provided, find users with those roles
    if (recipientRoles && recipientRoles.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, phone')
        .in('role', recipientRoles)

      if (!usersError && users && users.length > 0) {
        allRecipientIds = [...allRecipientIds, ...users.map((u) => u.id)]
      }
    }

    // Remove duplicates
    allRecipientIds = [...new Set(allRecipientIds)]

    // Create notification_recipients entries
    if (allRecipientIds.length > 0) {
      const recipients = allRecipientIds.map((userId: string) => ({
        notification_id: notification.id,
        user_id: userId,
      }))

      const { error: recipientsError } = await supabase
        .from('notification_recipients')
        .insert(recipients)

      if (recipientsError) {
        console.error('Error creating notification recipients:', recipientsError)
      }
    }

    // Send SMS if channel includes SMS
    if ((channel === 'sms' || channel === 'both') && process.env.ENABLE_SMS === 'true') {
      try {
        // Get user phone numbers
        const { data: users } = await supabase
          .from('users')
          .select('phone')
          .in('id', allRecipientIds)
          .not('phone', 'is', null)

        if (users && users.length > 0) {
          const phoneNumbers = users.map(u => u.phone).filter(Boolean)

          // Send SMS to each recipient
          const twilio = require('twilio')(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
          )

          let sentCount = 0
          for (const phone of phoneNumbers) {
            try {
              await twilio.messages.create({
                body: `${title}\n\n${message}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone,
              })
              sentCount++
            } catch (smsError) {
              console.error('Error sending SMS to', phone, smsError)
            }
          }

          // Update notification with SMS stats
          await supabase
            .from('notifications')
            .update({
              sms_sent_count: sentCount,
              sms_sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id)
        }
      } catch (smsError) {
        console.error('Error sending SMS notifications:', smsError)
      }
    }

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update notification (mark as read, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const { notificationId, userId, isRead } = await request.json()

    if (!notificationId || userId === undefined) {
      return NextResponse.json(
        { error: 'Notification ID and user ID are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Update notification_recipients
    const updates: any = {}
    if (isRead !== undefined) {
      updates.is_read = isRead
      if (isRead) {
        updates.read_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('notification_recipients')
      .update(updates)
      .eq('notification_id', notificationId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notification: data })
  } catch (error) {
    console.error('Error in PATCH /api/admin/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Get all templates
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('active')

    let query = supabase
      .from('announcement_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (isActive === 'true') {
      query = query.eq('is_active', true)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error in GET /api/admin/announcement-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new template
export async function POST(request: NextRequest) {
  try {
    const { name, title, message, type, channel, recipientRoles } = await request.json()

    if (!name || !title || !message) {
      return NextResponse.json(
        { error: 'Name, title and message are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get current user from session or headers
    const { data: { user } } = await supabase.auth.getUser()

    const { data: template, error } = await supabase
      .from('announcement_templates')
      .insert({
        name,
        title,
        message,
        type: type || 'info',
        channel: channel || 'in_app',
        recipient_roles: recipientRoles || [],
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/announcement-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a template
export async function PATCH(request: NextRequest) {
  try {
    const { id, name, title, message, type, channel, recipientRoles, isActive } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (title !== undefined) updates.title = title
    if (message !== undefined) updates.message = message
    if (type !== undefined) updates.type = type
    if (channel !== undefined) updates.channel = channel
    if (recipientRoles !== undefined) updates.recipient_roles = recipientRoles
    if (isActive !== undefined) updates.is_active = isActive

    const { data: template, error } = await supabase
      .from('announcement_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error in PATCH /api/admin/announcement-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('announcement_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/announcement-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

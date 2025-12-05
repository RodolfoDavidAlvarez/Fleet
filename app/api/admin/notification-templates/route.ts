import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET - Load all notification message templates
export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('notification_message_templates')
      .select('*')
    
    if (error) throw error
    
    // Convert array to object format for easier lookup
    const templates: Record<string, { en: string; es: string }> = {}
    data?.forEach(row => {
      templates[row.notification_type] = {
        en: row.message_en || '',
        es: row.message_es || '',
      }
    })
    
    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Error loading notification templates:', error)
    return NextResponse.json(
      { error: 'Failed to load notification templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Save notification template for a specific type
export async function POST(request: NextRequest) {
  try {
    const { notificationType, messageEn, messageEs } = await request.json()
    
    if (!notificationType) {
      return NextResponse.json(
        { error: 'notificationType is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerClient()
    
    // Upsert the template
    const { data, error } = await supabase
      .from('notification_message_templates')
      .upsert({
        notification_type: notificationType,
        message_en: messageEn || '',
        message_es: messageEs || '',
      }, {
        onConflict: 'notification_type'
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, template: data })
  } catch (error: any) {
    console.error('Error saving notification template:', error)
    return NextResponse.json(
      { error: 'Failed to save notification template', details: error.message },
      { status: 500 }
    )
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'

const driverUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'mechanic', 'customer', 'driver']).optional(),
  approval_status: z.enum(['pending_approval', 'approved']).optional(),
  level_certification: z.string().optional(),
  notes: z.string().optional(),
  preferred_language: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      driver: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        approval_status: data.approval_status,
        airtable_id: data.airtable_id,
        member_legacy_id: data.member_legacy_id,
        level_certification: data.level_certification,
        notes: data.notes,
        preferred_language: data.preferred_language,
        equipment_oversight: data.equipment_oversight,
        last_seen_at: data.last_seen_at,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch driver' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json()
    const parsed = driverUpdateSchema.safeParse(json)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Build update object, only including provided fields
    const updateData: any = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role
    if (parsed.data.approval_status !== undefined) updateData.approval_status = parsed.data.approval_status
    if (parsed.data.level_certification !== undefined) updateData.level_certification = parsed.data.level_certification
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes
    if (parsed.data.preferred_language !== undefined) updateData.preferred_language = parsed.data.preferred_language

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to update driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      driver: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        approval_status: data.approval_status,
        airtable_id: data.airtable_id,
        member_legacy_id: data.member_legacy_id,
        level_certification: data.level_certification,
        notes: data.notes,
        preferred_language: data.preferred_language,
        equipment_oversight: data.equipment_oversight,
        last_seen_at: data.last_seen_at,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json(
      { error: 'Failed to update driver' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete driver' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Driver deleted' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete driver' },
      { status: 500 }
    )
  }
}








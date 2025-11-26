import { NextRequest, NextResponse } from 'next/server'
import { optimizeAndStoreVehicleImage } from '@/lib/vehicle-media'
import { createServerClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const photoFile = formData.get('photo') as File | null

    if (!photoFile) {
      return NextResponse.json(
        { error: 'No photo provided' },
        { status: 400 }
      )
    }

    if (!photoFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    if (photoFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be 5MB or smaller' },
        { status: 400 }
      )
    }

    // Upload and optimize the image
    const uploaded = await optimizeAndStoreVehicleImage(photoFile)

    // Update vehicle with photo URL
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('vehicles')
      .update({ photo_url: uploaded.url })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to update vehicle photo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      vehicle: { ...data, photoUrl: uploaded.url },
      photoUrl: uploaded.url 
    })
  } catch (error) {
    console.error('Error uploading vehicle photo:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    )
  }
}


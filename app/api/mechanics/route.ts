import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { mechanicDB } from '@/lib/db'

const mechanicSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  specializations: z.array(z.string()).optional(),
  availability: z.enum(['available', 'busy', 'unavailable']).optional(),
})

export async function GET() {
  try {
    const mechanics = await mechanicDB.getAll()
    return NextResponse.json({ mechanics })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch mechanics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = mechanicSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const mechanic = await mechanicDB.create({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      specializations: parsed.data.specializations || [],
      availability: parsed.data.availability || 'available',
      currentJobs: [],
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ mechanic }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create mechanic' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { vehicleDB } from '@/lib/db'

const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().min(3),
  licensePlate: z.string().min(1),
  mileage: z.coerce.number().nonnegative().optional(),
  status: z.enum(['active', 'in_service', 'retired']).optional(),
  lastServiceDate: z.string().optional(),
  nextServiceDue: z.string().optional(),
})

export async function GET() {
  try {
    const vehicles = await vehicleDB.getAll()
    return NextResponse.json({ vehicles })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = vehicleSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const vehicle = await vehicleDB.create({
      ...parsed.data,
      status: parsed.data.status || 'active',
      mileage: parsed.data.mileage || 0,
      serviceHistory: [],
    })

    return NextResponse.json({ vehicle }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { vehicleDB } from '@/lib/db'
import { z } from 'zod'

const vehicleUpdateSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  vin: z.string().optional(),
  licensePlate: z.string().optional(),
  mileage: z.coerce.number().nonnegative().optional(),
  status: z.enum(['active', 'in_service', 'retired']).optional(),
  lastServiceDate: z.string().optional(),
  nextServiceDue: z.string().optional(),
  driverId: z.string().uuid().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicle = await vehicleDB.getById(params.id)
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ vehicle })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicle' },
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
    const parsed = vehicleUpdateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const vehicle = await vehicleDB.update(params.id, parsed.data)

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ vehicle })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update vehicle' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await vehicleDB.delete(params.id)
    if (!success) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ message: 'Vehicle deleted' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete vehicle' },
      { status: 500 }
    )
  }
}


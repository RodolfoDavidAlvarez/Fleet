import { NextRequest, NextResponse } from 'next/server'
import { vehicleDB } from '@/lib/db'

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
    const body = await request.json()
    const { make, model, year, vin, licensePlate, mileage } = body

    if (!make || !model || !year || !vin || !licensePlate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const vehicle = await vehicleDB.create({
      make,
      model,
      year: parseInt(year),
      vin,
      licensePlate,
      status: 'active',
      mileage: mileage || 0,
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


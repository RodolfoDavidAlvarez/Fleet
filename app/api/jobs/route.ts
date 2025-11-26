import { NextRequest, NextResponse } from 'next/server'
import { jobDB } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mechanicId = searchParams.get('mechanicId')

    let jobs
    if (mechanicId) {
      jobs = jobDB.getByMechanic(mechanicId)
    } else {
      jobs = jobDB.getAll()
    }

    return NextResponse.json({ jobs })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, vehicleId, mechanicId, priority, estimatedHours } = body

    if (!bookingId || !vehicleId || !mechanicId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const job = jobDB.create({
      bookingId,
      vehicleId,
      mechanicId,
      status: 'assigned',
      priority: priority || 'medium',
      estimatedHours: estimatedHours || 0,
      partsUsed: [],
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}


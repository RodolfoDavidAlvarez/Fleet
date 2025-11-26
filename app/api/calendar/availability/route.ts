import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD format
    const weekStart = searchParams.get('weekStart') // YYYY-MM-DD format

    if (!date && !weekStart) {
      return NextResponse.json(
        { error: 'date or weekStart parameter required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get calendar settings
    const { data: settings } = await supabase
      .from('calendar_settings')
      .select('*')
      .single()

    const maxBookingsPerWeek = settings?.max_bookings_per_week || 5
    const startTime = settings?.start_time || '06:00'
    const endTime = settings?.end_time || '14:00'
    const slotDuration = settings?.slot_duration || 30
    const workingDays = settings?.working_days || [1, 2, 3, 4, 5] // Mon-Fri

    // Calculate week start (Monday)
    let weekStartDate: Date
    if (weekStart) {
      weekStartDate = new Date(weekStart)
    } else if (date) {
      const checkDate = new Date(date)
      const dayOfWeek = checkDate.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday, go back 6 days
      weekStartDate = new Date(checkDate)
      weekStartDate.setDate(checkDate.getDate() + mondayOffset)
      weekStartDate.setHours(0, 0, 0, 0)
    } else {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)
    weekEndDate.setHours(23, 59, 59, 999)

    // Count bookings for this week
    const { count: weeklyBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_date', weekStartDate.toISOString().split('T')[0])
      .lte('scheduled_date', weekEndDate.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed', 'in_progress'])

    const bookingsRemaining = maxBookingsPerWeek - (weeklyBookings || 0)

    // Get available time slots for the requested date
    let availableSlots: string[] = []
    if (date) {
      const checkDate = new Date(date)
      const dayOfWeek = checkDate.getDay()
      
      if (workingDays.includes(dayOfWeek)) {
        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)
        
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        
        for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
          const hour = Math.floor(minutes / 60)
          const min = minutes % 60
          const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
          
          // Check if this slot is already booked
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('scheduled_date', date)
            .eq('scheduled_time', timeString)
            .in('status', ['pending', 'confirmed', 'in_progress'])
          
          if ((count || 0) === 0) {
            availableSlots.push(timeString)
          }
        }
      }
    }

    return NextResponse.json({
      weekStart: weekStartDate.toISOString().split('T')[0],
      weekEnd: weekEndDate.toISOString().split('T')[0],
      weeklyBookings: weeklyBookings || 0,
      maxBookingsPerWeek,
      bookingsRemaining,
      availableSlots,
      workingDays,
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}


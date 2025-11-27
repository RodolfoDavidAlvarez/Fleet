import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// API to check availability for multiple dates (for calendar display)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') // YYYY-MM-DD format
    const endDate = searchParams.get('endDate') // YYYY-MM-DD format

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters required' },
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
    const slotBufferTime = settings?.slot_buffer_time || 0
    const workingDays = settings?.working_days || [1, 2, 3, 4, 5]
    const advanceBookingWindow = settings?.advance_booking_window || 0
    const advanceBookingUnit = settings?.advance_booking_unit || 'days'

    // Calculate minimum booking date based on advance window
    const now = new Date()
    const minBookingDate = new Date(now)
    if (advanceBookingUnit === 'hours') {
      minBookingDate.setHours(now.getHours() + advanceBookingWindow)
    } else {
      minBookingDate.setDate(now.getDate() + advanceBookingWindow)
      minBookingDate.setHours(0, 0, 0, 0)
    }

    // Get all bookings in the date range
    const { data: bookings } = await supabase
      .from('bookings')
      .select('scheduled_date, scheduled_time, status')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .in('status', ['pending', 'confirmed', 'in_progress'])

    // Count bookings per date
    const bookingsByDate: Record<string, number> = {}
    bookings?.forEach((booking) => {
      const date = booking.scheduled_date
      bookingsByDate[date] = (bookingsByDate[date] || 0) + 1
    })

    // Check availability for each date in range
    const dateAvailability: Record<string, { hasSlots: boolean; slotCount: number }> = {}
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T23:59:59')

    // Count weekly bookings to check weekly limit
    const weekStartDate = new Date(start)
    const dayOfWeek = weekStartDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    weekStartDate.setDate(start.getDate() + mondayOffset)
    weekStartDate.setHours(0, 0, 0, 0)
    
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)
    weekEndDate.setHours(23, 59, 59, 999)

    const { count: weeklyBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_date', weekStartDate.toISOString().split('T')[0])
      .lte('scheduled_date', weekEndDate.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed', 'in_progress'])

    const bookingsRemaining = maxBookingsPerWeek - (weeklyBookings || 0)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayOfWeek = d.getUTCDay()
      const dateObj = new Date(dateStr + 'T00:00:00')

      // Check if date is within advance booking window
      const isWithinAdvanceWindow = dateObj >= minBookingDate

      // Check if it's a working day
      const isWorkingDay = workingDays.includes(dayOfWeek)

      if (isWorkingDay && isWithinAdvanceWindow && bookingsRemaining > 0) {
        // Calculate available slots for this date
        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)
        
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        
        // Total time per slot = slotDuration + slotBufferTime
        const totalSlotTime = slotDuration + slotBufferTime
        
        let availableSlotCount = 0
        for (let minutes = startMinutes; minutes < endMinutes; minutes += totalSlotTime) {
          // Check if there's enough time for a full slot
          if (minutes + slotDuration > endMinutes) break
          
          const hour = Math.floor(minutes / 60)
          const min = minutes % 60
          const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
          
          // Check if this slot overlaps with any existing booking
          const slotStartMinutes = minutes
          const slotEndMinutes = minutes + slotDuration + slotBufferTime
          
          const hasOverlap = bookings?.some((b) => {
            if (b.scheduled_date !== dateStr) return false
            const [bookingHour, bookingMin] = b.scheduled_time.split(':').map(Number)
            const bookingStartMinutes = bookingHour * 60 + bookingMin
            const bookingEndMinutes = bookingStartMinutes + slotDuration + slotBufferTime
            
            // Check for overlap
            return slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes
          })
          
          if (!hasOverlap) {
            availableSlotCount++
          }
        }

        dateAvailability[dateStr] = {
          hasSlots: availableSlotCount > 0,
          slotCount: availableSlotCount,
        }
      } else {
        dateAvailability[dateStr] = {
          hasSlots: false,
          slotCount: 0,
        }
      }
    }

    return NextResponse.json({
      dateAvailability,
      minBookingDate: minBookingDate.toISOString().split('T')[0],
      advanceBookingWindow,
      advanceBookingUnit,
    })
  } catch (error) {
    console.error('Error checking dates availability:', error)
    return NextResponse.json(
      { error: 'Failed to check dates availability' },
      { status: 500 }
    )
  }
}


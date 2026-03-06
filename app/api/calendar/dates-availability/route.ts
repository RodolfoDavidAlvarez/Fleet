import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Helper to get Monday of the week containing a given date
function getWeekMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + mondayOffset)
  return d.toISOString().split('T')[0]
}

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

    // Get ALL bookings in an extended range (to cover weekly limits across month boundaries)
    const extendedStart = new Date(startDate + 'T12:00:00')
    extendedStart.setDate(extendedStart.getDate() - 7) // Go back a week
    const extendedEnd = new Date(endDate + 'T12:00:00')
    extendedEnd.setDate(extendedEnd.getDate() + 7) // Go forward a week

    const { data: bookings } = await supabase
      .from('bookings')
      .select('scheduled_date, scheduled_time, status')
      .gte('scheduled_date', extendedStart.toISOString().split('T')[0])
      .lte('scheduled_date', extendedEnd.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed', 'in_progress'])

    // Count bookings per week (keyed by Monday date string)
    const bookingsByWeek: Record<string, number> = {}
    bookings?.forEach((booking) => {
      const bDate = new Date(booking.scheduled_date + 'T12:00:00') // noon to avoid timezone issues
      const monday = getWeekMonday(bDate)
      bookingsByWeek[monday] = (bookingsByWeek[monday] || 0) + 1
    })

    // Pre-compute slots info
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const totalSlotTime = slotDuration + slotBufferTime

    // Check availability for each date in range
    const dateAvailability: Record<string, { hasSlots: boolean; slotCount: number }> = {}
    const start = new Date(startDate + 'T12:00:00') // Use noon to avoid timezone day shifts
    const end = new Date(endDate + 'T12:00:00')

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      // Use local day of week (parsing YYYY-MM-DD at noon avoids timezone shifts)
      const dayOfWeek = d.getDay()
      const dateForCompare = new Date(dateStr + 'T00:00:00')

      // Check if date is within advance booking window
      const isWithinAdvanceWindow = dateForCompare >= minBookingDate

      // Check if it's a working day
      const isWorkingDay = workingDays.includes(dayOfWeek)

      // Check weekly booking limit for THIS date's week
      const weekMonday = getWeekMonday(d)
      const weekBookingCount = bookingsByWeek[weekMonday] || 0
      const hasWeeklyCapacity = weekBookingCount < maxBookingsPerWeek

      if (isWorkingDay && isWithinAdvanceWindow && hasWeeklyCapacity) {
        // Calculate available slots for this date
        let availableSlotCount = 0
        for (let minutes = startMinutes; minutes < endMinutes; minutes += totalSlotTime) {
          if (minutes + slotDuration > endMinutes) break

          const slotStartMinutes = minutes
          const slotEndMinutes = minutes + slotDuration + slotBufferTime

          // Check if this slot overlaps with any existing booking on this date
          const hasOverlap = bookings?.some((b) => {
            if (b.scheduled_date !== dateStr) return false
            const [bookingHour, bookingMin] = b.scheduled_time.split(':').map(Number)
            const bookingStartMinutes = bookingHour * 60 + bookingMin
            const bookingEndMinutes = bookingStartMinutes + slotDuration + slotBufferTime
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

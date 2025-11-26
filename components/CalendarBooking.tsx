'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Globe } from 'lucide-react'

interface CalendarBookingProps {
  selectedDate: string
  selectedTime: string
  onDateSelect: (date: string) => void
  onTimeSelect: (time: string) => void
  availableTimeSlots: string[]
}

export default function CalendarBooking({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  availableTimeSlots,
}: CalendarBookingProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const formatDateString = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day)
    return date.toISOString().split('T')[0]
  }

  const isDateAvailable = (day: number) => {
    const date = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    return checkDate >= today
  }

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false
    const date = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date === selectedDate
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    )
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number) => {
    if (!day || !isDateAvailable(day)) return
    const date = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    onDateSelect(date)
  }

  const getSelectedDateLabel = () => {
    if (!selectedDate) return null
    const date = new Date(selectedDate)
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  const days = getDaysInMonth(currentMonth)
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Calendar Section */}
      <div className="card-surface rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {formatMonthYear(currentMonth)}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const available = isDateAvailable(day)
            const selected = isDateSelected(day)
            const today = isToday(day)

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={!available}
                className={`
                  aspect-square rounded-lg text-sm font-medium transition-colors
                  ${selected
                    ? 'bg-primary-600 text-white shadow-lg'
                    : available
                    ? 'bg-primary-50 text-primary-800 hover:bg-primary-100'
                    : 'text-gray-300 cursor-not-allowed'}
                  ${today && !selected ? 'ring-2 ring-primary-300' : ''}
                `}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Timezone indicator */}
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
          <Globe className="h-4 w-4" />
          <span>Arizona Time (MST)</span>
        </div>
      </div>

      {/* Time Slots Section */}
      <div className="card-surface rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Select a Date & Time
          </h3>
          {selectedDate && (
            <p className="text-sm text-gray-600">{getSelectedDateLabel()}</p>
          )}
          {!selectedDate && (
            <p className="text-sm text-gray-500">Please select a date first</p>
          )}
        </div>

        {selectedDate ? (
          <div className="space-y-2">
            {availableTimeSlots.map((time) => {
              const isSelected = selectedTime === time
              return (
                <button
                  key={time}
                  onClick={() => onTimeSelect(time)}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg border-2 transition-colors
                    ${isSelected
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-primary-300 hover:bg-primary-50'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{time}</span>
                    {isSelected && (
                      <span className="text-xs bg-white text-gray-800 px-2 py-1 rounded">Selected</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Select a date to view available times</p>
          </div>
        )}
      </div>
    </div>
  )
}


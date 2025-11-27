"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Clock, User, MessageSquare, CheckCircle, MapPin, Car } from "lucide-react";

export default function BookingLinkPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repairRequest, setRepairRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: searchParams.get("name") || "",
    email: "",
    phone: searchParams.get("phone") || "",
    date: "",
    time: "",
    notes: "",
  });

  const [calendarSettings, setCalendarSettings] = useState({
    maxBookingsPerWeek: 5,
    startTime: "06:00",
    endTime: "14:00",
    slotDuration: 30,
    slotBufferTime: 0, // Buffer time between slots (like Calendly)
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    advanceBookingWindow: 0,
    advanceBookingUnit: "days" as "hours" | "days",
  });
  const [availability, setAvailability] = useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [datesAvailability, setDatesAvailability] = useState<Record<string, { hasSlots: boolean; slotCount: number }>>({});

  // Load calendar settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/calendar/settings");
        const data = await res.json();
        if (data.settings) {
          setCalendarSettings({
            maxBookingsPerWeek: data.settings.maxBookingsPerWeek || 5,
            startTime: data.settings.startTime || "06:00",
            endTime: data.settings.endTime || "14:00",
            slotDuration: data.settings.slotDuration || 30,
            slotBufferTime: data.settings.slotBufferTime ?? 0,
            workingDays: data.settings.workingDays || [1, 2, 3, 4, 5],
            advanceBookingWindow: data.settings.advanceBookingWindow || 0,
            advanceBookingUnit: data.settings.advanceBookingUnit || "days",
          });
        }
      } catch (err) {
        console.error("Error loading calendar settings:", err);
      }
    };
    loadSettings();
  }, []);

  // Load dates availability for calendar display
  useEffect(() => {
    const loadDatesAvailability = async () => {
      try {
        // Get date range for current month (first day to last day)
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const res = await fetch(
          `/api/calendar/dates-availability?startDate=${start.toISOString().split("T")[0]}&endDate=${end.toISOString().split("T")[0]}`
        );
        const data = await res.json();
        if (res.ok && data.dateAvailability) {
          setDatesAvailability(data.dateAvailability);
        }
      } catch (err) {
        console.error("Error loading dates availability:", err);
      }
    };

    loadDatesAvailability();
  }, [
    currentMonth,
    calendarSettings.advanceBookingWindow,
    calendarSettings.advanceBookingUnit,
    calendarSettings.slotDuration,
    calendarSettings.slotBufferTime,
  ]);

  // Check availability when date is selected
  useEffect(() => {
    if (formData.date) {
      checkAvailability(formData.date);
    }
  }, [formData.date, calendarSettings]);

  const checkAvailability = async (date: string) => {
    setLoadingAvailability(true);
    try {
      const res = await fetch(`/api/calendar/availability?date=${date}`);
      const data = await res.json();
      if (res.ok) {
        setAvailability(data);
      }
    } catch (err) {
      console.error("Error checking availability:", err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Generate time slots based on settings
  const getTimeSlots = () => {
    if (!availability?.availableSlots) {
      const slots = [];
      const [startHour, startMin] = calendarSettings.startTime.split(":").map(Number);
      const [endHour, endMin] = calendarSettings.endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Total time per slot = slotDuration + slotBufferTime (like Calendly)
      const totalSlotTime = calendarSettings.slotDuration + calendarSettings.slotBufferTime;

      for (let minutes = startMinutes; minutes < endMinutes; minutes += totalSlotTime) {
        // Check if there's enough time for a full slot
        if (minutes + calendarSettings.slotDuration > endMinutes) break;

        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        slots.push(`${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
      }
      return slots;
    }
    return availability.availableSlots;
  };

  // Get available dates (next 7 days, only working days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      // Check next 2 weeks
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      // Only include working days
      if (calendarSettings.workingDays.includes(dayOfWeek)) {
        dates.push(date.toISOString().split("T")[0]);
      }
    }
    return dates;
  };

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Get days in month for calendar display
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const formatDateString = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    return date.toISOString().split("T")[0];
  };

  const isWorkingDay = (day: number | null) => {
    if (day === null) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    return calendarSettings.workingDays.includes(dayOfWeek);
  };

  const isDateAvailable = (day: number | null) => {
    if (day === null) return false;
    const dateString = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    // Check if it's a working day
    if (!isWorkingDay(day)) return false;

    // Check advance booking window
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateString);
    checkDate.setHours(0, 0, 0, 0);

    const minBookingDate = new Date(today);
    if (calendarSettings.advanceBookingUnit === "hours") {
      minBookingDate.setHours(today.getHours() + calendarSettings.advanceBookingWindow);
    } else {
      minBookingDate.setDate(today.getDate() + calendarSettings.advanceBookingWindow);
      minBookingDate.setHours(0, 0, 0, 0);
    }

    const isWithinAdvanceWindow = checkDate >= minBookingDate;
    if (!isWithinAdvanceWindow) return false;

    // Check if date has available slots
    const dateAvailability = datesAvailability[dateString];
    return dateAvailability?.hasSlots || false;
  };

  const isDateSelected = (day: number | null) => {
    if (day === null || !formData.date) return false;
    const dateString = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dateString === formData.date;
  };

  const handleDateSelect = (day: number) => {
    if (!isDateAvailable(day)) return;
    const dateString = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setFormData({ ...formData, date: dateString, time: "" });
    setShowCalendar(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    const loadRepairRequest = async () => {
      try {
        const res = await fetch(`/api/repair-requests/${params.id}`);
        if (!res.ok) throw new Error("Failed to load repair request");
        const data = await res.json();
        setRepairRequest(data.request);
        if (data.request) {
          setFormData((prev) => ({
            ...prev,
            name: prev.name || data.request.driverName,
            email: prev.email || data.request.driverEmail || "",
            phone: prev.phone || data.request.driverPhone,
          }));
        }
      } catch (err) {
        console.error("Error loading repair request:", err);
        setError("Failed to load repair request details");
      } finally {
        setLoading(false);
      }
    };

    loadRepairRequest();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Email is optional, but if provided, it should be valid
    if (formData.email && !formData.email.includes("@")) {
      setSubmitting(false);
      setError("Please provide a valid email address.");
      return;
    }

    try {
      // Create booking from repair request
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          serviceType: repairRequest?.aiCategory || "Repair Service",
          scheduledDate: formData.date,
          scheduledTime: formData.time,
          status: "confirmed",
          notes: formData.notes,
          repairRequestId: params.id,
          vehicleInfo: repairRequest?.vehicleIdentifier || "",
          smsConsent: true,
          complianceAccepted: true,
        }),
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) {
        throw new Error(bookingData.error || "Failed to create booking");
      }

      // Update repair request with booking info
      await fetch(`/api/repair-requests/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.booking.id,
          scheduledDate: formData.date,
          scheduledTime: formData.time,
          status: "scheduled",
        }),
      });

      // Trigger notifications (mechanic and confirmation SMS)
      await fetch(`/api/bookings/${bookingData.booking.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: formData.date,
          scheduledTime: formData.time,
        }),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Error scheduling appointment:", err);
      setError(err instanceof Error ? err.message : "Failed to schedule appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Appointment Scheduled!</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">Your repair appointment has been confirmed for:</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="font-semibold text-gray-900 text-base sm:text-lg">{formData.date}</p>
            <p className="text-gray-600 text-sm sm:text-base">{formData.time}</p>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">You'll receive a confirmation SMS shortly. We'll see you then!</p>
        </div>
      </div>
    );
  }

  if (!repairRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <p className="text-red-600 text-sm sm:text-base">Repair request not found or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Panel - Service Details (Calendly Style) */}
        <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-300 p-4 sm:p-6 md:p-8 flex flex-col">
          {/* Logo or Branding */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <img
              src="/images/AEC-Horizontal-Official-Logo-2020.png"
              alt="Agave Environmental Contracting"
              className="h-8 sm:h-10 md:h-12 object-contain"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-gray-700 text-xs sm:text-sm font-medium mb-2">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
              <span className="truncate">{repairRequest.driverName || "Valued Driver"}</span>
            </div>

            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Vehicle Repair Service</h1>

            <div className="space-y-3 sm:space-y-4 text-gray-700">
              <div className="flex items-start gap-2 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">30 min</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Service Center</p>
                  <p className="text-xs sm:text-sm text-gray-600">Agave Fleet HQ</p>
                </div>
              </div>

              {repairRequest.vehicleIdentifier && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <Car className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Vehicle</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{repairRequest.vehicleIdentifier}</p>
                  </div>
                </div>
              )}

              {repairRequest.description && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Issue Reported</p>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-3">{repairRequest.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4 sm:pt-6 text-xs text-gray-500">
            <p>© Agave Environmental Contracting</p>
          </div>
        </div>

        {/* Right Panel - Date & Time Selection */}
        <div className="w-full md:w-2/3 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Select a Date & Time</h2>

            {error && (
              <div className="mb-4 sm:mb-6 bg-red-50 border-2 border-red-300 text-red-900 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Calendar Section */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 sm:mb-3">Select Date</label>

                {/* Calendar Toggle Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 sm:p-4 bg-white shadow-sm text-left focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {formData.date ? (
                          <div>
                            <p className="text-base sm:text-lg font-medium text-gray-900">
                              {new Date(formData.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 font-medium">Monday - Friday only</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-base sm:text-lg font-medium text-gray-400">Select a date</p>
                            <p className="text-xs text-gray-600 mt-1 font-medium">Monday - Friday only</p>
                          </div>
                        )}
                      </div>
                      <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </button>

                  {/* Calendar Dropdown */}
                  {showCalendar && (
                    <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                          aria-label="Previous month"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{formatMonthYear(currentMonth)}</h3>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                          aria-label="Next month"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Week Days Header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map((day) => (
                          <div
                            key={day}
                            className={`text-center text-xs font-semibold py-2 ${day === "Sun" || day === "Sat" ? "text-gray-400" : "text-gray-700"}`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                          const available = isDateAvailable(day);
                          const selected = isDateSelected(day);
                          const isWorking = day !== null && isWorkingDay(day);
                          const isToday =
                            day !== null &&
                            new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

                          const dateString = day !== null ? formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                          const hasSlots = dateString ? datesAvailability[dateString]?.hasSlots : false;
                          const slotCount = dateString ? datesAvailability[dateString]?.slotCount || 0 : 0;

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => day !== null && handleDateSelect(day)}
                              disabled={!available}
                              className={`
                                   aspect-square min-h-[44px] sm:min-h-[48px] rounded-lg text-sm sm:text-base font-medium transition-all touch-manipulation relative
                                   ${
                                     day === null
                                       ? "cursor-default bg-transparent"
                                       : available && hasSlots
                                         ? selected
                                           ? "bg-primary-600 text-white shadow-md scale-105 border-2 border-primary-700"
                                           : "bg-white text-gray-900 hover:bg-primary-50 hover:border-primary-400 border-2 border-primary-300 hover:shadow-sm font-semibold"
                                         : isWorking
                                           ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200 opacity-50"
                                           : "bg-gray-50 text-gray-300 cursor-not-allowed border-2 border-transparent"
                                   }
                                   ${isToday && !selected && available ? "ring-2 ring-primary-300" : ""}
                                 `}
                              title={day !== null && hasSlots ? `${slotCount} slot${slotCount !== 1 ? "s" : ""} available` : undefined}
                            >
                              {day}
                              {available && hasSlots && !selected && (
                                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Helper Text */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 text-center">Only Monday - Friday are available</p>
                      </div>
                    </div>
                  )}

                  {/* Hidden input for form validation */}
                  <input type="hidden" required value={formData.date} onChange={() => {}} />
                </div>

                {/* Click outside to close calendar */}
                {showCalendar && <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />}

                {/* Additional Inputs that were in the previous form */}
                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white touch-manipulation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white touch-manipulation"
                      inputMode="tel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Email <span className="text-gray-500 font-normal text-xs">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white touch-manipulation"
                      placeholder="name@example.com"
                      inputMode="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Notes</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm bg-white border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-gray-900 placeholder-gray-500 touch-manipulation"
                      placeholder="Any specific requests..."
                    />
                  </div>
                </div>
              </div>

              {/* Time Slots Section */}
              <div className="lg:border-l lg:pl-8 border-gray-300 mt-6 lg:mt-0">
                <label className="block text-sm font-medium text-gray-900 mb-2 sm:mb-3">Select Time</label>

                {!formData.date ? (
                  <div className="flex flex-col items-center justify-center h-40 sm:h-48 text-gray-600 bg-gray-50 rounded-lg border-2 border-dashed border-gray-400">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mb-2 text-gray-500" />
                    <p className="text-xs sm:text-sm font-medium">Choose a date first</p>
                  </div>
                ) : loadingAvailability ? (
                  <div className="flex flex-col items-center justify-center h-40 sm:h-48 text-gray-700">
                    <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs sm:text-sm font-medium">Checking availability...</p>
                  </div>
                ) : getTimeSlots().length === 0 ? (
                  <div className="text-center p-3 sm:p-4 bg-yellow-50 border-2 border-yellow-200 text-yellow-900 rounded-lg text-xs sm:text-sm font-medium">
                    No slots available for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-2 max-h-[400px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                    {getTimeSlots().map((time: string) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormData({ ...formData, time })}
                        className={`w-full py-3 sm:py-3 px-3 sm:px-4 rounded-md border-2 text-center font-semibold transition-all touch-manipulation text-sm sm:text-base min-h-[44px] flex items-center justify-center ${
                          formData.time === time
                            ? "border-primary-600 bg-primary-600 text-white shadow-md scale-[1.02]"
                            : "border-primary-300 text-primary-800 active:border-primary-600 active:bg-primary-50 hover:border-primary-600 hover:bg-primary-50 hover:shadow-sm bg-white"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}

                {formData.time && (
                  <div className="mt-4 sm:mt-6 animate-fade-in">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gray-900 text-white py-3.5 sm:py-3 rounded-md font-semibold text-base sm:text-sm shadow-lg active:bg-black hover:bg-black hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-900 touch-manipulation min-h-[48px]"
                    >
                      {submitting ? "Confirming..." : "Confirm Booking"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

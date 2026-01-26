"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Clock, User, MessageSquare, CheckCircle, MapPin, Car, ChevronRight } from "lucide-react";

// Helper to format date strings as local dates (avoids timezone bug where YYYY-MM-DD shows as previous day)
function formatDateLocal(dateStr: string, options: Intl.DateTimeFormatOptions) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", options);
  }
  return new Date(dateStr).toLocaleDateString("en-US", options);
}

export default function BookingLinkPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repairRequest, setRepairRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkAlreadyUsed, setLinkAlreadyUsed] = useState(false);
  const [existingBookingId, setExistingBookingId] = useState<string | null>(null);

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

  // Calendar state - initialize early to prevent reference errors
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Get compact date list for mobile (next 10 available days with slot info)
  const compactDates = useMemo(() => {
    const dates: { date: string; dayName: string; dayNum: number; month: string; hasSlots: boolean; slotCount: number; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Calculate minimum booking date based on advance window
    const minBookingDate = new Date(today);
    if (calendarSettings.advanceBookingUnit === "hours") {
      minBookingDate.setHours(today.getHours() + calendarSettings.advanceBookingWindow);
    } else {
      minBookingDate.setDate(today.getDate() + calendarSettings.advanceBookingWindow);
    }
    minBookingDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 21 && dates.length < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      const dateStr = date.toISOString().split("T")[0];

      // Check if working day and within advance booking window
      if (calendarSettings.workingDays.includes(dayOfWeek) && date >= minBookingDate) {
        const availability = datesAvailability[dateStr];
        dates.push({
          date: dateStr,
          dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
          dayNum: date.getDate(),
          month: date.toLocaleDateString("en-US", { month: "short" }),
          hasSlots: availability?.hasSlots || false,
          slotCount: availability?.slotCount || 0,
          isToday: dateStr === todayStr,
        });
      }
    }
    return dates;
  }, [datesAvailability, calendarSettings]);


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
        if (!res.ok) {
          if (res.status === 404) {
            setError("Repair request not found. This booking link may be invalid.");
          } else {
            throw new Error("Failed to load repair request");
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        
        if (!data.request) {
          setError("Repair request not found. This booking link may be invalid.");
          setLoading(false);
          return;
        }

        // Check if booking already exists for this repair request
        if (data.request.bookingId) {
          // Verify the booking still exists
          try {
            const bookingRes = await fetch(`/api/bookings/${data.request.bookingId}`);
            if (bookingRes.ok) {
              const bookingData = await bookingRes.json();
              if (bookingData.booking) {
                setLinkAlreadyUsed(true);
                setExistingBookingId(data.request.bookingId);
                setRepairRequest(data.request);
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            // Booking doesn't exist, allow proceeding
            console.warn("Existing booking not found, allowing new booking");
          }
        }

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
        setError("Failed to load repair request details. Please try again or contact support.");
      } finally {
        setLoading(false);
      }
    };

    loadRepairRequest();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Comprehensive validation before submitting
    const validationErrors: string[] = [];

    if (!formData.name || formData.name.trim().length === 0) {
      validationErrors.push("Name is required");
    }

    // Email is optional, but if provided, it must be valid
    if (formData.email && formData.email.trim().length > 0) {
      if (!formData.email.includes("@") || !formData.email.includes(".")) {
        validationErrors.push("Please provide a valid email address");
      }
    }

    if (!formData.phone || formData.phone.trim().length === 0) {
      validationErrors.push("Phone number is required");
    } else {
      // Remove non-digits and check length
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits.length < 6) {
        validationErrors.push("Phone number must be at least 6 digits");
      }
    }

    if (!formData.date || formData.date.trim().length === 0) {
      validationErrors.push("Date is required");
    }

    if (!formData.time || formData.time.trim().length === 0) {
      validationErrors.push("Time is required");
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }

    // Prevent double submission
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      // Check again if booking already exists (race condition protection)
      if (repairRequest?.bookingId) {
        try {
          const checkRes = await fetch(`/api/bookings/${repairRequest.bookingId}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.booking) {
              setLinkAlreadyUsed(true);
              setExistingBookingId(repairRequest.bookingId);
              setSubmitting(false);
              setError("This booking link has already been used. A booking already exists for this repair request.");
              return;
            }
          }
        } catch (err) {
          // Continue if check fails
        }
      }

      // Create booking from repair request
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name.trim(),
          customerEmail: formData.email?.trim() || undefined,
          customerPhone: formData.phone.trim(),
          serviceType: repairRequest?.aiCategory || "Repair Service",
          scheduledDate: formData.date.trim(),
          scheduledTime: formData.time.trim(),
          status: "confirmed",
          notes: formData.notes?.trim() || undefined,
          repairRequestId: params.id,
          vehicleInfo: repairRequest?.vehicleIdentifier || undefined,
          smsConsent: true,
          complianceAccepted: true,
        }),
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) {
        // Handle specific error cases
        if (bookingRes.status === 409) {
          // Conflict - booking already exists
          throw new Error(bookingData.error || "This booking link has already been used. A booking already exists for this repair request.");
        } else if (bookingRes.status === 404) {
          throw new Error(bookingData.error || "Repair request not found. This booking link may be invalid.");
        } else if (bookingData.details) {
          // Show detailed validation errors from server if available
          const serverErrors = Object.entries(bookingData.details)
            .map(([field, errors]: [string, any]) => {
              const fieldName = field.replace(/([A-Z])/g, " $1").toLowerCase();
              return Array.isArray(errors) ? errors.join(", ") : String(errors);
            })
            .join(". ");
          throw new Error(serverErrors || bookingData.error || "Validation failed");
        }
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
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6 text-lg">Your repair appointment is all set</p>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-200">
              <div className="space-y-2">
                <p className="text-green-800 font-semibold text-lg">
                  {formatDateLocal(formData.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-green-700 text-xl font-bold">{formData.time}</p>
                <p className="text-green-600 text-sm">30 minute appointment</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Confirmation SMS will be sent shortly
              </p>
              <p className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Service location: Agave Fleet HQ
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (linkAlreadyUsed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Booking Already Completed</h2>
            <p className="text-gray-600 mb-6 text-lg">This booking link has already been used to create a booking.</p>
            
            {existingBookingId && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200">
                <p className="text-sm text-gray-600 mb-2">Booking ID:</p>
                <p className="text-blue-800 font-mono font-semibold text-lg break-all">{existingBookingId}</p>
              </div>
            )}
            
            <div className="space-y-3 text-sm text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Your booking has been confirmed
              </p>
              <p className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Check your SMS for booking details
              </p>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              If you need to modify your booking, please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!repairRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Request Not Found</h2>
            <p className="text-red-600 mb-4">This repair request could not be found or has expired.</p>
            <p className="text-sm text-gray-500">Please contact support if you believe this is an error.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/images/AEC-Horizontal-Official-Logo-2020.png"
            alt="Agave Environmental Contracting"
            className="h-12 mx-auto mb-6"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Book Your Repair Service</h1>
          <p className="text-gray-600 text-lg">Select a convenient time for your vehicle repair</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Details Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Driver</p>
                  <p className="text-lg font-semibold text-gray-900">{repairRequest.driverName || "Valued Driver"}</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-6">Vehicle Repair Service</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">30 minutes</p>
                    <p className="text-sm text-gray-600">Estimated duration</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Service Center</p>
                    <p className="text-sm text-gray-600">Agave Fleet HQ</p>
                  </div>
                </div>

                {repairRequest.vehicleIdentifier && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Car className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">Vehicle</p>
                      <p className="text-sm text-gray-600 truncate">{repairRequest.vehicleIdentifier}</p>
                    </div>
                  </div>
                )}

                {repairRequest.description && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">Issue Reported</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{repairRequest.description}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">© Agave Environmental Contracting</p>
              </div>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>

              {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-800 px-5 py-4 rounded-xl text-sm font-medium mb-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-700 text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Validation Error</p>
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  Select Date
                </h3>

                {/* Mobile: Compact Date List */}
                {isMobile ? (
                  <div className="space-y-2">
                    {formData.date && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-3 mb-4">
                        <p className="text-sm text-blue-600 font-medium">✓ Selected</p>
                        <p className="text-base font-bold text-gray-900">
                          {formatDateLocal(formData.date, { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {compactDates.map((d) => (
                        <button
                          key={d.date}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, date: d.date, time: "" });
                          }}
                          disabled={!d.hasSlots}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all touch-manipulation ${
                            formData.date === d.date
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                              : d.hasSlots
                                ? "bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                              formData.date === d.date ? "bg-white/20" : "bg-gray-100"
                            }`}>
                              <span className={`text-xs font-medium ${formData.date === d.date ? "text-white/80" : "text-gray-500"}`}>
                                {d.dayName}
                              </span>
                              <span className={`text-lg font-bold ${formData.date === d.date ? "text-white" : "text-gray-900"}`}>
                                {d.dayNum}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className={`font-semibold ${formData.date === d.date ? "text-white" : "text-gray-900"}`}>
                                {d.month} {d.dayNum}{d.isToday ? " (Today)" : ""}
                              </p>
                              <p className={`text-sm ${formData.date === d.date ? "text-white/80" : d.hasSlots ? "text-green-600" : "text-gray-400"}`}>
                                {d.hasSlots ? `${d.slotCount} slot${d.slotCount !== 1 ? "s" : ""} available` : "No slots"}
                              </p>
                            </div>
                          </div>
                          {d.hasSlots && (
                            <ChevronRight className={`h-5 w-5 ${formData.date === d.date ? "text-white" : "text-gray-400"}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Desktop: Calendar Dropdown */
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 text-left focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 touch-manipulation group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {formData.date ? (
                            <div>
                              <p className="text-lg font-semibold text-gray-900 mb-1">
                                {formatDateLocal(formData.date, {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-blue-600 font-medium">✓ Date selected</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-lg font-semibold text-gray-500 mb-1">Choose your date</p>
                              <p className="text-sm text-gray-600">Monday - Friday available</p>
                            </div>
                          )}
                        </div>
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                          <Calendar className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    </button>

                  {/* Calendar Dropdown */}
                  {showCalendar && (
                    <div className="absolute z-50 mt-3 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 backdrop-blur-sm">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-6">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="w-10 h-10 hover:bg-gray-100 rounded-xl transition-colors touch-manipulation flex items-center justify-center group"
                          aria-label="Previous month"
                        >
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <h3 className="text-lg font-bold text-gray-900">{formatMonthYear(currentMonth)}</h3>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="w-10 h-10 hover:bg-gray-100 rounded-xl transition-colors touch-manipulation flex items-center justify-center group"
                          aria-label="Next month"
                        >
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Week Days Header */}
                      <div className="grid grid-cols-7 gap-1 mb-3">
                        {weekDays.map((day) => (
                          <div
                            key={day}
                            className={`text-center text-sm font-semibold py-3 ${day === "Sun" || day === "Sat" ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2">
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
                                   aspect-square min-h-[48px] rounded-xl text-base font-semibold transition-all duration-200 touch-manipulation relative group overflow-hidden
                                   ${
                                     day === null
                                       ? "cursor-default bg-transparent"
                                       : available && hasSlots
                                         ? selected
                                           ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105 transform hover:scale-110"
                                           : "bg-white text-gray-900 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 border-2 border-blue-200 hover:border-blue-400 shadow-sm hover:shadow-md"
                                         : isWorking
                                           ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 opacity-60"
                                           : "bg-transparent text-gray-300 cursor-not-allowed"
                                   }
                                   ${isToday && !selected && available ? "ring-2 ring-blue-400 ring-opacity-50" : ""}
                                 `}
                              title={day !== null && hasSlots ? `${slotCount} slot${slotCount !== 1 ? "s" : ""} available` : undefined}
                            >
                              <span className="relative z-10">{day}</span>
                              {available && hasSlots && !selected && (
                                <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              )}
                              {selected && (
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Helper Text */}
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Available dates • Monday - Friday only</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hidden input for form validation */}
                  <input type="hidden" required value={formData.date} onChange={() => {}} />

                  {/* Click outside to close calendar */}
                  {showCalendar && <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />}
                </div>
                )}

                {/* Hidden input for mobile validation */}
                {isMobile && <input type="hidden" required value={formData.date} onChange={() => {}} />}
              </div>

              {/* Time Selection */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  Select Time
                </h3>

                {!formData.date ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold mb-1">Select a date first</p>
                    <p className="text-sm text-gray-600">Choose from available dates</p>
                  </div>
                ) : loadingAvailability ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-700">
                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-semibold">Checking availability...</p>
                  </div>
                ) : getTimeSlots().length === 0 ? (
                  <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 text-yellow-800 rounded-2xl">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <p className="font-semibold mb-1">No slots available</p>
                    <p className="text-sm">Please choose a different date</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: Horizontal scrollable chips */}
                    <div className="sm:hidden">
                      {formData.time && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-3 mb-4">
                          <p className="text-sm text-green-600 font-medium">✓ Time selected</p>
                          <p className="text-xl font-bold text-gray-900">{formData.time}</p>
                        </div>
                      )}
                      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
                        {getTimeSlots().map((time: string) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setFormData({ ...formData, time })}
                            className={`flex-shrink-0 py-3 px-5 rounded-full text-center font-semibold transition-all duration-200 touch-manipulation text-base snap-start ${
                              formData.time === time
                                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                                : "bg-white border-2 border-green-200 text-green-800 active:bg-green-50"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">← Scroll to see more times →</p>
                    </div>
                    {/* Desktop: Grid layout */}
                    <div className="hidden sm:grid grid-cols-2 gap-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {getTimeSlots().map((time: string) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData({ ...formData, time })}
                          className={`py-4 px-6 rounded-xl text-center font-semibold transition-all duration-200 touch-manipulation text-base min-h-[60px] flex items-center justify-center group relative overflow-hidden ${
                            formData.time === time
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105 hover:scale-110"
                              : "bg-white border-2 border-green-200 text-green-800 hover:border-green-400 hover:bg-green-50 shadow-sm hover:shadow-md"
                          }`}
                        >
                          <span className="relative z-10">{time}</span>
                          {formData.time === time && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}

              </div>

              {/* Contact Details */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  Your Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 text-gray-900 bg-white transition-all duration-200 touch-manipulation"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 text-gray-900 bg-white transition-all duration-200 touch-manipulation"
                      placeholder="(555) 123-4567"
                      inputMode="tel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email <span className="text-gray-500 font-normal text-sm">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 text-gray-900 bg-white transition-all duration-200 touch-manipulation"
                      placeholder="name@example.com"
                      inputMode="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Notes</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 text-base bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 resize-none text-gray-900 placeholder-gray-500 transition-all duration-200 touch-manipulation"
                      placeholder="Any special requests or information..."
                    />
                  </div>
                </div>
              </div>

              {/* Confirm Booking Button */}
              {formData.date && formData.time && (
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Booking Summary</h4>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><span className="font-medium">Date:</span> {formatDateLocal(formData.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                      <p><span className="font-medium">Time:</span> {formData.time}</p>
                      <p><span className="font-medium">Duration:</span> 30 minutes</p>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitting || linkAlreadyUsed}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[56px] flex items-center justify-center gap-3 group"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Confirming...
                      </>
                    ) : linkAlreadyUsed ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Already Booked
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        Confirm Booking
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

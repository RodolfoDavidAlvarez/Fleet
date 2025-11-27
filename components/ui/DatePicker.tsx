"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string; // YYYY-MM-DD format
  maxDate?: string; // YYYY-MM-DD format
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  className = "",
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Initialize with selected date or today
    if (value) {
      const date = new Date(value + "T00:00:00");
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Parse the value to get the selected date
  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  // Set current month to selected date or today (only when value changes externally)
  useEffect(() => {
    if (selectedDate && !isOpen) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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

  const isDateDisabled = (day: number | null) => {
    if (day === null) return true;
    const dateString = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const date = new Date(dateString + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return true; // Can't select past dates
    if (minDate && dateString < minDate) return true;
    if (maxDate && dateString > maxDate) return true;
    return false;
  };

  const isDateSelected = (day: number | null) => {
    if (day === null || !selectedDate) return false;
    const dateString = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dateString === value;
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    const today = new Date();
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const handleDateSelect = (day: number) => {
    if (isDateDisabled(day)) return;
    const dateString = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(dateString);
    setIsOpen(false);
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

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div ref={datePickerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2.5 text-left bg-white border-2 border-gray-300 rounded-lg
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          transition-all duration-200
          flex items-center justify-between
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-gray-400 cursor-pointer"}
          ${isOpen ? "border-primary-500 ring-2 ring-primary-200" : ""}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className={value ? "text-gray-900 font-medium truncate" : "text-gray-500 truncate"}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "transform rotate-90" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-20 mt-2 w-full bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4"
              style={{ minWidth: "320px" }}
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-base font-semibold text-gray-900">{formatMonthYear(currentMonth)}</h3>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
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
                  const disabled = isDateDisabled(day);
                  const selected = isDateSelected(day);
                  const today = isToday(day);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => day !== null && handleDateSelect(day)}
                      disabled={disabled}
                      className={`
                        aspect-square min-h-[40px] rounded-lg text-sm font-medium transition-all touch-manipulation
                        ${
                          day === null
                            ? "cursor-default bg-transparent"
                            : disabled
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent opacity-50"
                              : selected
                                ? "bg-primary-600 text-white shadow-md scale-105 border-2 border-primary-700"
                                : "bg-white text-gray-900 hover:bg-primary-50 hover:border-primary-300 border-2 border-gray-200 hover:shadow-sm"
                        }
                        ${today && !selected ? "ring-2 ring-primary-300" : ""}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Helper Text */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">Select a date</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


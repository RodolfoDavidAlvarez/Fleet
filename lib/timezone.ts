/**
 * Timezone utilities for Phoenix, Arizona (America/Phoenix)
 * Phoenix is in Mountain Standard Time (MST) and does not observe Daylight Saving Time
 */

const PHOENIX_TIMEZONE = "America/Phoenix";

/**
 * Convert a Phoenix local date/time string to UTC ISO string
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Time string in HH:MM format (24-hour)
 * @returns UTC ISO string
 */
export function phoenixToUTC(dateString: string, timeString: string): string {
  // Parse the date and time components
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);

  // Create a date object in UTC, then subtract 7 hours (Phoenix is UTC-7, no DST)
  // This gives us the Phoenix local time as if it were UTC
  const phoenixAsUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

  // Now add 7 hours to get the actual UTC time
  // Phoenix time = UTC - 7, so UTC = Phoenix time + 7
  const utcDate = new Date(phoenixAsUTC.getTime() + 7 * 60 * 60 * 1000);

  return utcDate.toISOString();
}

/**
 * Convert UTC ISO string to Phoenix local date/time
 * @param utcISOString - UTC ISO string
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM) in Phoenix timezone
 */
export function utcToPhoenix(utcISOString: string): { date: string; time: string } {
  const utcDate = new Date(utcISOString);

  // Phoenix is UTC-7 (MST, no DST)
  // Subtract 7 hours from UTC to get Phoenix time
  const phoenixTime = new Date(utcDate.getTime() - 7 * 60 * 60 * 1000);

  const year = phoenixTime.getUTCFullYear();
  const month = String(phoenixTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(phoenixTime.getUTCDate()).padStart(2, "0");
  const hours = String(phoenixTime.getUTCHours()).padStart(2, "0");
  const minutes = String(phoenixTime.getUTCMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

/**
 * Format a UTC ISO string to Phoenix local time string
 * @param utcISOString - UTC ISO string
 * @returns Formatted string in Phoenix timezone
 */
export function formatPhoenixTime(utcISOString: string): string {
  const { date, time } = utcToPhoenix(utcISOString);

  // Parse the date components
  const [year, month, day] = date.split("-").map(Number);
  const [hours24, minutes] = time.split(":").map(Number);

  // Convert to 12-hour format
  const hours12 = hours24 % 12 || 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";

  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}, ${hours12}:${String(minutes).padStart(2, "0")} ${ampm} MST`;
}

/**
 * Get current Phoenix time as date and time strings
 * @returns Object with current date (YYYY-MM-DD) and time (HH:MM) in Phoenix timezone
 */
export function getCurrentPhoenixTime(): { date: string; time: string } {
  const now = new Date();
  return utcToPhoenix(now.toISOString());
}

/**
 * Get minimum date/time for scheduling (current Phoenix time + 1 minute)
 * @returns Object with minimum date (YYYY-MM-DD) and time (HH:MM) in Phoenix timezone
 */
export function getMinScheduleTime(): { date: string; time: string } {
  const now = new Date();
  const oneMinuteLater = new Date(now.getTime() + 60 * 1000);
  return utcToPhoenix(oneMinuteLater.toISOString());
}

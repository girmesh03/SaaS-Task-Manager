/**
 * Date Utility Functions - Frontend Timezone Management
 *
 * CRITICAL: All dates stored in UTC on backend, converted to local timezone in UI
 *
 * Data Flow:
 * - Backend → Frontend: UTC ISO string → Local timezone display
 * - Frontend → Backend: Local timezone input → UTC ISO string
 *
 * Requirements: 19.1, 19.2, 19.3, 19.7
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs with required plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

/**
 * Get user's timezone
 *
 * Uses browser's Intl API to detect user's timezone.
 * Falls back to UTC if detection fails.
 *
 * @returns {string} User's timezone (e.g., "America/New_York", "Europe/London")
 *
 * @example
 * const timezone = getUserTimezone();
 * // Returns: "America/New_York" (if user is in New York)
 */
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error(
      "Failed to detect user timezone, falling back to UTC:",
      error
    );
    return "UTC";
  }
};

/**
 * Convert UTC date to user's local timezone
 *
 * Takes a UTC date (ISO string or Date object) and converts it to user's local timezone.
 * Returns dayjs object for further manipulation or formatting.
 *
 * @param {string|Date} utcDate - UTC date (ISO string or Date object)
 * @returns {dayjs.Dayjs} dayjs object in user's local timezone
 *
 * @example
 * // Backend returns: "2024-01-15T15:30:00.000Z" (UTC)
 * const localDate = convertUTCToLocal("2024-01-15T15:30:00.000Z");
 * // User in EST sees: "2024-01-15 10:30 AM EST"
 *
 * @example
 * // Format for display
 * const formatted = convertUTCToLocal(utcDate).format("MMM DD, YYYY HH:mm");
 * // Returns: "Jan 15, 2024 10:30"
 */
export const convertUTCToLocal = (utcDate) => {
  if (!utcDate) return null;

  try {
    return dayjs.utc(utcDate).tz(getUserTimezone());
  } catch (error) {
    console.error("Failed to convert UTC to local timezone:", error);
    return dayjs.utc(utcDate);
  }
};

/**
 * Convert local date to UTC ISO string
 *
 * Takes a local date (from date picker or user input) and converts it to UTC ISO string.
 * This is the format expected by the backend.
 *
 * @param {string|Date} localDate - Local date (ISO string or Date object)
 * @returns {string} UTC ISO string (e.g., "2024-01-15T15:30:00.000Z")
 *
 * @example
 * // User selects: "2024-01-15 10:30 AM EST" (local time)
 * const utcString = convertLocalToUTC("2024-01-15T10:30:00");
 * // Backend receives: "2024-01-15T15:30:00.000Z" (UTC)
 *
 * @example
 * // From date picker
 * const utcString = convertLocalToUTC(datePickerValue);
 * // Send to backend in request body
 */
export const convertLocalToUTC = (localDate) => {
  if (!localDate) return null;

  try {
    return dayjs.tz(localDate, getUserTimezone()).utc().toISOString();
  } catch (error) {
    console.error("Failed to convert local to UTC:", error);
    return dayjs(localDate).utc().toISOString();
  }
};

/**
 * Format date for display
 *
 * Formats a date (UTC or local) for user-friendly display.
 * Automatically converts UTC dates to local timezone.
 *
 * @param {string|Date} date - Date to format (UTC ISO string or Date object)
 * @param {string} format - dayjs format string (default: "MMM DD, YYYY HH:mm")
 * @returns {string} Formatted date string
 *
 * @example
 * // Default format
 * formatDateForDisplay("2024-01-15T15:30:00.000Z");
 * // Returns: "Jan 15, 2024 10:30" (in EST)
 *
 * @example
 * // Custom format
 * formatDateForDisplay("2024-01-15T15:30:00.000Z", "YYYY-MM-DD");
 * // Returns: "2024-01-15"
 *
 * @example
 * // Full date with day
 * formatDateForDisplay(date, "dddd, MMMM DD, YYYY [at] h:mm A");
 * // Returns: "Monday, January 15, 2024 at 10:30 AM"
 */
export const formatDateForDisplay = (date, format = "MMM DD, YYYY HH:mm") => {
  if (!date) return "";

  try {
    return convertUTCToLocal(date).format(format);
  } catch (error) {
    console.error("Failed to format date:", error);
    return "";
  }
};

/**
 * Format date as relative time
 *
 * Formats a date as relative time (e.g., "2 hours ago", "in 3 days").
 * Useful for recent activities, comments, notifications.
 *
 * @param {string|Date} date - Date to format (UTC ISO string or Date object)
 * @returns {string} Relative time string
 *
 * @example
 * // Recent date
 * formatRelativeTime("2024-01-15T13:30:00.000Z");
 * // Returns: "2 hours ago" (if current time is 15:30 UTC)
 *
 * @example
 * // Future date
 * formatRelativeTime("2024-01-17T15:30:00.000Z");
 * // Returns: "in 2 days"
 *
 * @example
 * // Very recent
 * formatRelativeTime(recentDate);
 * // Returns: "a few seconds ago"
 */
export const formatRelativeTime = (date) => {
  if (!date) return "";

  try {
    return convertUTCToLocal(date).fromNow();
  } catch (error) {
    console.error("Failed to format relative time:", error);
    return "";
  }
};

/**
 * Check if date is today
 *
 * Checks if a date is today in user's local timezone.
 *
 * @param {string|Date} date - Date to check (UTC ISO string or Date object)
 * @returns {boolean} True if date is today
 *
 * @example
 * isToday("2024-01-15T15:30:00.000Z");
 * // Returns: true (if today is Jan 15, 2024 in user's timezone)
 */
export const isToday = (date) => {
  if (!date) return false;

  try {
    const localDate = convertUTCToLocal(date);
    const today = dayjs().tz(getUserTimezone());
    return localDate.isSame(today, "day");
  } catch (error) {
    console.error("Failed to check if date is today:", error);
    return false;
  }
};

/**
 * Check if date is in the past
 *
 * Checks if a date is in the past relative to current time.
 *
 * @param {string|Date} date - Date to check (UTC ISO string or Date object)
 * @returns {boolean} True if date is in the past
 *
 * @example
 * isPast("2024-01-15T15:30:00.000Z");
 * // Returns: true (if current time is after Jan 15, 2024 15:30 UTC)
 */
export const isPast = (date) => {
  if (!date) return false;

  try {
    return dayjs.utc(date).isBefore(dayjs.utc());
  } catch (error) {
    console.error("Failed to check if date is past:", error);
    return false;
  }
};

/**
 * Check if date is in the future
 *
 * Checks if a date is in the future relative to current time.
 *
 * @param {string|Date} date - Date to check (UTC ISO string or Date object)
 * @returns {boolean} True if date is in the future
 *
 * @example
 * isFuture("2024-12-31T23:59:59.000Z");
 * // Returns: true (if current time is before Dec 31, 2024 23:59 UTC)
 */
export const isFuture = (date) => {
  if (!date) return false;

  try {
    return dayjs.utc(date).isAfter(dayjs.utc());
  } catch (error) {
    console.error("Failed to check if date is future:", error);
    return false;
  }
};

/**
 * Get days until date
 *
 * Calculates number of days until a future date.
 * Returns negative number if date is in the past.
 *
 * @param {string|Date} date - Target date (UTC ISO string or Date object)
 * @returns {number} Number of days until date (negative if past)
 *
 * @example
 * // Future date
 * getDaysUntil("2024-01-20T00:00:00.000Z");
 * // Returns: 5 (if today is Jan 15, 2024)
 *
 * @example
 * // Past date
 * getDaysUntil("2024-01-10T00:00:00.000Z");
 * // Returns: -5 (if today is Jan 15, 2024)
 */
export const getDaysUntil = (date) => {
  if (!date) return 0;

  try {
    const targetDate = dayjs.utc(date);
    const now = dayjs.utc();
    return targetDate.diff(now, "day");
  } catch (error) {
    console.error("Failed to calculate days until date:", error);
    return 0;
  }
};

/**
 * Format countdown for deadline
 *
 * Formats a deadline as countdown string with color indicator.
 * Returns object with text and color for UI display.
 *
 * @param {string|Date} deadline - Deadline date (UTC ISO string or Date object)
 * @returns {Object} Countdown object with text and color
 * @returns {string} return.text - Countdown text (e.g., "5 days left", "Overdue by 2 days")
 * @returns {string} return.color - Color indicator ("success", "warning", "error")
 *
 * @example
 * // Future deadline (5+ days)
 * formatDeadlineCountdown("2024-01-20T00:00:00.000Z");
 * // Returns: { text: "5 days left", color: "success" }
 *
 * @example
 * // Near deadline (1-3 days)
 * formatDeadlineCountdown("2024-01-17T00:00:00.000Z");
 * // Returns: { text: "2 days left", color: "warning" }
 *
 * @example
 * // Overdue
 * formatDeadlineCountdown("2024-01-10T00:00:00.000Z");
 * // Returns: { text: "Overdue by 5 days", color: "error" }
 */
export const formatDeadlineCountdown = (deadline) => {
  if (!deadline) return { text: "No deadline", color: "default" };

  try {
    const daysUntil = getDaysUntil(deadline);

    if (daysUntil < 0) {
      // Overdue
      return {
        text: `Overdue by ${Math.abs(daysUntil)} ${
          Math.abs(daysUntil) === 1 ? "day" : "days"
        }`,
        color: "error",
      };
    } else if (daysUntil === 0) {
      // Due today
      return {
        text: "Due today",
        color: "warning",
      };
    } else if (daysUntil <= 3) {
      // Due soon (1-3 days)
      return {
        text: `${daysUntil} ${daysUntil === 1 ? "day" : "days"} left`,
        color: "warning",
      };
    } else {
      // Due later (4+ days)
      return {
        text: `${daysUntil} days left`,
        color: "success",
      };
    }
  } catch (error) {
    console.error("Failed to format deadline countdown:", error);
    return { text: "Invalid date", color: "default" };
  }
};

/**
 * Get current date in UTC
 *
 * Returns current date/time as UTC ISO string.
 * Useful for creating timestamps to send to backend.
 *
 * @returns {string} Current UTC ISO string
 *
 * @example
 * const now = getCurrentUTC();
 * // Returns: "2024-01-15T15:30:00.000Z"
 */
export const getCurrentUTC = () => {
  return dayjs.utc().toISOString();
};

/**
 * Validate date string
 *
 * Checks if a date string is valid.
 *
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if date is valid
 *
 * @example
 * isValidDate("2024-01-15T15:30:00.000Z");
 * // Returns: true
 *
 * @example
 * isValidDate("invalid-date");
 * // Returns: false
 */
export const isValidDate = (date) => {
  if (!date) return false;
  return dayjs(date).isValid();
};

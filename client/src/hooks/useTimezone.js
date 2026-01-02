/**
 * useTimezone Hook - Timezone Management Hook
 *
 * Custom hook for timezone operations.
 * Provides timezone conversion and formatting functions.
 *
 * Returns:
 * - timezone: Current user's timezone
 * - setTimezone: Function to manually set timezone
 * - convertToLocal: Function to convert UTC to local timezone
 * - convertToUTC: Function to convert local to UTC
 * - formatDate: Function to format date for display
 *
 * Requirements: 19.1, 19.2, 19.3, 19.8
 */

import { useState, useEffect, useCallback } from "react";
import {
  getUserTimezone,
  convertUTCToLocal,
  convertLocalToUTC,
  formatDateForDisplay,
  formatRelativeTime,
  formatDeadlineCountdown,
  isToday,
  isPast,
  isFuture,
  getDaysUntil,
} from "../utils/dateUtils";

// LocalStorage key for timezone preference
const TIMEZONE_STORAGE_KEY = "user_timezone";

/**
 * useTimezone hook
 *
 * @returns {Object} Timezone state and functions
 * @returns {string} return.timezone - Current user's timezone
 * @returns {Function} return.setTimezone - Set timezone manually
 * @returns {Function} return.convertToLocal - Convert UTC to local timezone
 * @returns {Function} return.convertToUTC - Convert local to UTC
 * @returns {Function} return.formatDate - Format date for display
 * @returns {Function} return.formatRelative - Format date as relative time
 * @returns {Function} return.formatDeadline - Format deadline with countdown
 * @returns {Function} return.isToday - Check if date is today
 * @returns {Function} return.isPast - Check if date is in the past
 * @returns {Function} return.isFuture - Check if date is in the future
 * @returns {Function} return.getDaysUntil - Get days until date
 *
 * @example
 * const { timezone, convertToLocal, formatDate } = useTimezone();
 *
 * // Display current timezone
 * console.log("User timezone:", timezone);
 *
 * // Convert UTC date to local for display
 * const localDate = convertToLocal("2024-01-15T15:30:00.000Z");
 * console.log("Local date:", formatDate(localDate));
 *
 * @example
 * // Format date for display
 * const { formatDate, formatRelative } = useTimezone();
 *
 * // Full date format
 * const fullDate = formatDate(utcDate, "MMM DD, YYYY HH:mm");
 * // Returns: "Jan 15, 2024 10:30"
 *
 * // Relative time
 * const relativeTime = formatRelative(utcDate);
 * // Returns: "2 hours ago"
 *
 * @example
 * // Deadline countdown
 * const { formatDeadline } = useTimezone();
 * const deadline = formatDeadline(task.dueDate);
 * // Returns: { text: "5 days left", color: "success" }
 *
 * @example
 * // Manual timezone selection
 * const { timezone, setTimezone } = useTimezone();
 *
 * const handleTimezoneChange = (newTimezone) => {
 *   setTimezone(newTimezone);
 * };
 */
const useTimezone = () => {
  // Initialize timezone from localStorage or browser detection
  const [timezone, setTimezoneState] = useState(() => {
    try {
      const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
      return stored || getUserTimezone();
    } catch (error) {
      console.error("Failed to load timezone from localStorage:", error);
      return getUserTimezone();
    }
  });

  /**
   * Set timezone and persist to localStorage
   *
   * @param {string} newTimezone - New timezone (e.g., "America/New_York")
   */
  const setTimezone = useCallback((newTimezone) => {
    try {
      setTimezoneState(newTimezone);
      localStorage.setItem(TIMEZONE_STORAGE_KEY, newTimezone);
    } catch (error) {
      console.error("Failed to save timezone to localStorage:", error);
    }
  }, []);

  /**
   * Update timezone if browser timezone changes
   * This effect only runs once on mount to sync with localStorage
   */
  useEffect(() => {
    // Check if timezone needs to be persisted to localStorage
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (!stored) {
      try {
        localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
      } catch (error) {
        console.error("Failed to save timezone to localStorage:", error);
      }
    }
  }, [timezone]);

  /**
   * Convert UTC date to local timezone
   *
   * @param {string|Date} utcDate - UTC date (ISO string or Date object)
   * @returns {dayjs.Dayjs} dayjs object in local timezone
   */
  const convertToLocal = useCallback((utcDate) => {
    return convertUTCToLocal(utcDate);
  }, []);

  /**
   * Convert local date to UTC ISO string
   *
   * @param {string|Date} localDate - Local date (ISO string or Date object)
   * @returns {string} UTC ISO string
   */
  const convertToUTC = useCallback((localDate) => {
    return convertLocalToUTC(localDate);
  }, []);

  /**
   * Format date for display
   *
   * @param {string|Date} date - Date to format (UTC ISO string or Date object)
   * @param {string} format - dayjs format string (default: "MMM DD, YYYY HH:mm")
   * @returns {string} Formatted date string
   */
  const formatDate = useCallback((date, format = "MMM DD, YYYY HH:mm") => {
    return formatDateForDisplay(date, format);
  }, []);

  /**
   * Format date as relative time
   *
   * @param {string|Date} date - Date to format (UTC ISO string or Date object)
   * @returns {string} Relative time string (e.g., "2 hours ago")
   */
  const formatRelative = useCallback((date) => {
    return formatRelativeTime(date);
  }, []);

  /**
   * Format deadline with countdown
   *
   * @param {string|Date} deadline - Deadline date (UTC ISO string or Date object)
   * @returns {Object} Countdown object with text and color
   * @returns {string} return.text - Countdown text
   * @returns {string} return.color - Color indicator
   */
  const formatDeadline = useCallback((deadline) => {
    return formatDeadlineCountdown(deadline);
  }, []);

  /**
   * Check if date is today
   *
   * @param {string|Date} date - Date to check (UTC ISO string or Date object)
   * @returns {boolean} True if date is today
   */
  const checkIsToday = useCallback((date) => {
    return isToday(date);
  }, []);

  /**
   * Check if date is in the past
   *
   * @param {string|Date} date - Date to check (UTC ISO string or Date object)
   * @returns {boolean} True if date is in the past
   */
  const checkIsPast = useCallback((date) => {
    return isPast(date);
  }, []);

  /**
   * Check if date is in the future
   *
   * @param {string|Date} date - Date to check (UTC ISO string or Date object)
   * @returns {boolean} True if date is in the future
   */
  const checkIsFuture = useCallback((date) => {
    return isFuture(date);
  }, []);

  /**
   * Get days until date
   *
   * @param {string|Date} date - Target date (UTC ISO string or Date object)
   * @returns {number} Number of days until date (negative if past)
   */
  const getDaysUntilDate = useCallback((date) => {
    return getDaysUntil(date);
  }, []);

  return {
    timezone,
    setTimezone,
    convertToLocal,
    convertToUTC,
    formatDate,
    formatRelative,
    formatDeadline,
    isToday: checkIsToday,
    isPast: checkIsPast,
    isFuture: checkIsFuture,
    getDaysUntil: getDaysUntilDate,
  };
};

export default useTimezone;

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Timezone Management Utilities
 *
 * CRITICAL: All dates stored in UTC, converted at application boundaries
 * Zero Timezone Offset principle
 */

/**
 * Convert any date to UTC Date object
 * @param {Date|string|number} date - Date to convert
 * @returns {Date} UTC Date object
 */
export const toUTC = (date) => {
  if (!date) return null;
  return dayjs(date).utc().toDate();
};

/**
 * Convert date to ISO 8601 string in UTC
 * @param {Date|string|number} date - Date to convert
 * @returns {string} ISO 8601 string in UTC
 */
export const toISOString = (date) => {
  if (!date) return null;
  return dayjs(date).utc().toISOString();
};

/**
 * Format date for API responses (ISO string)
 * @param {Date|string|number} date - Date to format
 * @returns {string} ISO 8601 string in UTC
 */
export const formatDate = (date) => {
  return toISOString(date);
};

/**
 * Validate if value is a valid date
 * @param {any} date - Value to validate
 * @returns {boolean} True if valid date
 */
export const isValidDate = (date) => {
  return dayjs(date).isValid();
};

/**
 * Check if date is in the future
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is in future
 */
export const isFutureDate = (date) => {
  return dayjs(date).isAfter(dayjs());
};

/**
 * Check if date is in the past
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is in past
 */
export const isPastDate = (date) => {
  return dayjs(date).isBefore(dayjs());
};

/**
 * Check if date1 is after date2 (UTC comparison)
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @returns {boolean} True if date1 is after date2
 */
export const isAfter = (date1, date2) => {
  return dayjs(date1).utc().isAfter(dayjs(date2).utc());
};

/**
 * Check if date1 is before date2 (UTC comparison)
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @returns {boolean} True if date1 is before date2
 */
export const isBefore = (date1, date2) => {
  return dayjs(date1).utc().isBefore(dayjs(date2).utc());
};

/**
 * Get current date in UTC
 * @returns {Date} Current UTC Date object
 */
export const getCurrentUTC = () => {
  return dayjs().utc().toDate();
};

/**
 * Add time to date
 * @param {Date|string|number} date - Base date
 * @param {number} amount - Amount to add
 * @param {string} unit - Unit (day, hour, minute, etc.)
 * @returns {Date} New UTC Date object
 */
export const addTime = (date, amount, unit) => {
  return dayjs(date).utc().add(amount, unit).toDate();
};

/**
 * Subtract time from date
 * @param {Date|string|number} date - Base date
 * @param {number} amount - Amount to subtract
 * @param {string} unit - Unit (day, hour, minute, etc.)
 * @returns {Date} New UTC Date object
 */
export const subtractTime = (date, amount, unit) => {
  return dayjs(date).utc().subtract(amount, unit).toDate();
};

/**
 * Get difference between two dates
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @param {string} unit - Unit (day, hour, minute, etc.)
 * @returns {number} Difference in specified unit
 */
export const getDifference = (date1, date2, unit = "day") => {
  return dayjs(date1).utc().diff(dayjs(date2).utc(), unit);
};

/**
 * Check if two dates are the same day (UTC)
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  return dayjs(date1).utc().isSame(dayjs(date2).utc(), "day");
};

/**
 * Get start of day in UTC
 * @param {Date|string|number} date - Date
 * @returns {Date} Start of day in UTC
 */
export const startOfDay = (date) => {
  return dayjs(date).utc().startOf("day").toDate();
};

/**
 * Get end of day in UTC
 * @param {Date|string|number} date - Date
 * @returns {Date} End of day in UTC
 */
export const endOfDay = (date) => {
  return dayjs(date).utc().endOf("day").toDate();
};

/**
 * Parse date string to UTC Date object
 * @param {string} dateString - Date string
 * @param {string} format - Date format (optional)
 * @returns {Date} UTC Date object
 */
export const parseDate = (dateString, format) => {
  if (format) {
    return dayjs(dateString, format).utc().toDate();
  }
  return dayjs(dateString).utc().toDate();
};

/**
 * Format date with custom format (UTC)
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string (e.g., 'YYYY-MM-DD')
 * @returns {string} Formatted date string
 */
export const formatWithPattern = (date, format) => {
  return dayjs(date).utc().format(format);
};

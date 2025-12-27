import {
  toUTC,
  toISOString,
  formatDate,
  isValidDate,
  isFutureDate,
  isPastDate,
  isAfter,
  isBefore,
  getCurrentUTC,
  addTime,
  subtractTime,
  getDifference,
  isSameDay,
  startOfDay,
  endOfDay,
  parseDate,
  formatWithPattern,
} from "../../../utils/dateUtils.js";

describe("dateUtils - Timezone Management Utilities", () => {
  const testDate = new Date("2024-01-15T10:30:00.000Z"); // Fixed UTC date for testing
  const testDateString = "2024-01-15T10:30:00.000Z";

  describe("toUTC()", () => {
    test("should convert date to UTC Date object", () => {
      const result = toUTC(testDate);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(testDateString);
    });

    test("should convert string date to UTC Date object", () => {
      const result = toUTC("2024-01-15T10:30:00.000Z");
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(testDateString);
    });

    test("should return null for null input", () => {
      expect(toUTC(null)).toBeNull();
    });

    test("should return null for undefined input", () => {
      expect(toUTC(undefined)).toBeNull();
    });

    test("ZERO OFFSET: should not shift time value when converting to UTC", () => {
      // This is the critical zero-offset test
      const localTime = new Date("2024-01-15T10:30:00");
      const utcTime = toUTC(localTime);

      // The UTC representation should maintain the same instant in time
      // (not shift the clock value)
      expect(utcTime.getTime()).toBe(localTime.getTime());
    });
  });

  describe("toISOString()", () => {
    test("should convert date to ISO 8601 string in UTC", () => {
      const result = toISOString(testDate);
      expect(result).toBe(testDateString);
    });

    test("should return null for null input", () => {
      expect(toISOString(null)).toBeNull();
    });

    test("ZERO OFFSET: ISO string should represent exact same moment", () => {
      const date = new Date("2024-06-15T14:30:00.000Z");
      const isoString = toISOString(date);

      // Parse it back and verify same timestamp
      const parsedBack = new Date(isoString);
      expect(parsedBack.getTime()).toBe(date.getTime());
    });
  });

  describe("formatDate()", () => {
    test("should format date as ISO string", () => {
      const result = formatDate(testDate);
      expect(result).toBe(testDateString);
    });
  });

  describe("isValidDate()", () => {
    test("should return true for valid date", () => {
      expect(isValidDate(testDate)).toBe(true);
      expect(isValidDate("2024-01-15")).toBe(true);
    });

    test("should return false for invalid date", () => {
      expect(isValidDate("not-a-date")).toBe(false);
      expect(isValidDate("")).toBe(false);
    });
  });

  describe("isFutureDate()", () => {
    test("should return true for future dates", () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      expect(isFutureDate(futureDate)).toBe(true);
    });

    test("should return false for past dates", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      expect(isFutureDate(pastDate)).toBe(false);
    });
  });

  describe("isPastDate()", () => {
    test("should return true for past dates", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(isPastDate(pastDate)).toBe(true);
    });

    test("should return false for future dates", () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(isPastDate(futureDate)).toBe(false);
    });
  });

  describe("isAfter()", () => {
    test("should return true if date1 is after date2", () => {
      const date1 = new Date("2024-01-16");
      const date2 = new Date("2024-01-15");
      expect(isAfter(date1, date2)).toBe(true);
    });

    test("should return false if date1 is before date2", () => {
      const date1 = new Date("2024-01-14");
      const date2 = new Date("2024-01-15");
      expect(isAfter(date1, date2)).toBe(false);
    });

    test("ZERO OFFSET: UTC comparison should be accurate regardless of input timezone", () => {
      // Both represent same instant, one in local time, one in UTC
      const date1 = new Date("2024-01-15T15:00:00Z");
      const date2 = new Date("2024-01-15T14:00:00Z");

      expect(isAfter(date1, date2)).toBe(true);
      expect(isAfter(date2, date1)).toBe(false);
    });
  });

  describe("isBefore()", () => {
    test("should return true if date1 is before date2", () => {
      const date1 = new Date("2024-01-14");
      const date2 = new Date("2024-01-15");
      expect(isBefore(date1, date2)).toBe(true);
    });

    test("should return false if date1 is after date2", () => {
      const date1 = new Date("2024-01-16");
      const date2 = new Date("2024-01-15");
      expect(isBefore(date1, date2)).toBe(false);
    });
  });

  describe("getCurrentUTC()", () => {
    test("should return current date as UTC Date object", () => {
      const before = Date.now();
      const result = getCurrentUTC();
      const after = Date.now();

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });

    test("ZERO OFFSET: current UTC should match system time", () => {
      const systemNow = new Date();
      const utcNow = getCurrentUTC();

      // Should be within 100ms of each other (same instant)
      const diff = Math.abs(utcNow.getTime() - systemNow.getTime());
      expect(diff).toBeLessThan(100);
    });
  });

  describe("addTime()", () => {
    test("should add days to date", () => {
      const result = addTime(testDate, 5, "day");
      const expected = new Date("2024-01-20T10:30:00.000Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("should add hours to date", () => {
      const result = addTime(testDate, 3, "hour");
      const expected = new Date("2024-01-15T13:30:00.000Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("should add minutes to date", () => {
      const result = addTime(testDate, 15, "minute");
      const expected = new Date("2024-01-15T10:45:00.000Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });
  });

  describe("subtractTime()", () => {
    test("should subtract days from date", () => {
      const result = subtractTime(testDate, 5, "day");
      const expected = new Date("2024-01-10T10:30:00.000Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });

    test("should subtract hours from date", () => {
      const result = subtractTime(testDate, 3, "hour");
      const expected = new Date("2024-01-15T07:30:00.000Z");
      expect(result.toISOString()).toBe(expected.toISOString());
    });
  });

  describe("getDifference()", () => {
    test("should calculate difference in days", () => {
      const date1 = new Date("2024-01-20");
      const date2 = new Date("2024-01-15");
      expect(getDifference(date1, date2, "day")).toBe(5);
    });

    test("should calculate difference in hours", () => {
      const date1 = new Date("2024-01-15T18:00:00Z");
      const date2 = new Date("2024-01-15T12:00:00Z");
      expect(getDifference(date1, date2, "hour")).toBe(6);
    });

    test("should default to days if no unit specified", () => {
      const date1 = new Date("2024-01-20");
      const date2 = new Date("2024-01-15");
      expect(getDifference(date1, date2)).toBe(5);
    });
  });

  describe("isSameDay()", () => {
    test("should return true for same day in UTC", () => {
      const date1 = new Date("2024-01-15T10:00:00Z");
      const date2 = new Date("2024-01-15T22:00:00Z");
      expect(isSameDay(date1, date2)).toBe(true);
    });

    test("should return false for different days", () => {
      const date1 = new Date("2024-01-15T23:00:00Z");
      const date2 = new Date("2024-01-16T01:00:00Z");
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe("startOfDay()", () => {
    test("should return start of day in UTC", () => {
      const result = startOfDay(testDate);
      expect(result.toISOString()).toBe("2024-01-15T00:00:00.000Z");
    });
  });

  describe("endOfDay()", () => {
    test("should return end of day in UTC", () => {
      const result = endOfDay(testDate);
      expect(result.toISOString()).toBe("2024-01-15T23:59:59.999Z");
    });
  });

  describe("parseDate()", () => {
    test("should parse date string to UTC Date object", () => {
      const result = parseDate("2024-01-15");
      expect(result).toBeInstanceOf(Date);
    });

    test("should parse date string with custom format", () => {
      const result = parseDate("15-01-2024", "DD-MM-YYYY");
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("formatWithPattern()", () => {
    test("should format date with custom pattern", () => {
      const result = formatWithPattern(testDate, "YYYY-MM-DD");
      expect(result).toBe("2024-01-15");
    });

    test("should format date with time pattern", () => {
      const result = formatWithPattern(testDate, "YYYY-MM-DD HH:mm:ss");
      expect(result).toBe("2024-01-15 10:30:00");
    });
  });

  describe("Zero Offset Round-Trip Tests", () => {
    test("CRITICAL: round-trip conversion should maintain same instant", () => {
      const original = new Date("2024-06-15T14:30:45.123Z");
      const utcConverted = toUTC(original);
      const isoString = toISOString(utcConverted);
      const parsedBack = new Date(isoString);

      // All should represent the exact same instant in time
      expect(utcConverted.getTime()).toBe(original.getTime());
      expect(parsedBack.getTime()).toBe(original.getTime());
    });

    test("CRITICAL: UTC storage maintains zero offset principle", () => {
      // Create a date representing "Jan 15, 2024 at 2:30 PM"
      const localDate = new Date(2024, 0, 15, 14, 30, 0, 0);

      // Convert to UTC (should not shift the time value)
      const utcDate = toUTC(localDate);

      // The timestamp should be identical (same instant in time)
      expect(utcDate.getTime()).toBe(localDate.getTime());
    });

    test("CRITICAL: all date utilities preserve timestamp integrity", () => {
      const originalTimestamp = testDate.getTime();

      // Run through various utilities
      const utcConverted = toUTC(testDate);
      const withAdded = addTime(utcConverted, 0, "day"); // Add 0 days
      const withSubtracted = subtractTime(withAdded, 0, "day"); // Subtract 0 days

      // Final timestamp should match original
      expect(withSubtracted.getTime()).toBe(originalTimestamp);
    });
  });
});

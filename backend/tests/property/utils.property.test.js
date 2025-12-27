import fc from "fast-check";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { toUTC, toISOString, isAfter, isBefore } from "../../utils/dateUtils.js";
import { sanitizeObject, generateRandomString } from "../../utils/helpers.js";

dayjs.extend(utc);

describe("Utility Property-Based Tests", () => {
  describe("Property 6: Date utilities maintain UTC consistency", () => {
    test("toUTC and toISOString should always produce UTC dates/strings", () => {
      fc.assert(
        fc.property(fc.date(), (date) => {
          const utcDate = toUTC(date);
          const isoString = toISOString(date);

          // Verify it's a valid date
          expect(dayjs(utcDate).isValid()).toBe(true);
          expect(dayjs(isoString).isValid()).toBe(true);

          // Verify it matches the original timestamp
          expect(utcDate.getTime()).toBe(date.getTime());

          // Verify ISO string ends with Z (simplistic UTC check)
          expect(isoString).toMatch(/Z$/);

          // Verify they represent the same moment
          expect(new Date(isoString).getTime()).toBe(date.getTime());
        }),
        { numRuns: 100 }
      );
    });

    test("isAfter and isBefore should be consistent with built-in comparison", () => {
      fc.assert(
        fc.property(fc.date(), fc.date(), (d1, d2) => {
            const after = isAfter(d1, d2);
            const before = isBefore(d1, d2);

            expect(after).toBe(d1.getTime() > d2.getTime());
            expect(before).toBe(d1.getTime() < d2.getTime());
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 7: Helpers sanitizeObject consistency", () => {
    test("sanitizeObject should remove all null and undefined values", () => {
      fc.assert(
        fc.property(fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined))), (obj) => {
          const sanitized = sanitizeObject(obj);

          Object.values(sanitized).forEach(val => {
            expect(val).not.toBeNull();
            expect(val).not.toBeUndefined();
          });

          // Original keys that had non-null/non-undefined values should remain
          Object.entries(obj).forEach(([key, val]) => {
            if (val !== null && val !== undefined) {
              expect(sanitized[key]).toBe(val);
            }
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 8: generateRandomString properties", () => {
    test("should always produce string of requested length", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (len) => {
          const str = generateRandomString(len);
          expect(str).toHaveLength(len);
          expect(typeof str).toBe("string");
        }),
        { numRuns: 100 }
      );
    });
  });
});

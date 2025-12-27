import mongoose from "mongoose";
import { jest } from "@jest/globals";
import {
  dateTransform,
  convertDatesToUTC,
  sanitizeObject,
  generateRandomString,
  normalizeToArray,
  isValidObjectId,
  buildPaginationMeta,
  buildOrgScopeFilter,
  isOwner,
  asyncHandler,
} from "../../../utils/helpers.js";

describe("helpers - Utility Helper Functions", () => {
  describe("dateTransform", () => {
    test("should convert Date objects to ISO strings", () => {
      const doc = {};
      const ret = {
        name: "test",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
        otherInfo: "data",
      };

      const result = dateTransform(doc, ret);

      expect(typeof result.createdAt).toBe("string");
      expect(result.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(typeof result.updatedAt).toBe("string");
      expect(result.updatedAt).toBe("2024-01-02T00:00:00.000Z");
    });

    test("should remove __v field", () => {
      const ret = { name: "test", __v: 0 };
      const result = dateTransform({}, ret);
      expect(result.__v).toBeUndefined();
    });
  });

  describe("convertDatesToUTC", () => {
    test("should convert specified date fields to UTC dates", () => {
      const doc = {
        date1: "2024-01-01",
        date2: new Date("2024-01-02"),
        other: "value"
      };

      convertDatesToUTC(doc, ["date1", "date2"]);

      expect(doc.date1).toBeInstanceOf(Date);
      expect(doc.date2).toBeInstanceOf(Date);
      // toISOString check to allow flexibility in object type
      expect(doc.date1.toISOString()).toContain("2024-01-01");
    });

    test("should ignore missing fields", () => {
      const doc = { date1: "2024-01-01" };
      convertDatesToUTC(doc, ["date1", "missingField"]);
      expect(doc.missingField).toBeUndefined();
    });
  });

  describe("sanitizeObject", () => {
    test("should remove undefined and null values", () => {
      const obj = {
        a: 1,
        b: undefined,
        c: null,
        d: "value",
        e: 0,
        f: false
      };

      const result = sanitizeObject(obj);

      expect(result).toHaveProperty("a", 1);
      expect(result).not.toHaveProperty("b");
      expect(result).not.toHaveProperty("c");
      expect(result).toHaveProperty("d", "value");
      expect(result).toHaveProperty("e", 0);
      expect(result).toHaveProperty("f", false);
    });
  });

  describe("generateRandomString", () => {
    test("should generate string of default length (32)", () => {
      const str = generateRandomString();
      expect(str).toHaveLength(32);
    });

    test("should generate string of specified length", () => {
      const str = generateRandomString(10);
      expect(str).toHaveLength(10);
    });
  });

  describe("normalizeToArray", () => {
    test("should return empty array for null/undefined", () => {
      expect(normalizeToArray(null)).toEqual([]);
      expect(normalizeToArray(undefined)).toEqual([]);
    });

    test("should wrap single value in array", () => {
      expect(normalizeToArray(1)).toEqual([1]);
      expect(normalizeToArray("string")).toEqual(["string"]);
    });

    test("should return array if input is already array", () => {
      expect(normalizeToArray([1, 2])).toEqual([1, 2]);
    });
  });

  describe("isValidObjectId", () => {
    test("should return true for valid ObjectId string", () => {
      const id = new mongoose.Types.ObjectId().toString();
      expect(isValidObjectId(id)).toBe(true);
    });

    test("should return false for invalid string", () => {
      expect(isValidObjectId("invalid-id")).toBe(false);
      expect(isValidObjectId("123")).toBe(false);
    });
  });

  describe("buildPaginationMeta", () => {
    test("should calculate totalPages correctly", () => {
      const meta = buildPaginationMeta(1, 10, 25);
      expect(meta.totalPages).toBe(3);
      expect(meta.totalCount).toBe(25);
    });

    test("should set hasNextPage and hasPrevPage correctly", () => {
      let meta = buildPaginationMeta(1, 10, 25);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(false);

      meta = buildPaginationMeta(2, 10, 25);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.hasPrevPage).toBe(true);

      meta = buildPaginationMeta(3, 10, 25);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPrevPage).toBe(true);
    });
  });

  describe("buildOrgScopeFilter", () => {
    const user = {
      _id: new mongoose.Types.ObjectId(),
      organization: { _id: new mongoose.Types.ObjectId() },
      department: { _id: new mongoose.Types.ObjectId() }
    };

    test("crossOrg scope should return only isDeleted: false", () => {
      const filter = buildOrgScopeFilter(user, "crossOrg");
      expect(filter).toEqual({ isDeleted: false });
    });

    test("crossDept scope should filter by organization", () => {
      const filter = buildOrgScopeFilter(user, "crossDept");
      expect(filter.organization).toEqual(user.organization._id);
      expect(filter.department).toBeUndefined();
    });

    test("ownDept scope should filter by org and department", () => {
      const filter = buildOrgScopeFilter(user, "ownDept");
      expect(filter.organization).toEqual(user.organization._id);
      expect(filter.department).toEqual(user.department._id);
    });

    test("own scope should filter by org, dept and createdBy", () => {
      const filter = buildOrgScopeFilter(user, "own");
      expect(filter.organization).toEqual(user.organization._id);
      expect(filter.department).toEqual(user.department._id);
      expect(filter.createdBy).toEqual(user._id);
    });
  });

  describe("isOwner", () => {
    const userId = new mongoose.Types.ObjectId();
    const otherId = new mongoose.Types.ObjectId();
    const user = { _id: userId };

    test("should return true if createdBy matches", () => {
      const resource = { createdBy: userId };
      expect(isOwner(resource, user)).toBe(true);
    });

    test("should return true if addedBy matches", () => {
      const resource = { addedBy: userId };
      expect(isOwner(resource, user)).toBe(true);
    });

    test("should return true if uploadedBy matches", () => {
            const resource = { uploadedBy: userId };
            expect(isOwner(resource, user)).toBe(true);
    });

    test("should return true if recipient matches", () => {
            const resource = { recipient: userId };
            expect(isOwner(resource, user)).toBe(true);
    });

    test("should return true if in assignees array", () => {
      const resource = { assignees: [otherId, userId] };
      expect(isOwner(resource, user)).toBe(true);
    });

    test("should return true if in watchers array", () => {
      const resource = { watchers: [userId] };
      expect(isOwner(resource, user)).toBe(true);
    });

     test("should return true if in mentions array", () => {
          const resource = { mentions: [userId] };
          expect(isOwner(resource, user)).toBe(true);
        });

    test("should return false if no match", () => {
      const resource = { createdBy: otherId, assignees: [otherId] };
      expect(isOwner(resource, user)).toBe(false);
    });
  });

  describe("asyncHandler", () => {
    test("should call the wrapped function", async () => {
      const fn = jest.fn().mockResolvedValue("success");
      const wrapped = asyncHandler(fn);
      const req = {}, res = {}, next = jest.fn();

      await wrapped(req, res, next);
      expect(fn).toHaveBeenCalledWith(req, res, next);
    });

    test("should catch errors and pass to next", async () => {
      const error = new Error("Test error");
      const fn = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(fn);
      const req = {}, res = {}, next = jest.fn();

      await wrapped(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

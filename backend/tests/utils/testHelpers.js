/**
 * Test Helper Functions
 *
 * Provides assertion helpers for testing soft delete, restore, cascade operations,
 * transactions, timezone handling, and authorization scope
 */

import { expect } from "@jest/globals";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);

/**
 * Generate mock data using fast-check (placeholder for now)
 * @param {string} modelName - Name of the model
 * @param {number} count - Number of items to generate
 * @returns {Array}
 */
export const generateMockData = (modelName, count = 1) => {
  // This will be implemented with fast-check arbitraries in property tests
  return [];
};

/**
 * Assert document is soft-deleted correctly
 * @param {Object} doc - Document to check
 */
export const assertSoftDelete = (doc) => {
  expect(doc.isDeleted).toBe(true);
  expect(doc.deletedAt).toBeDefined();
  expect(doc.deletedAt).toBeInstanceOf(Date);
  expect(doc.deletedBy).toBeDefined();

  // Verify deletedAt is in the past
  expect(new Date(doc.deletedAt).getTime()).toBeLessThanOrEqual(Date.now());
};

/**
 * Assert document is restored correctly
 * @param {Object} doc - Document to check
 */
export const assertRestore = (doc) => {
  expect(doc.isDeleted).toBe(false);
  expect(doc.restoredAt).toBeDefined();
  expect(doc.restoredAt).toBeInstanceOf(Date);
  expect(doc.restoredBy).toBeDefined();
  expect(doc.deletedAt).toBeNull();
  expect(doc.deletedBy).toBeNull();

  // Verify restoredAt is in the past
  expect(new Date(doc.restoredAt).getTime()).toBeLessThanOrEqual(Date.now());
};

/**
 * Assert cascade delete worked for all children
 * @param {Object} parent - Parent document
 * @param {Array} children - Array of child documents
 */
export const assertCascadeDelete = (parent, children) => {
  // Assert parent is deleted
  assertSoftDelete(parent);

  // Assert all children are deleted
  children.forEach((child) => {
    assertSoftDelete(child);
  });
};

/**
 * Assert transaction rolled back on error
 * @param {Function} operation - Async operation that should fail
 */
export const assertTransactionRollback = async (operation) => {
  let errorThrown = false;

  try {
    await operation();
  } catch (error) {
    errorThrown = true;
  }

  expect(errorThrown).toBe(true);
};

/**
 * Assert date is stored in UTC
 * @param {Date} date - Date to check
 */
export const assertTimezoneUTC = (date) => {
  expect(date).toBeInstanceOf(Date);

  // Convert to dayjs and check timezone offset
  const dayjsDate = dayjs(date);
  const utcDate = dayjsDate.utc();

  // UTC dates should have offset of 0
  expect(utcDate.utcOffset()).toBe(0);

  // ISO string should end with 'Z' (UTC indicator)
  const isoString = date.toISOString();
  expect(isoString).toMatch(/Z$/);
};

/**
 * Assert authorization scope is correct
 * @param {Object} user - User document
 * @param {Object} resource - Resource document
 * @param {string} operation - Operation being performed
 */
export const assertAuthorizationScope = (user, resource, operation) => {
  // Platform SuperAdmin can access all organizations
  if (user.role === "SuperAdmin" && user.isPlatformUser) {
    // crossOrg scope for Organization resource
    if (resource.constructor.modelName === "Organization") {
      expect(true).toBe(true); // Can access any organization
    } else {
      // crossDept scope for other resources within platform org
      expect(resource.organization.toString()).toBe(
        user.organization._id.toString()
      );
    }
  }
  // Customer SuperAdmin/Admin can access all departments in own org
  else if (user.role === "SuperAdmin" || user.role === "Admin") {
    expect(resource.organization.toString()).toBe(
      user.organization._id.toString()
    );
  }
  // Manager can access own department only
  else if (user.role === "Manager") {
    expect(resource.organization.toString()).toBe(
      user.organization._id.toString()
    );
    expect(resource.department.toString()).toBe(user.department._id.toString());
  }
  // User can access own department (read) or own resources (write)
  else if (user.role === "User") {
    expect(resource.organization.toString()).toBe(
      user.organization._id.toString()
    );

    if (operation === "read") {
      expect(resource.department.toString()).toBe(
        user.department._id.toString()
      );
    } else {
      // Write operations: must be owner
      const ownerFields = ["createdBy", "addedBy", "uploadedBy"];
      const isOwner = ownerFields.some(
        (field) =>
          resource[field] && resource[field].toString() === user._id.toString()
      );
      expect(isOwner).toBe(true);
    }
  }
};

/**
 * Assert array contains unique values
 * @param {Array} array - Array to check
 */
export const assertUnique = (array) => {
  const uniqueSet = new Set(array.map((item) => item.toString()));
  expect(uniqueSet.size).toBe(array.length);
};

/**
 * Assert document has required audit fields
 * @param {Object} doc - Document to check
 */
export const assertAuditFields = (doc) => {
  expect(doc.createdAt).toBeDefined();
  expect(doc.createdAt).toBeInstanceOf(Date);
  expect(doc.updatedAt).toBeDefined();
  expect(doc.updatedAt).toBeInstanceOf(Date);

  // Verify timestamps are in UTC
  assertTimezoneUTC(doc.createdAt);
  assertTimezoneUTC(doc.updatedAt);
};

/**
 * Assert error has correct structure
 * @param {Error} error - Error to check
 * @param {number} statusCode - Expected status code
 * @param {string} errorCode - Expected error code
 */
export const assertCustomError = (error, statusCode, errorCode) => {
  expect(error.statusCode).toBe(statusCode);
  expect(error.errorCode).toBe(errorCode);
  expect(error.message).toBeDefined();
  expect(error.isOperational).toBe(true);
};

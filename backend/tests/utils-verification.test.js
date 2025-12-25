/**
 * Test Utilities Verification
 *
 * Verifies that all test utilities can be imported and used correctly
 */

import { describe, it, expect } from "@jest/globals";
import {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  seedTestData,
  createTestOrganization,
  createTestDepartment,
  createTestUser,
  createTestVendor,
  createTestMaterial,
} from "./utils/testDb.js";
import {
  generateMockData,
  assertSoftDelete,
  assertRestore,
  assertCascadeDelete,
  assertTransactionRollback,
  assertTimezoneUTC,
  assertAuthorizationScope,
  assertUnique,
  assertAuditFields,
  assertCustomError,
} from "./utils/testHelpers.js";
import {
  fcOrganization,
  fcDepartment,
  fcUser,
  fcVendor,
  fcMaterial,
  fcProjectTask,
  fcRoutineTask,
  fcAssignedTask,
  fcTaskActivity,
  fcTaskComment,
  fcAttachment,
  fcNotification,
} from "./utils/mockData.js";

describe("Test Utilities Verification", () => {
  describe("testDb utilities", () => {
    it("should import all testDb functions", () => {
      expect(typeof connectTestDB).toBe("function");
      expect(typeof disconnectTestDB).toBe("function");
      expect(typeof clearTestDB).toBe("function");
      expect(typeof seedTestData).toBe("function");
      expect(typeof createTestOrganization).toBe("function");
      expect(typeof createTestDepartment).toBe("function");
      expect(typeof createTestUser).toBe("function");
      expect(typeof createTestVendor).toBe("function");
      expect(typeof createTestMaterial).toBe("function");
    });

    it("should create test organization", async () => {
      const org = await createTestOrganization();
      expect(org).toBeDefined();
      expect(org._id).toBeDefined();
      expect(org.name).toBeDefined();
      expect(org.email).toBeDefined();
    });
  });

  describe("testHelpers utilities", () => {
    it("should import all testHelpers functions", () => {
      expect(typeof generateMockData).toBe("function");
      expect(typeof assertSoftDelete).toBe("function");
      expect(typeof assertRestore).toBe("function");
      expect(typeof assertCascadeDelete).toBe("function");
      expect(typeof assertTransactionRollback).toBe("function");
      expect(typeof assertTimezoneUTC).toBe("function");
      expect(typeof assertAuthorizationScope).toBe("function");
      expect(typeof assertUnique).toBe("function");
      expect(typeof assertAuditFields).toBe("function");
      expect(typeof assertCustomError).toBe("function");
    });

    it("should assert timezone UTC correctly", () => {
      const utcDate = new Date();
      expect(() => assertTimezoneUTC(utcDate)).not.toThrow();
    });

    it("should assert unique arrays correctly", () => {
      const uniqueArray = [1, 2, 3, 4, 5];
      expect(() => assertUnique(uniqueArray)).not.toThrow();
    });
  });

  describe("mockData utilities", () => {
    it("should import all mockData generators", () => {
      expect(typeof fcOrganization).toBe("function");
      expect(typeof fcDepartment).toBe("function");
      expect(typeof fcUser).toBe("function");
      expect(typeof fcVendor).toBe("function");
      expect(typeof fcMaterial).toBe("function");
      expect(typeof fcProjectTask).toBe("function");
      expect(typeof fcRoutineTask).toBe("function");
      expect(typeof fcAssignedTask).toBe("function");
      expect(typeof fcTaskActivity).toBe("function");
      expect(typeof fcTaskComment).toBe("function");
      expect(typeof fcAttachment).toBe("function");
      expect(typeof fcNotification).toBe("function");
    });

    it("should generate organization arbitrary", () => {
      const orgArbitrary = fcOrganization();
      expect(orgArbitrary).toBeDefined();
    });
  });
});

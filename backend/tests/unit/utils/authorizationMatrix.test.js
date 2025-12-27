import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { SCOPES } from "../../../utils/constants.js";
import { checkPermission, getHighestScope, canAccessResource, getAllPermissions } from "../../../utils/authorizationMatrix.js";

describe("authorizationMatrix - Permission & Scope Checks (Integration with Config)", () => {
  const userId = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const deptId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();

  const user = {
    _id: userId,
    role: "User",
    organization: { _id: orgId },
    department: { _id: deptId }
  };

  const admin = {
    _id: otherId,
    role: "Admin",
    organization: { _id: orgId },
    department: { _id: deptId }
  };

  const superAdmin = {
      _id: new mongoose.Types.ObjectId(),
      role: "SuperAdmin"
  };

  describe("checkPermission", () => {
    test("should return true and scopes if permission exists (User -> Task -> read)", () => {
      // User can read Tasks in ownDept
      const result = checkPermission(user, "Task", "read");
      expect(result.hasPermission).toBe(true);
      expect(result.allowedScopes).toContain("ownDept");
    });

    test("should return false if resource not in matrix", () => {
      const result = checkPermission(user, "NonExistentResource", "read");
      expect(result.hasPermission).toBe(false);
    });

    // We can't easily test role not in matrix because checking role is done via object access
    // and most roles are covered, but let's try a fake role if we could inject it, but we can't.
    // However, we can test an operation not allowed.

    test("should return false if operation not allowed (User -> Organization -> create)", () => {
      // User cannot create Organization
      const result = checkPermission(user, "Organization", "create");
      expect(result.hasPermission).toBe(false);
    });
  });

  describe("getHighestScope", () => {
    test("should return CROSS_ORG if present (SuperAdmin -> Organization -> read)", () => {
        // SuperAdmin can read Organization with crossOrg
        const scope = getHighestScope(superAdmin, "Organization", "read");
        expect(scope).toBe(SCOPES.CROSS_ORG);
    });

    test("should return CROSS_DEPT if present (Admin -> Task -> read)", () => {
      // Admin can read Task with crossDept
      const scope = getHighestScope(admin, "Task", "read");
      expect(scope).toBe(SCOPES.CROSS_DEPT);
    });

    test("should return OWN_DEPT if present (User -> Task -> read)", () => {
      // User can read Task with ownDept
      const scope = getHighestScope(user, "Task", "read");
      expect(scope).toBe(SCOPES.OWN_DEPT);
    });

    test("should return OWN if present (User -> Task -> update)", () => {
      // User can update Task with own scope
      const scope = getHighestScope(user, "Task", "update");
      expect(scope).toBe(SCOPES.OWN);
    });
  });

  describe("canAccessResource", () => {
    // We use "Task" for testing usually, as it has diverse permissions

    test("CROSS_ORG: should return true regardless of ownership", () => {
       // SuperAdmin reading Organization
       const resource = { organization: otherId };
       const result = canAccessResource(superAdmin, resource, "read", "Organization");
       expect(result).toBe(true);
    });

    test("CROSS_DEPT: should return true if same org (Admin -> Task -> read)", () => {
       const resource = { organization: orgId, department: otherId }; // Same org, diff dept
       const result = canAccessResource(admin, resource, "read", "Task");
       expect(result).toBe(true);
    });

    test("CROSS_DEPT: should return false if diff org", () => {
        const resource = { organization: otherId };
        const result = canAccessResource(admin, resource, "read", "Task");
        expect(result).toBe(false);
     });

    test("OWN_DEPT: should return true if same org and dept (User -> Task -> read)", () => {
        const resource = { organization: orgId, department: deptId };
        const result = canAccessResource(user, resource, "read", "Task");
        expect(result).toBe(true);
    });

    test("OWN_DEPT: should return false if diff dept (User -> Task -> read)", () => {
        const resource = { organization: orgId, department: otherId };
        const result = canAccessResource(user, resource, "read", "Task");
        expect(result).toBe(false);
    });

    test("OWN: should return true if createdBy matches (User -> Task -> update)", () => {
        const resource = { createdBy: userId };
        const result = canAccessResource(user, resource, "update", "Task");
        expect(result).toBe(true);
    });

    test("OWN: should return false if no ownership match (User -> Task -> update)", () => {
        const resource = { createdBy: otherId };
        const result = canAccessResource(user, resource, "update", "Task");
        expect(result).toBe(false);
    });
  });

  describe("getAllPermissions", () => {
    test("should return permissions object structure", () => {
      const perms = getAllPermissions(user);
      expect(perms).toHaveProperty("Task");
      expect(perms.Task).toHaveProperty("read");
      expect(perms.Task.read.hasPermission).toBe(true);
      expect(perms.Task.create.hasPermission).toBe(true); // User can create tasks
    });
  });
});

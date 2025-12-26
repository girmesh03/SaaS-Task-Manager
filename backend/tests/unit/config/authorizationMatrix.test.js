/**
 * Unit Tests for Authorization Matrix (config/authorizationMatrix.json)
 *
 * Tests RBAC permissions for all roles, resources, and operations
 * Requirements: 22.1
 */

import { describe, test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authorizationMatrix = JSON.parse(
  readFileSync(
    join(__dirname, "../../../config/authorizationMatrix.json"),
    "utf-8"
  )
);

describe("Authorization Matrix Tests", () => {
  const roles = ["SuperAdmin", "Admin", "Manager", "User"];
  const operations = ["create", "read", "update", "delete", "restore"];
  const resources = [
    "Organization",
    "Department",
    "User",
    "Vendor",
    "Material",
    "Task",
    "TaskActivity",
    "TaskComment",
    "Attachment",
    "Notification",
  ];

  describe("Matrix structure", () => {
    test("should have all resources defined", () => {
      resources.forEach((resource) => {
        expect(authorizationMatrix[resource]).toBeDefined();
      });
    });

    test("should have all roles defined for each resource", () => {
      resources.forEach((resource) => {
        roles.forEach((role) => {
          expect(authorizationMatrix[resource][role]).toBeDefined();
        });
      });
    });

    test("should have all operations defined for each role", () => {
      resources.forEach((resource) => {
        roles.forEach((role) => {
          operations.forEach((operation) => {
            expect(
              authorizationMatrix[resource][role][operation]
            ).toBeDefined();
            expect(
              Array.isArray(authorizationMatrix[resource][role][operation])
            ).toBe(true);
          });
        });
      });
    });
  });

  describe("Platform SuperAdmin permissions", () => {
    test("should have crossOrg scope for Organization read", () => {
      const scopes = authorizationMatrix.Organization.SuperAdmin.read;
      expect(scopes).toContain("crossOrg");
      expect(scopes).toContain("own");
    });

    test("should have crossOrg scope for Organization update", () => {
      const scopes = authorizationMatrix.Organization.SuperAdmin.update;
      expect(scopes).toContain("crossOrg");
      expect(scopes).toContain("own");
    });

    test("should have crossOrg scope for Organization delete", () => {
      const scopes = authorizationMatrix.Organization.SuperAdmin.delete;
      expect(scopes).toContain("crossOrg");
      expect(scopes).toContain("own");
    });

    test("should have crossDept scope for Department operations", () => {
      expect(authorizationMatrix.Department.SuperAdmin.create).toContain(
        "crossDept"
      );
      expect(authorizationMatrix.Department.SuperAdmin.read).toContain(
        "crossDept"
      );
      expect(authorizationMatrix.Department.SuperAdmin.update).toContain(
        "crossDept"
      );
      expect(authorizationMatrix.Department.SuperAdmin.delete).toContain(
        "crossDept"
      );
      expect(authorizationMatrix.Department.SuperAdmin.restore).toContain(
        "crossDept"
      );
    });

    test("should have crossDept scope for User operations", () => {
      expect(authorizationMatrix.User.SuperAdmin.create).toContain("crossDept");
      expect(authorizationMatrix.User.SuperAdmin.read).toContain("crossDept");
      expect(authorizationMatrix.User.SuperAdmin.update).toContain("crossDept");
      expect(authorizationMatrix.User.SuperAdmin.delete).toContain("crossDept");
      expect(authorizationMatrix.User.SuperAdmin.restore).toContain(
        "crossDept"
      );
    });

    test("should have crossDept scope for Task operations", () => {
      expect(authorizationMatrix.Task.SuperAdmin.create).toContain("crossDept");
      expect(authorizationMatrix.Task.SuperAdmin.read).toContain("crossDept");
      expect(authorizationMatrix.Task.SuperAdmin.update).toContain("crossDept");
      expect(authorizationMatrix.Task.SuperAdmin.delete).toContain("crossDept");
      expect(authorizationMatrix.Task.SuperAdmin.restore).toContain(
        "crossDept"
      );
    });
  });

  describe("Customer SuperAdmin permissions", () => {
    test("should have own scope for Organization read", () => {
      const scopes = authorizationMatrix.Organization.SuperAdmin.read;
      expect(scopes).toContain("own");
    });

    test("should have crossDept scope for Department operations", () => {
      expect(authorizationMatrix.Department.SuperAdmin.create).toContain(
        "crossDept"
      );
      expect(authorizationMatrix.Department.SuperAdmin.read).toContain(
        "crossDept"
      );
      expect(authorizationMatrix.Department.SuperAdmin.update).toContain(
        "crossDept"
      );
      expect(authorizationMatrix.Department.SuperAdmin.delete).toContain(
        "crossDept"
      );
    });

    test("should have crossDept scope for User operations", () => {
      expect(authorizationMatrix.User.SuperAdmin.create).toContain("crossDept");
      expect(authorizationMatrix.User.SuperAdmin.read).toContain("crossDept");
      expect(authorizationMatrix.User.SuperAdmin.update).toContain("crossDept");
      expect(authorizationMatrix.User.SuperAdmin.delete).toContain("crossDept");
    });
  });

  describe("Admin permissions", () => {
    test("should have own scope for Organization read", () => {
      const scopes = authorizationMatrix.Organization.Admin.read;
      expect(scopes).toContain("own");
    });

    test("should have crossDept scope for Department operations", () => {
      expect(authorizationMatrix.Department.Admin.create).toContain(
        "crossDept"
      );
      expect(authorizationMatrix.Department.Admin.read).toContain("crossDept");
      expect(authorizationMatrix.Department.Admin.update).toContain(
        "crossDept"
      );
      expect(authorizationMatrix.Department.Admin.delete).toContain(
        "crossDept"
      );
    });

    test("should have crossDept scope for User operations", () => {
      expect(authorizationMatrix.User.Admin.create).toContain("crossDept");
      expect(authorizationMatrix.User.Admin.read).toContain("crossDept");
      expect(authorizationMatrix.User.Admin.update).toContain("crossDept");
      expect(authorizationMatrix.User.Admin.delete).toContain("crossDept");
    });

    test("should have crossDept scope for Task operations", () => {
      expect(authorizationMatrix.Task.Admin.create).toContain("crossDept");
      expect(authorizationMatrix.Task.Admin.read).toContain("crossDept");
      expect(authorizationMatrix.Task.Admin.update).toContain("crossDept");
      expect(authorizationMatrix.Task.Admin.delete).toContain("crossDept");
    });
  });

  describe("Manager permissions", () => {
    test("should have ownDept scope for Department read", () => {
      const scopes = authorizationMatrix.Department.Manager.read;
      expect(scopes).toContain("ownDept");
    });

    test("should have ownDept scope for User read", () => {
      const scopes = authorizationMatrix.User.Manager.read;
      expect(scopes).toContain("ownDept");
    });

    test("should have own scope for User update", () => {
      const scopes = authorizationMatrix.User.Manager.update;
      expect(scopes).toContain("own");
    });

    test("should have ownDept scope for Task operations", () => {
      expect(authorizationMatrix.Task.Manager.create).toContain("ownDept");
      expect(authorizationMatrix.Task.Manager.read).toContain("ownDept");
      expect(authorizationMatrix.Task.Manager.update).toContain("ownDept");
      expect(authorizationMatrix.Task.Manager.delete).toContain("ownDept");
    });

    test("should have ownDept scope for Vendor operations", () => {
      expect(authorizationMatrix.Vendor.Manager.create).toContain("ownDept");
      expect(authorizationMatrix.Vendor.Manager.read).toContain("ownDept");
      expect(authorizationMatrix.Vendor.Manager.update).toContain("ownDept");
      expect(authorizationMatrix.Vendor.Manager.delete).toContain("ownDept");
    });

    test("should have ownDept scope for Material operations", () => {
      expect(authorizationMatrix.Material.Manager.create).toContain("ownDept");
      expect(authorizationMatrix.Material.Manager.read).toContain("ownDept");
      expect(authorizationMatrix.Material.Manager.update).toContain("ownDept");
      expect(authorizationMatrix.Material.Manager.delete).toContain("ownDept");
    });
  });

  describe("User permissions", () => {
    test("should have ownDept scope for read operations", () => {
      expect(authorizationMatrix.Department.User.read).toContain("ownDept");
      expect(authorizationMatrix.User.User.read).toContain("ownDept");
      expect(authorizationMatrix.Task.User.read).toContain("ownDept");
      expect(authorizationMatrix.Vendor.User.read).toContain("ownDept");
      expect(authorizationMatrix.Material.User.read).toContain("ownDept");
    });

    test("should have own scope for write operations", () => {
      expect(authorizationMatrix.User.User.update).toContain("own");
      expect(authorizationMatrix.Task.User.update).toContain("own");
      expect(authorizationMatrix.Task.User.delete).toContain("own");
      expect(authorizationMatrix.TaskActivity.User.update).toContain("own");
      expect(authorizationMatrix.TaskComment.User.update).toContain("own");
    });

    test("should have ownDept scope for Task create", () => {
      expect(authorizationMatrix.Task.User.create).toContain("ownDept");
    });

    test("should have own scope for Notification operations", () => {
      expect(authorizationMatrix.Notification.User.read).toContain("own");
      expect(authorizationMatrix.Notification.User.update).toContain("own");
      expect(authorizationMatrix.Notification.User.delete).toContain("own");
    });

    test("should have empty create array for most resources", () => {
      expect(authorizationMatrix.Department.User.create).toEqual([]);
      expect(authorizationMatrix.User.User.create).toEqual([]);
      expect(authorizationMatrix.Vendor.User.create).toEqual([]);
      expect(authorizationMatrix.Material.User.create).toEqual([]);
    });
  });

  describe("Notification permissions", () => {
    test("should have own scope for all roles", () => {
      roles.forEach((role) => {
        expect(authorizationMatrix.Notification[role].read).toContain("own");
        expect(authorizationMatrix.Notification[role].update).toContain("own");
        expect(authorizationMatrix.Notification[role].delete).toContain("own");
      });
    });

    test("should have empty create array for all roles", () => {
      roles.forEach((role) => {
        expect(authorizationMatrix.Notification[role].create).toEqual([]);
      });
    });

    test("should have empty restore array for all roles", () => {
      roles.forEach((role) => {
        expect(authorizationMatrix.Notification[role].restore).toEqual([]);
      });
    });
  });

  describe("Resource-specific permissions", () => {
    test("Organization create should be empty for all roles", () => {
      roles.forEach((role) => {
        expect(authorizationMatrix.Organization[role].create).toEqual([]);
      });
    });

    test("Organization delete should be empty for non-SuperAdmin roles", () => {
      expect(authorizationMatrix.Organization.Admin.delete).toEqual([]);
      expect(authorizationMatrix.Organization.Manager.delete).toEqual([]);
      expect(authorizationMatrix.Organization.User.delete).toEqual([]);
    });

    test("Organization update should be empty for non-SuperAdmin roles", () => {
      expect(authorizationMatrix.Organization.Admin.update).toEqual([]);
      expect(authorizationMatrix.Organization.Manager.update).toEqual([]);
      expect(authorizationMatrix.Organization.User.update).toEqual([]);
    });
  });
});

/**
 * Test Database Utilities
 *
 * CRITICAL: Uses real MongoDB instance (NOT mongodb-memory-server)
 * Provides helper functions for test data setup and teardown
 */

import mongoose from "mongoose";
import {
  Organization,
  Department,
  User,
  Vendor,
  Material,
} from "../../models/index.js";

/**
 * Connect to test MongoDB instance
 * @returns {Promise<void>}
 */
export const connectTestDB = async () => {
  const MONGODB_URI_TEST =
    process.env.MONGODB_URI_TEST ||
    "mongodb://localhost:27017/task-manager-test";

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI_TEST, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  }
};

/**
 * Disconnect from test database
 * @returns {Promise<void>}
 */
export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

/**
 * Clear all collections in test database
 * @returns {Promise<void>}
 */
export const clearTestDB = async () => {
  const collections = await mongoose.connection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
};

/**
 * Seed test data for specific model
 * @param {string} modelName - Name of the model
 * @param {Array|Object} data - Data to seed
 * @returns {Promise<Array>}
 */
export const seedTestData = async (modelName, data) => {
  const Model = mongoose.model(modelName);
  const dataArray = Array.isArray(data) ? data : [data];

  return await Model.create(dataArray);
};

/**
 * Create test organization (platform or customer)
 * @param {Object} overrides - Override default values
 * @returns {Promise<Object>}
 */
export const createTestOrganization = async (overrides = {}) => {
  const timestamp = Date.now();
  const defaultOrg = {
    name: `test-org-${timestamp}`,
    email: `org-${timestamp}@test.com`,
    phone: `+251${String(100000000 + Math.floor(Math.random() * 900000000))}`,
    address: "123 Test Street",
    industry: "Technology",
    isPlatformOrg: false,
    ...overrides,
  };

  const org = await Organization.create([defaultOrg]);
  return org[0];
};

/**
 * Create test department
 * @param {Object} organization - Organization document
 * @param {Object} overrides - Override default values
 * @returns {Promise<Object>}
 */
export const createTestDepartment = async (organization, overrides = {}) => {
  const timestamp = Date.now();
  const defaultDept = {
    name: `test-dept-${timestamp}`,
    description: "Test Department",
    organization: organization._id,
    ...overrides,
  };

  const dept = await Department.create([defaultDept]);
  return dept[0];
};

/**
 * Create test user with role
 * @param {Object} organization - Organization document
 * @param {Object} department - Department document
 * @param {Object} overrides - Override default values
 * @returns {Promise<Object>}
 */
export const createTestUser = async (
  organization,
  department,
  overrides = {}
) => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const defaultUser = {
    firstName: "Test",
    lastName: "User",
    email: `user-${timestamp}-${randomNum}@test.com`,
    password: "Password123!",
    organization: organization._id,
    department: department._id,
    role: "User",
    employeeId: String(1000 + Math.floor(Math.random() * 9000)),
    dateOfBirth: new Date("1990-01-01"),
    joinedAt: new Date(),
    ...overrides,
  };

  const user = await User.create([defaultUser]);
  return user[0];
};

/**
 * Create test vendor
 * @param {Object} organization - Organization document
 * @param {Object} overrides - Override default values
 * @returns {Promise<Object>}
 */
export const createTestVendor = async (organization, overrides = {}) => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const defaultVendor = {
    name: `test-vendor-${timestamp}-${randomNum}`,
    description: "Test Vendor",
    organization: organization._id,
    contactPerson: "John Doe",
    email: `vendor-${timestamp}-${randomNum}@test.com`,
    phone: `+251${String(100000000 + Math.floor(Math.random() * 900000000))}`,
    ...overrides,
  };

  const vendor = await Vendor.create([defaultVendor]);
  return vendor[0];
};

/**
 * Create test material
 * @param {Object} organization - Organization document
 * @param {Object} department - Department document
 * @param {Object} overrides - Override default values
 * @returns {Promise<Object>}
 */
export const createTestMaterial = async (
  organization,
  department,
  overrides = {}
) => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const defaultMaterial = {
    name: `test-material-${timestamp}-${randomNum}`,
    description: "Test Material",
    category: "Electrical",
    unitType: "pcs",
    price: 100,
    organization: organization._id,
    department: department._id,
    ...overrides,
  };

  const material = await Material.create([defaultMaterial]);
  return material[0];
};

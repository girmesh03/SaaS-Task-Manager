/**
 * Mock Data Generators using fast-check
 *
 * Provides arbitraries for generating random test data for all models
 * Used in property-based testing to verify universal properties
 */

import fc from "fast-check";
import {
  USER_ROLES,
  TASK_STATUS,
  TASK_PRIORITY,
  MATERIAL_CATEGORIES,
  UNIT_TYPES,
  NOTIFICATION_TYPES,
  ATTACHMENT_TYPES,
  INDUSTRIES,
} from "../../utils/constants.js";

/**
 * Generate random organization data
 */
export const fcOrganization = () =>
  fc.record({
    name: fc
      .string({ minLength: 3, maxLength: 100 })
      .map((s) => s.toLowerCase()),
    email: fc.emailAddress({ maxLength: 50 }),
    phone: fc.constantFrom(
      ...Array.from(
        { length: 10 },
        (_, i) => `+251${String(100000000 + i).padStart(9, "0")}`
      )
    ),
    address: fc.string({ minLength: 10, maxLength: 500 }),
    industry: fc.constantFrom(...Object.values(INDUSTRIES)),
    description: fc.string({ maxLength: 2000 }),
    isPlatformOrg: fc.boolean(),
  });

/**
 * Generate random department data
 */
export const fcDepartment = (organizationId) =>
  fc.record({
    name: fc.string({ minLength: 3, maxLength: 100 }),
    description: fc.string({ maxLength: 2000 }),
    organization: fc.constant(organizationId),
  });

/**
 * Generate random user data
 */
export const fcUser = (organizationId, departmentId) =>
  fc.record({
    firstName: fc.string({ minLength: 2, maxLength: 20 }),
    lastName: fc.string({ minLength: 2, maxLength: 20 }),
    email: fc.emailAddress({ maxLength: 50 }),
    password: fc.string({ minLength: 8, maxLength: 50 }),
    organization: fc.constant(organizationId),
    department: fc.constant(departmentId),
    role: fc.constantFrom(...Object.values(USER_ROLES)),
    employeeId: fc.integer({ min: 1000, max: 9999 }).map(String),
    dateOfBirth: fc.date({ max: new Date() }),
    joinedAt: fc.date({ max: new Date() }),
    position: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  });

/**
 * Generate random vendor data
 */
export const fcVendor = (organizationId) =>
  fc.record({
    name: fc.string({ minLength: 3, maxLength: 100 }),
    description: fc.string({ maxLength: 2000 }),
    organization: fc.constant(organizationId),
    contactPerson: fc.string({ maxLength: 100 }),
    email: fc.option(fc.emailAddress({ maxLength: 50 }), { nil: undefined }),
    phone: fc.option(
      fc.constantFrom(
        ...Array.from(
          { length: 10 },
          (_, i) => `+251${String(100000000 + i).padStart(9, "0")}`
        )
      ),
      { nil: undefined }
    ),
    address: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  });

/**
 * Generate random material data
 */
export const fcMaterial = (organizationId, departmentId) =>
  fc.record({
    name: fc.string({ minLength: 3, maxLength: 100 }),
    description: fc.string({ maxLength: 2000 }),
    category: fc.constantFrom(...Object.values(MATERIAL_CATEGORIES)),
    unitType: fc.constantFrom(...Object.values(UNIT_TYPES)),
    price: fc.float({ min: 0, max: 10000 }),
    organization: fc.constant(organizationId),
    department: fc.constant(departmentId),
  });

/**
 * Generate random ProjectTask data
 */
export const fcProjectTask = (
  organizationId,
  departmentId,
  createdById,
  vendorId
) =>
  fc.record({
    title: fc.string({ minLength: 3, maxLength: 50 }),
    description: fc.string({ minLength: 10, maxLength: 2000 }),
    vendor: fc.constant(vendorId),
    organization: fc.constant(organizationId),
    department: fc.constant(departmentId),
    createdBy: fc.constant(createdById),
    status: fc.constantFrom(...Object.values(TASK_STATUS)),
    priority: fc.constantFrom(...Object.values(TASK_PRIORITY)),
    estimatedCost: fc.option(fc.float({ min: 0, max: 100000 }), {
      nil: undefined,
    }),
    actualCost: fc.option(fc.float({ min: 0, max: 100000 }), {
      nil: undefined,
    }),
    currency: fc.constant("ETB"),
    startDate: fc.option(fc.date(), { nil: undefined }),
    dueDate: fc.option(fc.date(), { nil: undefined }),
    tags: fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 }),
  });

/**
 * Generate random RoutineTask data
 */
export const fcRoutineTask = (organizationId, departmentId, createdById) =>
  fc.record({
    description: fc.string({ minLength: 10, maxLength: 2000 }),
    organization: fc.constant(organizationId),
    department: fc.constant(departmentId),
    createdBy: fc.constant(createdById),
    status: fc.constantFrom("In Progress", "Completed", "Pending"), // Cannot be "To Do"
    priority: fc.constantFrom("Medium", "High", "Urgent"), // Cannot be "Low"
    startDate: fc.date({ max: new Date() }), // Required, not future
    dueDate: fc.date({ min: new Date() }), // Required, must be after startDate
    tags: fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 }),
  });

/**
 * Generate random AssignedTask data
 */
export const fcAssignedTask = (
  organizationId,
  departmentId,
  createdById,
  assigneeIds
) =>
  fc.record({
    title: fc.string({ minLength: 3, maxLength: 50 }),
    description: fc.string({ minLength: 10, maxLength: 2000 }),
    assignees: fc.constant(assigneeIds),
    organization: fc.constant(organizationId),
    department: fc.constant(departmentId),
    createdBy: fc.constant(createdById),
    status: fc.constantFrom(...Object.values(TASK_STATUS)),
    priority: fc.constantFrom(...Object.values(TASK_PRIORITY)),
    startDate: fc.option(fc.date(), { nil: undefined }),
    dueDate: fc.option(fc.date(), { nil: undefined }),
    tags: fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 }),
  });

/**
 * Generate random TaskActivity data
 */
export const fcTaskActivity = (
  organizationId,
  departmentId,
  createdById,
  parentTaskId
) =>
  fc.record({
    activity: fc.string({ minLength: 10, maxLength: 2000 }),
    parent: fc.constant(parentTaskId),
    parentModel: fc.constantFrom("ProjectTask", "AssignedTask"),
    organization: fc.constant(organizationId),
    department: fc.constant(departmentId),
    createdBy: fc.constant(createdById),
  });

/**
 * Generate random TaskComment data
 */
export const fcTaskComment = (
  organizationId,
  departmentId,
  createdById,
  parentId,
  parentModel
) =>
  fc.record({
    comment: fc.string({ minLength: 10, maxLength: 2000 }),
    parent: fc.constant(parentId),
    parentModel: fc.constant(parentModel),
    organization: fc.constant(organizationId),
    department: fc.constant(departmentId),
    createdBy: fc.constant(createdById),
  });

/**
 * Generate random Attachment data
 */
export const fcAttachment = (
  organizationId,
  departmentId,
  uploadedById,
  parentId,
  parentModel
) =>
  fc.record({
    filename: fc.string({ minLength: 5, maxLength: 100 }),
    fileUrl: fc.webUrl(),
    fileType: fc.constantFrom(...Object.values(ATTACHMENT_TYPES)),
    fileSize: fc.integer({ min: 1000, max: 10000000 }),
    parent: fc.constant(parentId),
    parentModel: fc.constant(parentModel),
    organization: fc.constant(organizationId),
    department: fc.constant(departmentId),
    uploadedBy: fc.constant(uploadedById),
  });

/**
 * Generate random Notification data
 */
export const fcNotification = (organizationId, recipientId) =>
  fc.record({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    message: fc.string({ minLength: 10, maxLength: 500 }),
    type: fc.constantFrom(...Object.values(NOTIFICATION_TYPES)),
    recipient: fc.constant(recipientId),
    organization: fc.constant(organizationId),
    isRead: fc.boolean(),
  });

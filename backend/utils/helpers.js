import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Utility Helper Functions
 */

/**
 * Transform function for Mongoose toJSON/toObject
 * Converts dates to ISO 8601 strings in UTC
 * @param {object} doc - Mongoose document
 * @param {object} ret - Returned object
 * @returns {object} Transformed object
 */
export const dateTransform = (doc, ret) => {
  // Convert all Date fields to ISO strings
  Object.keys(ret).forEach((key) => {
    if (ret[key] instanceof Date) {
      ret[key] = dayjs.utc(ret[key]).toISOString();
    }
  });

  // Remove __v and convert _id to id
  delete ret.__v;

  return ret;
};

/**
 * Convert specified date fields to UTC before saving
 * Used in pre-save hooks
 * @param {object} doc - Mongoose document
 * @param {array} dateFields - Array of date field names
 */
export const convertDatesToUTC = (doc, dateFields) => {
  dateFields.forEach((field) => {
    if (doc[field]) {
      doc[field] = dayjs.utc(doc[field]).toDate();
    }
  });
};

/**
 * Sanitize object by removing undefined and null values
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined && obj[key] !== null) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Normalize array field (convert single value to array)
 * @param {any} value - Value to normalize
 * @returns {array} Normalized array
 */
export const normalizeToArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

/**
 * Check if value is valid MongoDB ObjectId
 * @param {string} id - ID to check
 * @returns {boolean} True if valid ObjectId
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Build pagination metadata
 * @param {number} page - Current page (1-based)
 * @param {number} limit - Items per page
 * @param {number} totalCount - Total number of items
 * @returns {object} Pagination metadata
 */
export const buildPaginationMeta = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
};

/**
 * Build query filter for organization scoping
 * @param {object} user - Authenticated user
 * @param {string} scope - Authorization scope (own, ownDept, crossDept, crossOrg)
 * @returns {object} Query filter
 */
export const buildOrgScopeFilter = (user, scope) => {
  const filter = { isDeleted: false };

  switch (scope) {
    case "crossOrg":
      // Platform SuperAdmin - no organization filter
      break;
    case "crossDept":
      // SuperAdmin/Admin - filter by organization
      filter.organization = user.organization._id;
      break;
    case "ownDept":
      // Manager/User - filter by organization and department
      filter.organization = user.organization._id;
      filter.department = user.department._id;
      break;
    case "own":
      // User - filter by organization, department, and ownership
      filter.organization = user.organization._id;
      filter.department = user.department._id;
      filter.createdBy = user._id;
      break;
    default:
      // Default to own department
      filter.organization = user.organization._id;
      filter.department = user.department._id;
  }

  return filter;
};

/**
 * Check if user owns resource
 * @param {object} resource - Resource document
 * @param {object} user - Authenticated user
 * @returns {boolean} True if user owns resource
 */
export const isOwner = (resource, user) => {
  // Check various ownership fields
  if (
    resource.createdBy &&
    resource.createdBy.toString() === user._id.toString()
  ) {
    return true;
  }
  if (resource.addedBy && resource.addedBy.toString() === user._id.toString()) {
    return true;
  }
  if (
    resource.uploadedBy &&
    resource.uploadedBy.toString() === user._id.toString()
  ) {
    return true;
  }
  if (
    resource.recipient &&
    resource.recipient.toString() === user._id.toString()
  ) {
    return true;
  }

  // Check if user is in assignees array
  if (resource.assignees) {
    const assignees = normalizeToArray(resource.assignees);
    if (assignees.some((a) => a.toString() === user._id.toString())) {
      return true;
    }
  }

  // Check if user is in watchers array
  if (
    resource.watchers &&
    resource.watchers.some((w) => w.toString() === user._id.toString())
  ) {
    return true;
  }

  // Check if user is in mentions array
  if (
    resource.mentions &&
    resource.mentions.some((m) => m.toString() === user._id.toString())
  ) {
    return true;
  }

  return false;
};

/**
 * Async handler wrapper to catch errors
 * @param {function} fn - Async function to wrap
 * @returns {function} Wrapped function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

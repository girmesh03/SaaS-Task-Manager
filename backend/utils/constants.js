/**
 * Application Constants - SINGLE SOURCE OF TRUTH
 *
 * CRITICAL: ALL constants must be imported from this file
 * NEVER hardcode values that exist here
 * Frontend constants MUST match these exactly
 */

// User Roles (descending privileges)
export const USER_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

// Task Status
export const TASK_STATUS = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  PENDING: "Pending",
};

// Task Priority
export const TASK_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

// Task Types (Discriminator)
export const TASK_TYPES = {
  PROJECT_TASK: "ProjectTask",
  ROUTINE_TASK: "RoutineTask",
  ASSIGNED_TASK: "AssignedTask",
};

// User Status
export const USER_STATUS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  AWAY: "Away",
};

// Material Categories
export const MATERIAL_CATEGORIES = {
  ELECTRICAL: "Electrical",
  MECHANICAL: "Mechanical",
  PLUMBING: "Plumbing",
  HARDWARE: "Hardware",
  CLEANING: "Cleaning",
  TEXTILES: "Textiles",
  CONSUMABLES: "Consumables",
  CONSTRUCTION: "Construction",
  OTHER: "Other",
};

// Unit Types
export const UNIT_TYPES = {
  // Count
  PCS: "pcs",
  DOZEN: "dozen",

  // Weight
  KG: "kg",
  G: "g",
  OUNCE: "ounce",
  POUND: "pound",
  TON: "ton",

  // Volume
  L: "l",
  ML: "ml",
  LITER: "liter",
  MILLILITER: "milliliter",
  GALLON: "gallon",

  // Length
  M: "m",
  CM: "cm",
  MM: "mm",
  INCH: "inch",
  FOOT: "foot",
  YARD: "yard",
  MILE: "mile",

  // Area
  M2: "m2",
  SQUARE_METER: "square meter",

  // Volume (cubic)
  M3: "m3",
  CUBIC_METER: "cubic meter",

  // Packaging
  BOX: "box",
  PACK: "pack",
  ROLL: "roll",
  SHEET: "sheet",
  BAG: "bag",
  BOTTLE: "bottle",
  CAN: "can",
  CARTON: "carton",
};

// Industries
export const INDUSTRIES = {
  TECHNOLOGY: "Technology",
  HEALTHCARE: "Healthcare",
  FINANCE: "Finance",
  EDUCATION: "Education",
  RETAIL: "Retail",
  MANUFACTURING: "Manufacturing",
  CONSTRUCTION: "Construction",
  HOSPITALITY: "Hospitality",
  TRANSPORTATION: "Transportation",
  REAL_ESTATE: "Real Estate",
  AGRICULTURE: "Agriculture",
  ENERGY: "Energy",
  TELECOMMUNICATIONS: "Telecommunications",
  MEDIA: "Media",
  ENTERTAINMENT: "Entertainment",
  LEGAL: "Legal",
  CONSULTING: "Consulting",
  INSURANCE: "Insurance",
  AUTOMOTIVE: "Automotive",
  AEROSPACE: "Aerospace",
  PHARMACEUTICAL: "Pharmaceutical",
  FOOD_BEVERAGE: "Food & Beverage",
  GOVERNMENT: "Government",
  NON_PROFIT: "Non-Profit",
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
};

// Limits
export const LIMITS = {
  // Array limits
  MAX_ATTACHMENTS: 10,
  MAX_WATCHERS: 20,
  MAX_ASSIGNEES: 20,
  MAX_MENTIONS: 5,
  MAX_MATERIALS: 20,
  MAX_TAGS: 5,
  MAX_SKILLS: 10,
  MAX_COST_HISTORY: 200,

  // String length limits
  NAME_MAX: 100,
  ORGANIZATION_NAME_MAX: 100,
  DEPARTMENT_NAME_MAX: 100,
  TITLE_MAX: 50,
  DESCRIPTION_MAX: 2000,
  EMAIL_MAX: 50,
  POSITION_MAX: 100,
  ADDRESS_MAX: 500,
  INDUSTRY_MAX: 100,
  SKILL_MAX: 50,
  TAG_MAX: 50,
  FIRST_NAME_MAX: 20,
  LAST_NAME_MAX: 20,
  CONTACT_PERSON_MAX: 100,
  COMMENT_MAX: 2000,
  ACTIVITY_MAX: 2000,

  // Number limits
  PASSWORD_MIN: 8,
  EMPLOYEE_ID_MIN: 1000,
  EMPLOYEE_ID_MAX: 9999,
  SKILL_PERCENTAGE_MIN: 0,
  SKILL_PERCENTAGE_MAX: 100,
  QUANTITY_MIN: 0,
  PRICE_MIN: 0,
  COST_MIN: 0,

  // Comment depth
  MAX_COMMENT_DEPTH: 3,
};

// Alias for backward compatibility
export const LENGTH_LIMITS = {
  ORGANIZATION_NAME: LIMITS.NAME_MAX,
  DEPARTMENT_NAME: LIMITS.NAME_MAX,
  EMAIL: LIMITS.EMAIL_MAX,
  ADDRESS: LIMITS.ADDRESS,
  DESCRIPTION: LIMITS.DESCRIPTION_MAX,
  FIRST_NAME: LIMITS.FIRST_NAME_MAX,
  LAST_NAME: LIMITS.LAST_NAME_MAX,
  POSITION: LIMITS.POSITION_MAX,
  PASSWORD_MIN: LIMITS.PASSWORD_MIN,
};

// File Size Limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 25 * 1024 * 1024, // 25MB
  AUDIO: 20 * 1024 * 1024, // 20MB
  OTHER: 50 * 1024 * 1024, // 50MB
};

// File Types
export const FILE_TYPES = {
  IMAGE: {
    type: "Image",
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
  },
  VIDEO: {
    type: "Video",
    extensions: [".mp4", ".avi", ".mov", ".wmv"],
    mimeTypes: [
      "video/mp4",
      "video/x-msvideo",
      "video/quicktime",
      "video/x-ms-wmv",
    ],
  },
  DOCUMENT: {
    type: "Document",
    extensions: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
  AUDIO: {
    type: "Audio",
    extensions: [".mp3", ".wav", ".ogg"],
    mimeTypes: ["audio/mpeg", "audio/wav", "audio/ogg"],
  },
  OTHER: {
    type: "Other",
    extensions: [],
    mimeTypes: [],
  },
};

// Notification Types
export const NOTIFICATION_TYPES = {
  CREATED: "Created",
  UPDATED: "Updated",
  DELETED: "Deleted",
  RESTORED: "Restored",
  MENTION: "Mention",
  ASSIGNED: "Assigned",
  WELCOME: "Welcome",
  ANNOUNCEMENT: "Announcement",
};

// Attachment Types (same as file types)
export const ATTACHMENT_TYPES = {
  IMAGE: "Image",
  VIDEO: "Video",
  DOCUMENT: "Document",
  AUDIO: "Audio",
  OTHER: "Other",
};

// TTL (Time To Live) in seconds
export const TTL = {
  ORGANIZATION: null, // Never expires
  DEPARTMENT: 365 * 24 * 60 * 60, // 365 days
  USER: 365 * 24 * 60 * 60, // 365 days
  TASK: 180 * 24 * 60 * 60, // 180 days
  TASK_ACTIVITY: 90 * 24 * 60 * 60, // 90 days
  TASK_COMMENT: 90 * 24 * 60 * 60, // 90 days
  MATERIAL: 180 * 24 * 60 * 60, // 180 days
  VENDOR: 180 * 24 * 60 * 60, // 180 days
  ATTACHMENT: 90 * 24 * 60 * 60, // 90 days
  NOTIFICATION: 30 * 24 * 60 * 60, // 30 days
};

// Currency
export const CURRENCY = {
  DEFAULT: "ETB",
  ETB: "ETB",
  USD: "USD",
  EUR: "EUR",
};

// Authorization Scopes
export const SCOPES = {
  OWN: "own",
  OWN_DEPT: "ownDept",
  CROSS_DEPT: "crossDept",
  CROSS_ORG: "crossOrg",
};

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 5,
};

// JWT
export const JWT = {
  ACCESS_EXPIRES_IN: "15m",
  REFRESH_EXPIRES_IN: "7d",
  COOKIE_MAX_AGE: {
    ACCESS: 15 * 60 * 1000, // 15 minutes
    REFRESH: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

// Password Reset
export const PASSWORD_RESET = {
  TOKEN_EXPIRES_IN: 60 * 60 * 1000, // 1 hour
  BCRYPT_ROUNDS: 10,
};

// Bcrypt
export const BCRYPT = {
  SALT_ROUNDS: 12,
};

// Phone Regex (Ethiopian format)
export const PHONE_REGEX = /^(\+251\d{9}|0\d{9})$/;

// Socket.IO Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // User
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  USER_AWAY: "user:away",

  // Task
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_ASSIGNED: "task:assigned",
  TASK_DELETED: "task:deleted",
  TASK_RESTORED: "task:restored",

  // Activity
  ACTIVITY_CREATED: "activity:created",
  ACTIVITY_UPDATED: "activity:updated",
  ACTIVITY_DELETED: "activity:deleted",
  ACTIVITY_RESTORED: "activity:restored",

  // Comment
  COMMENT_CREATED: "comment:created",
  COMMENT_UPDATED: "comment:updated",
  COMMENT_DELETED: "comment:deleted",
  COMMENT_RESTORED: "comment:restored",

  // Notification
  NOTIFICATION_CREATED: "notification:created",
};

// Email Preferences Defaults
export const EMAIL_PREFERENCES_DEFAULTS = {
  enabled: true,
  taskNotifications: true,
  taskReminders: true,
  mentions: true,
  announcements: true,
  welcomeEmails: true,
  passwordReset: true,
};

// Soft Delete Error Codes
export const SOFT_DELETE_ERRORS = {
  RESTORE_BLOCKED_PARENT_DELETED: "RESTORE_BLOCKED_PARENT_DELETED",
  RESTORE_BLOCKED_DEPENDENCY_DELETED: "RESTORE_BLOCKED_DEPENDENCY_DELETED",
  ASSIGNED_TASK_NO_ACTIVE_ASSIGNEES: "ASSIGNED_TASK_NO_ACTIVE_ASSIGNEES",
  COMMENT_PARENT_CHAIN_INVALID: "COMMENT_PARENT_CHAIN_INVALID",
  ATTACHMENT_PARENT_CHAIN_INVALID: "ATTACHMENT_PARENT_CHAIN_INVALID",
  CROSS_ORG_VIOLATION: "CROSS_ORG_VIOLATION",
  QUOTA_VIOLATION: "QUOTA_VIOLATION",
  INVALID_QUANTITY: "INVALID_QUANTITY",
};

# Implementation Plan

## Phase 1: Backend Foundation and Core Infrastructure

- [x] 1. Backend Project Setup and Configuration

  - [x] 1.1 Initialize backend with ES modules and install dependencies

  - Create backend directory with package.json ("type": "module")
  - Install all dependencies: express, mongoose, mongoose-paginate-v2, bcrypt, jsonwebtoken, socket.io, nodemailer, express-validator, express-mongo-sanitize, helmet, cors, cookie-parser, compression, express-rate-limit, winston, dayjs, dotenv
  - Install dev dependencies: jest, supertest, fast-check, nodemon
  - Create complete folder structure as specified in design
  - Setup/utilize .env file with all required environment variables
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

  - [x] 1.2 Create configuration files

  - Create config/db.js with MongoDB connection, retry logic, connection pooling (min: 2, max: 10)
  - Create config/allowedOrigins.js with CORS allowed origins list
  - Create config/corsOptions.js with CORS configuration and validation
  - Create config/authorizationMatrix.json with complete role-based permissions
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 11.1, 11.5, 22.1_

  - [x] 1.3 Create error handling infrastructure

  - Create errorHandler/CustomError.js with static helper methods (validation, authentication, authorization, notFound, conflict, internal)
  - Create errorHandler/ErrorController.js with global error handler middleware
  - Ensure CustomError includes statusCode, errorCode, context, isOperational
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 1.4 Create utility functions

  - Follow the Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10
  - Create utils/logger.js with Winston configuration (file and console transports)
  - Create utils/helpers.js with utility helper functions
  - Create utils/generateTokens.js with JWT token generation functions
  - Create utils/validateEnv.js with environment variable validation
  - Create utils/authorizationMatrix.js with authorization helper functions
  - Create utils/responseTransform.js with response formatting utilities
  - Create utils/materialTransform.js with material data transformation
  - Create utils/userStatus.js with user status tracking utilities
  - Create utils/dateUtils.js with timezone management utilities (toUTC, formatISO, isValidDate)
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 10.1, 10.2, 10.3_

  - [x] 1.5 Create middleware (non-validator)

  - Create middlewares/authMiddleware.js with verifyJWT and verifyRefreshToken
  - Create middlewares/authorization.js with role-based authorization middleware
  - Create middlewares/rateLimiter.js with rate limiting (production only: 5/15min auth, 100/15min general)
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.5, 11.3, 11.4, 22.1_

  - [x] 1.6 Create services

  - Create services/emailService.js with Nodemailer, Gmail SMTP, queue-based email sending
  - Create services/notificationService.js with notification creation and management
  - Create templates/emailTemplates.js with HTML email templates (welcome, password reset, notifications)
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 1.7 Create Socket.IO infrastructure

  - Create utils/socketInstance.js with Socket.IO singleton pattern
  - Create utils/socket.js with Socket.IO event handlers (connection, disconnection, rooms)
  - Create utils/socketEmitter.js with Socket.IO event emitters (task, activity, comment, notification events)
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [x] 1.8 Create soft delete plugin (CRITICAL - Universal Dependency)

  - Create models/plugins/softDelete.js with universal soft delete functionality
  - Implement query helpers: withDeleted(), onlyDeleted()
  - Implement instance methods: softDelete(deletedBy, {session}), restore(restoredBy, {session})
  - Implement static methods: softDeleteById, softDeleteMany, restoreById, restoreMany, findDeletedByIds, countDeleted, ensureTTLIndex, getRestoreAudit
  - Implement automatic filtering middleware for isDeleted: false
  - Implement hard delete protection (block deleteOne, deleteMany, findOneAndDelete, remove)
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [x] 1.9 Create app configuration

  - Create app.js with Express app setup and security middleware order (helmet, cors, cookieParser, express.json, mongoSanitize, compression, rateLimiter)
  - Apply error handling middleware
  - Configure static file serving for production
  - Set process.env.TZ = 'UTC' for timezone configuration
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 10.1, 11.1, 11.2_

  - [x] 1.10 Create server startup

  - Create server.js with HTTP server creation, Socket.IO initialization, graceful shutdown
  - Implement database connection with retry logic
  - Verify UTC timezone with console.log
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 10.1_

## Phase 2: Backend Models (In Dependency Order)

- [x] 2. Create Organization Model

  - [x] 2.1 Implement Organization schema with all fields and indexes

    - Fields: name, description, email, phone, address, industry, logoUrl, publicId, createdBy, isPlatformOrg, soft delete fields, timestamps
    - Indexes: unique name/email/phone (partial), isPlatformOrg, isDeleted, deletedAt (TTL: never)
    - Apply mongoosePaginate and softDeletePlugin
    - Implement pre-save hooks with session support
    - Implement cascade delete static method with session
    - Configure TTL index: Model.ensureTTLIndex(null)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3. Create Department Model

  - [x] 3.1 Implement Department schema with all fields and indexes

    - Fields: name, description, hod, organization, createdBy, soft delete fields, timestamps
    - Indexes: unique {organization, name} (partial), organization, isDeleted, deletedAt (TTL: 365 days)
    - Apply mongoosePaginate and softDeletePlugin
    - Implement pre-save hooks with session support
    - Implement cascade delete static method with session
    - Configure TTL index: Model.ensureTTLIndex(365 _ 24 _ 60 \* 60)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 4. Create User Model

  - [x] 4.1 Implement User schema with all fields and indexes

    - Fields: firstName, lastName, position, role, email, password, organization, department, profilePicture, skills, employeeId, dateOfBirth, joinedAt, emailPreferences, passwordResetToken, passwordResetExpires, isPlatformUser, isHod, lastLogin, soft delete fields, timestamps
    - Indexes: unique {organization, email}, unique {department} for HOD, unique {organization, employeeId}, isPlatformUser, isHod, isDeleted, deletedAt (TTL: 365 days)
    - Virtuals: fullName
    - Apply mongoosePaginate and softDeletePlugin
    - Implement pre-save hooks: password hashing (bcrypt ≥12 rounds), isHod auto-set, isPlatformUser auto-set
    - Implement instance methods: comparePassword, generatePasswordResetToken, verifyPasswordResetToken, clearPasswordResetToken
    - Implement cascade delete static method with session
    - Configure TTL index: Model.ensureTTLIndex(365 _ 24 _ 60 \* 60)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 5. Create Vendor Model

  - [x] 5.1 Implement Vendor schema with all fields and indexes

    - Fields: name, description, contactPerson, email, phone, address, organization, createdBy, soft delete fields, timestamps
    - Indexes: {organization, name}, isDeleted, deletedAt (TTL: 180 days)
    - Apply mongoosePaginate and softDeletePlugin
    - Implement pre-save hooks with session support
    - Configure TTL index: Model.ensureTTLIndex(180 _ 24 _ 60 \* 60)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.3, 9.4, 9.5, 9.8_

- [x] 6. Create Material Model

  - [x] 6.1 Implement Material schema with all fields and indexes

    - Fields: name, description, category, unitType, price, department, organization, addedBy, soft delete fields, timestamps
    - Indexes: {organization, department, name}, category, isDeleted, deletedAt (TTL: 180 days)
    - Apply mongoosePaginate and softDeletePlugin
    - Implement pre-save hooks with session support
    - Configure TTL index: Model.ensureTTLIndex(180 _ 24 _ 60 \* 60)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.1, 9.2, 9.6, 9.7, 9.9_

- [x] 7. Create BaseTask Model (Abstract - Discriminator Base)

  - [x] 7.1 Implement BaseTask schema with all fields and indexes

    - Fields: description, status, priority, organization, department, createdBy, attachments, watchers, tags, taskType (discriminator key), soft delete fields, timestamps
    - Indexes: {organization, department, createdAt}, {organization, createdBy, createdAt}, {organization, department, startDate, dueDate}, {organization, department, status, priority, dueDate}, tags (text), isDeleted, deletedAt (TTL: 180 days)
    - Apply mongoosePaginate and softDeletePlugin
    - Implement pre-save hooks with session support and date UTC conversion
    - Implement cascade delete static method with session
    - Configure TTL index: Model.ensureTTLIndex(180 _ 24 _ 60 \* 60)
    - Configure toJSON transform for ISO date strings
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [x] 8. Create ProjectTask Model (extends BaseTask)

  - [x] 8.1 Implement ProjectTask discriminator schema

    - Additional fields: title, vendor (required), estimatedCost, actualCost, currency, costHistory, startDate, dueDate
    - Validate vendor reference exists and not deleted
    - Validate watchers are HOD users
    - Validate dueDate after startDate
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [x] 9. Create RoutineTask Model (extends BaseTask)

  - [x] 9.1 Implement RoutineTask discriminator schema

    - Additional fields: materials (array, added directly), startDate (required, not future), dueDate (required, must be after startDate, not future)
    - Validate status NOT "To Do" (must be In Progress, Completed, or Pending)
    - Validate priority NOT "Low" (must be Medium, High, or Urgent)
    - Validate materials exist and not deleted
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 10. Create AssignedTask Model (extends BaseTask)

  - [x] 10.1 Implement AssignedTask discriminator schema

    - Additional fields: title, assignees (required, array), startDate, dueDate
    - Validate at least one assignee
    - Validate assignees exist and not deleted
    - Validate dueDate after startDate if both provided
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [x] 11. Create TaskActivity Model

  - [x] 11.1 Implement TaskActivity schema with all fields and indexes

    - Fields: activity, parent (ProjectTask or AssignedTask ONLY), parentModel, materials, createdBy, department, organization, soft delete fields, timestamps
    - Indexes: {parent, createdAt}, {organization, department, createdAt}, isDeleted, deletedAt (TTL: 90 days)
    - Apply mongoosePaginate and softDeletePlugin
    - Validate parent is ProjectTask or AssignedTask (NOT RoutineTask)
    - Implement cascade delete static method with session
    - Configure TTL index: Model.ensureTTLIndex(90 _ 24 _ 60 \* 60)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 12. Create TaskComment Model

  - [x] 12.1 Implement TaskComment schema with all fields and indexes

    - Fields: comment, parent (Task/TaskActivity/TaskComment), parentModel, mentions, createdBy, department, organization, soft delete fields, timestamps
    - Indexes: {parent, createdAt}, {organization, department, createdAt}, isDeleted, deletedAt (TTL: 90 days)
    - Apply mongoosePaginate and softDeletePlugin
    - Validate max depth 3 levels
    - Implement cascade delete static method with session (recursive for child comments)
    - Configure TTL index: Model.ensureTTLIndex(90 _ 24 _ 60 \* 60)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.6, 19.7, 19.8, 19.9, 19.10_

- [x] 13. Create Attachment Model

  - [x] 13.1 Implement Attachment schema with all fields and indexes

    - Fields: filename, fileUrl, fileType, fileSize, parent (Task/TaskActivity/TaskComment), parentModel, uploadedBy, department, organization, soft delete fields, timestamps
    - Indexes: {parent, createdAt}, {organization, department, createdAt}, isDeleted, deletedAt (TTL: 90 days)
    - Apply mongoosePaginate and softDeletePlugin
    - Validate file type and size limits (Image 10MB, Video 100MB, Document 25MB, Audio 20MB, Other 50MB)
    - Configure TTL index: Model.ensureTTLIndex(90 _ 24 _ 60 \* 60)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10_

- [x] 14. Create Notification Model

  - [x] 14.1 Implement Notification schema with all fields and indexes

    - Fields: title, message, type, isRead, recipient, entity, entityModel, organization, expiresAt, createdAt, updatedAt
    - Indexes: {recipient, isRead, createdAt}, {organization, createdAt}, {expiresAt} (TTL: 30 days)
    - Apply mongoosePaginate
    - Configure TTL index based on expiresAt field
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9, 21.10_

- [x] 15. Create models/index.js

  - [x] 15.1 Export all models from single file

    - Export Organization, Department, User, Vendor, Material, BaseTask, ProjectTask, RoutineTask, AssignedTask, TaskActivity, TaskComment, Attachment, Notification
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All model requirements_

## Phase 3: Backend Routes, Validators, and Controllers (By Resource)

- [x] 16. Authentication (No Model Dependency)

  - [x] 16.1 Create routes/authRoutes.js

    - POST /register (public, rate limited 5/15min, organization, department, user)
    - POST /login (public, rate limited 5/15min)
    - DELETE /logout (protected, rate limited 5/15min)
    - GET /refresh-token (protected, rate limited 5/15min)
    - POST /forgot-password (public, rate limited 5/15min)
    - POST /reset-password (public, rate limited 5/15min)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.1, 3.2, 3.3, 3.4, 3.9, 3.10_

  - [x] 16.2 Create middlewares/validators/authValidators.js

    - registerValidator: organization, department, user fields with uniqueness checks using withDeleted()
    - loginValidator: email, password validation
    - forgotPasswordValidator: email validation
    - resetPasswordValidator: token, password validation
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.1, 3.2, 3.9, 3.10, 18.1, 18.2, 18.3_

  - [x] 16.3 Create controllers/authControllers.js

    - register: Create organization, department, user in transaction, send welcome email, emit Socket.IO events
    - login: Verify credentials, generate JWT tokens, set HTTP-only cookies, update lastLogin, emit user:online
    - logout: Clear cookies, update status to Offline, emit user:offline
    - refreshToken: Verify refresh token, generate new tokens with rotation, set cookies
    - forgotPassword: Generate reset token, hash and store, send reset email, always return success
    - resetPassword: Verify token, update password, clear reset fields, send confirmation email
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.1, 3.2, 3.3, 3.4, 3.9, 3.10, 14.1, 14.2, 14.6_

- [x] 17. Organization

  - [x] 17.1 Create routes/organizationRoutes.js

    - GET / (protected, authorize Organization read)
    - GET /:resourceId (protected, authorize Organization read)
    - PUT /:resourceId (protected, authorize Organization update)
    - DELETE /:resourceId (protected, authorize Organization delete)
    - PATCH /:resourceId/restore (protected, authorize Organization update)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 17.2 Create middlewares/validators/organizationValidators.js

    - createOrganizationValidator: name, email, phone uniqueness with withDeleted(), all required fields
    - updateOrganizationValidator: partial fields, uniqueness checks excluding current
    - organizationIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 1.2, 18.1, 18.2, 18.3_

  - [x] 17.3 Create controllers/organizationControllers.js

    - getOrganizations: List with pagination, filters (search, industry, deleted), Platform SuperAdmin sees all
    - getOrganization: Get single organization by ID
    - updateOrganization: Update with transaction, emit Socket.IO event
    - deleteOrganization: Soft delete with cascade (prevent platform org deletion), emit Socket.IO event
    - restoreOrganization: Restore with validation, emit Socket.IO event
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 12.1, 12.2, 12.3_

- [-] 18. Department

  - [x] 18.1 Create routes/departmentRoutes.js

    - GET / (protected, authorize Department read)
    - GET /:resourceId (protected, authorize Department read)
    - POST / (protected, authorize Department create)
    - PUT /:resourceId (protected, authorize Department update)
    - DELETE /:resourceId (protected, authorize Department delete)
    - PATCH /:resourceId/restore (protected, authorize Department update)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 18.2 Create middlewares/validators/departmentValidators.js

    - createDepartmentValidator: name, description, organization reference validation with withDeleted()
    - updateDepartmentValidator: partial fields, uniqueness checks
    - departmentIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 2.1, 18.1, 18.2, 18.3_

  - [x] 18.3 Create controllers/departmentControllers.js

    - getDepartments: List with pagination, filters (search, deleted), organization scoping
    - getDepartment: Get single department by ID
    - createDepartment: Create with transaction, emit Socket.IO event
    - updateDepartment: Update with transaction, emit Socket.IO event
    - deleteDepartment: Soft delete with cascade, emit Socket.IO event
    - restoreDepartment: Restore with validation (hod exists and isHod: true), emit Socket.IO event
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 12.1, 12.2, 12.3_

  - [x] 18.4 Validate, verify and implement

  - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema.
  - `docs/TIMEZONE-MANAGEMENT.md`.
  - `utils/*`.
  - `middlewares/*`.
  - `services/*` and `templates/*`
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [x] 19. User

  - [x] 19.1 Create routes/userRoutes.js

    - GET / (protected, authorize User read)
    - GET /:userId (protected, authorize User read)
    - POST / (protected, authorize User create)
    - PUT /:userId (protected, authorize User update)
    - PUT /:userId/profile (protected, authorize User update own)
    - GET /:userId/account (protected, authorize User read own)
    - GET /:userId/profile (protected, authorize User read own)
    - DELETE /:userId (protected, authorize User delete)
    - PATCH /:userId/restore (protected, authorize User update)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.5, 3.6, 3.7, 3.8_

  - [x] 19.2 Create middlewares/validators/userValidators.js

    - createUserValidator: all required fields, email uniqueness per org with withDeleted(), employeeId uniqueness per org, department/organization existence
    - updateUserValidator: partial fields, uniqueness checks excluding current, HOD constraints
    - userIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.6, 3.7, 18.1, 18.2, 18.3, 18.7, 18.8_

  - [x] 19.3 Create controllers/userControllers.js

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema
    - getUsers: List with pagination, filters (search, role, department, status, deleted), organization scoping
    - getUser: Get single user by ID
    - createUser: Create with transaction, auto-set isHod and isPlatformUser, send welcome email, emit Socket.IO event
    - updateUser: Update with transaction, auto-update isHod on role change, emit Socket.IO event
    - updateProfile: Update own profile with restrictions (cannot change role, department for non-SuperAdmin)
    - getAccount: Get current user's account information
    - getProfile: Get current user's profile and dashboard data
    - deleteUser: Soft delete with cascade (prevent last SuperAdmin/HOD deletion), remove from task arrays, emit Socket.IO event
    - restoreUser: Restore with validation, emit Socket.IO event
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.5, 3.6, 3.7, 3.8, 12.1, 12.2, 12.3, 14.1_

  - [x] 19.4 Validate, verify and implement

  - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema.
  - `docs/TIMEZONE-MANAGEMENT.md`.
  - `utils/*`.
  - `middlewares/*`.
  - `services/*` and `templates/*`
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [x] 20. Vendor

  - [x] 20.1 Create routes/vendorRoutes.js

    - GET / (protected, authorize Vendor read)
    - GET /:resourceId (protected, authorize Vendor read)
    - POST / (protected, authorize Vendor create)
    - PUT /:resourceId (protected, authorize Vendor update)
    - DELETE /:resourceId (protected, authorize Vendor delete)
    - PATCH /:resourceId/restore (protected, authorize Vendor update)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.3, 9.4, 9.5_

  - [x] 20.2 Create middlewares/validators/vendorValidators.js

    - createVendorValidator: name, organization reference, email/phone validation
    - updateVendorValidator: partial fields
    - vendorIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.3, 18.1, 18.2, 18.3_

  - [x] 20.3 Create controllers/vendorControllers.js

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema
    - getVendors: List with pagination, filters (search, deleted), organization scoping (NOT department)
    - getVendor: Get single vendor by ID with linked ProjectTasks
    - createVendor: Create with transaction, emit Socket.IO event
    - updateVendor: Update with transaction, emit Socket.IO event
    - deleteVendor: Soft delete (require ProjectTask reassignment), emit Socket.IO event
    - restoreVendor: Restore with validation (organization exists), emit Socket.IO event
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.3, 9.4, 9.5, 9.8, 12.1, 12.2, 12.3_

  - [x] 20.4 Validate, verify and implement

  - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema.
  - `docs/TIMEZONE-MANAGEMENT.md`.
  - `utils/*`.
  - `middlewares/*`.
  - `services/*` and `templates/*`
  - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [x] 21. Material

  - [x] 21.1 Create routes/materialRoutes.js

    - GET / (protected, authorize Material read)
    - GET /:resourceId (protected, authorize Material read)
    - POST / (protected, authorize Material create)
    - PUT /:resourceId (protected, authorize Material update)
    - DELETE /:resourceId (protected, authorize Material delete)
    - PATCH /:resourceId/restore (protected, authorize Material update)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.1, 9.2, 9.6, 9.7_

  - [x] 21.2 Create middlewares/validators/materialValidators.js

    - createMaterialValidator: name, category, unitType, price, department/organization references
    - updateMaterialValidator: partial fields
    - materialIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.1, 18.1, 18.2, 18.3_

  - [x] 21.3 Create controllers/materialControllers.js

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema
    - getMaterials: List with pagination, filters (category, department, search, deleted), organization scoping
    - getMaterial: Get single material by ID
    - createMaterial: Create with transaction, emit Socket.IO event
    - updateMaterial: Update with transaction, emit Socket.IO event
    - deleteMaterial: Soft delete (check for linked tasks/activities, unlink), emit Socket.IO event
    - restoreMaterial: Restore with validation (link back to previously linked resources), emit Socket.IO event
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.1, 9.2, 9.6, 9.7, 9.9, 12.1, 12.2, 12.3_

  - [x] 21.4 Validate, verify and implement

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema.
    - `docs/TIMEZONE-MANAGEMENT.md`.
    - `utils/*`.
    - `middlewares/*`.
    - `services/*` and `templates/*`
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [x] 22. Task (All Types: ProjectTask, RoutineTask, AssignedTask)

  - [x] 22.1 Create routes/taskRoutes.js

    - GET / (protected, authorize Task read)
    - GET /:resourceId (protected, authorize Task read)
    - POST / (protected, authorize Task create)
    - PUT /:resourceId (protected, authorize Task update)
    - DELETE /:resourceId (protected, authorize Task delete)
    - PATCH /:resourceId/restore (protected, authorize Task update)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 4.1-4.9, 5.1-5.9, 6.1-6.9_

  - [x] 22.2 Create middlewares/validators/taskValidators.js

    - createTaskValidator: task type-specific validation (ProjectTask requires vendor, RoutineTask requires dates and restricts status/priority, AssignedTask requires assignees)
    - updateTaskValidator: partial fields, task type-specific validation
    - taskIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 4.1, 4.2, 5.1, 5.2, 5.3, 6.1, 18.1, 18.2, 18.3, 18.9_

  - [x] 22.3 Create controllers/taskControllers.js

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema
    - getTasks: List with pagination, filters (taskType, status, priority, assigneeId, vendor, startDate range, dueDate range, search, deleted), organization scoping
    - getTask: Get single task by ID with activities and comments
    - createTask: Create with transaction (discriminator pattern), validate task type-specific fields, create notifications for watchers/assignees, emit Socket.IO event
    - updateTask: Update with transaction, validate task type-specific fields, emit Socket.IO event
    - deleteTask: Soft delete with cascade (activities, comments, attachments, notifications), emit Socket.IO event
    - restoreTask: Restore with validation (vendor/assignees/materials exist, prune invalid watchers), emit Socket.IO event
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 4.1-4.9, 5.1-5.9, 6.1-6.9, 12.1, 12.2, 12.3, 21.1, 21.2_

  - [x] 22.4 Validate, verify and implement

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema.
    - `docs/TIMEZONE-MANAGEMENT.md`.
    - `utils/*`.
    - `middlewares/*`.
    - `services/*` and `templates/*`
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [x] 23. TaskActivity

  - [x] 23.1 Create routes/taskActivityRoutes.js

    - GET / (protected, authorize TaskActivity read)
    - GET /:resourceId (protected, authorize TaskActivity read)
    - POST / (protected, authorize TaskActivity create)
    - PUT /:resourceId (protected, authorize TaskActivity update)
    - DELETE /:resourceId (protected, authorize TaskActivity delete)
    - PATCH /:resourceId/restore (protected, authorize TaskActivity update)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 23.2 Create middlewares/validators/taskActivityValidators.js

    - createTaskActivityValidator: activity, parent (ProjectTask or AssignedTask ONLY), materials validation
    - updateTaskActivityValidator: partial fields
    - taskActivityIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.1, 19.2, 18.1, 18.2, 18.3_

  - [x] 23.3 Create controllers/taskActivityControllers.js

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema
    - getTaskActivities: List with pagination, filters (parent, deleted), organization scoping
    - getTaskActivity: Get single activity by ID
    - createTaskActivity: Create with transaction, validate parent type (NOT RoutineTask), emit Socket.IO event
    - updateTaskActivity: Update with transaction, emit Socket.IO event
    - deleteTaskActivity: Soft delete with cascade (comments, attachments), emit Socket.IO event
    - restoreTaskActivity: Restore with validation (parent exists, materials exist), emit Socket.IO event
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.1, 19.2, 19.3, 19.4, 19.5, 12.1, 12.2, 12.3_

  - [x] 23.4 Validate, verify and implement

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema.
    - `docs/TIMEZONE-MANAGEMENT.md`.
    - `utils/*`.
    - `middlewares/*`.
    - `services/*` and `templates/*`
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [x] 24. TaskComment

  - [x] 24.1 Create routes/taskCommentRoutes.js

    - GET / (protected, authorize TaskComment read)
    - GET /:resourceId (protected, authorize TaskComment read)
    - POST / (protected, authorize TaskComment create)
    - PUT /:resourceId (protected, authorize TaskComment update)
    - DELETE /:resourceId (protected, authorize TaskComment delete)
    - PATCH /:resourceId/restore (protected, authorize TaskComment update)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.6, 19.7, 19.8, 19.9, 19.10_

  - [x] 24.2 Create middlewares/validators/taskCommentValidators.js

    - createTaskCommentValidator: comment, parent (Task/TaskActivity/TaskComment), mentions validation, max depth 3
    - updateTaskCommentValidator: partial fields
    - taskCommentIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.6, 19.7, 18.1, 18.2, 18.3_

  - [x] 24.3 Create controllers/taskCommentControllers.js

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema
    - getTaskComments: List with pagination, filters (parent, deleted), organization scoping
    - getTaskComment: Get single comment by ID
    - createTaskComment: Create with transaction, validate max depth 3, send email notifications to mentions, create notifications, emit Socket.IO event
    - updateTaskComment: Update with transaction, emit Socket.IO event
    - deleteTaskComment: Soft delete with cascade (child comments recursive, attachments), emit Socket.IO event
    - restoreTaskComment: Restore with validation (parent chain active, prune invalid mentions), emit Socket.IO event
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.6, 19.7, 19.8, 19.9, 19.10, 12.1, 12.2, 12.3, 14.3, 21.2_

  - [x] 24.4 Validate, verify and implement

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema.
    - `docs/TIMEZONE-MANAGEMENT.md`.
    - `utils/*`.
    - `middlewares/*`.
    - `services/*` and `templates/*`
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [x] 25. Attachment

  - [x] 25.1 Create routes/attachmentRoutes.js

    - GET / (protected, authorize Attachment read)
    - GET /:resourceId (protected, authorize Attachment read)
    - POST / (protected, authorize Attachment create)
    - DELETE /:resourceId (protected, authorize Attachment delete)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

  - [x] 25.2 Create middlewares/validators/attachmentValidators.js

    - createAttachmentValidator: filename, fileUrl, fileType, fileSize, parent validation, file type/size limits
    - attachmentIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 18.1, 18.2, 18.3_

  - [x] 25.3 Create controllers/attachmentControllers.js

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema
    - getAttachments: List with pagination, filters (parent, parentModel), organization scoping
    - getAttachment: Get single attachment by ID
    - createAttachment: Create with transaction, validate file type/size, enforce max 10 per entity, upload to Cloudinary, emit Socket.IO event
    - deleteAttachment: Soft delete (leaf node, no cascade), emit Socket.IO event
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10, 12.1, 12.2, 12.3_

  - [x] 25.4 Validate, verify and implement

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema.
    - `docs/TIMEZONE-MANAGEMENT.md`.
    - `utils/*`.
    - `middlewares/*`.
    - `services/*` and `templates/*`
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [x] 26. Notification

  - [x] 26.1 Create routes/notificationRoutes.js

    - GET / (protected, authorize Notification read own)
    - GET /:resourceId (protected, authorize Notification read own)
    - PATCH /:resourceId/read (protected, authorize Notification update own)
    - PATCH /read-all (protected, authorize Notification update own)
    - DELETE /:resourceId (protected, authorize Notification delete own)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.10_

  - [x] 26.2 Create middlewares/validators/notificationValidators.js

    - notificationIdValidator: valid MongoDB ObjectId
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 18.1, 18.2, 18.3_

  - [x] 26.3 Create controllers/notificationControllers.js

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema
    - getNotifications: List with pagination, filters (isRead, type), own notifications only, sort by createdAt desc (unread first)
    - getNotification: Get single notification by ID (own only)
    - markAsRead: Mark notification as read
    - markAllAsRead: Mark all user's notifications as read
    - deleteNotification: Delete notification (own only)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9, 21.10_

  - [x] 26.4 Validate, verify and implement

    - cascade delete/restore, linking/unlinking, weakRefs, criticalDependencies, restorePrerequisites, deletionCascadePolicy, using `docs/softDelete-doc.md` including on schema.
    - `docs/TIMEZONE-MANAGEMENT.md`.
    - `utils/*`.
    - `middlewares/*`.
    - `services/*` and `templates/*`
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [x] 27. Route Aggregation
  - [x] 27.1 Create routes/index.js
    - Aggregate all routes with proper prefixes: /api/auth, /api/organizations, /api/departments, /api/users, /api/vendors, /api/materials, /api/tasks, /api/task-activities, /api/task-comments, /api/attachments, /api/notifications
    - Apply global authentication middleware where needed
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All route requirements_

## Phase 4: Backend Testing

**NOTE:** The comprehensive Phase 4: Backend Testing with all 47 tasks (~1616 lines) has been created in `.kiro/specs/saas-task-manager-mvp/phase4-comprehensive.md`.

To replace this section with the full comprehensive version, copy the content from `phase4-comprehensive.md` and paste it here, or reference that file for the complete testing plan.

**Summary of Comprehensive Phase 4:**

- Phase 4.1: Test Setup and Infrastructure (1 task - 28)
- Phase 4.2: Test Phase 1 Foundation (10 tasks - 29-37: Config, Error Handling, Utils, Middleware, Validators, Services, Socket.IO, Soft Delete Plugin, App/Server)
- Phase 4.3: Test Phase 2 Models (4 tasks - 38-41: Core Models, Vendor/Material, Task Models, Activity/Comment/Attachment/Notification)
- Phase 4.4: Test Phase 3 Routes/Validators/Controllers (5 tasks - 42-46: Auth, Organization, Department/User/Vendor/Material, Tasks/Activity/Comment, Attachment/Notification)
- Phase 4.5: Final Testing Checkpoint (1 task - 47)

**Total: 47 comprehensive testing tasks** following the 5-point protocol with:

- Pre-Implementation Documentation Analysis (Requirement 26)
- Search, Validation, Action, Verification (line-by-line analysis)
- Pre-Test Phase Tracking + Pre-Git Workflow
- Complete Testing (unit, property, coverage)
- Post-Test Phase Tracking + Post-Git Workflow
- Test timeout: 960 seconds
- Coverage thresholds: statements 80%+, branches 75%+, functions 80%+, lines 80%+
- Property-based tests: minimum 100 iterations
- All tests use real MongoDB (NOT mongodb-memory-server)
- Never skip failing tests
- Local in sync with remote after phase completion

## Phase 5: Frontend Foundation and Core Infrastructure

- [ ] 29. Frontend Project Setup and Configuration

  - [ ] 29.1 Initialize frontend with Vite and install dependencies

    - Create client directory with Vite React template
    - Install all dependencies: react, react-dom, @mui/material, @mui/x-data-grid, @mui/x-date-pickers, @emotion/react, @emotion/styled, @reduxjs/toolkit, react-redux, redux-persist, react-router-dom, react-hook-form, socket.io-client, react-toastify, dayjs, axios
    - Install dev dependencies: @vitejs/plugin-react, eslint, vite
    - Create complete folder structure as specified in design
    - Setup .env file with VITE_API_URL
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All frontend requirements_

  - [ ] 29.2 Create constants (MUST MIRROR BACKEND EXACTLY)

    - Create utils/constants.js with ALL constants matching backend exactly (USER_ROLES, TASK_STATUS, TASK_PRIORITY, TASK_TYPES, USER_STATUS, MATERIAL_CATEGORIES, UNIT_TYPES, INDUSTRIES, PAGINATION, LIMITS, LENGTH_LIMITS, FILE_SIZE_LIMITS, FILE_TYPES, NOTIFICATION_TYPES, ATTACHMENT_TYPES)
    - Verify exact match with backend constants (case-sensitive)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements using constants_

  - [ ] 29.3 Create utility functions

    - Create utils/errorHandler.js with custom error class for frontend
    - Create utils/dateUtils.js with timezone management utilities (getUserTimezone, convertUTCToLocal, convertLocalToUTC, formatDateForDisplay, formatDateForAPI, getRelativeTime, isPastDate, isToday)
    - Configure dayjs with UTC and timezone plugins
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

  - [ ] 29.4 Create services

    - Create services/socketService.js with Socket.IO client service (connection management, event handling)
    - Create services/socketEvents.js with Socket.IO event handlers and RTK Query cache invalidation
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 8.1, 8.2, 8.3, 8.9, 15.2_

  - [ ] 29.5 Create hooks

    - Create hooks/useSocket.js with Socket.IO React hook
    - Create hooks/useAuth.js with authentication hook (access user state and auth methods)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 8.1, 3.2, 3.3, 3.4_

  - [ ] 29.6 Create theme infrastructure
    - Create theme/themePrimitives.js with theme primitives (colors, spacing, typography)
    - Create theme/AppTheme.jsx with theme provider and light/dark mode support
    - Create theme/customizations/index.js with component customizations aggregator
    - Create theme/customizations/inputs.js with input component overrides
    - Create theme/customizations/dataDisplay.js with data display component overrides
    - Create theme/customizations/feedback.js with feedback component overrides
    - Create theme/customizations/surfaces.js with surface component overrides
    - Create theme/customizations/navigation.js with navigation component overrides
    - Create theme/customizations/dataGrid.js with DataGrid component overrides
    - Create theme/customizations/datePickers.js with date picker component overrides
    - Create theme/customizations/charts.js with chart component overrides
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9_

## Phase 6: Frontend Redux Store and API Endpoints

- [ ] 30. Redux Store Setup

  - [ ] 30.1 Create base API configuration

    - Create redux/features/api.js with RTK Query base API (baseUrl, credentials: 'include', prepareHeaders, tagTypes for all resources)
    - Configure date transformation (UTC → local for responses, local → UTC for requests)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 15.1, 15.6, 15.7, 10.4, 10.5_

  - [ ] 30.2 Create auth slice

    - Create redux/features/auth/authSlice.js with local auth state (user, isAuthenticated, isLoading)
    - Create selectors: selectUser, selectIsAuthenticated, selectIsLoading
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 15.1, 3.2, 3.3, 3.4_

  - [ ] 30.3 Create store configuration

    - Create redux/app/store.js with configureStore (api reducer, auth slice with redux-persist, middleware configuration, setupListeners)
    - Configure redux-persist for auth slice only (storage: localStorage, key: 'auth', whitelist: ['user', 'isAuthenticated'])
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 15.1, 15.5_

- [ ] 31. Redux API Endpoints (In Dependency Order)

  - [ ] 31.1 Create authApi.js

    - Endpoints: register, login, logout, refreshToken, forgotPassword, resetPassword
    - Configure cache tags and invalidation
    - Handle AUTHENTICATION_ERROR with automatic logout
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.1, 3.2, 3.3, 3.4, 3.9, 3.10, 15.8_

  - [ ] 31.2 Create organizationApi.js

    - Endpoints: getOrganizations, getOrganization, createOrganization, updateOrganization, deleteOrganization, restoreOrganization
    - Configure cache tags: ['Organization']
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 31.3 Create departmentApi.js

    - Endpoints: getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment, restoreDepartment
    - Configure cache tags: ['Department']
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 31.4 Create userApi.js

    - Endpoints: getUsers, getUser, createUser, updateUser, updateProfile, getAccount, getProfile, deleteUser, restoreUser
    - Configure cache tags: ['User']
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.5, 3.6, 3.7, 3.8_

  - [ ] 31.5 Create vendorApi.js

    - Endpoints: getVendors, getVendor, createVendor, updateVendor, deleteVendor, restoreVendor
    - Configure cache tags: ['Vendor']
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.3, 9.4, 9.5_

  - [ ] 31.6 Create materialApi.js

    - Endpoints: getMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial, restoreMaterial
    - Configure cache tags: ['Material']
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.1, 9.2, 9.6, 9.7_

  - [ ] 31.7 Create taskApi.js

    - Endpoints: getTasks, getTask, createTask, updateTask, deleteTask, restoreTask
    - Configure cache tags: ['Task']
    - Handle all three task types (ProjectTask, RoutineTask, AssignedTask)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 4.1-4.9, 5.1-5.9, 6.1-6.9_

  - [ ] 31.8 Create taskActivityApi.js

    - Endpoints: getTaskActivities, getTaskActivity, createTaskActivity, updateTaskActivity, deleteTaskActivity, restoreTaskActivity
    - Configure cache tags: ['TaskActivity']
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ] 31.9 Create taskCommentApi.js

    - Endpoints: getTaskComments, getTaskComment, createTaskComment, updateTaskComment, deleteTaskComment, restoreTaskComment
    - Configure cache tags: ['TaskComment']
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.6, 19.7, 19.8, 19.9, 19.10_

  - [ ] 31.10 Create attachmentApi.js

    - Endpoints: getAttachments, getAttachment, createAttachment, deleteAttachment
    - Configure cache tags: ['Attachment']
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

  - [ ] 31.11 Create notificationApi.js
    - Endpoints: getNotifications, getNotification, markAsRead, markAllAsRead, deleteNotification
    - Configure cache tags: ['Notification']
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.10_

## Phase 7: Frontend Common Components

- [ ] 32. Form Components

  - [ ] 32.1 Create MUI form input wrappers

    - Create MuiTextField.jsx with validation and error display
    - Create MuiTextArea.jsx with character counter
    - Create MuiNumberField.jsx with prefix/suffix support
    - Create MuiSelectAutocomplete.jsx for single-select
    - Create MuiMultiSelect.jsx with chips
    - Create MuiResourceSelect.jsx for fetching and selecting resources (users, departments, materials, vendors)
    - Create MuiDatePicker.jsx with automatic UTC ↔ local conversion
    - Create MuiDateRangePicker.jsx with automatic UTC ↔ local conversion
    - Create MuiCheckbox.jsx with label
    - Create MuiRadioGroup.jsx for radio buttons
    - Create MuiFileUpload.jsx with preview and Cloudinary upload
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 16.1, 16.2, 16.3, 16.4, 16.5, 16.8, 10.7_

- [ ] 33. DataGrid Components

  - [ ] 33.1 Create DataGrid wrappers

    - Create MuiDataGrid.jsx with automatic pagination conversion (0-based ↔ 1-based)
    - Create MuiActionColumn.jsx with View/Edit/Delete/Restore buttons and auto soft-delete detection
    - Create CustomDataGridToolbar.jsx with export, filters, columns
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 16.2, 16.7_

- [ ] 34. Filter Components

  - [ ] 34.1 Create filter components

    - Create FilterTextField.jsx with debouncing
    - Create FilterSelect.jsx for single/multiple selection
    - Create FilterDateRange.jsx with UTC ↔ local conversion
    - Create FilterChipGroup.jsx for active filters display
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 16.1, 16.2, 10.7_

- [ ] 35. Dialog Components

  - [ ] 35.1 Create dialog wrappers

    - Create MuiDialog.jsx with accessibility props (disableEnforceFocus, disableRestoreFocus, aria-labelledby, aria-describedby)
    - Create MuiDialogConfirm.jsx for confirmation dialogs
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 16.6_

- [ ] 36. Loading Components

  - [ ] 36.1 Create loading components

    - Create MuiLoading.jsx with CircularProgress and optional message
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 16.9_

- [ ] 37. Utility Components
  - [ ] 37.1 Create utility components
    - Create NotificationMenu.jsx with notification dropdown and unread count
    - Create GlobalSearch.jsx with Ctrl+K shortcut
    - Create ErrorBoundary.jsx for React error catching
    - Create RouteError.jsx for route error display (404, etc.)
    - Create CustomIcons.jsx with custom icon components
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 16.1, 16.2, 17.9_

## Phase 8: Frontend Resource-Specific Components

- [ ] 38. Organization Components

  - [ ] 38.1 Create organization components

    - Create columns/OrganizationColumns.jsx with column definitions
    - Create cards/OrganizationCard.jsx with React.memo, useCallback, useMemo
    - Create lists/OrganizationList.jsx with empty state handling
    - Create filters/OrganizationFilter.jsx with filter UI
    - Create forms/organizations/CreateUpdateOrganization.jsx with React Hook Form and Controller
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 16.3, 16.8_

- [ ] 39. Department Components

  - [ ] 39.1 Create department components

    - Create columns/DepartmentColumns.jsx
    - Create cards/DepartmentCard.jsx with React.memo
    - Create lists/DepartmentList.jsx
    - Create filters/DepartmentFilter.jsx
    - Create forms/departments/CreateUpdateDepartment.jsx
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 2.1, 2.2, 2.3, 2.4, 2.5, 16.3, 16.8_

- [ ] 40. User Components

  - [ ] 40.1 Create user components

    - Create columns/UserColumns.jsx
    - Create cards/UserCard.jsx with React.memo
    - Create lists/UserList.jsx
    - Create filters/UserFilter.jsx
    - Create forms/users/CreateUpdateUser.jsx
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.5, 3.6, 3.7, 3.8, 16.3, 16.8_

- [ ] 41. Vendor Components

  - [ ] 41.1 Create vendor components

    - Create columns/VendorColumns.jsx
    - Create cards/VendorCard.jsx with React.memo
    - Create lists/VendorList.jsx
    - Create filters/VendorFilter.jsx
    - Create forms/vendors/CreateUpdateVendor.jsx
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.3, 9.4, 9.5, 16.3, 16.8_

- [ ] 42. Material Components

  - [ ] 42.1 Create material components

    - Create columns/MaterialColumns.jsx
    - Create cards/MaterialCard.jsx with React.memo
    - Create lists/MaterialList.jsx
    - Create filters/MaterialFilter.jsx
    - Create forms/materials/CreateUpdateMaterial.jsx
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 9.1, 9.2, 9.6, 9.7, 16.3, 16.8_

- [ ] 43. Task Components

  - [ ] 43.1 Create task components

    - Create columns/TaskColumns.jsx
    - Create cards/TaskCard.jsx with React.memo (handle all three task types)
    - Create lists/TaskList.jsx
    - Create filters/TaskFilter.jsx
    - Create forms/tasks/CreateUpdateTask.jsx (handle task type-specific fields)
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 4.1-4.9, 5.1-5.9, 6.1-6.9, 16.3, 16.8_

- [ ] 44. TaskActivity Components

  - [ ] 44.1 Create task activity components

    - Create columns/TaskActivityColumns.jsx
    - Create cards/TaskActivityCard.jsx with React.memo
    - Create lists/TaskActivityList.jsx
    - Create forms/taskActivities/CreateUpdateTaskActivity.jsx
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.1, 19.2, 19.3, 4, 19.5, 16.3, 16.8_

- [ ] 45. TaskComment Components

  - [ ] 45.1 Create task comment components

    - Create columns/TaskCommentColumns.jsx
    - Create cards/TaskCommentCard.jsx with React.memo (handle threaded comments)
    - Create lists/TaskCommentList.jsx
    - Create forms/taskComments/CreateUpdateTaskComment.jsx
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 19.6, 19.7, 19.8, 19.9, 19.10, 16.3, 16.8_

- [ ] 46. Attachment Components

  - [ ] 46.1 Create attachment components

    - Create columns/AttachmentColumns.jsx
    - Create cards/AttachmentCard.jsx with React.memo
    - Create lists/AttachmentList.jsx
    - Create forms/attachments/UploadAttachment.jsx
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 16.3, 16.8_

- [ ] 47. Notification Components
  - [ ] 47.1 Create notification components
    - Create columns/NotificationColumns.jsx
    - Create cards/NotificationCard.jsx with React.memo
    - Create lists/NotificationList.jsx
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.10, 16.3, 16.8_

## Phase 9: Frontend Layouts and Pages

- [ ] 48. Layouts

  - [ ] 48.1 Create layout components

    - Create layouts/RootLayout.jsx with Outlet
    - Create layouts/PublicLayout.jsx for public pages
    - Create layouts/DashboardLayout.jsx with Header, Sidebar, Footer
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 16.1, 16.2_

- [ ] 49. Auth Components

  - [ ] 49.1 Create auth components

    - Create components/auth/ProtectedRoute.jsx to restrict access to authenticated users
    - Create components/auth/PublicRoute.jsx to redirect authenticated users
    - Create components/auth/AuthProvider.jsx for auth context
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.2, 3.3, 3.4_

- [ ] 50. Public Pages

  - [ ] 50.1 Create public pages

    - Create pages/Home.jsx with landing page
    - Create pages/Login.jsx with login form
    - Create pages/Register.jsx with multi-step registration (organization, department, user)
    - Create pages/ForgotPassword.jsx with password reset request
    - Create pages/ResetPassword.jsx with password reset form
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 3.1, 3.2, 3.9, 3.10_

- [ ] 51. Protected Pages
  - [ ] 51.1 Create protected pages
    - Create pages/Dashboard.jsx with widgets and statistics
    - Create pages/Organizations.jsx with DataGrid pattern (Platform SuperAdmin only)
    - Create pages/Organization.jsx with organization detail
    - Create pages/Departments.jsx with DataGrid pattern
    - Create pages/Users.jsx with Three-Layer pattern
    - Create pages/Materials.jsx with DataGrid pattern
    - Create pages/Vendors.jsx with DataGrid pattern
    - Create pages/Tasks.jsx with Three-Layer pattern (all task types)
    - Create pages/TaskDetail.jsx with task detail, activities, and comments
    - Create pages/NotFound.jsx with 404 page
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 1.1-1.8, 2.1-2.9, 3.5-3.8, 4.1-4.9, 5.1-5.9, 6.1-6.9, 9.1-9.9, 16.1, 16.2_

## Phase 10: Frontend Routing and App Entry

- [ ] 52. Routing

  - [ ] 52.1 Create route configuration

    - Create router/routes.jsx with all routes, lazy loading, protected routes, error boundaries
    - Configure nested routes for layouts
    - Configure route parameters for detail pages
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All page requirements_

- [ ] 53. App Entry Point

  - [ ] 53.1 Create root component

    - Create App.jsx with theme provider, Redux provider with persistor, router provider, Socket.IO setup and event handlers, toast container, error boundary
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 15.1, 15.5, 8.1, 8.2, 8.3, 8.9, 17.7_

  - [ ] 53.2 Create main entry
    - Create main.jsx with React DOM render and StrictMode
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

## Phase 11: Frontend Testing

- [ ] 54. Frontend Testing Checkpoint
  - [ ] 54.1 Ensure all tests pass, ask the user if questions arise
    - Run all frontend tests: npm test
    - Verify all tests pass
    - Fix any failing tests
    - Update docs/dev-phase-tracker.md with test results
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8, 25.9, 25.10_

## Phase 12: Integration and Deployment

- [ ] 55. Integration Testing

  - [ ] 55.1 Test complete application flow

    - Test registration and login flow
    - Test organization, department, user management
    - Test all three task types (ProjectTask, RoutineTask, AssignedTask)
    - Test task activities and comments
    - Test material and vendor management
    - Test attachments and notifications
    - Test real-time updates via Socket.IO
    - Test soft delete and restore operations
    - Test authorization and role-based access
    - Test timezone conversion across different timezones
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [ ] 56. Production Build

  - [ ] 56.1 Build frontend for production

    - Run npm run build in client directory
    - Verify build output in client/dist
    - Test production build locally
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

  - [ ] 56.2 Configure backend to serve frontend

    - Configure Express to serve static files from client/dist in production
    - Test complete application with backend serving frontend
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

- [ ] 57. Environment Configuration

  - [ ] 57.1 Configure production environment

    - Setup production environment variables
    - Configure MongoDB production connection
    - Configure SSL/TLS certificates
    - Configure Cloudinary for production
    - Configure email service for production
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, 11.1, 11.2, 11.3, 11.4, 11.5, 14.1, 14.2, 14.3, 20.10_

- [ ] 58. Deployment
  - [ ] 58.1 Deploy application
    - Setup PM2 or systemd for process management
    - Setup Nginx reverse proxy
    - Configure security hardening
    - Setup monitoring and logging
    - Setup backup strategy
    - _Requirements: 23.1-23.10, 26.1-26.10, 24.1-24.10, All requirements_

## Notes

- **CRITICAL**: Before starting ANY task, perform comprehensive documentation analysis as specified in Requirement 26
- **CRITICAL**: Use CustomError static helper methods ONLY (validation, authentication, authorization, notFound, conflict, internal)
- **CRITICAL**: All write operations MUST use MongoDB transactions
- **CRITICAL**: All models MUST use soft delete plugin
- **CRITICAL**: All dates MUST be stored in UTC and converted at boundaries
- **CRITICAL**: Frontend constants MUST mirror backend exactly
- **CRITICAL**: Use real MongoDB for testing (NOT mongodb-memory-server)
- **CRITICAL**: Tests executed ONLY at phase completion (backend after Phase 4, frontend after Phase 11)
- **CRITICAL**: Git workflow management on task start/complete as specified in Requirement 23
- **CRITICAL**: Phase tracking documentation as specified in Requirement 24

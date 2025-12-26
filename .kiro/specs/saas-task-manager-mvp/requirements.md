# Requirements Document

## Introduction

This document specifies the requirements for a Multi-Tenant SaaS Task Manager - an enterprise task management system with strict data isolation and role-based access control. The system enables organizations to manage three distinct task types (ProjectTask, RoutineTask, AssignedTask) with complete multi-tenancy isolation, real-time updates, and comprehensive audit trails through soft delete functionality.

## Glossary

- **Platform Organization**: The service provider organization with `isPlatformOrg: true`, managing the entire SaaS system with exactly ONE instance
- **Customer Organization**: Regular tenant organizations with `isPlatformOrg: false`, completely isolated from each other
- **HOD (Head of Department)**: Users with SuperAdmin or Admin roles, automatically designated as department heads with `isHod: true`
- **Soft Delete**: Logical deletion marking records as deleted without physical removal, with TTL-based auto-cleanup
- **TTL (Time To Live)**: Automatic cleanup period after soft deletion (Users 365d, Tasks 180d, Activities 90d, Notifications 30d)
- **Discriminator Pattern**: Mongoose pattern for task type inheritance (BaseTask → ProjectTask/RoutineTask/AssignedTask)
- **Scope**: Authorization level (own, ownDept, crossDept, crossOrg)
- **Session**: MongoDB transaction session for atomic multi-document operations
- **ES Modules**: ECMAScript modules using import/export syntax (`"type": "module"` in package.json)
- **HTTP-Only Cookie**: Secure cookie storage preventing JavaScript access for XSS protection
- **RBAC**: Role-Based Access Control with four roles (SuperAdmin, Admin, Manager, User)
- **Cascade Operation**: Automatic propagation of soft delete/restore to related child documents
- **Property-Based Testing**: Testing approach verifying universal properties across all valid inputs using fast-check library
- **Zero Timezone Offset**: All dates stored in UTC, converted at application boundaries

## Requirements

### Requirement 1: Multi-Tenancy and Organization Management

**User Story:** As a platform administrator, I want to manage multiple isolated customer organizations, so that each tenant's data remains completely separate and secure.

#### Acceptance Criteria

1. WHEN the system initializes, THE System SHALL create exactly one Platform Organization with `isPlatformOrg: true` and immutable flag
2. WHEN a new customer registers via frontend, THE System SHALL create a Customer Organization with `isPlatformOrg: false`, unique name (lowercase, max 100 chars), unique email (max 50 chars), unique phone matching pattern /^(\+251\d{9}|0\d{9})$/, and fields: description (max 2000), address (max 500), industry (one of 24 industries), logoUrl with publicId
3. WHEN a Platform SuperAdmin queries organizations, THE System SHALL return all organizations with crossOrg scope including platform and all customer organizations
4. WHEN a Customer SuperAdmin queries resources, THE System SHALL filter results by organization.\_id to only their own organization
5. WHEN attempting to delete the Platform Organization, THE System SHALL prevent the deletion with hard-coded protection and return AUTHORIZATION_ERROR
6. WHEN an organization is soft-deleted, THE System SHALL cascade delete to all Departments, Users, Tasks (all types), TaskActivities, TaskComments, Materials, Vendors, Attachments, and Notifications within a MongoDB transaction
7. WHEN an organization is created, THE System SHALL set createdBy field to the user who created it and auto-set isPlatformOrg based on creation context
8. WHEN querying organizations, THE System SHALL support pagination with page (1-based), limit (default 10, max 100), sortBy (default createdAt), sortOrder (default desc), search (text search), industry filter, and deleted filter

### Requirement 2: Department Management and HOD Assignment

**User Story:** As an organization administrator, I want to create and manage departments with designated heads, so that organizational structure is maintained.

#### Acceptance Criteria

1. WHEN creating a department, THE System SHALL require fields: name (max 100 chars), description (max 2000 chars), organization reference, and createdBy reference
2. WHEN a user with SuperAdmin or Admin role is assigned to a department, THE System SHALL automatically set `isHod: true` via pre-save hook
3. WHEN a user with Manager or User role is assigned to a department, THE System SHALL automatically set `isHod: false` via pre-save hook
4. WHEN attempting to delete the last HOD in a department, THE System SHALL prevent the deletion and return AUTHORIZATION_ERROR with message "Cannot delete last HOD in department"
5. WHERE a department exists, THE System SHALL enforce uniqueness of name per organization through compound unique index on {organization, name}
6. WHEN a department is soft-deleted, THE System SHALL cascade delete to all Users, Tasks (all types), and Materials within a MongoDB transaction
7. WHEN a department is soft-deleted, THE System SHALL set hod field to null if the HOD reference becomes invalid
8. WHEN a department is restored, THE System SHALL validate that hod exists and has isHod: true, setting to null if invalid
9. WHEN querying departments, THE System SHALL support pagination, search, and deleted filter with organization scoping for Customer SuperAdmin/Admin

### Requirement 3: User Authentication and Authorization

**User Story:** As a system user, I want secure authentication with role-based permissions, so that I can access only the resources appropriate for my role.

#### Acceptance Criteria

1. WHEN a user registers, THE System SHALL hash the password using bcrypt with minimum 12 salt rounds and store with select: false
2. WHEN a user logs in with valid credentials, THE System SHALL generate JWT access token (15min expiry, JWT_ACCESS_SECRET) and refresh token (7 days expiry, JWT_REFRESH_SECRET) stored in HTTP-only cookies with httpOnly: true, secure: true in production, sameSite: 'strict', and appropriate maxAge
3. WHEN a user's access token expires, THE System SHALL allow token refresh using the refresh token with token rotation (new refresh token issued)
4. WHEN a user logs out, THE System SHALL clear both access_token and refresh_token cookies and update user status to 'Offline'
5. WHEN a user requests a protected resource, THE System SHALL verify JWT token via verifyJWT middleware and check authorization scope via authorize middleware based on role, organization, department, and resource ownership
6. WHEN a user is created, THE System SHALL require fields: firstName (max 20), lastName (max 20), email (unique per org, lowercase, max 50), password (min 8), organization reference, department reference, role (enum: SuperAdmin/Admin/Manager/User, default User), employeeId (4-digit 1000-9999, unique per org), dateOfBirth (not future), joinedAt (required, not future), and optional fields: position (max 100), profilePicture (url, publicId), skills (array max 10: {skill max 50, percentage 0-100})
7. WHEN a user is created, THE System SHALL auto-set isPlatformUser based on organization.isPlatformOrg and isHod based on role via pre-save hook
8. WHEN a user is soft-deleted, THE System SHALL remove them from all task watchers, task assignees, and comment mentions arrays, and cascade delete to created tasks, activities, comments, attachments, and notifications
9. WHEN a user requests password reset, THE System SHALL generate random reset token, hash with bcrypt (10 rounds), store in passwordResetToken field with passwordResetExpires (1 hour), and send reset email with unhashed token
10. WHEN password reset is completed, THE System SHALL verify token, update password, clear passwordResetToken and passwordResetExpires fields, and send confirmation email

### Requirement 4: Task Type Management - ProjectTask

**User Story:** As a department user, I want to create tasks outsourced to external vendors, so that I can track vendor work progress and costs.

#### Acceptance Criteria

1. WHEN creating a ProjectTask, THE System SHALL require fields: title (max 50), description (max 2000), vendor reference (required), organization reference, department reference, createdBy reference, and optional fields: estimatedCost (min 0), actualCost (min 0), currency (default ETB), startDate, dueDate (must be after startDate), status (enum: To Do/In Progress/Completed/Pending, default To Do), priority (enum: Low/Medium/High/Urgent, default Medium), attachments (array max 10, unique), watchers (array max 20, unique, HOD only), tags (array max 5, max 50 each, unique case-insensitive)
2. WHEN a ProjectTask is created, THE System SHALL allow all status values (To Do, In Progress, Completed, Pending) without restriction
3. WHEN a ProjectTask is created, THE System SHALL allow all priority values (Low, Medium, High, Urgent) without restriction
4. WHEN adding watchers to a ProjectTask, THE System SHALL validate that all watchers have `isHod: true` and belong to the same organization
5. WHEN materials are added to a ProjectTask, THE System SHALL require them to be added via TaskActivity with materials array containing {material reference, quantity min 0} and attachments as proof
6. WHEN a ProjectTask is updated, THE System SHALL track cost changes in costHistory array (max 200 entries) with {amount, type: estimated/actual, updatedBy reference, updatedAt}
7. WHEN a ProjectTask is soft-deleted, THE System SHALL cascade delete to all TaskActivities, TaskComments, Attachments, and Notifications within a transaction
8. WHEN a ProjectTask is restored, THE System SHALL validate vendor exists and is not deleted, validate createdBy exists, and prune invalid watchers
9. WHEN querying ProjectTasks, THE System SHALL support filters: taskType, status, priority, vendor, startDate range, dueDate range, search (text on tags), and deleted filter

### Requirement 5: Task Type Management - RoutineTask

**User Story:** As a department user, I want to log daily routine tasks received from outlets, so that I can track completed work with materials used.

#### Acceptance Criteria

1. WHEN creating a RoutineTask, THE System SHALL require fields: description (max 2000), startDate (REQUIRED, not future), dueDate (REQUIRED, must be after startDate, not future), organization reference, department reference, createdBy reference, materials array (max 20: {material reference, quantity min 0}, added DIRECTLY), and optional fields: status (restricted), priority (restricted), attachments (array max 10), tags (array max 5)
2. WHEN creating a RoutineTask, THE System SHALL prevent status "To Do" and only allow In Progress, Completed, or Pending
3. WHEN creating a RoutineTask, THE System SHALL prevent priority "Low" and only allow Medium, High, or Urgent
4. WHEN adding materials to a RoutineTask, THE System SHALL allow direct addition to the task.materials array without TaskActivity intermediary
5. WHEN querying TaskActivity for a RoutineTask, THE System SHALL return empty results as RoutineTask does not support activities
6. WHEN a RoutineTask is soft-deleted, THE System SHALL cascade delete to TaskComments, Attachments, and Notifications (NO TaskActivity) within a transaction
7. WHEN a RoutineTask is restored, THE System SHALL validate materials exist and are not deleted, validate createdBy exists, and prune invalid material references
8. WHEN updating a RoutineTask, THE System SHALL allow comments via TaskComment for changes/updates/corrections but NOT TaskActivity
9. WHEN a RoutineTask is created, THE System SHALL NOT allow watchers field as it is not applicable to RoutineTask

### Requirement 6: Task Type Management - AssignedTask

**User Story:** As a manager, I want to assign tasks to users or groups of users, so that work can be distributed and tracked.

#### Acceptance Criteria

1. WHEN creating an AssignedTask, THE System SHALL require fields: title (max 50), description (max 2000), assignees (ref User or array of Users, REQUIRED, max 20, unique), organization reference, department reference, createdBy reference, and optional fields: startDate, dueDate (must be after startDate if both provided), status (enum: To Do/In Progress/Completed/Pending, default To Do), priority (enum: Low/Medium/High/Urgent, default Medium), attachments (array max 10), watchers (array max 20, HOD only), tags (array max 5)
2. WHEN creating an AssignedTask, THE System SHALL allow all status values (To Do, In Progress, Completed, Pending) without restriction
3. WHEN creating an AssignedTask, THE System SHALL allow all priority values (Low, Medium, High, Urgent) without restriction
4. WHEN assigned users add materials to an AssignedTask, THE System SHALL require materials to be added via TaskActivity with materials array containing {material reference, quantity min 0} and attachments as proof
5. WHEN an assignee is soft-deleted, THE System SHALL remove them from the assignees array during restore validation and ensure at least one active assignee remains
6. WHEN an AssignedTask is soft-deleted, THE System SHALL cascade delete to TaskActivities, TaskComments, Attachments, and Notifications within a transaction
7. WHEN an AssignedTask is restored, THE System SHALL validate at least one assignee exists and is not deleted, validate createdBy exists, and prune invalid assignees
8. WHEN updating an AssignedTask, THE System SHALL allow comments via TaskComment for changes/updates/corrections
9. WHEN querying AssignedTasks, THE System SHALL support filters: assigneeId, status, priority, startDate range, dueDate range, search, and deleted filter

### Requirement 7: Soft Delete and Cascade Operations

**User Story:** As a system administrator, I want deleted records to be recoverable for a period of time, so that accidental deletions can be reversed.

#### Acceptance Criteria

1. WHEN a resource is deleted, THE System SHALL set `isDeleted: true`, `deletedAt: current timestamp`, `deletedBy: user._id`, and increment `__v` version field
2. WHEN a parent resource is soft-deleted, THE System SHALL cascade soft delete to all child resources within a MongoDB transaction session following cascade order: Organization → Departments/Users/Tasks/Materials/Vendors/Notifications, Department → Users/Tasks/Materials, User → Tasks/Activities/Comments/Attachments/Notifications, Task → Activities/Comments/Attachments/Notifications, Activity → Comments/Attachments, Comment → Child Comments (recursive)/Attachments
3. WHEN querying resources without `withDeleted()` query helper, THE System SHALL automatically filter `isDeleted: false` via middleware
4. WHEN a soft-deleted resource exceeds its TTL period, THE System SHALL automatically hard delete the record via TTL index: Users 365 days, Tasks 180 days, Activities 90 days, Comments 90 days, Departments 365 days, Materials 180 days, Vendors 180 days, Attachments 90 days, Notifications 30 days, Organizations never (TTL null)
5. WHEN a resource is restored, THE System SHALL set `isDeleted: false`, `restoredAt: current timestamp`, `restoredBy: user._id`, clear `deletedAt` and `deletedBy`, and increment `__v` version field
6. WHEN a resource is restored, THE System SHALL validate all references (organization, department, createdBy, parent, etc.) exist and are not deleted, pruning invalid references where applicable
7. WHEN hard delete operations (deleteOne, deleteMany, findOneAndDelete, remove) are attempted, THE System SHALL block them and throw error "Hard delete operations are not allowed. Use soft delete instead."
8. WHEN using soft delete plugin, THE System SHALL provide static methods: softDeleteById, softDeleteMany, restoreById, restoreMany, findDeletedByIds, countDeleted, ensureTTLIndex, getRestoreAudit
9. WHEN using soft delete plugin, THE System SHALL provide instance methods: softDelete(deletedBy, {session}), restore(restoredBy, {session})

### Requirement 8: Real-Time Communication

**User Story:** As a user, I want to receive instant notifications when tasks are created or updated, so that I can respond quickly to changes.

#### Acceptance Criteria

1. WHEN a user connects to the system, THE System SHALL establish a Socket.IO connection with CORS configuration matching backend corsOptions, withCredentials: true for HTTP-only cookies, and join rooms: `user:${userId}`, `department:${departmentId}`, `organization:${organizationId}`
2. WHEN a task is created, THE System SHALL emit a `task:created` event with task data to rooms: `department:${task.department}` and `organization:${task.organization}`, and invalidate RTK Query cache tags ['Task'] on frontend
3. WHEN a task is updated, THE System SHALL emit a `task:updated` event with task data to rooms: `department:${task.department}` and `organization:${task.organization}`, and invalidate RTK Query cache tag [{type: 'Task', id: task._id}] on frontend
4. WHEN a notification is created, THE System SHALL emit a `notification:created` event with notification data to room: `user:${notification.recipient}`, and invalidate RTK Query cache tags ['Notification'] on frontend
5. WHEN a user disconnects, THE System SHALL update their status to 'Offline', leave all rooms (`user:${userId}`, `department:${departmentId}`, `organization:${organizationId}`), and emit `user:offline` event
6. WHEN a user logs in, THE System SHALL update their status to 'Online', emit `user:online` event to department and organization rooms
7. WHEN Socket.IO events are emitted, THE System SHALL use socketEmitter utility with emitToRooms(event, data, rooms) pattern
8. WHEN frontend receives Socket.IO events, THE System SHALL handle them in socketEvents.js with automatic RTK Query cache invalidation
9. WHEN Socket.IO connection fails, THE System SHALL attempt reconnection with exponential backoff: reconnectionDelay 1000ms, reconnectionDelayMax 5000ms, reconnectionAttempts 5

### Requirement 9: Material and Vendor Management

**User Story:** As a department manager, I want to track materials and vendors, so that I can manage resources and external relationships.

#### Acceptance Criteria

1. WHEN creating a material, THE System SHALL require fields: name (max 100), category (enum: Electrical/Mechanical/Plumbing/Hardware/Cleaning/Textiles/Consumables/Construction/Other), unitType (enum: 30+ types including pcs/kg/g/l/ml/m/cm/mm/m2/m3/box/pack/roll/sheet/bag/bottle/can/carton/dozen/gallon/inch/foot/yard/mile/ounce/pound/ton/liter/milliliter/cubic meter/square meter), price (min 0), department reference, organization reference, and optional fields: description (max 2000), addedBy reference
2. WHEN a material is soft-deleted, THE System SHALL check for linked tasks (RoutineTask.materials array) and activities (TaskActivity.materials array) and unlink from all resources before deletion
3. WHEN creating a vendor, THE System SHALL require fields: name (max 100), organization reference (NOT department-specific), and optional fields: description (max 2000), contactPerson (max 100), email (valid, max 50), phone (pattern /^(\+251\d{9}|0\d{9})$/), address (max 500), createdBy reference
4. WHEN a vendor is soft-deleted, THE System SHALL require reassignment of all linked ProjectTasks to another vendor before allowing deletion, or return CONFLICT_ERROR
5. WHEN a vendor is restored, THE System SHALL validate that the organization still exists and is not deleted
6. WHEN a material is restored, THE System SHALL link back to all previously linked tasks and activities if they still exist and are not deleted
7. WHEN querying materials, THE System SHALL support filters: category, department, search, deleted, with pagination and organization scoping
8. WHEN querying vendors, THE System SHALL support filters: organization, search, deleted, with pagination and organization scoping (NOT department scoping)
9. WHEN a material is used in a task or activity, THE System SHALL store quantity (min 0) along with material reference in materials array

### Requirement 10: Timezone Management

**User Story:** As a user in any timezone, I want to see dates and times in my local timezone, so that deadlines and schedules are clear and accurate.

#### Acceptance Criteria

1. WHEN the backend server starts, THE System SHALL set process.env.TZ = 'UTC' and verify timezone with console.log of current date in UTC
2. WHEN a date is saved to the database, THE System SHALL convert it to UTC using dayjs(date).utc().toDate() in pre-save hooks before storage
3. WHEN a date is returned from the API, THE System SHALL format it as an ISO 8601 string in UTC using dayjs(date).utc().toISOString() in toJSON transform
4. WHEN the frontend receives a date from the API, THE System SHALL convert it to the user's local timezone using convertUTCToLocal(utcDate) which returns dayjs.utc(utcDate).tz(getUserTimezone())
5. WHEN a user inputs a date in the frontend, THE System SHALL convert it from local timezone to UTC using convertLocalToUTC(localDate) which returns dayjs.tz(localDate, getUserTimezone()).utc().toISOString() before sending to the API
6. WHEN displaying dates in UI components, THE System SHALL use formatDateForDisplay(date, format) which converts UTC to local and formats with default format 'MMM DD, YYYY HH:mm'
7. WHEN using MUI DatePicker, THE System SHALL automatically convert UTC to local for display and local to UTC for form state via Controller with value={value ? convertUTCToLocal(value) : null} and onChange={(newValue) => onChange(newValue ? convertLocalToUTC(newValue) : null)}
8. WHEN Mongoose timestamps (createdAt, updatedAt) are created, THE System SHALL store them in UTC automatically
9. WHEN validating dates, THE System SHALL ensure dueDate is after startDate using UTC comparison
10. WHEN querying with date ranges, THE System SHALL convert frontend local dates to UTC before sending to backend API

### Requirement 11: Security and Rate Limiting

**User Story:** As a security administrator, I want the system to be protected against common attacks, so that user data remains secure.

#### Acceptance Criteria

1. WHEN the application starts, THE System SHALL apply security middleware in order: helmet (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, hide X-Powered-By), cors (origin validation, credentials enabled, no wildcards in production), cookieParser, express.json (10mb limit), mongoSanitize (removes $ and . from user input), compression (gzip for responses >1KB)
2. WHEN a request is received, THE System SHALL sanitize input using express-mongo-sanitize to prevent NoSQL injection attacks by removing $ and . operators
3. WHEN authentication endpoints (/api/auth/login, /api/auth/register, /api/auth/forgot-password, /api/auth/reset-password, /api/auth/refresh-token, /api/auth/logout) are accessed in production, THE System SHALL limit requests to 5 per 15 minutes per IP address with message "Too many authentication attempts, please try again later"
4. WHEN general API endpoints are accessed in production, THE System SHALL limit requests to 100 per 15 minutes per IP address with message "Too many requests, please try again later"
5. WHEN CORS validation occurs, THE System SHALL only allow requests from configured allowed origins (development: http://localhost:3000, http://localhost:5173; production: process.env.CLIENT_URL + process.env.ALLOWED_ORIGINS) with credentials: true, methods: GET/POST/PUT/PATCH/DELETE/OPTIONS, allowedHeaders: Content-Type/Authorization/X-Requested-With, exposedHeaders: X-Request-ID/X-RateLimit-Limit/X-RateLimit-Remaining, maxAge: 86400 (24 hours)
6. WHEN rate limit is exceeded, THE System SHALL return headers: X-RateLimit-Limit (total allowed), X-RateLimit-Remaining (remaining requests), X-RateLimit-Reset (time when limit resets)
7. WHEN helmet is applied, THE System SHALL set security headers: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection: 1; mode=block, Referrer-Policy: no-referrer
8. WHEN passwords are hashed, THE System SHALL use bcrypt with minimum 12 salt rounds via bcrypt.hash(password, 12)
9. WHEN JWT tokens are generated, THE System SHALL use secrets with minimum 32 characters from environment variables JWT_ACCESS_SECRET and JWT_REFRESH_SECRET

### Requirement 12: Transaction-Based Write Operations

**User Story:** As a developer, I want all write operations to use transactions, so that data integrity is maintained even during failures.

#### Acceptance Criteria

1. WHEN a create operation is performed, THE System SHALL start a MongoDB session via mongoose.startSession() and transaction via session.startTransaction() before any database writes
2. WHEN all operations within a transaction succeed, THE System SHALL commit the transaction via session.commitTransaction() and then emit Socket.IO events after successful commit
3. WHEN any operation within a transaction fails, THE System SHALL rollback the transaction via session.abortTransaction() in catch block and return appropriate CustomError
4. WHEN a cascade delete operation is performed, THE System SHALL execute all deletions within a single transaction session passed to all softDelete operations
5. WHEN a transaction is complete, THE System SHALL end the session via session.endSession() in finally block regardless of success or failure
6. WHEN performing database operations within a transaction, THE System SHALL pass {session} parameter to all Mongoose operations: Model.create([data], {session}), model.save({session}), Model.findById(id).session(session)
7. WHEN validating references within a transaction, THE System SHALL use .session(session) on all find operations to ensure transaction isolation
8. WHEN checking uniqueness within a transaction, THE System SHALL use .withDeleted().session(session) to include soft-deleted records in uniqueness checks
9. WHEN a transaction fails, THE System SHALL log the error with full stack trace using Winston logger before throwing CustomError

### Requirement 13: Property-Based Testing

**User Story:** As a quality assurance engineer, I want comprehensive property-based tests, so that the system behaves correctly across all valid inputs.

#### Acceptance Criteria

1. WHEN property-based tests are executed, THE System SHALL use the fast-check library version ^4.3.0 with minimum 100 iterations configured via fc.assert(fc.property(...), {numRuns: 100})
2. WHEN testing soft delete functionality, THE System SHALL verify that soft-deleted records are excluded from normal queries by generating random resources, soft-deleting them, and asserting find() excludes them while find().withDeleted() includes them
3. WHEN testing cascade operations, THE System SHALL verify that all child records are affected when parent is deleted by generating random parent-child hierarchies, soft-deleting parent, and asserting all children have isDeleted: true
4. WHEN testing timezone conversion, THE System SHALL verify that dates round-trip correctly between UTC and local timezones by generating random dates, converting local→UTC→local, and asserting equality
5. WHEN testing authorization, THE System SHALL verify that users can only access resources within their authorized scope by generating random users with different roles and asserting query results match expected scope (own, ownDept, crossDept, crossOrg)
6. WHEN property-based tests are written, THE System SHALL tag each test with comment format: "**Feature: saas-task-manager-mvp, Property {number}: {property_text}**" and "**Validates: Requirements {requirement_number}**"
7. WHEN testing HOD constraints, THE System SHALL verify that only users with isHod: true can be watchers on ProjectTasks by generating random users and tasks, attempting to add non-HOD watchers, and asserting validation errors
8. WHEN testing uniqueness constraints, THE System SHALL verify that duplicate resources are rejected by generating random resources, attempting to create duplicates, and asserting CONFLICT_ERROR
9. WHEN running property-based tests, THE System SHALL use real MongoDB instance (NOT mongodb-memory-server) with test database configured via MONGODB_URI_TEST environment variable

### Requirement 14: Email Notifications

**User Story:** As a user, I want to receive email notifications for important events, so that I stay informed even when not actively using the system.

#### Acceptance Criteria

1. WHEN a new user is created, THE System SHALL send a welcome email to the user's email address using Nodemailer with Gmail SMTP (EMAIL_USER, EMAIL_PASSWORD from env), HTML template from templates/emailTemplates.js, subject "Welcome to Task Manager", and FROM address from EMAIL_FROM env variable
2. WHEN a user requests a password reset, THE System SHALL send a password reset email with a token valid for 1 hour (passwordResetExpires), reset link format: `${CLIENT_URL}/reset-password?token=${unhashed_token}`, HTML template with clear instructions, and always return success response to prevent email enumeration
3. WHEN a user is mentioned in a comment, THE System SHALL send an email notification if user.emailPreferences.mentions is true, with subject "You were mentioned in a comment", HTML template showing comment content and link to task
4. WHEN an email fails to send, THE System SHALL log the error using Winston logger with full error details and continue processing without blocking the request or throwing error to user
5. WHEN sending emails, THE System SHALL use a queue-based approach with async/await pattern: emailService.sendEmail() returns immediately, actual sending happens asynchronously, errors logged but not thrown
6. WHEN a user completes password reset, THE System SHALL send confirmation email with subject "Password Reset Successful", HTML template confirming password change, and security notice
7. WHEN email preferences are configured, THE System SHALL respect user.emailPreferences object with fields: enabled (boolean), taskNotifications (boolean), taskReminders (boolean), mentions (boolean), announcements (boolean), welcomeEmails (boolean), passwordReset (boolean)
8. WHEN Gmail SMTP is configured, THE System SHALL use settings: host: 'smtp.gmail.com', port: 587, secure: false, auth: {user: EMAIL_USER, pass: EMAIL_PASSWORD}, and require app-specific password (not regular Gmail password)
9. WHEN email templates are rendered, THE System SHALL use HTML templates from templates/emailTemplates.js with consistent branding, responsive design, and clear call-to-action buttons

### Requirement 15: Frontend State Management

**User Story:** As a frontend developer, I want centralized state management with automatic cache invalidation, so that the UI always reflects the current data state.

#### Acceptance Criteria

1. WHEN the frontend application loads, THE System SHALL initialize Redux store with configureStore including: api reducer from RTK Query, auth slice with redux-persist (persist auth slice only using redux-persist with storage: localStorage, key: 'auth', whitelist: ['user', 'isAuthenticated']), middleware configuration with RTK Query middleware, and setupListeners for refetchOnFocus and refetchOnReconnect
2. WHEN a Socket.IO event is received, THE System SHALL invalidate the appropriate RTK Query cache tags via store.dispatch(api.util.invalidateTags([...])) in socketEvents.js handlers: task:created → ['Task'], task:updated → [{type: 'Task', id: task._id}], task:deleted → ['Task'], notification:created → ['Notification']
3. WHEN a mutation succeeds, THE System SHALL automatically invalidate related cache tags defined in endpoint configuration: createTask invalidates ['Task'], updateTask invalidates [{type: 'Task', id}], deleteTask invalidates ['Task'], with providesTags and invalidatesTags configuration
4. WHEN a user logs out, THE System SHALL clear all cached data via api.util.resetApiState(), reset auth slice to initial state, clear redux-persist storage, and clear HTTP-only cookies
5. WHEN the auth slice is updated, THE System SHALL persist the auth state to localStorage using redux-persist with PersistGate component wrapping App, persistor created from persistStore(store), and automatic rehydration on app load
6. WHEN RTK Query base API is configured, THE System SHALL use baseQuery: fetchBaseQuery with baseUrl: import.meta.env.VITE_API_URL, credentials: 'include' for HTTP-only cookies, prepareHeaders to set Content-Type: application/json
7. WHEN RTK Query endpoints are defined, THE System SHALL use tagTypes: ['Organization', 'Department', 'User', 'Vendor', 'Material', 'Task', 'TaskActivity', 'TaskComment', 'Attachment', 'Notification'] for cache management
8. WHEN API errors occur, THE System SHALL handle them in RTK Query with transformErrorResponse to extract error.data.message and error.data.errorCode, and dispatch logout action if errorCode === 'AUTHENTICATION_ERROR'
9. WHEN queries are executed, THE System SHALL support pagination with automatic conversion: frontend 0-based page → backend 1-based page via transformRequest, backend response → frontend 0-based via transformResponse

### Requirement 16: Responsive UI Components

**User Story:** As a user on any device, I want a responsive interface that works well on desktop, tablet, and mobile, so that I can work from anywhere.

#### Acceptance Criteria

1. WHEN viewing the application on mobile, THE System SHALL use MUI Grid v7 with responsive size props: `<Grid size={{xs: 12, sm: 6, md: 4}}>` (NOT item prop which is deprecated in v7)
2. WHEN displaying data tables, THE System SHALL use MUI DataGrid with server-side pagination (paginationMode: "server"), automatic page conversion (frontend 0-based ↔ backend 1-based via MuiDataGrid wrapper), loading state (loading={isLoading || isFetching}), rowCount from backend pagination.totalCount, and meaningful emptyMessage
3. WHEN rendering lists of cards, THE System SHALL use React.memo to prevent unnecessary re-renders with displayName set for debugging, useCallback for event handlers passed to children, useMemo for computed values (dates, colors, status), and proper dependency arrays
4. WHEN displaying dates, THE System SHALL format them using formatDateForDisplay(date, format) which converts UTC to user's local timezone with dayjs.utc(date).tz(getUserTimezone()).format(format), default format 'MMM DD, YYYY HH:mm', and relative time via getRelativeTime(date) returning dayjs.fromNow()
5. WHEN forms are submitted, THE System SHALL show loading states via isLoading from mutation hook, disable submit buttons during submission, show toast notifications for success/error using react-toastify, and reset form on success
6. WHEN using MUI Dialog, THE System SHALL include accessibility props: disableEnforceFocus, disableRestoreFocus, aria-labelledby="dialog-title", aria-describedby="dialog-description"
7. WHEN rendering action columns in DataGrid, THE System SHALL use MuiActionColumn component with auto soft-delete detection (shows Restore button if row.isDeleted), actions: onView/onEdit/onDelete/onRestore, and column config: sortable: false, filterable: false, disableColumnMenu: true
8. WHEN using forms, THE System SHALL use react-hook-form with Controller for MUI components, control prop from useForm, validation rules matching backend validators exactly, and NEVER use watch() method
9. WHEN displaying loading states, THE System SHALL use MuiLoading component with CircularProgress, optional message, and backdrop for full-screen loading

### Requirement 17: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and feedback, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a validation error occurs, THE System SHALL return a 400 status code with error code "VALIDATION_ERROR" via CustomError.validation(message, context), descriptive message explaining what field failed validation, and context object with field details
2. WHEN an authentication error occurs, THE System SHALL return a 401 status code with error code "AUTHENTICATION_ERROR" via CustomError.authentication(message, context), trigger automatic logout on frontend by checking errorCode === 'AUTHENTICATION_ERROR' in RTK Query error handler, clear auth state and cookies, and redirect to login page
3. WHEN an authorization error occurs, THE System SHALL return a 403 status code with error code "AUTHORIZATION_ERROR" via CustomError.authorization(message, context), descriptive message explaining insufficient permissions, and context with required role/scope
4. WHEN a resource is not found, THE System SHALL return a 404 status code with error code "NOT_FOUND_ERROR" via CustomError.notFound(message, context), descriptive message identifying the missing resource, and context with resource type and ID
5. WHEN an unexpected error occurs, THE System SHALL return a 500 status code with error code "INTERNAL_SERVER_ERROR" via CustomError.internal(message, context), log the full error details with stack trace using Winston logger, and return generic message to user without exposing internal details
6. WHEN CustomError is thrown, THE System SHALL use static helper methods ONLY (validation, authentication, authorization, notFound, conflict, internal) and NEVER use constructor directly
7. WHEN frontend receives errors, THE System SHALL display toast notifications using react-toastify with appropriate severity (error, warning, info, success), auto-dismiss after 5 seconds, and position: top-right
8. WHEN validation errors occur in forms, THE System SHALL display field-level error messages using react-hook-form error state, show errors below input fields in red text, and prevent form submission until errors are resolved
9. WHEN global errors occur, THE System SHALL use ErrorBoundary component to catch React errors, display user-friendly error page with option to reload, and log error details to console in development

### Requirement 18: Data Validation and Sanitization

**User Story:** As a security-conscious developer, I want all user input to be validated and sanitized, so that the system is protected from malicious input.

#### Acceptance Criteria

1. WHEN validating user input, THE System SHALL use express-validator with validation chains matching the Mongoose schema exactly: field types (isEmail, isMongoId, isLength, isFloat, isIn, isISO8601), constraints (min, max, notEmpty, trim, normalizeEmail), and custom validators for business logic
2. WHEN checking for existing resources, THE System SHALL use `withDeleted()` query helper to include soft-deleted records in uniqueness checks: `Model.findOne({field: value}).withDeleted()` to prevent creating duplicates of soft-deleted resources
3. WHEN validating references, THE System SHALL verify that referenced documents exist and are not soft-deleted using custom validators: `const doc = await Model.findById(value).withDeleted(); if (!doc) throw new Error('Not found'); if (doc.isDeleted) throw new Error('Document is deleted');`
4. WHEN validating dates, THE System SHALL ensure dueDate is after startDate if both are provided using custom validator: `custom((value, {req}) => { if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) throw new Error('Due date must be after start date'); return true; })`
5. WHEN validation completes, THE System SHALL store validated data in `req.validated` object via handleValidationErrors middleware: `req.validated = {body: matchedData(req, {locations: ['body']}), params: matchedData(req, {locations: ['params']}), query: matchedData(req, {locations: ['query']})}`
6. WHEN validation fails, THE System SHALL return 400 status with VALIDATION_ERROR code, array of validation errors with field names and messages, and prevent controller execution
7. WHEN validating organization/department scoping, THE System SHALL verify referenced resources belong to user's organization: `if (doc.organization.toString() !== req.user.organization._id.toString()) throw new Error('Resource does not belong to your organization');`
8. WHEN validating HOD constraints, THE System SHALL verify watchers on ProjectTasks have isHod: true: `const user = await User.findById(watcherId); if (!user.isHod) throw new Error('Only HOD users can be watchers');`
9. WHEN validating task type-specific fields, THE System SHALL enforce: ProjectTask requires vendor, RoutineTask requires startDate/dueDate and restricts status/priority, AssignedTask requires assignees
10. WHEN sanitizing input, THE System SHALL use express-mongo-sanitize to remove $ and . operators from all request bodies, params, and query strings before validation

### Requirement 19: TaskActivity and TaskComment Management

**User Story:** As a task participant, I want to log activities and add comments to tasks, so that progress and discussions are tracked.

#### Acceptance Criteria

1. WHEN creating a TaskActivity, THE System SHALL require fields: activity (max 2000), parent reference (ProjectTask or AssignedTask ONLY, NOT RoutineTask), parentModel (enum: ProjectTask/AssignedTask), createdBy reference, department reference, organization reference, and optional fields: materials array (max 20: {material reference, quantity min 0})
2. WHEN a TaskActivity is created for ProjectTask, THE System SHALL allow department users to log vendor's work progress with materials and attachments as proof
3. WHEN a TaskActivity is created for AssignedTask, THE System SHALL allow assigned users to log their own work progress with materials and attachments as proof
4. WHEN attempting to create TaskActivity for RoutineTask, THE System SHALL return VALIDATION_ERROR with message "TaskActivity is not supported for RoutineTask"
5. WHEN a TaskActivity is soft-deleted, THE System SHALL cascade delete to TaskComments and Attachments within a transaction
6. WHEN creating a TaskComment, THE System SHALL require fields: comment (max 2000), parent reference (Task/TaskActivity/TaskComment), parentModel (enum: Task/TaskActivity/TaskComment), createdBy reference, department reference, organization reference, and optional fields: mentions array (max 5 User references)
7. WHEN a TaskComment is created with parent as TaskComment, THE System SHALL enforce max depth of 3 levels (comment → reply → reply to reply) and return VALIDATION_ERROR if depth exceeds 3
8. WHEN a TaskComment is created with mentions, THE System SHALL send email notifications to mentioned users if their emailPreferences.mentions is true and create Notification records
9. WHEN a TaskComment is soft-deleted, THE System SHALL cascade delete to all child TaskComments recursively and Attachments within a transaction
10. WHEN a TaskComment is restored, THE System SHALL validate parent chain is active (Task/TaskActivity/TaskComment all exist and not deleted), validate createdBy exists, and prune invalid mentions

### Requirement 20: Attachment and File Management

**User Story:** As a user, I want to upload and manage file attachments on tasks, activities, and comments, so that I can provide supporting documentation.

#### Acceptance Criteria

1. WHEN creating an Attachment, THE System SHALL require fields: filename, fileUrl (Cloudinary URL), fileType (enum: Image/Video/Document/Audio/Other), fileSize (bytes), parent reference (Task/TaskActivity/TaskComment), parentModel (enum: Task/TaskActivity/TaskComment), uploadedBy reference, department reference, organization reference
2. WHEN uploading an Image file, THE System SHALL validate file extensions (.jpg/.jpeg/.png/.gif/.webp/.svg) and enforce max size 10MB (10 _ 1024 _ 1024 bytes)
3. WHEN uploading a Video file, THE System SHALL validate file extensions (.mp4/.avi/.mov/.wmv) and enforce max size 100MB (100 _ 1024 _ 1024 bytes)
4. WHEN uploading a Document file, THE System SHALL validate file extensions (.pdf/.doc/.docx/.xls/.xlsx/.ppt/.pptx) and enforce max size 25MB (25 _ 1024 _ 1024 bytes)
5. WHEN uploading an Audio file, THE System SHALL validate file extensions (.mp3/.wav/.ogg) and enforce max size 20MB (20 _ 1024 _ 1024 bytes)
6. WHEN uploading Other file types, THE System SHALL enforce max size 50MB (50 _ 1024 _ 1024 bytes)
7. WHEN adding attachments to a parent entity, THE System SHALL enforce max 10 attachments per entity (Task/TaskActivity/TaskComment)
8. WHEN an Attachment is soft-deleted, THE System SHALL NOT cascade to any children as it is a leaf node, and set TTL to 90 days
9. WHEN an Attachment is restored, THE System SHALL validate parent chain is active (Task/TaskActivity/TaskComment exists and not deleted), and align organization/department with parent if mismatched
10. WHEN files are uploaded to Cloudinary, THE System SHALL store both fileUrl and publicId for deletion capability, use environment variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

### Requirement 21: Notification System

**User Story:** As a user, I want to receive in-app notifications for important events, so that I stay informed of changes affecting me.

#### Acceptance Criteria

1. WHEN creating a Notification, THE System SHALL require fields: title, message, type (enum: Created/Updated/Deleted/Restored/Mention/Welcome/Announcement), recipient reference (User, required), organization reference, and optional fields: entity reference (any resource), entityModel (any resource type), expiresAt (default 30 days from creation)
2. WHEN a task is created, THE System SHALL create notifications for all watchers and assignees with type: Created, title: "New Task Created", message including task title, entity reference to task
3. WHEN a user is mentioned in a comment, THE System SHALL create notification for mentioned user with type: Mention, title: "You were mentioned", message including comment content, entity reference to comment
4. WHEN a new user is created, THE System SHALL create notification for user with type: Welcome, title: "Welcome to Task Manager", message with getting started information
5. WHEN a notification is created, THE System SHALL set isRead: false by default and emit Socket.IO event `notification:created` to recipient's user room
6. WHEN a notification is marked as read, THE System SHALL set isRead: true and update timestamp
7. WHEN marking all notifications as read, THE System SHALL update all unread notifications for the user to isRead: true in a single operation
8. WHEN a notification exceeds expiresAt date, THE System SHALL automatically hard delete via TTL index (default 30 days)
9. WHEN notifications are restored, THE System SHALL NOT restore by default as they are ephemeral history, unless explicitly requested
10. WHEN querying notifications, THE System SHALL support filters: isRead, type, recipient (own notifications only), with pagination and sorting by createdAt desc (unread first)

### Requirement 22: Authorization Matrix and Scope Enforcement

**User Story:** As a system architect, I want fine-grained authorization control based on roles and scopes, so that users can only perform actions they are permitted to.

#### Acceptance Criteria

1. WHEN authorization is checked, THE System SHALL load permissions from config/authorizationMatrix.json with structure: {Resource: {Role: {operation: [scopes]}}} where operations are create/read/update/delete and scopes are own/ownDept/crossDept/crossOrg
2. WHEN Platform SuperAdmin accesses Organization resource, THE System SHALL allow crossOrg scope for read/delete/restore operations, enabling access to all organizations
3. WHEN Platform SuperAdmin accesses non-Organization resources, THE System SHALL limit to crossDept scope within platform organization, NOT crossOrg
4. WHEN Customer SuperAdmin accesses resources, THE System SHALL limit to crossDept scope within own organization, filtering by organization.\_id
5. WHEN Admin accesses resources, THE System SHALL limit to crossDept scope within own organization, same as Customer SuperAdmin
6. WHEN Manager accesses resources, THE System SHALL limit to ownDept scope, filtering by both organization.\_id and department.\_id
7. WHEN User accesses resources for read operations, THE System SHALL limit to ownDept scope, filtering by organization.\_id and department.\_id
8. WHEN User accesses resources for write operations (create/update/delete), THE System SHALL limit to own scope, checking ownership via createdBy/addedBy/uploadedBy fields
9. WHEN checking ownership for update/delete operations, THE System SHALL verify user is owner (createdBy === user.\_id) OR user is in assignees array OR user is in watchers array OR user is in mentions array OR user is recipient
10. WHEN authorization fails, THE System SHALL return 403 status with AUTHORIZATION_ERROR code and message "Insufficient permissions to {operation} this {resource}"

### Requirement 23: Git Workflow and Branch Management

**User Story:** As a developer, I want automated Git workflow management during task execution, so that code changes are properly tracked and synchronized.

#### Acceptance Criteria

1. WHEN a task is started, THE System SHALL execute git status to obtain detailed information about current branch, local changes, staged files, and untracked files. WHEN starting a phase THEN the System SHALL create feature branch with naming convention: `validate/phase-N-description` or `implement/phase-N-description`. WHEN executing terminal commands THEN the System SHALL ensure commands are suitable for GitBash WSL VSCode integrated terminal using forward slashes for paths
2. WHEN a task is started, THE System SHALL execute git branch -vv to display current branch, tracking branch, and commit status relative to remote
3. WHEN a task is started, THE System SHALL execute git fetch origin to update remote tracking information and check for remote changes
4. WHEN a task is started, THE System SHALL execute git diff to show unstaged changes and git diff --staged to show staged changes
5. WHEN uncommitted changes are detected, THE System SHALL prompt user to commit, stash, or discard changes before proceeding with task
6. WHEN local branch is behind remote, THE System SHALL execute git pull origin <branch> to synchronize with remote before proceeding
7. WHEN merge conflicts are detected, THE System SHALL halt task execution and prompt user to resolve conflicts manually
8. WHEN a task is completed, THE System SHALL execute git status to verify all changes are committed and git push origin <branch> to synchronize with remote
9. WHEN push fails due to remote changes, THE System SHALL execute git pull --rebase origin <branch> to rebase local commits on top of remote changes
10. WHEN Git operations fail, THE System SHALL log detailed error messages with git command output and prompt user for manual intervention

### Requirement 24: Documentation and Phase Tracking

**User Story:** As a project manager, I want automated phase tracking documentation, so that project progress is visible and auditable.

#### Acceptance Criteria

1. WHEN a task is started, THE System SHALL update docs/dev-phase-tracker.md with task status "IN PROGRESS", timestamp, task description, and current phase
2. WHEN a task is completed, THE System SHALL update docs/dev-phase-tracker.md with task status "COMPLETE", completion timestamp, and summary of changes
3. WHEN a phase is started, THE System SHALL create a new section in docs/dev-phase-tracker.md with phase name, start timestamp, and list of tasks
4. WHEN a phase is completed, THE System SHALL update the phase section with completion timestamp, total tasks completed, and phase summary
5. WHEN updating phase tracker, THE System SHALL maintain chronological order with most recent updates at the top
6. WHEN a task encounters errors, THE System SHALL log error details in docs/dev-phase-tracker.md with error message, stack trace, and resolution steps
7. WHEN multiple tasks are executed in sequence, THE System SHALL group them under the same phase section with individual task entries
8. WHEN the phase tracker file does not exist, THE System SHALL create it with initial structure including project name, start date, and phase sections
9. WHEN updating phase tracker, THE System SHALL preserve existing content and append new entries without overwriting previous history
10. WHEN a phase is completed, THE System SHALL generate a phase summary including: total tasks, completion rate, time taken, and key accomplishments

### Requirement 25: Comprehensive Testing Strategy

**User Story:** As a quality assurance engineer, I want comprehensive testing at phase completion, so that code quality and functionality are verified before proceeding.

#### Acceptance Criteria

1. WHEN the backend phase is completed, THE System SHALL execute all backend tests including unit tests and property-based tests using Jest with real MongoDB instance
2. WHEN backend tests are executed, THE System SHALL run npm test in backend directory and verify all tests pass with exit code 0
3. WHEN backend tests fail, THE System SHALL halt progression to frontend phase, log detailed test failure output, and prompt user to fix failing tests
4. WHEN the frontend phase is completed, THE System SHALL execute all frontend tests including component tests and integration tests
5. WHEN frontend tests are executed, THE System SHALL run npm test in client directory and verify all tests pass with exit code 0
6. WHEN frontend tests fail, THE System SHALL halt deployment, log detailed test failure output, and prompt user to fix failing tests
7. WHEN running property-based tests, THE System SHALL execute minimum 100 iterations per property and verify all properties hold across generated inputs
8. WHEN test coverage is generated, THE System SHALL verify minimum coverage thresholds: statements 80%, branches 75%, functions 80%, lines 80%
9. WHEN tests are executed, THE System SHALL use real MongoDB test database configured via MONGODB_URI_TEST environment variable, NOT mongodb-memory-server
10. WHEN all tests pass, THE System SHALL update docs/test-phase-tracker.md with test results including: total tests, passed tests, failed tests, coverage percentages, and execution time

### Requirement 26: Pre-Implementation Documentation Analysis

**User Story:** As a developer, I want comprehensive documentation analysis before starting any task, so that implementation is accurate and aligned with all specifications.

#### Acceptance Criteria

1. WHEN a task is started, THE System SHALL read and analyze docs/build-prompt.md completely to understand overall architecture, technology stack, implementation patterns, and critical instructions. Verify the implementation in all backend/\* directory.
2. WHEN a task is started, THE System SHALL read and analyze docs/softDelete-doc.md to understand soft delete plugin functionality, cascade operations, TTL configuration, and restore validation patterns
3. WHEN a task is started, THE System SHALL read and analyze docs/TIMEZONE-MANAGEMENT.md to understand UTC storage requirements, date conversion patterns, dayjs configuration, and timezone handling across frontend and backend
4. WHEN a task is started, THE System SHALL read and analyze docs/dev-phase-tracker.md to understand current project status, completed phases, pending tasks, and any documented issues or blockers
5. WHEN a task is started, THE System SHALL read and analyze .kiro/specs/saas-task-manager-mvp/requirements.md to understand all requirements, acceptance criteria, and business rules relevant to the current task
6. WHEN a task is started, THE System SHALL read and analyze .kiro/specs/saas-task-manager-mvp/design.md to understand architecture decisions, component interfaces, data models, and implementation strategies
7. WHEN documentation analysis is complete, THE System SHALL create a comprehensive analysis summary including: relevant requirements, design decisions, implementation patterns, dependencies, potential issues, and validation checklist
8. WHEN conflicting information is found across documents, THE System SHALL prioritize: build-prompt.md (highest), design.md, requirements.md, then other docs, and document the conflict for user review
9. WHEN critical patterns are identified (CustomError usage, transaction patterns, soft delete, timezone conversion, authorization scoping), THE System SHALL explicitly note them in the analysis summary
10. WHEN the analysis reveals missing information or ambiguities, THE System SHALL document questions and seek clarification from user before proceeding with implementation

## Glossary

- **Platform Organization**: The service provider organization with `isPlatformOrg: true`, managing the entire SaaS system with exactly ONE instance
- **Customer Organization**: Regular tenant organizations with `isPlatformOrg: false`, completely isolated from each other
- **HOD (Head of Department)**: Users with SuperAdmin or Admin roles, automatically designated as department heads with `isHod: true`
- **Soft Delete**: Logical deletion marking records as deleted without physical removal, with TTL-based auto-cleanup per docs/softDelete-doc.md
- **TTL (Time To Live)**: Automatic cleanup period after soft deletion (Users 365d, Tasks 180d, Activities 90d, Notifications 30d)
- **Discriminator Pattern**: Mongoose pattern for task type inheritance (BaseTask → ProjectTask/RoutineTask/AssignedTask)
- **Scope**: Authorization level (own, ownDept, crossDept, crossOrg)
- **Session**: MongoDB transaction session for atomic multi-document operations
- **ES Modules**: ECMAScript modules using import/export syntax (`"type": "module"` in package.json)
- **HTTP-Only Cookie**: Secure cookie storage preventing JavaScript access for XSS protection
- **RBAC**: Role-Based Access Control with four roles (SuperAdmin, Admin, Manager, User)
- **Cascade Operation**: Automatic propagation of soft delete/restore to related child documents per docs/softDelete-doc.md
- **Property-Based Testing**: Testing approach verifying universal properties across all valid inputs using fast-check library
- **Zero Timezone Offset**: All dates stored in UTC, converted at application boundaries per docs/TIMEZONE-MANAGEMENT.md
- **Ownership**: Resource ownership identified by fields like createdBy, assignees, mentions, watchers, uploadedBy, addedBy

---

## CONTEXT: UNDERSTANDING THE SYSTEM

### Platform Organization

A **Platform Organization** is the service provider that manages the entire SaaS system:

- **Identifier**: `isPlatformOrg: true` (immutable field in Organization model)
- **Purpose**: Oversees all customer organizations, manages system-wide operations
- **Quantity**: Exactly ONE platform organization exists in the system
- **Creation**: Created via backend seed data during initial system setup
- **Users**: All users in platform organization have `isPlatformUser: true` (auto-set)
- **Special Access**: Platform SuperAdmin can view and manage ALL customer organizations (crossOrg scope)
- **Deletion Protection**: Platform organization CANNOT be deleted (hard-coded protection)
- **TTL**: Never expires (no automatic cleanup)
- **Use Case**: System administrators, support staff, platform management team

### Customer Organization

A **Customer Organization** is a regular tenant using the platform:

- **Identifier**: `isPlatformOrg: false` (default value in Organization model)
- **Purpose**: Independent business entity using the task management system
- **Quantity**: Multiple customer organizations can exist
- **Creation**: Created via frontend registration/onboarding process
- **Users**: All users in customer organization have `isPlatformUser: false` (auto-set)
- **Data Isolation**: Completely isolated from other customer organizations
- **Access Scope**: Customer SuperAdmin can only access own organization (crossDept scope within org)
- **Deletion**: CAN be deleted (soft delete with cascade to all related data)
- **TTL**: Never expires (no automatic cleanup)
- **Use Case**: Companies, businesses, teams using the platform as tenants

### Schema Overview

**Organization (Tenant Root)**

- The top-level entity representing either platform or customer organization
- Contains: name, description, contact info, industry, logo {url, publicId}, isPlatformOrg
- Cascades to: Departments, Users, Tasks, Materials, Vendors, Notifications

**Department (Organizational Unit)**

- Subdivision within an organization for team/functional grouping
- Contains: name, description, hod, organization reference
- Cascades to: Users, Tasks, Materials
- Constraint: Must have at least one HOD (Head of Department)

**User (System Actor)**

- Individual with authentication and role-based permissions
- Contains: firstName, lastName, dateOfBirth. employeeId (4 digit, unique), skills [{skill, percentage}], role, password, email, position (if isHod, unique within organization), organization, department, isHod, isPlatformUser, profilePicture {url, publicId}, lastLogin, passwordResetExpires, passwordResetToken,
- Roles: SuperAdmin (highest), Admin, Manager, User (lowest)
- HOD Status: Automatically set based on role (SuperAdmin/Admin = HOD)
- Cascades to: Created tasks, activities, comments, attachments, notifications

**BaseTask (Abstract Task Model)**

- Base discriminator model for all task types
- Contains: description, status, priority, organization, department, attachments, watchers ([ref]), tags ([unique string])
- Discriminator Key: taskType (ProjectTask, RoutineTask, AssignedTask)
- Cascades to: Activities, Comments, Attachments, Notifications

**ProjectTask (Vendor-Outsourced Task)**

- Task outsourced to external vendor/client due to complexity or resource limitation
- Contains: title, vendor reference (required), cost tracking, materials via activities start/due dates
- Materials: Added through TaskActivity with attachments as proof
- TaskActivity: YES - Department users log vendor's work progress
- Watchers: Only HOD users allowed

**RoutineTask (Outlet-Received Task)**

- Daily routine task received by department user from organization outlet
- Contains: materials (added directly), required task peformed date, can't be in future
- Materials: Added DIRECTLY to task (NO TaskActivity intermediary)
- TaskActivity: NO - Not applicable for routine tasks
- Status Restriction: Cannot be "To Do" (must be In Progress, Completed, or Pending)
- Priority Restriction: Cannot be "Low" (must be Medium, High, or Urgent)

**AssignedTask (User-Assigned Task)**

- Task assigned to single user or group of users within department
- Contains: title, assignees (required), start/due dates can't be in future/past, materials via activities
- Materials: Added through TaskActivity with attachments as proof
- TaskActivity: YES - Assigned users log their own work progress

**TaskActivity (Progress Log)**

- Tracks updates and progress on ProjectTask and AssignedTask ONLY (NOT RoutineTask)
- Contains: content, parent task reference (Task), materials with quantities, createdBy, organization, department
- Purpose: Log vendor work (ProjectTask) or user work (AssignedTask)
- Cascades to: Comments, Attachments

**TaskComment (Discussion Thread)**

- Comments on tasks, activities, or other comments (threaded)
- Contains: content, parent reference (Task, TaskActivity), mentions, createdBy, organization, department
- Max Depth: 3 levels (comment → reply → reply to reply)
- Cascades to: Child comments (recursive), Attachments

**Material (Inventory Item)**

- Physical or consumable item used in tasks
- Contains: name, description, category, unit type, price, organization, department
- Usage: Via TaskActivity (ProjectTask/AssignedTask) or directly (RoutineTask)

**Vendor (External Client)**

- External vendor/client who takes and completes outsourced ProjectTasks
- Contains: name, description, contact info, only organization references
- Business Logic: Communicates orally with department users, work logged via TaskActivity

**Attachment (File Reference)**

- File uploaded to Cloudinary linked to task, activity, or comment
- Contains: filename, URL, type, size, parent reference (Task, TaskActivity, TaskComment), uploadedBy, organization, department
- File Types: Image (10MB), Video (100MB), Document (25MB), Audio (20MB), Other (50MB)
- Max per Entity: 10 attachments

**Notification (User Alert)**

- System notification for user about events and mentions
- Contains: title, message, type, read status, recipients, entity reference, organization, department
- TTL: 30 days (auto-cleanup after expiry)
- Types: Created, Updated, Deleted, Restored, Mention, Welcome, Announcement

## CRITICAL INSTRUCTIONS FOR

**YOU ARE STRICTLY FORBIDDEN FROM:**

- Skipping ANY line, statement, or character from the requirements below
- Making assumptions or using default knowledge
- Deviating from the specified architecture, patterns, or conventions
- Adding your own interpretations or improvements
- Using different naming conventions than specified
- Implementing features not explicitly documented

**YOU MUST:**

- Follow EVERY SINGLE instruction exactly as written
- Implement EVERY field, validation rule, and business logic specified
- Use the EXACT file structure, naming conventions, and patterns provided
- Reference backend validators as the ONLY source of truth for field names
- Import constants from utils/constants.js - NEVER hardcode values
- Implement soft delete for ALL models using the softDelete plugin
- Use HTTP-only cookies for JWT authentication (NEVER localStorage)
- Follow the discriminator pattern for task types (BaseTask → ProjectTask/RoutineTask/AssignedTask)
- Implement real-time features using Socket.IO with room-based broadcasting
- Use MUI v7 syntax (size prop for Grid, NOT item prop)
- Apply React.memo, useCallback, and useMemo for performance optimization
- Test EVERY feature after implementation

**BEFORE STARTING ANY IMPLEMENTATION:**

1. Read and understand ALL requirements in this document
2. Identify dependencies between components
3. Plan the implementation order (All backend cores → models → controllers → routes → frontend)
4. Verify you understand the multi-tenancy isolation rules
5. Confirm you understand the three task types and their differences

---

## PROJECT OVERVIEW

### System Description

Multi-tenant SaaS task manager with role-based access control structured in organization → department → user hierarchy for enterprise environments.

### Technology Stack

**Backend:**

- Node.js v20.x LTS with ES modules ("type": "module")
- Express.js ^4.21.2
- MongoDB v7.0 with Mongoose ^8.19.1
- mongoose-paginate-v2 ^1.9.1 for pagination
- JWT authentication (jsonwebtoken ^9.0.2)
- bcrypt ^6.0.0 for password hashing (≥12 salt rounds)
- Socket.IO ^4.8.1 for real-time communication
- Nodemailer ^7.0.9 for email (Gmail SMTP)
- express-validator ^7.2.1 for request validation
- express-mongo-sanitize ^2.2.0 for NoSQL injection prevention
- helmet ^8.1.0 for security headers
- cors ^2.8.5 for CORS configuration
- express-rate-limit ^8.1.0 for rate limiting (production only)
- winston ^3.18.3 for logging
- dayjs ^1.11.18 for date manipulation (UTC plugin)

**Frontend:**

- React ^19.1.1 with React DOM ^19.1.1
- Vite ^7.1.7 build tool
- Material-UI (MUI) v7.3.4 complete suite
- Redux Toolkit ^2.9.0 with RTK Query
- React Router ^7.9.4
- react-hook-form ^7.65.0 (NEVER use watch() method)
- Socket.IO Client ^4.8.1
- react-toastify ^11.0.5 for notifications
- dayjs ^1.11.18 (same as backend)

**Development:**

- nodemon ^3.1.10 for backend auto-restart
- Jest ^30.2.0 for testing with ES modules
- **CRITICAL**: DO NOT use mongodb-memory-server - Use real MongoDB instance for testing

### Architecture

- Monorepo: backend/ (Node.js/Express) + client/ (React/Vite)
- Backend serves frontend static files in production
- Separate dev servers in development (backend:4000, frontend:3000)
- MongoDB with Mongoose ODM, pagination plugin, soft delete plugin
- Redux Toolkit with persistence for auth state
- Socket.IO for bidirectional real-time communication

---

## TENANT HIERARCHY AND MULTI-TENANCY

### Organizational Structure

Organizations → Departments → Users

### Platform vs Customer Organizations

**CRITICAL DISTINCTION:**

**Platform Organization:**

- Identifier: `isPlatformOrg: true` (immutable field)
- Purpose: Service provider organization managing the entire system
- Quantity: ONLY ONE platform organization exists
- Creation: Backend seed data during initial setup
- Users: All have `isPlatformUser: true` (automatically set)
- Access: Platform SuperAdmin can view/manage ALL customer organizations
- TTL: Never expires (TTL = null)
- Deletion: CANNOT be deleted (hard-coded protection)

**Customer Organization:**

- Identifier: `isPlatformOrg: false` (default)
- Purpose: Regular tenant organizations using the platform
- Quantity: Multiple customer organizations
- Creation: Frontend registration/onboarding process
- Users: All have `isPlatformUser: false` (automatically set)
- Access: Completely isolated from other customer organizations
- TTL: Never expires (TTL = null)
- Deletion: CAN be deleted (soft delete with cascade)

**Platform Organization Structure:**

```
Platform Organization (isPlatformOrg: true)
├── Department 1
│   ├── User 1 (isPlatformUser: true, role: SuperAdmin, isHod: true)
│   ├── User 2 (isPlatformUser: true, role: Admin, isHod: false)
│   ├── User 3 (isPlatformUser: true, role: Manager, isHod: false)
│   └── User 4 (isPlatformUser: true, role: User, isHod: false)
└── Resources (Tasks, Materials, Vendors, etc.)
```

**Customer Organization Structure:**

```
Customer Organization (isPlatformOrg: false)
├── Department 1
│   ├── User 1 (isPlatformUser: false, role: SuperAdmin, isHod: true)
│   ├── User 2 (isPlatformUser: false, role: Admin, isHod: false)
│   ├── User 3 (isPlatformUser: false, role: Manager, isHod: false)
│   └── User 4 (isPlatformUser: false, role: User, isHod: false)
└── Resources (Tasks, Materials, Vendors, etc.)
```

### Head of Department (HOD) Rules

**Definition:** Users with SuperAdmin or Admin roles are automatically designated as Head of Department.

**Characteristics:**

- `isHod: true` for SuperAdmin and Admin roles (automatically set)
- `isHod: false` for Manager and User roles (automatically set)
- Uniqueness: Only ONE HOD (SuperAdmin or Admin) per department
- Enforced at database level with unique index
- Special Privilege: Only HOD users can be watchers on ProjectTasks

**HOD Assignment:**

- SuperAdmin: Always HOD (`isHod: true`)
- Admin: Always HOD (`isHod: true`)
- Manager: Never HOD (`isHod: false`)
- User: Never HOD (`isHod: false`)

**Deletion Protection:**

- Cannot delete last HOD in department
- System checks HOD count before allowing deletion
- Ensures every department has at least one HOD

**Watcher Eligibility:**

- Only HOD users can be watchers on ProjectTasks
- Validation enforced at task creation/update
- Non-HOD users cannot be added as watchers

**Automatic Updates:**

- Changing user role to SuperAdmin/Admin automatically sets `isHod: true`
- Changing user role to Manager/User automatically sets `isHod: false`
- Pre-save hook handles automatic updates

### Role-Based Access Control

**Roles (Descending Privileges):**

1. SuperAdmin (Platform & Organization Level)
2. Admin (Organization Level)
3. Manager (Department Level)
4. User (Standard)

**Platform SuperAdmin:**

- Organization Access: ALL organizations (platform + all customers)
- Department Access: All departments in all organizations
- User Access: All users in all organizations
- Resource Access: All resources in all organizations
- Special Permissions: Create/manage customer organizations, view cross-organization data
- Scope: `crossOrg` for Organization resource, `crossDept` for all other resources

**Customer SuperAdmin:**

- Organization Access: Own organization ONLY
- Department Access: All departments in own organization
- User Access: All users in own organization
- Resource Access: All resources in own organization
- Special Permissions: Create/manage departments, manage all users in organization
- Scope: `crossDept` (cannot access other organizations)

**Platform Admin:**

- Organization Access: Platform organization ONLY
- Department Access: All departments in platform organization
- User Access: All users in platform organization
- Resource Access: All resources in platform organization
- Special Permissions: Same as Customer Admin (no cross-org access)
- Scope: `crossDept` within platform organization

**Customer Admin:**

- Organization Access: Own organization ONLY
- Department Access: All departments in own organization
- User Access: All users in own organization
- Resource Access: All resources in own organization
- Special Permissions: Manage users, view cross-department resources
- Scope: `crossDept` within own organization

**Manager (Platform or Customer):**

- Organization Access: Own organization (read-only)
- Department Access: Own department ONLY
- User Access: Users in own department
- Resource Access: Resources in own department
- Special Permissions: Create tasks, manage own tasks
- Scope: `ownDept`

**User (Platform or Customer):**

- Organization Access: Own organization (read-only)
- Department Access: Own department (read-only)
- User Access: Users in own department (read-only)
- Resource Access: Resources in own department (read-only for materials/vendors)
- Special Permissions: Create/manage own tasks
- Scope: `ownDept` (read), `own` (write)

### Multi-Tenancy Isolation

**Data Isolation:**

- Customer organizations are completely isolated from each other
- No customer organization can access another customer organization's data
- Database queries automatically scoped to user's organization
- Authorization middleware enforces organization boundaries
- Exception: Platform SuperAdmin can access all organizations

**Query Scoping Examples:**

```javascript
// Platform SuperAdmin/Admin query (can access all organizations for read/delete/restore operation)
{
  isDeleted: false
}

// Platform SuperAdmin/Admin query (can access all organizations for all operation except read/delete/restore)
{
  organization: user.organization._id,
   department: user.department._id,
  isDeleted: false
}

// Customer SuperAdmin/Admin query (scoped to own organization for only read operation)
{
  organization: user.organization._id,
  isDeleted: false
}

// Customer SuperAdmin/Admin query (scoped to own organization and department)
{
  organization: user.organization._id,
  department: user.department._id,
  isDeleted: false
}

// Manager/User query (scoped to own department)
{
  organization: user.organization._id,
  department: user.department._id,
  isDeleted: false
}
```

---

## CORE ENTITIES AND DATA MODELS

### Primary Resources

**Organization (Tenant):**

- Fields: name (unique, lowercase, max 100), description (max 2000), email (unique, valid, max 50), phone (unique, /^(\+251\d{9}|0\d{9})$/), address (max 500), industry (one of 24 industries, max 100), logoUrl (url, publicId), createdBy (ref: User), isPlatformOrg (boolean, immutable, indexed), isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, createdAt, updatedAt
- Indexes: name (unique, partial), email (unique, partial), phone (unique, partial), isPlatformOrg, isDeleted, deletedAt (TTL: never)
- Cascade Delete: Departments → Users → Tasks → Activities → Comments → Attachments → Materials → Vendors → Notifications
- Protection: Platform organization CANNOT be deleted

**Department:**

- Fields: name (max 100), description (max 2000), hod (ref: User) organization (ref: Organization, required), createdBy (ref: User), isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, createdAt, updatedAt
- Indexes: Unique name per organization, organization reference
- Cascade Delete: Users, Tasks, Materials
- TTL: 365 days

**User:**

- Fields: firstName (max 20), lastName (max 20), position (max 100), role (enum: SuperAdmin/Admin/Manager/User, default: User), email (unique per org, lowercase, max 50), password (min 8, bcrypt ≥12 salt rounds, select: false), organization (ref: Organization, required), department (ref: Department, required), profilePicture (url, publicId), skills (array max 10: {skill: max 50, percentage: 0-100}), employeeId (4-digit: 1000-9999, unique per org), dateOfBirth (not future), joinedAt (required, not future), emailPreferences (enabled, taskNotifications, taskReminders, mentions, announcements, welcomeEmails, passwordReset), passwordResetToken (select: false, bcrypt hashed), passwordResetExpires (select: false), isPlatformUser (boolean, immutable, indexed, auto-set from org), isHod (boolean, indexed, auto-set from role), lastLogin, isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, createdAt, updatedAt
- Virtuals: fullName (firstName + lastName)
- Indexes: {organization, email} unique, {department} unique for HOD, {organization, employeeId} unique, isPlatformUser, isHod, isDeleted, deletedAt (TTL: 365 days)
- Instance Methods: comparePassword, generatePasswordResetToken, verifyPasswordResetToken, clearPasswordResetToken
- Cascade Delete: Tasks (createdBy), Activities (createdBy), Comments (createdBy), Attachments (uploadedBy), Materials (addedBy), Notifications (createdBy), remove from task watchers
- Protection: Cannot delete last SuperAdmin in organization, cannot delete last HOD in department
- TTL: 365 days

**BaseTask (Abstract Base - Discriminator Pattern):**

- Fields: description (max 2000), status (enum: To Do/In Progress/Completed/Pending, default: To Do), priority (enum: Low/Medium/High/Urgent, default: Medium), organization (ref: Organization, required), department (ref: Department, required), createdBy (ref: User, required), attachments (array max 10, ref: Attachment, unique), watchers (array max 20, ref: User, unique, HOD only), tags (array max 5, max 50 each, unique case-insensitive), taskType (discriminator key: ProjectTask/RoutineTask/AssignedTask), isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, createdAt, updatedAt
- Indexes: {organization, department, createdAt}, {organization, createdBy, createdAt}, {organization, department, startDate, dueDate}, {organization, department, status, priority, dueDate}, tags (text), isDeleted, deletedAt (TTL: 180 days)
- Cascade Delete: Activities, Comments, Attachments, Notifications
- TTL: 180 days

**ProjectTask (extends BaseTask):**

- Purpose: Department task outsourced to external vendor/client due to complexity or resource limitation
- Additional Fields: title (max 50), vendor (ref: Vendor, REQUIRED), estimatedCost (min 0), actualCost (min 0), currency (default: ETB), costHistory (array max 200: {amount, type: estimated/actual, updatedBy: ref User, updatedAt}), startDate, dueDate (must be after startDate)
- Business Logic: Vendor communicates orally with department users. Department users log activities tracking vendor's work progress. Materials added via TaskActivity with attachments as proof.
- All Statuses: To Do, In Progress, Completed, Pending
- All Priorities: Low, Medium, High, Urgent

**RoutineTask (extends BaseTask):**

- Purpose: Daily routine task received (not assigned) by department user from organization outlet
- Additional Fields: materials (array max 20: {material: ref Material, quantity: min 0}, added DIRECTLY), startDate (REQUIRED), dueDate (REQUIRED, must be after startDate)
- Status Restriction: Cannot be "To Do" (must be In Progress, Completed, or Pending)
- Priority Restriction: Cannot be "Low" (must be Medium, High, or Urgent)
- Business Logic: User receives task to perform, not formally assigned. Materials added DIRECTLY to RoutineTask (NO TaskActivity intermediary), comment via TaskComment to make changes/update/correction on the task.
- NO TaskActivity: Materials added directly to task, not via activities

**AssignedTask (extends BaseTask):**

- Purpose: Task assigned to single department user or group of department users
- Additional Fields: title (max 50), assignees (ref: User or array of Users, REQUIRED), startDate, dueDate (must be after startDate if both provided)
- Business Logic: Assigned users log their own work progress. Materials added via TaskActivity with attachments as proof, comment via TaskComment to make changes/update/correction on the task.
- All Statuses: To Do, In Progress, Completed, Pending
- All Priorities: Low, Medium, High, Urgent

**TaskActivity:**

- Purpose: Track updates and progress on ProjectTask and AssignedTask ONLY (NOT RoutineTask)
- Fields: activity (max 2000), parent (ref: ProjectTask or AssignedTask ONLY), parentModel (ProjectTask or AssignedTask), materials (array max 20: {material: ref Material, quantity: min 0}), createdBy (ref: User, required), department (ref: Department, required), organization (ref: Organization, required), isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, createdAt, updatedAt
- Activity Logging: ProjectTask - department users log vendor's work. AssignedTask - assigned users log their own work.
- Material Tracking: Materials added to TaskActivity with quantities and attachments as proof
- Cascade Delete: Comments, Attachments
- TTL: 90 days

**TaskComment:**

- Fields: comment (max 2000), parent (ref: Task/TaskActivity/TaskComment), parentModel (Task/TaskActivity/TaskComment), mentions (array max 5, ref: User), createdBy (ref: User, required), department (ref: Department, required), organization (ref: Organization, required), isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, createdAt, updatedAt
- Threading: Max depth 3 levels (comment → reply → reply to reply)
- Cascade Delete: Child Comments (recursive), Attachments
- TTL: 90 days

**Material:**

- Fields: name (max 100), description (max 2000), category (enum: Electrical/Mechanical/Plumbing/Hardware/Cleaning/Textiles/Consumables/Construction/Other), unitType (enum: 30+ types - pcs/kg/g/l/ml/m/cm/mm/m2/m3/box/pack/roll/sheet/etc), price (min 0), department (ref: Department, required), organization (ref: Organization, required), addedBy (ref: User), isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, createdAt, updatedAt
- Usage Patterns: ProjectTask/AssignedTask - materials added to TaskActivity with quantities. RoutineTask - materials added directly to task (no TaskActivity).
- TTL: 180 days

**Vendor:**

- Purpose: External client/vendor who takes and completes outsourced ProjectTasks
- Fields: name (max 100), description (max 2000), contactPerson (max 100), email (valid, max 50), phone (/^(\+251\d{9}|0\d{9})$/), address (max 500), organization (ref: Organization, required), createdBy (ref: User), isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, createdAt, updatedAt
- Business Logic: External client who takes ProjectTask. Communicates orally with department users. Department users log vendor's work via TaskActivity.
- Special: Deletion requires material reassignment
- TTL: 180 days

**Attachment:**

- Fields: filename, fileUrl (Cloudinary URL), fileType (enum: Image/Video/Document/Audio/Other), fileSize (bytes), parent (ref: Task/TaskActivity/TaskComment), parentModel (Task/TaskActivity/TaskComment), uploadedBy (ref: User, required), department (ref: Department, required), organization (ref: Organization, required), isDeleted, deletedAt, deletedBy, restoredAt, restoredBy, createdAt, updatedAt
- File Types: Image (.jpg/.jpeg/.png/.gif/.webp/.svg max 10MB), Video (.mp4/.avi/.mov/.wmv max 100MB), Document (.pdf/.doc/.docx/.xls/.xlsx/.ppt/.pptx max 25MB), Audio (.mp3/.wav/.ogg max 20MB), Other (max 50MB)
- Max Attachments: 10 per entity
- TTL: 90 days

**Notification:**

- Fields: title, message, type (enum: Created/Updated/Deleted/Restored/Mention/Welcome/Announcement), isRead (default: false), recipient (ref: User, required), entity (ref: any resource), entityModel (any resource type), organization (ref: Organization, required), expiresAt (default: 30 days from creation), createdAt, updatedAt
- TTL: 30 days (or custom expiresAt)

---

## SOFT DELETE PLUGIN (UNIVERSAL)

**File:** `backend/models/plugins/softDelete.js`

**Purpose:** Universal soft delete functionality for ALL models

**Fields Added to Every Model:**

```javascript
{
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: ObjectId, ref: "User", default: null, index: true },
  restoredAt: { type: Date, default: null },
  restoredBy: { type: ObjectId, ref: "User", default: null },: { type: Number, default: 0 }
}
```

**Query Helpers:**

- `withDeleted()`: Include soft-deleted documents in query
- `onlyDeleted()`: Return only soft-deleted documents

**Instance Methods:**

- `softDelete(deletedBy, { session })`: Soft delete this document
- `restore(restoredBy, { session })`: Restore this document

**Static Methods:**

- `softDeleteById(id, { session, deletedBy })`: Soft delete by ID
- `softDeleteMany(filter, { session, deletedBy })`: Soft delete multiple
- `restoreById(id, { session, restoredBy })`: Restore by ID
- `restoreMany(filter, { session, restoredBy })`: Restore multiple
- `findDeletedByIds(ids, { session })`: Find soft-deleted documents
- `countDeleted(filter, { session })`: Count soft-deleted documents
- `ensureTTLIndex(expireAfterSeconds)`: Create TTL index for auto-cleanup
- `getRestoreAudit(id, { session })`: Get restore audit trail

**Automatic Filtering:**

- All queries automatically filter out soft-deleted documents unless `withDeleted()` is used
- `find({})` excludes soft-deleted
- `find({}).withDeleted()` includes soft-deleted
- `find({}).onlyDeleted()` only soft-deleted

**Hard Delete Protection:**

- `deleteOne()` - Blocked (throws error)
- `deleteMany()` - Blocked (throws error)
- `findOneAndDelete()` - Blocked (throws error)
- `remove()` - Blocked (throws error)

**TTL Configuration (Auto-Expiry After Soft Delete):**

- Users: 365 days
- Tasks (all types): 180 days
- TaskActivity: 90 days
- TaskComment: 90 days
- Organizations: Never (TTL = null)
- Departments: 365 days
- Materials: 180 days
- Vendors: 180 days
- Attachments: 90 days
- Notifications: 30 days

**Cascade Delete Operations:**

- ALL cascade operations MUST use MongoDB transactions
- Cascade order documented for each model
- Parent deletion cascades to all children
- Restore does NOT automatically restore children (manual restore required)

---

## AUTHENTICATION & SECURITY

### JWT Token System

**Access Token:**

- Expiry: 15 minutes
- Secret: `process.env.JWT_ACCESS_SECRET` (min 32 chars)
- Storage: HTTP-only cookie named `access_token`
- Purpose: Short-lived token for API requests

**Refresh Token:**

- Expiry: 7 days
- Secret: `process.env.JWT_REFRESH_SECRET` (min 32 chars)
- Storage: HTTP-only cookie named `refresh_token`
- Purpose: Long-lived token for refreshing access tokens
- Rotation: New refresh token issued on each refresh

**Cookie Configuration:**

```javascript
{
  httpOnly: true,              // Prevents JavaScript access (XSS protection)
  secure: isProduction,        // HTTPS only in production
  sameSite: 'strict',          // CSRF protection
  maxAge: 15 * 60 * 1000,      // 15 minutes (access token)
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days (refresh token)
}
```

### Password Security

**Hashing (bcrypt):**

```javascript
// Hash password on user creation/update
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12); // 12 salt rounds
  }
  next();
});

// Compare entered password with hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

**Requirements:**

- Minimum 8 characters
- Bcrypt with ≥12 salt rounds
- Never stored in plain text
- Never returned in API responses (select: false)

**Password Reset:**

- Generate random reset token
- Hash token with bcrypt (10 rounds)
- Store hashed token in user document
- Set expiry (1 hour)
- Send reset email with unhashed token
- Always return success (prevents email enumeration)

### Authorization Matrix

**File:** `backend/config/authorizationMatrix.json`

**Structure:**

```json
{
  "Resource": {
    "Role": {
      "operation": ["scope1", "scope2"]
    }
  }
}
```

**Operations:**

- `create`: Create new resources
- `read`: View resources
- `update`: Modify resources
- `delete`: Soft delete resources
- `restore`: Restore soft delete resources

**Scopes:**

- `own`: User's own resources only
- `ownDept`: Resources in user's department
- `crossDept`: Resources across departments in organization
- `crossOrg`: Resources across organizations (platform SuperAdmin only)

## Resource Ownership and Scope Matrix

### Organization

- **Ownership Field**: createdBy
- **Scope**: organization (req.user.organization.\_id)
- **Soft Delete Unlinks**: N/A (tenant root)
- **Soft Delete Cascades To**: Departments, Users, Tasks (all types), TaskActivities, TaskComments, Materials, Vendors, Attachments, Notifications (per docs/softDelete-doc.md)
- **Restore Links**: All cascaded children remain soft-deleted unless explicitly restored
- **Authorization**: Platform SuperAdmin (crossOrg), Customer SuperAdmin (crossDept within own org)

### Department

- **Ownership Field**: createdBy
- **Scope**: organization (req.user.organization.\_id) + department (req.user.department.\_id)
- **Soft Delete Unlinks**: hod (set to null if invalid per docs/softDelete-doc.md)
- **Soft Delete Cascades To**: Users, Tasks (all types), Materials (per docs/softDelete-doc.md)
- **Restore Links**: Validate hod exists and isHod: true, set to null if invalid
- **Authorization**: SuperAdmin/Admin (crossDept), Manager (ownDept)

### User

- **Ownership Field**: createdBy
- **Scope**: organization (req.user.organization.\_id) + department (req.user.department.\_id)
- **Soft Delete Unlinks**: Remove from task watchers, task assignees, comment mentions (per docs/softDelete-doc.md)
- **Soft Delete Cascades To**: Created tasks, activities, comments, attachments, notifications (per docs/softDelete-doc.md)
- **Restore Links**: Re-validate all references, prune invalid watchers/assignees/mentions
- **Authorization**: SuperAdmin/Admin (crossDept), Manager (ownDept), User (own)

### ProjectTask

- **Ownership Field**: createdBy
- **Additional Ownership**: watchers (HOD only)
- **Scope**: organization (req.user.organization.\_id) + department (req.user.department.\_id)
- **Soft Delete Unlinks**: N/A
- **Soft Delete Cascades To**: TaskActivities, TaskComments, Attachments, Notifications (per docs/softDelete-doc.md)
- **Restore Links**: Validate vendor exists, validate createdBy exists, prune invalid watchers (per docs/softDelete-doc.md)
- **Authorization**: SuperAdmin/Admin (crossDept), Manager (ownDept), User (own for created tasks)

### RoutineTask

- **Ownership Field**: createdBy
- **Scope**: organization (req.user.organization.\_id) + department (req.user.department.\_id)
- **Soft Delete Unlinks**: N/A
- **Soft Delete Cascades To**: TaskComments, Attachments, Notifications (NO TaskActivity per docs/softDelete-doc.md)
- **Restore Links**: Validate materials exist, validate createdBy exists (per docs/softDelete-doc.md)
- **Authorization**: SuperAdmin/Admin (crossDept), Manager (ownDept), User (own for created tasks)

### AssignedTask

- **Ownership Field**: createdBy
- **Additional Ownership**: assignees
- **Scope**: organization (req.user.organization.\_id) + department (req.user.department.\_id)
- **Soft Delete Unlinks**: N/A
- **Soft Delete Cascades To**: TaskActivities, TaskComments, Attachments, Notifications (per docs/softDelete-doc.md)
- **Restore Links**: Validate assignees exist (at least one active), validate createdBy exists, prune invalid assignees (per docs/softDelete-doc.md)
- **Authorization**: SuperAdmin/Admin (crossDept), Manager (ownDept), User (own for created tasks OR included in assignees)

### TaskActivity

- **Ownership Field**: createdBy
- **Scope**: organization (req.user.organization.\_id) + department (req.user.department.\_id)
- **Soft Delete Unlinks**: N/A
- **Soft Delete Cascades To**: TaskComments, Attachments (per docs/softDelete-doc.md)
- **Restore Links**: Validate parent task exists (ProjectTask or AssignedTask only), validate materials exist, validate createdBy exists (per docs/softDelete-doc.md)
- **Authorization**: SuperAdmin/Admin (crossDept), Manager (ownDept), User (own for created activities)

### TaskComment

- **Ownership Field**: createdBy
- **Additional Ownership**: mentions
- **Scope**: organization (req.user.organization.\_id) + department (req.user.department.\_id)
- **Soft Delete Unlinks**: N/A
- **Soft Delete Cascades To**: Child TaskComments (recursive), Attachments (per docs/softDelete-doc.md)
- **Restore Links**: Validate parent chain active (Task/TaskActivity/TaskComment), validate createdBy exists, prune invalid mentions (per docs/softDelete-doc.md)
- **Authorization**: SuperAdmin/Admin (crossDept), Manager (ownDept), User (own for created comments OR included in mentions)

### Material

- **Ownership Field**: addedBy
- **Scope**: organization (req.user.organization.\_id) + department (req.user.department.\_id)
- **Soft Delete Unlinks**: N/A
- **Soft Delete Cascades To**: None (check for linked tasks/activities before deletion per docs/softDelete-doc.md)
- **Restore Links**: Validate organization and department exist (per docs/softDelete-doc.md)
- **Authorization**: SuperAdmin/Admin (crossDept), Manager (ownDept)

### Vendor

- **Ownership Field**: createdBy
- **Scope**: organization (req.user.organization.\_id) ONLY (NOT department scoped)
- **Soft Delete Unlinks**: N/A
- **Soft Delete Cascades To**: None (check for linked ProjectTasks before deletion per docs/softDelete-doc.md)
- **Restore Links**: Validate organization exists (per docs/softDelete-doc.md)
- **Authorization**: SuperAdmin/Admin (crossDept within organization)

### Attachment

- **Ownership Field**: uploadedBy
- **Scope**: organization (req.user.organization.\_id) + department (req.user.department.\_id)
- **Soft Delete Unlinks**: N/A
- **Soft Delete Cascades To**: None (leaf node per docs/softDelete-doc.md)
- **Restore Links**: Validate parent chain active (Task/TaskActivity/TaskComment), align org/department with parent if mismatched (per docs/softDelete-doc.md)
- **Authorization**: SuperAdmin/Admin (crossDept), Manager (ownDept), User (own for uploaded attachments)

### Notification

- **Ownership Field**: N/A (system-generated)
- **Scope**: organization (req.user.organization.\_id)
- **Soft Delete Unlinks**: N/A
- **Soft Delete Cascades To**: None (leaf node, not restored by default per docs/softDelete-doc.md)
- **Restore Links**: Not restored by default (ephemeral history per docs/softDelete-doc.md)
- **Authorization**: User (own notifications only)

**Note:** Platform SuperAdmin has `crossOrg` scope for Organization resource only. All other resources use `crossDept` as maximum scope.

### Permission Fields in Schemas

**CRITICAL:** Each schema has specific permission-related fields that control access and ownership:

**Organization Schema:**

- `createdBy` (ref: User) - User who created the organization (permission: track createdBy)
- `isPlatformOrg` (Boolean, immutable) - Platform organization flag (permission: crossOrg access for platform SuperAdmin)

**Department Schema:**

- `organization` (ref: Organization, required) - Parent organization (permission: organization-level isolation)
- `createdBy` (ref: User) - User who created the department (permission: track createdBy)

**User Schema:**

- `role` (enum: SuperAdmin/Admin/Manager/User) - User's role (permission: determines authorization scope)
- `organization` (ref: Organization, required) - User's organization (permission: organization-level isolation)
- `department` (ref: Department, required) - User's department (permission: department-level isolation)
- `isPlatformUser` (Boolean, immutable, auto-set) - Platform user flag (permission: crossOrg access for platform users)
- `isHod` (Boolean, auto-set from role) - Head of Department flag (permission: watcher eligibility on ProjectTasks)

**BaseTask Schema (All Task Types):**

- `organization` (ref: Organization, required) - Task's organization (permission: organization-level isolation)
- `department` (ref: Department, required) - Task's department (permission: department-level isolation)
- `createdBy` (ref: User, required) - Task createdBy (permission: ownership for update/delete)
- `watchers` (array of User refs, max 20, unique) - HOD users watching task (permission: only HOD users allowed)

**ProjectTask Schema:**

- `assignees` (array of User refs, max 20, unique) - Users assigned to task (permission: assignee access)
- `vendor` (ref: Vendor, required) - Vendor handling task (permission: vendor-specific access)

**RoutineTask Schema:**

- No additional permission fields (inherits from BaseTask)

**AssignedTask Schema:**

- `assignees` (ref: User or array of Users, required) - User(s) assigned to task included in assignees array (permission: assignee access)

**TaskActivity Schema:**

- `parent` (ref: ProjectTask or AssignedTask) - Parent task (permission: task-level access)
- `createdBy` (ref: User, required) - Activity createdBy (permission: ownership)
- `department` (ref: Department, required) - Activity's department (permission: department-level isolation)
- `organization` (ref: Organization, required) - Activity's organization (permission: organization-level isolation)

**TaskComment Schema:**

- `parent` (ref: Task/TaskActivity/TaskComment) - Parent entity (permission: parent-level access)
- `mentions` (array of User refs, max 5) - Mentioned users (permission: notification access)
- `createdBy` (ref: User, required) - Comment createdBy (permission: ownership)
- `department` (ref: Department, required) - Comment's department (permission: department-level isolation)
- `organization` (ref: Organization, required) - Comment's organization (permission: organization-level isolation)

**Material Schema:**

- `department` (ref: Department, required) - Material's department (permission: department-level isolation)
- `organization` (ref: Organization, required) - Material's organization (permission: organization-level isolation)
- `addedBy` (ref: User) - User who added material (permission: track createdBy)
- `vendor` (ref: Vendor) - Associated vendor (permission: vendor-specific access)

**Vendor Schema:**

- `department` (ref: Department, required) - Vendor's department (permission: department-level isolation)
- `organization` (ref: Organization, required) - Vendor's organization (permission: organization-level isolation)
- `createdBy` (ref: User) - User who created vendor (permission: track createdBy)

**Attachment Schema:**

- `parent` (ref: Task/TaskActivity/TaskComment) - Parent entity (permission: parent-level access)
- `uploadedBy` (ref: User, required) - User who uploaded file (permission: ownership)
- `department` (ref: Department, required) - Attachment's department (permission: department-level isolation)
- `organization` (ref: Organization, required) - Attachment's organization (permission: organization-level isolation)

**Notification Schema:**

- `recipients` (ref: User, required) - Notification recipient included in recipients array (permission: recipient-only access)
- `organization` (ref: Organization, required) - Notification's organization (permission: organization-level isolation)
- `entity` (ref: any resource) - Related entity (permission: entity-level access)

**Permission Field Usage Rules:**

1. **Organization Isolation**: All queries MUST filter by `organizationId` (except platform SuperAdmin with crossOrg)
2. **Department Isolation**: Queries MUST filter by `departmentId` for Manager/User roles
3. **Ownership**: `createdBy`, `addedBy`, `uploadedBy` fields determine ownership for update/delete operations
4. **Role-Based**: `role` field determines authorization scope (own, ownDept, crossDept, crossOrg)
5. **Platform Flag**: `isPlatformOrg` and `isPlatformUser` enable crossOrg access for platform organization
6. **HOD Flag**: `isHod` determines watcher eligibility on ProjectTasks
7. **Assignment**: `assignees` fields grant task access to assigned users
8. **Mentions**: `mentions` field grants notification access to mentioned users
9. **Watchers**: `watchers` field grants task visibility to HOD users

### Security Middleware Order (CRITICAL)

**File:** `backend/app.js`

**Order matters for security:**

1. **helmet** - Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, hide X-Powered-By)
2. **cors** - Cross-origin resource sharing (origin validation, credentials enabled, no wildcards in production)
3. **cookieParser** - Parse cookies (required before authentication middleware)
4. **express.json** - Parse JSON bodies (10mb limit for file uploads)
5. **mongoSanitize** - NoSQL injection prevention (removes $ and . from user input)
6. **compression** - Response compression (gzip for responses >1KB)
7. **rateLimiter** - Rate limiting (production only: 100 req/15min general, 5 req/15min auth)

### Rate Limiting (Production Only)

**General API Limiter:**

```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: "Too many requests, please try again later",
  standardHeaders: true,      // Return rate limit info in headers
  keyGenerator: (req) => req.ip  // Track by IP address
}
```

**Auth Endpoints Limiter:**

```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: "Too many authentication attempts, please try again later",
  keyGenerator: (req) => req.ip
}
```

**Headers:**

- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

**Endpoints with Stricter Limits:**

- POST /api/auth/login - 5/15min
- POST /api/auth/register - 5/15min
- POST /api/auth/forgot-password - 5/15min
- POST /api/auth/reset-password - 5/15min
- GET /api/auth/refresh-token - 5/15min
- DELETE /api/auth/logout - 5/15min

### CORS Configuration

**File:** `backend/config/corsOptions.js`

```javascript
{
  origin: validateOrigin,  // Function that validates against allowedOrigins
  credentials: true,       // Enable cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
  maxAge: 86400,          // 24 hours preflight cache
  optionsSuccessStatus: 200,
  preflightContinue: false
}
```

**Allowed Origins:**

- Development: http://localhost:3000, http://localhost:5173
- Production: process.env.CLIENT_URL + process.env.ALLOWED_ORIGINS
- NO wildcards in production

---

## COMPLETE BACKEND FILE STRUCTURE

```
backend/
├── config/
│   ├── allowedOrigins.js          # CORS allowed origins list
│   ├── authorizationMatrix.json   # Role-based permissions (ONLY source of truth)
│   ├── corsOptions.js             # CORS configuration with validation
│   └── db.js                      # MongoDB connection with retry logic
├── controllers/
│   ├── attachmentControllers.js   # Attachment CRUD operations
│   ├── authControllers.js         # Login, register, refresh, logout, password reset
│   ├── departmentControllers.js   # Department CRUD with cascade
│   ├── materialControllers.js     # Material CRUD operations
│   ├── notificationControllers.js # Notification CRUD, mark as read
│   ├── organizationControllers.js # Organization CRUD (platform SuperAdmin)
│   ├── taskControllers.js         # Task CRUD (all types: ProjectTask/RoutineTask/AssignedTask)
│   ├── userControllers.js         # User CRUD, profile, status updates
│   └── vendorControllers.js       # Vendor CRUD with material reassignment
├── errorHandler/
│   ├── CustomError.js             # Custom error class with status codes
│   └── ErrorController.js         # Global error handler middleware
├── middlewares/
│   ├── validators/
│   │   ├── attachmentValidators.js  # Attachment validation rules
│   │   ├── authValidators.js        # Auth validation (register, login, reset)
│   │   ├── departmentValidators.js  # Department validation rules
│   │   ├── materialValidators.js    # Material validation rules
│   │   ├── notificationValidators.js # Notification validation rules
│   │   ├── organizationValidators.js # Organization validation rules
│   │   ├── taskValidators.js        # Task validation (all types)
│   │   ├── userValidators.js        # User validation rules
│   │   ├── validation.js            # Validation result handler
│   │   └── vendorValidators.js      # Vendor validation rules
│   ├── authMiddleware.js          # JWT verification (verifyJWT, verifyRefresh_token)
│   ├── authorization.js           # Role-based authorization middleware
│   └── rateLimiter.js             # Rate limiting (production only)
├── mock/
│   ├── cleanSeedSetup.js          # Seed data initialization script
│   └── data.js                    # Mock data for seeding
├── models/
│   ├── plugins/
│   │   └── softDelete.js          # Universal soft delete plugin
│   ├── AssignedTask.js            # Assigned task model (discriminator)
│   ├── Attachment.js              # Attachment model (polymorphic parent)
│   ├── BaseTask.js                # Base task model (discriminator base)
│   ├── Department.js              # Department model with cascade
│   ├── index.js                   # Model exports
│   ├── Material.js                # Material model
│   ├── Notification.js            # Notification model with TTL
│   ├── Organization.js            # Organization model (tenant)
│   ├── ProjectTask.js             # Project task model (discriminator)
│   ├── RoutineTask.js             # Routine task model (discriminator)
│   ├── TaskActivity.js            # Task activity model (ProjectTask/AssignedTask only)
│   ├── TaskComment.js             # Task comment model (threaded, max depth 3)
│   ├── User.js                    # User model with authentication
│   └── Vendor.js                  # Vendor model (external clients)
├── routes/
│   ├── attachmentRoutes.js        # Attachment routes
│   ├── authRoutes.js              # Auth routes (public + protected)
│   ├── departmentRoutes.js        # Department routes
│   ├── index.js                   # Route aggregator
│   ├── materialRoutes.js          # Material routes
│   ├── notificationRoutes.js      # Notification routes
│   ├── organizationRoutes.js      # Organization routes
│   ├── taskRoutes.js              # Task routes (all types)
│   ├── userRoutes.js              # User routes
│   └── vendorRoutes.js            # Vendor routes
├── services/
│   ├── emailService.js            # Email sending (Nodemailer, Gmail SMTP, queue-based)
│   └── notificationService.js     # Notification creation and management
├── templates/
│   └── emailTemplates.js          # HTML email templates
├── utils/
│   ├── authorizationMatrix.js     # Authorization helper functions
│   ├── constants.js               # ALL constants (ONLY source of truth)
│   ├── generateTokens.js          # JWT token generation
│   ├── helpers.js                 # Utility functions
│   ├── logger.js                  # Winston logger configuration
│   ├── materialTransform.js       # Material data transformation
│   ├── responseTransform.js       # Response formatting
│   ├── socket.js                  # Socket.IO event handlers
│   ├── socketEmitter.js           # Socket.IO event emitters
│   ├── socketInstance.js          # Socket.IO singleton
│   ├── userStatus.js              # User status tracking
│   └── validateEnv.js             # Environment validation
├── .env                           # Environment variables
├── app.js                         # Express app configuration
├── jest.config.js                 # Jest configuration (ES modules)
├── package.json                   # Dependencies and scripts
└── server.js                      # Server startup and lifecycle
```

---

## COMPLETE FRONTEND FILE STRUCTURE

```
client/
├── public/                        # Static assets
├── src/
│   ├── assets/
│   │   └── notFound_404.svg       # 404 page illustration
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthProvider.jsx   # Auth context provider
│   │   │   ├── index.js           # Auth exports
│   │   │   ├── ProtectedRoute.jsx # Protected route wrapper
│   │   │   └── PublicRoute.jsx    # Public route wrapper
│   │   ├── cards/
│   │   │   ├── AttachmentCard.jsx
│   │   │   ├── DepartmentCard.jsx
│   │   │   ├── MaterialCard.jsx
│   │   │   ├── NotificationCard.jsx
│   │   │   ├── OrganizationCard.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── UserCard.jsx
│   │   │   ├── UsersCardList.jsx
│   │   │   └── VendorCard.jsx
│   │   ├── columns/
│   │   │   ├── AttachmentColumns.jsx
│   │   │   ├── DepartmentColumns.jsx
│   │   │   ├── MaterialColumns.jsx
│   │   │   ├── NotificationColumns.jsx
│   │   │   ├── OrganizationColumns.jsx
│   │   │   ├── TaskColumns.jsx
│   │   │   ├── UserColumns.jsx
│   │   │   └── VendorColumns.jsx
│   │   ├── common/
│   │   │   ├── CustomDataGridToolbar.jsx  # DataGrid toolbar (export, filter, columns)
│   │   │   ├── CustomIcons.jsx            # Custom icons
│   │   │   ├── ErrorBoundary.jsx          # Error boundary component
│   │   │   ├── FilterChipGroup.jsx        # Active filters display
│   │   │   ├── FilterDateRange.jsx        # Date range filter
│   │   │   ├── FilterSelect.jsx           # Select filter
│   │   │   ├── FilterTextField.jsx        # Text filter with debouncing
│   │   │   ├── GlobalSearch.jsx           # Global search bar (Ctrl+K)
│   │   │   ├── index.js                   # Common exports
│   │   │   ├── MuiActionColumn.jsx        # DataGrid action column (View/Edit/Delete/Restore)
│   │   │   ├── MuiCheckbox.jsx            # Checkbox input
│   │   │   ├── MuiDataGrid.jsx            # DataGrid wrapper (auto pagination conversion)
│   │   │   ├── MuiDatePicker.jsx          # Date picker (UTC conversion)
│   │   │   ├── MuiDateRangePicker.jsx     # Date range picker
│   │   │   ├── MuiDialog.jsx              # Dialog wrapper (accessibility props)
│   │   │   ├── MuiDialogConfirm.jsx       # Confirmation dialog
│   │   │   ├── MuiFileUpload.jsx          # File upload (Cloudinary)
│   │   │   ├── MuiLoading.jsx             # Loading spinner
│   │   │   ├── MuiMultiSelect.jsx         # Multi-select autocomplete
│   │   │   ├── MuiNumberField.jsx         # Number input
│   │   │   ├── MuiRadioGroup.jsx          # Radio group
│   │   │   ├── MuiResourceSelect.jsx      # Resource select (users/departments/materials/vendors)
│   │   │   ├── MuiSelectAutocomplete.jsx  # Autocomplete select
│   │   │   ├── MuiTextArea.jsx            # Text area with character counter
│   │   │   ├── MuiTextField.jsx           # Text input
│   │   │   ├── MuiThemeDropDown.jsx       # Theme switcher
│   │   │   ├── NotificationMenu.jsx       # Notification dropdown
│   │   │   └── RouteError.jsx             # Route error display
│   │   ├── filters/
│   │   │   ├── MaterialFilter.jsx
│   │   │   ├── TaskFilter.jsx
│   │   │   ├── UserFilter.jsx
│   │   │   └── VendorFilter.jsx
│   │   ├── forms/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── OrganizationDetailsStep.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   ├── ReviewStep.jsx
│   │   │   │   ├── UploadAttachmentsStep.jsx
│   │   │   │   └── UserDetailsStep.jsx
│   │   │   ├── departments/
│   │   │   │   └── CreateUpdateDepartment.jsx
│   │   │   ├── materials/
│   │   │   │   └── CreateUpdateMaterial.jsx
│   │   │   ├── users/
│   │   │   │   └── CreateUpdateUser.jsx
│   │   │   └── vendors/
│   │   │       └── CreateUpdateVendor.jsx
│   │   └── lists/
│   │       ├── TasksList.jsx
│   │       └── UsersList.jsx
│   ├── hooks/
│   │   ├── useAuth.js             # Authentication hook
│   │   └── useSocket.js           # Socket.IO hook
│   ├── layouts/
│   │   ├── DashboardLayout.jsx    # Protected layout (Header, Sidebar, Footer)
│   │   ├── PublicLayout.jsx       # Public layout
│   │   └── RootLayout.jsx         # Root layout
│   ├── pages/
│   │   ├── Dashboard.jsx          # Dashboard page (widgets, statistics)
│   │   ├── Departments.jsx        # Departments page (DataGrid pattern)
│   │   ├── ForgotPassword.jsx     # Forgot password page
│   │   ├── Home.jsx               # Home page
│   │   ├── Materials.jsx          # Materials page (DataGrid pattern)
│   │   ├── NotFound.jsx           # 404 page
│   │   ├── Organization.jsx       # Organization detail page
│   │   ├── Organizations.jsx      # Organizations list page (Platform SuperAdmin)
│   │   ├── Tasks.jsx              # Tasks page (Three-Layer pattern)
│   │   ├── Users.jsx              # Users page (Three-Layer pattern)
│   │   └── Vendors.jsx            # Vendors page (DataGrid pattern)
│   ├── redux/
│   │   ├── app/
│   │   │   └── store.js           # Redux store configuration (persist auth)
│   │   └── features/
│   │       ├── api.js             # Base API configuration (RTK Query)
│   │       ├── attachment/
│   │       │   └── attachmentApi.js
│   │       ├── auth/
│   │       │   ├── authApi.js
│   │       │   └── authSlice.js
│   │       ├── department/
│   │       │   ├── departmentApi.js
│   │       │   └── departmentSlice.js
│   │       ├── material/
│   │       │   ├── materialApi.js
│   │       │   └── materialSlice.js
│   │       ├── notification/
│   │       │   ├── notificationApi.js
│   │       │   └── notificationSlice.js
│   │       ├── organization/
│   │       │   ├── organizationApi.js
│   │       │   └── organizationSlice.js
│   │       ├── task/
│   │       │   ├── taskApi.js
│   │       │   └── taskSlice.js
│   │       ├── user/
│   │       │   ├── userApi.js
│   │       │   └── userSlice.js
│   │       └── vendor/
│   │           ├── vendorApi.js
│   │           └── vendorSlice.js
│   ├── router/
│   │   └── routes.jsx             # Route configuration (lazy loading)
│   ├── services/
│   │   ├── socketEvents.js        # Socket.IO event handlers (cache invalidation)
│   │   └── socketService.js       # Socket.IO client service
│   ├── theme/
│   │   ├── customizations/
│   │   │   ├── charts.js          # Chart customizations
│   │   │   ├── dataDisplay.js     # Data display customizations
│   │   │   ├── dataGrid.js        # DataGrid customizations
│   │   │   ├── datePickers.js     # Date picker customizations
│   │   │   ├── feedback.js        # Feedback customizations
│   │   │   ├── index.js           # Customization exports
│   │   │   ├── inputs.js          # Input customizations
│   │   │   ├── navigation.js      # Navigation customizations
│   │   │   └── surfaces.js        # Surface customizations
│   │   ├── AppTheme.jsx           # Theme provider (light/dark mode)
│   │   └── themePrimitives.js     # Theme primitives (colors, spacing)
│   ├── utils/
│   │   ├── constants.js           # ALL constants (MUST mirror backend exactly)
│   │   └── errorHandler.js        # Custom error class
│   ├── App.jsx                    # Root component
│   └── main.jsx                   # Application entry point
├── .env                           # Environment variables
├── eslint.config.js               # ESLint configuration
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
└── vite.config.js                 # Vite configuration (code splitting, terser)
```

---

## CRITICAL CONSTANTS (MUST BE IDENTICAL IN BACKEND AND FRONTEND)

**File:** `backend/utils/constants.js` AND `client/src/utils/constants.js`

**THESE MUST BE EXACTLY THE SAME:**

```javascript
// User Roles (descending privileges)
export const USER_ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

// Task Status
export const TASK_STATUS = ["To Do", "In Progress", "Completed", "Pending"];

// Task Priority
export const TASK_PRIORITY = ["Low", "Medium", "High", "Urgent"];

// Task Types
export const TASK_TYPES = ["ProjectTask", "RoutineTask", "AssignedTask"];

// User Status
export const USER_STATUS = ["Online", "Offline", "Away"];

// Material Categories
export const MATERIAL_CATEGORIES = [
  "Electrical",
  "Mechanical",
  "Plumbing",
  "Hardware",
  "Cleaning",
  "Textiles",
  "Consumables",
  "Construction",
  "Other",
];

// Unit Types (30+ types)
export const UNIT_TYPES = [
  "pcs",
  "kg",
  "g",
  "l",
  "ml",
  "m",
  "cm",
  "mm",
  "m2",
  "m3",
  "box",
  "pack",
  "roll",
  "sheet",
  "bag",
  "bottle",
  "can",
  "carton",
  "dozen",
  "gallon",
  "inch",
  "foot",
  "yard",
  "mile",
  "ounce",
  "pound",
  "ton",
  "liter",
  "milliliter",
  "cubic meter",
  "square meter",
];

// Industries (24 options)
export const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Hospitality",
  "Real Estate",
  "Transportation",
  "Energy",
  "Agriculture",
  "Construction",
  "Media",
  "Telecommunications",
  "Automotive",
  "Aerospace",
  "Pharmaceutical",
  "Legal",
  "Consulting",
  "Non-Profit",
  "Government",
  "Entertainment",
  "Food & Beverage",
  "Other",
];

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_SORT_ORDER: "desc",
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_LIMIT: 100,
};

// Validation Limits
export const LIMITS = {
  MAX_ATTACHMENTS: 10,
  MAX_WATCHERS: 20,
  MAX_ASSIGNEES: 20,
  MAX_MATERIALS: 20,
  MAX_TAGS: 5,
  MAX_MENTIONS: 5,
  MAX_SKILLS: 10,
  MAX_COMMENT_DEPTH: 3,
  MAX_COST_HISTORY: 200,
  MAX_NOTIFICATION_RECIPIENTS: 500,
};

// Length Limits
export const LENGTH_LIMITS = {
  TITLE_MAX: 50,
  DESCRIPTION_MAX: 2000,
  COMMENT_MAX: 2000,
  ORG_NAME_MAX: 100,
  DEPT_NAME_MAX: 100,
  USER_NAME_MAX: 20,
  EMAIL_MAX: 50,
  PASSWORD_MIN: 8,
  POSITION_MAX: 100,
  ADDRESS_MAX: 500,
  SKILL_NAME_MAX: 50,
  TAG_MAX: 50,
};

// File Size Limits (bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 25 * 1024 * 1024, // 25MB
  AUDIO: 20 * 1024 * 1024, // 20MB
  OTHER: 50 * 1024 * 1024, // 50MB
};

// File Types
export const FILE_TYPES = {
  IMAGE: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
  VIDEO: ["mp4", "avi", "mov", "wmv"],
  DOCUMENT: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
  AUDIO: ["mp3", "wav", "ogg"],
};

// Notification Types
export const NOTIFICATION_TYPES = [
  "Created",
  "Updated",
  "Deleted",
  "Restored",
  "Mention",
  "Welcome",
  "Announcement",
];

// Attachment Types
export const ATTACHMENT_TYPES = [
  "Image",
  "Video",
  "Document",
  "Audio",
  "Other",
];
```

**NEVER HARDCODE THESE VALUES - ALWAYS IMPORT FROM CONSTANTS**

---

## COMPLETE API ENDPOINTS REFERENCE

### Authentication Endpoints (Public)

**POST /api/auth/register** - Register new organization with department and SuperAdmin user

- Rate Limit: 5/15min
- Request Body: { organization: {name, description, industry, address, phone, email}, department: {name, description}, user: {firstName, lastName, email, password, phone, position} }
- Response: 201 - { success, message, data: {organization, department, user} }
- Side Effects: Creates org/dept/user in transaction, user assigned SuperAdmin role, welcome email sent, Socket.IO emits organization:created

**POST /api/auth/login** - Authenticate user and set JWT tokens in HTTP-only cookies

- Rate Limit: 5/15min
- Request Body: { email, password }
- Response: 200 - { success, message, data: {user} }
- Cookies Set: access_token (15min), refresh_token (7 days)
- Side Effects: User status updated to 'Online', Socket.IO user joins rooms, emits user:online

**DELETE /api/auth/logout** - Logout user and clear authentication cookies

- Authentication: Required (refresh token)
- Rate Limit: 5/15min
- Response: 200 - { success, message }
- Side Effects: Cookies cleared, user status updated to 'Offline', Socket.IO user disconnected, emits user:offline

**GET /api/auth/refresh-token** - Get new access token using refresh token

- Authentication: Required (refresh token)
- Rate Limit: 5/15min
- Response: 200 - { success, message, data: {user} }
- Cookies Set: New access_token (15min), new refresh_token (7 days) - Token rotation

**POST /api/auth/forgot-password** - Request password reset email

- Rate Limit: 5/15min
- Request Body: { email }
- Response: 200 - { success, message }
- Side Effects: Password reset token generated (1 hour expiry), reset email sent
- Security: Always returns success (prevents email enumeration)

**POST /api/auth/reset-password** - Reset password using valid reset token

- Rate Limit: 5/15min
- Request Body: { token, password }
- Response: 200 - { success, message }
- Side Effects: Password updated, reset token cleared, confirmation email sent

### User Endpoints (Protected)

**POST /api/users** - Create new user within department

- Authentication: Required
- Authorization: User resource, create operation
- Request Body: { firstName, lastName, email, password, role, department, employeeId, position, phone, profilePicture, skills }
- Response: 201 - { success, message, data: {user} }
- Side Effects: Welcome email sent, Socket.IO emits user:created, notification created for department admins

**GET /api/users** - List users with pagination, filtering, and sorting

- Authentication: Required
- Authorization: User resource, read operation
- Query Parameters: page (1-based), limit, sortBy, sortOrder, search, role, department, status, deleted
- Response: 200 - { success, data: {users, pagination} }
- Authorization Scoping: Platform SuperAdmin (all orgs), Customer SuperAdmin/Admin (own org), Manager/User (own dept)

**GET /api/users/:userId** - Get single user by ID with complete profile

- Authentication: Required
- Authorization: User resource, read operation
- Response: 200 - { success, data: {user} }

**PUT /api/users/:userId** - Update user by SuperAdmin (can change role, department, etc.)

- Authentication: Required
- Authorization: User resource, update operation
- Request Body: Partial user object
- Response: 200 - { success, message, data: {user} }

**PUT /api/users/:userId/profile** - Update own profile with role-based field restrictions

- Authentication: Required
- Authorization: User resource, update operation (own resource)
- Restrictions: Cannot change own role, cannot change own department (SuperAdmin only), cannot change own organization
- Response: 200 - { success, message, data: {user} }

**GET /api/users/:userId/account** - Get current authenticated user's account information

- Authentication: Required
- Authorization: User resource, read operation (own resource)
- Response: 200 - { success, data: {user} }

**GET /api/users/:userId/profile** - Get current authenticated user's complete profile and dashboard data

- Authentication: Required
- Authorization: User resource, read operation (own resource)
- Response: 200 - { success, data: {user, dashboardStats} }

**DELETE /api/users/:userId** - Soft delete user with cascade deletion

- Authentication: Required
- Authorization: User resource, delete operation
- Response: 200 - { success, message }
- Side Effects: User marked as deleted, user's tasks/activities/comments soft-deleted (cascade), Socket.IO emits user:deleted, notification sent

**PATCH /api/users/:userId/restore** - Restore soft-deleted user

- Authentication: Required
- Authorization: User resource, update operation
- Response: 200 - { success, message, data: {user} }
- Side Effects: User restored, Socket.IO emits user:restored

### Organization Endpoints (Protected)

**GET /api/organizations** - List organizations (Platform SuperAdmin only)

- Authentication: Required
- Authorization: Organization resource, read operation (crossOrg scope)
- Query Parameters: page, limit, sortBy, sortOrder, search, industry, deleted
- Response: 200 - { success, data: {organizations, pagination} }

**GET /api/organizations/:resourceId** - Get organization details

- Authentication: Required
- Authorization: Organization resource, read operation
- Response: 200 - { success, data: {organization} }

**POST /api/organizations** - Create organization (Platform SuperAdmin only)

- Authentication: Required
- Authorization: Organization resource, create operation (crossOrg scope)
- Request Body: { name, description, industry, address, phone, email, logoUrl }
- Response: 201 - { success, message, data: {organization} }

**PUT /api/organizations/:resourceId** - Update organization

- Authentication: Required
- Authorization: Organization resource, update operation
- Request Body: Partial organization object
- Response: 200 - { success, message, data: {organization} }

**DELETE /api/organizations/:resourceId** - Soft delete organization (cascade to departments and users)

- Authentication: Required
- Authorization: Organization resource, delete operation
- Response: 200 - { success, message }
- Protection: Cannot delete platform organization
- Side Effects: Cascade delete to all departments, users, tasks, materials, vendors, notifications

**PATCH /api/organizations/:resourceId/restore** - Restore organization

- Authentication: Required
- Authorization: Organization resource, update operation
- Response: 200 - { success, message, data: {organization} }

### Department Endpoints (Protected)

**GET /api/departments** - List departments (scoped by organization)

- Authentication: Required
- Authorization: Department resource, read operation
- Query Parameters: page, limit, sortBy, sortOrder, search, deleted
- Response: 200 - { success, data: {departments, pagination} }
- Authorization Scoping: SuperAdmin/Admin (all depts in org), Manager/User (own dept only)

**GET /api/departments/:resourceId** - Get department details

- Authentication: Required
- Authorization: Department resource, read operation
- Response: 200 - { success, data: {department} }

**POST /api/departments** - Create department

- Authentication: Required
- Authorization: Department resource, create operation
- Request Body: { name, description }
- Response: 201 - { success, message, data: {department} }

**PUT /api/departments/:resourceId** - Update department

- Authentication: Required
- Authorization: Department resource, update operation
- Request Body: Partial department object
- Response: 200 - { success, message, data: {department} }

**DELETE /api/departments/:resourceId** - Soft delete department (cascade to users and tasks)

- Authentication: Required
- Authorization: Department resource, delete operation
- Response: 200 - { success, message }
- Side Effects: Cascade delete to users, tasks, materials, vendors

**PATCH /api/departments/:resourceId/restore** - Restore department

- Authentication: Required
- Authorization: Department resource, update operation
- Response: 200 - { success, message, data: {department} }

### Task Endpoints (Protected)

**GET /api/tasks** - List tasks with filtering by type, status, priority, assignee

- Authentication: Required
- Authorization: Task resource, read operation
- Query Parameters: page, limit, sortBy, sortOrder, search, taskType, status, priority, assigneeId, vendor, deleted
- Response: 200 - { success, data: {tasks, pagination} }

**GET /api/tasks/:resourceId** - Get task details with activities and comments

- Authentication: Required
- Authorization: Task resource, read operation
- Response: 200 - { success, data: {task} }

**POST /api/tasks** - Create task (type determined by taskType field)

- Authentication: Required
- Authorization: Task resource, create operation
- Request Body: { title, description, status, priority, taskType, ...typeSpecificFields }
- Response: 201 - { success, message, data: {task} }
- Task Types: ProjectTask (requires vendor), RoutineTask (materials direct, restricted status/priority), AssignedTask (requires assignees)

**PUT /api/tasks/:resourceId** - Update task

- Authentication: Required
- Authorization: Task resource, update operation
- Request Body: Partial task object
- Response: 200 - { success, message, data: {task} }

**DELETE /api/tasks/:resourceId** - Soft delete task (cascade to activities, comments, attachments)

- Authentication: Required
- Authorization: Task resource, delete operation
- Response: 200 - { success, message }
- Side Effects: Cascade delete to activities, comments, attachments, notifications

**PATCH /api/tasks/:resourceId/restore** - Restore task

- Authentication: Required
- Authorization: Task resource, update operation
- Response: 200 - { success, message, data: {task} }

### Material Endpoints (Protected)

**GET /api/materials** - List materials with filtering by category, department

- Authentication: Required
- Authorization: Material resource, read operation
- Query Parameters: page, limit, sortBy, sortOrder, search, category, deleted
- Response: 200 - { success, data: {materials, pagination} }

**GET /api/materials/:resourceId** - Get material details

- Authentication: Required
- Authorization: Material resource, read operation
- Response: 200 - { success, data: {material} }

**POST /api/materials** - Create material

- Authentication: Required
- Authorization: Material resource, create operation
- Request Body: { name, description, category, unitType, price}
- Response: 201 - { success, message, data: {material} }

**PUT /api/materials/:resourceId** - Update material (name, description, category, unitType, price)

- Authentication: Required
- Authorization: Material resource, update operation
- Request Body: Partial material object
- Response: 200 - { success, message, data: {material} }

**DELETE /api/materials/:resourceId** - Soft delete material

- Authentication: Required
- Authorization: Material resource, delete operation, unlink from all resource linked to
- Response: 200 - { success, message }

**PATCH /api/materials/:resourceId/restore** - Restore material

- Authentication: Required
- Authorization: Material resource, update operation, link back to all the resource previously linked to
- Response: 200 - { success, message, data: {material} }

### Vendor Endpoints (Protected)

**GET /api/vendors** - List vendors

- Authentication: Required
- Authorization: Vendor resource, read operation
- Query Parameters: page, limit, sortBy, sortOrder, search, deleted
- Response: 200 - { success, data: {vendors, pagination} }

**GET /api/vendors/:resourceId** - Get vendor details with linked ProjectTasks

- Authentication: Required
- Authorization: Vendor resource, read operation
- Response: 200 - { success, data: {vendor} }

**POST /api/vendors** - Create vendor

- Authentication: Required
- Authorization: Vendor resource, create operation
- Request Body: { name, description, contactPerson, email, phone, address }
- Response: 201 - { success, message, data: {vendor} }

**PUT /api/vendors/:resourceId** - Update vendor

- Authentication: Required
- Authorization: Vendor resource, update operation
- Request Body: { name, description, contactPerson, email, phone, address }
- Response: 200 - { success, message, data: {vendor} }

**DELETE /api/vendors/:resourceId** - Soft delete vendor (requires ProjectTask reassignment)

- Authentication: Required
- Authorization: Vendor resource, delete operation
- Response: 200 - { success, message }
- Business Logic: Deleting vendor requires reassigning all linked ProjectTask to another vendor

**PATCH /api/vendors/:resourceId/restore** - Restore vendor

- Authentication: Required
- Authorization: Vendor resource, update operation
- Response: 200 - { success, message, data: {vendor} }
- Business Logic: Restoring vendor requires reassigning all previously linked ProjectTask to another vendor

### Notification Endpoints (Protected)

**GET /api/notifications** - List user's notifications (unread first)

- Authentication: Required
- Authorization: Notification resource, read operation (own notifications)
- Query Parameters: page, limit, isRead
- Response: 200 - { success, data: {notifications, pagination} }

**GET /api/notifications/:resourceId** - Get notification details

- Authentication: Required
- Authorization: Notification resource, read operation
- Response: 200 - { success, data: {notification} }

**PATCH /api/notifications/:resourceId/read** - Mark notification as read

- Authentication: Required
- Authorization: Notification resource, update operation
- Response: 200 - { success, message, data: {notification} }

**PATCH /api/notifications/read-all** - Mark all notifications as read

- Authentication: Required
- Authorization: Notification resource, update operation
- Response: 200 - { success, message }

**DELETE /api/notifications/:resourceId** - Delete notification

- Authentication: Required
- Authorization: Notification resource, delete operation
- Response: 200 - { success, message }

### Attachment Endpoints (Protected)

**GET /api/attachments** - List attachments

- Authentication: Required
- Authorization: Attachment resource, read operation
- Query Parameters: page, limit, parent, parentModel
- Response: 200 - { success, data: {attachments, pagination} }

**GET /api/attachments/:resourceId** - Get attachment details

- Authentication: Required
- Authorization: Attachment resource, read operation
- Response: 200 - { success, data: {attachment} }

**POST /api/attachments** - Upload attachment (Cloudinary)

- Authentication: Required
- Authorization: Attachment resource, create operation
- Request Body: { filename, fileUrl, fileType, fileSize, parent, parentModel }
- Response: 201 - { success, message, data: {attachment} }

**DELETE /api/attachments/:resourceId** - Delete attachment

- Authentication: Required
- Authorization: Attachment resource, delete operation
- Response: 200 - { success, message }

---

## SOCKET.IO REAL-TIME COMMUNICATION

### Backend Socket.IO Setup

**File:** `backend/utils/socketInstance.js` - Socket.IO Singleton

```javascript
import { Server } from "socket.io";
import corsOptions from "../config/corsOptions.js";

let io = null;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });

  setupSocketHandlers(io);
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};
```

**File:** `backend/utils/socket.js` - Socket.IO Event Handlers

**Connection/Disconnection:**

- User connects → joins user, department, organization rooms
- User disconnects → leaves all rooms, status updated to 'Offline'

**Rooms:**

- `user:${userId}` - User-specific events
- `department:${department}` - Department-wide events
- `organization:${organization}` - Organization-wide events

**File:** `backend/utils/socketEmitter.js` - Socket.IO Event Emitters

**Event Types:**

- `task:created`, `task:updated`, `task:deleted`, `task:restored`
- `activity:created`, `activity:updated`
- `comment:created`, `comment:updated`, `comment:deleted`
- `notification:created`
- `user:online`, `user:offline`, `user:away`
- `organization:created`, `department:created`, `material:created`, `vendor:created`

**Emit Pattern:**

```javascript
export const emitToRooms = (event, data, rooms) => {
  const io = getIO();
  rooms.forEach((room) => {
    io.to(room).emit(event, data);
  });
};

export const emitTaskEvent = (event, task) => {
  emitToRooms(event, task, [
    `department:${task.department}`,
    `organization:${task.organization}`,
  ]);
};
```

### Frontend Socket.IO Setup

**File:** `client/src/services/socketService.js` - Socket.IO Client Service

```javascript
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
      withCredentials: true, // Send HTTP-only cookies
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.connect();

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, handler) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event, handler) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

exportdefault new SocketService();
```

**File:** `client/src/services/socketEvents.js` - Socket.IO Event Handlers with Cache Invalidation

```javascript
import { store } from "../redux/app/store";
import { taskApi } from "../redux/features/task/taskApi";
import { notificationApi } from "../redux/features/notification/notificationApi";
import { toast } from "react-toastify";

export const setupSocketEventHandlers = (socket) => {
  // Task events
  socket.on("task:created", (task) => {
    console.log("Task created:", task);
    store.dispatch(taskApi.util.invalidateTags(["Task"]));
    toast.info(`New task created: ${task.title}`);
  });

  socket.on("task:updated", (task) => {
    console.log("Task updated:", task);
    store.dispatch(
      taskApi.util.invalidateTags([{ type: "Task", id: task._id }])
    );
  });

  socket.on("task:deleted", (task) => {
    console.log("Task deleted:", task);
    store.dispatch(taskApi.util.invalidateTags(["Task"]));
    toast.warning(`Task deleted: ${task.title}`);
  });

  socket.on("task:restored", (task) => {
    console.log("Task restored:", task);
    store.dispatch(taskApi.util.invalidateTags(["Task"]));
    toast.success(`Task restored: ${task.title}`);
  });

  // Notification events
  socket.on("notification:created", (notification) => {
    console.log("Notification received:", notification);
    store.dispatch(notificationApi.util.invalidateTags(["Notification"]));
    toast.info(notification.message);
  });

  // User status events
  socket.on("user:online", (user) => {
    console.log("User online:", user);
  });

  socket.on("user:offline", (user) => {
    console.log("User offline:", user);
  });
};
```

**File:** `client/src/hooks/useSocket.js` - Socket.IO Hook

```javascript
import { useEffect } from "react";
import socketService from "../services/socketService";

const useSocket = () => {
  useEffect(() => {
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const on = (event, handler) => {
    socketService.on(event, handler);
  };

  const off = (event, handler) => {
    socketService.off(event, handler);
  };

  const emit = (event, data) => {
    socketService.emit(event, data);
  };

  return { on, off, emit };
};

export default useSocket;
```

---

## FRONTEND UI PATTERNS

### DataGrid Pattern (Admin Views)

**Use For:** Organizations, Departments, Materials, Vendors, Users (admin view)

**When to Use:**

- Resource management pages requiring CRUD operations
- Pages with complex filtering, sorting, and pagination
- Admin-level views with bulk operations
- Data-heavy interfaces with many columns

**Required Files:**

- `*Page.jsx` - Data fetching, state management, filters
- `*Columns.jsx` - Column definitions for DataGrid
- `*Filter.jsx` - Filter UI components (optional)
- `CreateUpdate*.jsx` - Form modal for create/edit operations

**Required Components:**

- `MuiDataGrid` - Auto-converts pagination (0-based MUI ↔ 1-based backend)
- `MuiActionColumn` - Actions (View/Edit/Delete/Restore), auto-detects soft delete
- `CustomDataGridToolbar` - Optional toolbar with export, filters, columns

**Critical DataGrid Rules:**

1. ✅ ALWAYS use server-side pagination (`paginationMode: "server"`)
2. ✅ ALWAYS convert pagination: `page + 1` when sending to backend
3. ✅ ALWAYS pass `loading={isLoading || isFetching}` to show loading state
4. ✅ ALWAYS provide meaningful `emptyMessage`
5. ✅ ALWAYS use `MuiActionColumn` for action buttons (never custom)
6. ✅ ALWAYS set action column: `sortable: false`, `filterable: false`, `disableColumnMenu: true`

**Pattern Structure:**

```jsx
// MaterialsPage.jsx
import { useState } from "react";
import { useGetMaterialsQuery } from "../redux/features/material/materialApi";
import MuiDataGrid from "../components/common/MuiDataGrid";
import { getMaterialColumns } from "../components/columns/MaterialColumns";
import MaterialFilter from "../components/filters/MaterialFilter";
import CreateUpdateMaterial from "../components/forms/materials/CreateUpdateMaterial";

const MaterialsPage = () => {
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const { data, isLoading, isFetching } = useGetMaterialsQuery({
    page: pagination.page + 1, // Convert to 1-based for backend
    limit: pagination.pageSize,
    ...filters,
  });

  const handleView = (material) => {
    /* Navigate to detail view */
  };
  const handleEdit = (material) => {
    setSelectedMaterial(material);
    setDialogOpen(true);
  };
  const handleDelete = async (material) => {
    /* Show confirmation, then delete */
  };
  const handleRestore = async (material) => {
    /* Restore soft-deleted material */
  };

  const columns = getMaterialColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onRestore: handleRestore,
  });

  return (
    <Box>
      <MaterialFilter filters={filters} onFiltersChange={setFilters} />
      <MuiDataGrid
        rows={data?.materials || []}
        columns={columns}
        loading={isLoading || isFetching}
        rowCount={data?.pagination?.totalCount || 0}
        paginationModel={pagination}
        onPaginationModelChange={setPagination}
        emptyMessage="No materials found"
      />
      <CreateUpdateMaterial
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        material={selectedMaterial}
      />
    </Box>
  );
};
```

**Column Definition Pattern:**

```jsx
// MaterialColumns.jsx
import MuiActionColumn from "../common/MuiActionColumn";

export const getMaterialColumns = (actions) => {
  const { onView, onEdit, onDelete, onRestore } = actions;

  return [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
    },
    {
      field: "quantity",
      headerName: "Quantity",
      width: 100,
      type: "number",
    },
    {
      field: "unitType",
      headerName: "Unit",
      width: 100,
    },
    {
      field: "cost",
      headerName: "Cost",
      width: 120,
      type: "number",
      valueFormatter: (value) => `${value.toFixed(2)}`,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <MuiActionColumn
          row={params.row}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      ),
    },
  ];
};
```

### Three-Layer Pattern (User Views)

**Use For:** Tasks, Users (user view), Dashboard widgets

**When to Use:**

- Card-based layouts for better visual hierarchy
- User-facing views (non-admin)
- Mobile-responsive designs
- Content-heavy displays

**Structure:** Page → List → Card

**Layer Responsibilities:**

- **Page**: Data fetching, state management, event handling, routing
- **List**: Layout, mapping items, delegating events to cards
- **Card**: Display single item, memoized for performance

**Critical Three-Layer Rules:**

1. ✅ ALWAYS wrap Card components with `React.memo`
2. ✅ ALWAYS use `useCallback` for event handlers passed to children
3. ✅ ALWAYS use `useMemo` for computed values (dates, colors, etc.)
4. ✅ ALWAYS set `displayName` for memoized components (debugging)
5. ✅ ALWAYS handle empty states in List component
6. ✅ ALWAYS use MUI Grid with `size` prop (NOT `item` prop)

**Pattern Structure:**

```jsx
// TasksPage.jsx (Layer 1: Page)
import { useState } from "react";
import { useGetTasksQuery } from "../redux/features/task/taskApi";
import TasksList from "../components/lists/TasksList";
import TaskFilter from "../components/filters/TaskFilter";

const TasksPage = () => {
  const [filters, setFilters] = useState({});
  const { data, isLoading } = useGetTasksQuery(filters);

  const handleTaskClick = (task) => {
    navigate(`/tasks/${task._id}`);
  };

  const handleTaskUpdate = (task) => {
    // Open edit dialog
  };

  return (
    <Box>
      <TaskFilter filters={filters} onFiltersChange={setFilters} />
      {isLoading ? (
        <MuiLoading />
      ) : (
        <TasksList
          tasks={data?.tasks || []}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </Box>
  );
};

// TasksList.jsx (Layer 2: List)
import { Grid } from "@mui/material";
import TaskCard from "../cards/TaskCard";

const TasksList = ({ tasks, onTaskClick, onTaskUpdate }) => {
  if (tasks.length === 0) {
    return <EmptyState message="No tasks found" />;
  }

  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid key={task._id} size={{ xs: 12, sm: 6, md: 4 }}>
          <TaskCard task={task} onClick={onTaskClick} onUpdate={onTaskUpdate} />
        </Grid>
      ))}
    </Grid>
  );
};

// TaskCard.jsx (Layer 3: Card)
import React, { useCallback, useMemo } from "react";
import { Card, CardContent, Typography, Chip } from "@mui/material";
import dayjs from "dayjs";

const TaskCard = React.memo(({ task, onClick, onUpdate }) => {
  // Memoize event handlers
  const handleClick = useCallback(() => {
    onClick(task);
  }, [task, onClick]);

  const handleUpdate = useCallback(
    (e) => {
      e.stopPropagation(); // Prevent card click
      onUpdate(task);
    },
    [task, onUpdate]
  );

  // Memoize computed values
  const formattedDate = useMemo(() => {
    return dayjs(task.createdAt).format("MMM DD, YYYY");
  }, [task.createdAt]);

  const statusColor = useMemo(() => {
    const colors = {
      "To Do": "default",
      "In Progress": "primary",
      Completed: "success",
      Pending: "warning",
    };
    return colors[task.status] || "default";
  }, [task.status]);

  return (
    <Card onClick={handleClick} sx={{ cursor: "pointer", height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {task.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {task.description}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Chip label={task.status} color={statusColor} size="small" />
          <Chip label={task.priority} size="small" />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {formattedDate}
        </Typography>
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = "TaskCard";

export default TaskCard;
```

### Form Pattern (Create/Update)

**Use For:** All resource creation and editing

**When to Use:**

- Creating new resources
- Editing existing resources
- Multi-step forms (registration)
- Complex validation requirements

**Required Libraries:**

- `react-hook-form` - Form state management
- `@mui/material` - UI components
- Controller from react-hook-form for MUI integration

**Critical Form Rules:**

1. ❌ NEVER use `watch()` method from react-hook-form
2. ✅ ALWAYS use `Controller` for MUI components
3. ✅ ALWAYS use `control` prop from useForm
4. ✅ ALWAYS reset form when material/resource changes
5. ✅ ALWAYS handle both create and edit modes in same component
6. ✅ ALWAYS show loading state during submission
7. ✅ ALWAYS show toast notifications for success/error
8. ✅ ALWAYS validate on submit (not on change for better UX)
9. ✅ ALWAYS match backend validator field names exactly
10. ✅ ALWAYS import constants from utils/constants.js

**Pattern Structure:**

```jsx
// CreateUpdateMaterial.jsx
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
} from "../../redux/features/material/materialApi";
import MuiDialog from "../common/MuiDialog";
import MuiTextField from "../common/MuiTextField";
import MuiSelectAutocomplete from "../common/MuiSelectAutocomplete";
import { MATERIAL_CATEGORIES, UNIT_TYPES } from "../../utils/constants";
import { toast } from "react-toastify";

const CreateUpdateMaterial = ({ open, onClose, material }) => {
  const isEditMode = Boolean(material);

  const [createMaterial, { isLoading: isCreating }] =
    useCreateMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] =
    useUpdateMaterialMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      unitType: "",
      price: 0,
    },
  });

  // Reset form when material changes
  useEffect(() => {
    if (material) {
      reset({
        name: material.name || "",
        description: material.description || "",
        category: material.category || "",
        quantity: material.quantity || 0,
        unitType: material.unitType || "",
        price: material.price || 0,
      });
    } else {
      reset();
    }
  }, [material, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateMaterial({ id: material._id, ...data }).unwrap();
        toast.success("Material updated successfully");
      } else {
        await createMaterial(data).unwrap();
        toast.success("Material created successfully");
      }
      onClose();
    } catch (error) {
      toast.error(error.data?.message || "Operation failed");
    }
  };

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title={isEditMode ? "Edit Material" : "Create Material"}
      onSubmit={handleSubmit(onSubmit)}
      submitText={isEditMode ? "Update" : "Create"}
      loading={isCreating || isUpdating}
    >
      <MuiTextField
        {...register("email", {
          required: "Email is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Please enter a valid email address",
          },
        })}
        error={errors.email}
        label="Email Address"
        type="email"
        fullWidth
        size="small"
        margin="normal"
        autoComplete="email"
        autoFocus
        startAdornment={<EmailIcon fontSize="small" color="primary" />}
      />
    </MuiDialog>
  );
};

export default CreateUpdateMaterial;
```

---

## VALIDATION PATTERNS

### Client-Side Validation (Frontend)

**Purpose:** Provide immediate feedback to users before submitting to backend

**Critical Rules:**

1. ✅ ALWAYS match backend validation rules exactly
2. ✅ ALWAYS check backend validators for field requirements
3. ✅ ALWAYS use same error messages as backend when possible
4. ✅ ALWAYS validate on submit (not on change for better UX)

**Common Validation Rules:**

```javascript
// Text fields
{
  required: 'Field is required',
  minLength: { value: 3, message: 'Minimum 3 characters' },
  maxLength: { value: 100, message: 'Maximum 100 characters' },
  pattern: { value: /^[a-zA-Z0-9]+$/, message: 'Alphanumeric only' }
}

// Email
{
  required: 'Email is required',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Invalid email address'
  }
}

// Number fields
{
  required: 'Field is required',
  min: { value: 0, message: 'Must be positive' },
  max: { value: 100, message: 'Maximum 100' },
  validate: (value) => value > 0 || 'Must be greater than 0'
}

// Custom validation
{
  validate: {
    positive: (value) => value > 0 || 'Must be positive',
    lessThan100: (value) => value < 100 || 'Must be less than 100',
    unique: async (value) => {
      const exists = await checkUnique(value);
      return !exists || 'Already exists';
    }
  }
}
```

### Backend Validation Matching

**Critical:** Frontend validation MUST match backend validators exactly

**Process:**

1. Open backend validator file: `backend/middlewares/validators/*Validators.js`
2. Identify all validation rules for each field
3. Implement identical rules in frontend form
4. Use same error messages when possible

**Example:**

```javascript
// Backend: backend/middlewares/validators/materialValidators.js
body('name')
  .trim()
  .notEmpty().withMessage('Name is required')
  .isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),

body('quantity')
  .notEmpty().withMessage('Quantity is required')
  .isFloat({ min: 0 }).withMessage('Quantity must be positive'),

// Frontend: client/src/components/forms/materials/CreateUpdateMaterial.jsx
<Controller
  name="name"
  control={control}
  rules={{
    required: 'Name is required',
    maxLength: { value: 100, message: 'Name must not exceed 100 characters' }
  }}
 ...
/>

<Controller
  name="quantity"
  control={control}
  rules={{
    required: 'Quantity is required',
    min: { value: 0, message: 'Quantity must be positive' }
  }}
  ...
/>
```

---

## TEMPLATE PATTERNS (NO CODE - STRUCTURE ONLY)

### Schema Template Pattern

**File Structure:** `backend/models/ModelName.js`

**Required Imports:**

```javascript
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import softDeletePlugin from "./plugins/softDelete.js";
```

**Schema Configuration:**

```javascript
const schemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.id;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.id;
      return ret;
    },
  },
};
```

**Schema Definition:**

- Define all fields with types, validation, references
- Add indexes for frequently queried fields
- Add unique indexes for uniqueness constraints
- Add compound indexes for multi-field queries
- Add text indexes for search functionality

**Virtuals:**

- Define virtual fields (e.g., fullName = firstName + lastName)
- Configure virtual populate for relationships

**Pre-Save Hooks (with session support):**

```javascript
schemaName.pre("save", async function (next) {
  // Access session if available: this.$session()
  // Perform pre-save operations
  // Auto-set fields (e.g., isHod based on role)
  // Validate business rules
  next();
});
```

**Pre-Remove Hooks (with session support):**

```javascript
schemaName.pre("remove", async function (next) {
  const session = this.$session();
  // Perform cascade delete operations
  // Use session for all operations
  next();
});
```

**Instance Methods (with session support):**

```javascript
schemaName.methods.methodName = async function (params, { session } = {}) {
  // Method implementation
  // Use session if provided
  // Return result
};
```

**Static Methods (with session support):**

```javascript
schemaName.statics.methodName = async function (params, { session } = {}) {
  // Static method implementation
  // Use session if provided
  // Return result
};
```

**Cascade Delete Static Method (with session support):**

```javascript
schemaName.statics.softDeleteByIdWithCascade = async function (
  id,
  { session, deletedBy } = {}
) {
  // Start transaction if no session provided
  // Soft delete parent
  // Soft delete all children in order
  // Commit transaction
  // Return result
};
```

**Plugin Application:**

```javascript
schemaName.plugin(mongoosePaginate);
schemaName.plugin(softDeletePlugin);
```

**TTL Index:**

```javascript
// After model creation
ModelName.ensureTTLIndex(expireAfterSeconds); // or null for no expiry
```

### Controller Template Pattern

**File Structure:** `backend/controllers/resourceControllers.js`

**Required Imports:**

```javascript
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { matchedData } from "express-validator";
import Model from "../models/Model.js";
import CustomError from "../errorHandler/CustomError.js";
```

**Read Controller Pattern (No Session):**

```javascript
export const getResources = asyncHandler(async (req, res, next) => {
  // Extract user context
  const {
    _id: userId,
    role,
    organization,
    department,
    isPlatformUser,
    isHod,
    isPlatformOrg,
  } = req.user;

  // Extract validated query parameters
  const { page, limit, sortBy, sortOrder, search, ...filters } =
    req.validated.query;

  // Build query based on authorization scope
  const query = {};

  // Apply organization isolation (except platform SuperAdmin with crossOrg)
  if (!isPlatformUser || role !== "SuperAdmin") {
    query.organizationId = organizationId;
  }

  // Apply department isolation for Manager/User
  if (role === "Manager" || role === "User") {
    query.departmentId = departmentId;
  }

  // Apply additional filters
  if (search) {
    query.$text = { $search: search };
  }

  // Apply other filters from query params
  Object.assign(query, filters);

  // Pagination options
  const options = {
    page: page || 1,
    limit: limit || 10,
    sort: { [sortBy || "createdAt"]: sortOrder === "asc" ? 1 : -1 },
    populate: [
      /* populate options */
    ],
  };

  // Execute paginated query
  const result = await Model.paginate(query, options);

  // Return response
  res.status(200).json({
    success: true,
    pagination: {
      page: result.page,
      limit: result.limit,
      totalCount: result.totalDocs,
      totalPages: result.totalPages,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
    },
    resources: result.docs,
  });
});
```

**Write Controller Pattern (With Session and Transaction):**

```javascript
export const createResource = asyncHandler(async (req, res, next) => {
  // Extract user context
  const { _id: userId, req.user.organization._id: organizationId, req.user.department._id:departmentId } = req.user;

  // Extract validated body data
  const { field1, field2, field3 } = req.validated.body;

  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate business rules
    // Check existence of referenced documents (with session)
    const referencedDoc = await ReferencedModel.findById(referenceId).session(
      session
    );
    if (!referencedDoc) {
      throw CustomError.notFound("Referenced document not found");
    }

    // Check uniqueness (with session and withDeleted)
    const existing = await Model.findOne({ uniqueField: value })
      .withDeleted()
      .session(session);
    if (existing) {
      throw CustomError.conflict("Resource already exists");
    }

    // Create resource (with session)
    const resource = await Model.create(
      [
        {
          field1,
          field2,
          field3,
          organizationId,
          departmentId,
          createdBy: userId,
        },
      ],
      { session }
    );

    // Perform related operations (with session)
    // Create notifications, update related documents, etc.

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event (after successful commit)
    emitResourceEvent("resource:created", resource[0]);

    // Return response
    return res.status(201).json({
      success: true,
      message: "Resource created successfully",
      resource: resource[0],
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    next(error)
  } finally {
    // End session
    session.endSession();
  }
});
```

**Update Controller Pattern (With Session and Transaction):**

```javascript
export const updateResource = asyncHandler(async (req, res, next) => {
  // Extract user context
  const { _id: userId, role, req.user.organization._id: organizationId, req.user.department._id:departmentId} = req.user;

  // Extract validated params and body
  const { resourceId } = req.validated.params;
  const updateData = req.validated.body;

  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find resource (with session)
    const resource = await Model.findById(resourceId).session(session);
    if (!resource) {
      throw CustomError.notFound("Resource not found");
    }

    // Check authorization (ownership or scope)
    const hasPermission = checkUpdatePermission(req.user, resource);
    if (!hasPermission) {
      throw CustomError.authorization("Insufficient permissions to update this resource");
    }

    // Validate business rules for update
    // Check uniqueness if unique fields are being updated

    // Update resource fields
    Object.assign(resource, updateData);

    // Save resource (with session)
    await resource.save({ session });

    // Perform related operations (with session)

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event
    emitResourceEvent("resource:updated", resource);

    // Return response
    return res.status(200).json({
      success: true,
      message: "Resource updated successfully",
      resource,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error)
  } finally {
    session.endSession();
  }
});
```

**Delete Controller Pattern (With Session and Cascade):**

```javascript
export const deleteResource = asyncHandler(async (req, res, next) => {
  // Extract user context
  const { _id: userId, role, req.user.organization._id: organizationId, req.user.department._id:departmentId} = req.user;

  // Extract validated params
  const { resourceId } = req.validated.params;

  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find resource (with session)
    const resource = await Model.findById(resourceId).session(session);
    if (!resource) {
      throw CustomError.notFound("Resource not found");
    }

    // Check authorization
    const hasPermission = checkDeletePermission(req.user, resource);
    if (!hasPermission) {
      throw CustomError.authorization("Insufficient permissions to delete this resource");
    }

    // Check deletion constraints (e.g., cannot delete last HOD)

    // Soft delete with cascade (with session)
    await Model.softDeleteByIdWithCascade(resourceId, { session, deletedBy: userId });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event
    emitResourceEvent("resource:deleted", resource);

    // Return response
    return res.status(200).json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error)
  } finally {
    session.endSession();
  }
});
```

**Restore Controller Pattern (With Session):**

```javascript
export const restoreResource = asyncHandler(async (req, res, next) => {
  // Extract user context
  const { _id: userId } = req.user;

  // Extract validated params
  const { resourceId } = req.validated.params;

  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find soft-deleted resource (with session and onlyDeleted)
    const resource = await Model.findById(resourceId)
      .onlyDeleted()
      .session(session);
    if (!resource) {
      throw CustomError.notFound("Deleted resource not found");
    }

    // Check authorization

    // Restore resource (with session)
    await resource.restore(userId, { session });

    // Commit transaction
    await session.commitTransaction();

    // Emit Socket.IO event
    emitResourceEvent("resource:restored", resource);

    // Return response
    return res.status(200).json({
      success: true,
      message: "Resource restored successfully",
      resource,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
```

### Validator Template Pattern

**File Structure:** `backend/middlewares/validators/resourceValidators.js`

**Required Imports:**

```javascript
import { body, param, query } from "express-validator";
import { matchedData } from "express-validator";
import Model from "../../models/Model.js";
import ReferencedModel from "../../models/ReferencedModel.js";
```

**Field Validation Pattern:**

```javascript
// String field with length constraints
body('fieldName')
  .trim()
  .notEmpty().withMessage('Field is required')
  .isLength({ min: 1, max: 100 }).withMessage('Field must be between 1 and 100 characters'),

// Email field
body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .normalizeEmail({})
  .isLength({ max: 50 }).withMessage('Email must not exceed 50 characters'),

// Number field with range
body('quantity')
  .notEmpty().withMessage('Quantity is required')
  .isFloat({ min: 0 }).withMessage('Quantity must be positive'),

// Enum field
body('status')
  .notEmpty().withMessage('Status is required')
  .isIn(['To Do', 'In Progress', 'Completed', 'Pending']).withMessage('Invalid status'),

// Date field
body('dueDate')
  .optional()
  .isISO8601().withMessage('Invalid date format')
  .custom((value, { req }) => {
    if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
      throw new Error('Due date must be after start date');
    }
    return true;
  }),

// Reference field (ObjectId)
body('departmentId')
  .notEmpty().withMessage('Department is required')
  .isMongoId().withMessage('Invalid department ID'),

// Array field
body('tags')
  .optional()
  .isArray().withMessage('Tags must be an array')
  .custom((value) => {
    if (value.length > 5) {
      throw new Error('Maximum 5 tags allowed');
    }
    return true;
  }),
```

**Existence Validation Pattern (with withDeleted):**

```javascript
body('departmentId')
  .notEmpty().withMessage('Department is required')
  .isMongoId().withMessage('Invalid department ID')
  .custom(async (value, { req }) => {
    // Check if department exists (including soft-deleted)
    const department = await Department.findById(value).withDeleted();
    if (!department) {
      throw new Error('Department not found');
    }
    // Check if department is soft-deleted
    if (department.isDeleted) {
      throw new Error('Department is deleted');
    }
    // Check if department belongs to user's organization
    if (department.organizationId.toString() !== req.user.organizationId.toString()) {
      throw new Error('Department does not belong to your organization');
    }
    return true;
  }),
```

**Uniqueness Validation Pattern (with withDeleted):**

```javascript
body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .custom(async (value, { req }) => {
    // Check uniqueness within organization (including soft-deleted)
    const existing = await User.findOne({
      email: value.toLowerCase(),
      organization: req.user.organization._id,
    }).withDeleted();

    // If updating, exclude current document
    if (existing && (!req.params.id || existing._id.toString() !== req.params.id)) {
      throw new Error('Email already exists in your organization');
    }
    return true;
  }),
```

**Validation Result Handler:**

```javascript
export const handleValidationErrors = (req, res, next) => {
  // Extract validated data from all locations
  req.validated = {
    body: matchedData(req, { locations: ["body"] }),
    params: matchedData(req, { locations: ["params"] }),
    query: matchedData(req, { locations: ["query"] }),
  };

  next();
};
```

**Complete Validator Export:**

```javascript
export const createResourceValidator = [
  // All field validations
  body('field1')...,
  body('field2')...,
  // Validation result handler
  handleValidationErrors,
];

export const updateResourceValidator = [
  param('id').isMongoId().withMessage('Invalid resource ID'),
  // All field validations (optional for update)
  body('field1').optional()...,
  body('field2').optional()...,
  // Validation result handler
  handleValidationErrors,
];
```

### Route Template Pattern

**File Structure:** `backend/routes/resourceRoutes.js`

**Pattern:**

```javascript
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorization.js";
import {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  restoreResource,
} from "../controllers/resourceControllers.js";
import {
  createResourceValidator,
  updateResourceValidator,
  resourceIdValidator,
} from "../middlewares/validators/resourceValidators.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// List resources (read permission)
router.get("/", authorize("Resource", "read"), getResources);

// Get single resource (read permission)
router.get(
  "/:resourceId",
  resourceIdValidator,
  authorize("Resource", "read"),
  getResource
);

// Create resource (create permission)
router.post(
  "/",
  createResourceValidator,
  authorize("Resource", "create"),
  createResource
);

// Update resource (update permission)
router.put(
  "/:resourceId",
  updateResourceValidator,
  authorize("Resource", "update"),
  updateResource
);

// Delete resource (delete permission)
router.delete(
  "/:resourceId",
  resourceIdValidator,
  authorize("Resource", "delete"),
  deleteResource
);

// Restore resource (update permission)
router.patch(
  "/:resourceId/restore",
  resourceIdValidator,
  authorize("Resource", "update"),
  restoreResource
);

export default router;
```

---

## IMPLEMENTATION ORDER AND DEPENDENCIES

### Phase 1: Backend Foundation (Core → Models → Routes → Validators → Controllers)

**Phase 1.0: Backend Core Foundation (NO Models/Controllers/Routes Yet)**

**CRITICAL:** Build ALL foundational infrastructure BEFORE creating any models, controllers, or routes.

**Step 1.0.1: Project Setup**

- Initialize backend with ES modules (`"type": "module"`)
- Install all dependencies from package.json
- Create complete folder structure exactly as specified
- Setup environment variables (.env file)

**Step 1.0.2: Configuration Files**

- `config/db.js` - MongoDB connection with retry logic, connection pooling (min: 2, max: 10), health check monitoring
- `config/allowedOrigins.js` - CORS allowed origins list
- `config/corsOptions.js` - CORS configuration with validation
- `config/authorizationMatrix.json` - Role-based permissions (ONLY source of truth)

**Step 1.0.3: Error Handling Infrastructure**

- `errorHandler/CustomError.js` - Custom error class with status codes and error codes
- `errorHandler/ErrorController.js` - Global error handler middleware

**CustomError Class Structure:**

The CustomError class provides consistent error handling with standardized error codes and status codes:

```javascript
class CustomError extends Error {
  constructor(
    message,
    statusCode = 500,
    errorCode = "INTERNAL_SERVER_ERROR",
    context = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.context = context;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a validation error with consistent error code
   */
  static validation(message, context = {}) {
    return new CustomError(message, 400, "VALIDATION_ERROR", context);
  }

  /**
   * Create an authentication error with consistent error code (logout on frontend)
   */
  static authentication(message, context = {}) {
    return new CustomError(message, 401, "AUTHENTICATION_ERROR", context);
  }

  /**
   * Create an authorization error with consistent error code
   */
  static authorization(message, context = {}) {
    return new CustomError(message, 403, "AUTHORIZATION_ERROR", context);
  }

  /**
   * Create a not found error with consistent error code
   */
  static notFound(message, context = {}) {
    return new CustomError(message, 404, "NOT_FOUND_ERROR", context);
  }

  /**
   * Create a conflict error with consistent error code
   */
  static conflict(message, context = {}) {
    return new CustomError(message, 409, "CONFLICT_ERROR", context);
  }

  /**
   * Create an internal server error with consistent error code
   */
  static internal(message, context = {}) {
    return new CustomError(message, 500, "INTERNAL_SERVER_ERROR", context);
  }
}
```

**Error Code Standards:**

- `VALIDATION_ERROR` (400) - Invalid input data, validation failures
- `AUTHENTICATION_ERROR` (401) - Invalid credentials, expired tokens (triggers logout on frontend)
- `AUTHORIZATION_ERROR` (403) - Insufficient permissions, forbidden access
- `NOT_FOUND_ERROR` (404) - Resource not found
- `CONFLICT_ERROR` (409) - Duplicate resources, uniqueness violations
- `INTERNAL_SERVER_ERROR` (500) - Unexpected server errors

**Usage in Controllers:**

```javascript
// Validation error
throw CustomError.validation("Invalid email format");

// Authentication error (triggers logout on frontend)
throw CustomError.authentication("Invalid credentials");

// Authorization error
throw CustomError.authorization("Insufficient permissions");

// Not found error
throw CustomError.notFound("User not found");

// Conflict error
throw CustomError.conflict("Email already exists");

// Internal server error
throw CustomError.internal("Database connection failed");
```

**Step 1.0.4: Utility Functions**

- `utils/constants.js` - ALL constants (ONLY source of truth) - MUST be created FIRST
- `utils/logger.js` - Winston logger configuration (file and console transports)
- `utils/helpers.js` - Utility helper functions
- `utils/generateTokens.js` - JWT token generation functions
- `utils/validateEnv.js` - Environment variable validation
- `utils/authorizationMatrix.js` - Authorization helper functions
- `utils/responseTransform.js` - Response formatting utilities
- `utils/materialTransform.js` - Material data transformation
- `utils/userStatus.js` - User status tracking utilities
- `utils/dateUtils.js` - **Timezone management utilities (UTC conversion, ISO formatting)**

**Step 1.0.5: Middleware (Non-Validator)**

- `middlewares/authMiddleware.js` - JWT verification (verifyJWT, verifyRefreshToken)
- `middlewares/authorization.js` - Role-based authorization middleware
- `middlewares/rateLimiter.js` - Rate limiting (production only)

**Step 1.0.6: Services**

- `services/emailService.js` - Nodemailer, Gmail SMTP, queue-based email sending
- `services/notificationService.js` - Notification creation and management

**Step 1.0.7: Email Templates**

- `templates/emailTemplates.js` - HTML email templates (welcome, password reset, notifications)

**Step 1.0.8: Socket.IO Infrastructure**

- `utils/socketInstance.js` - Socket.IO singleton pattern
- `utils/socket.js` - Socket.IO event handlers (connection, disconnection, rooms)
- `utils/socketEmitter.js` - Socket.IO event emitters (task, activity, comment, notification events)

**Step 1.0.9: Soft Delete Plugin (CRITICAL - Universal Dependency)**

- `models/plugins/softDelete.js` - Universal soft delete functionality
- Implement all query helpers: `withDeleted()`, `onlyDeleted()`
- Implement instance methods: `softDelete()`, `restore()`
- Implement static methods: `softDeleteById()`, `softDeleteMany()`, `restoreById()`, `restoreMany()`, `findDeletedByIds()`, `countDeleted()`, `ensureTTLIndex()`, `getRestoreAudit()`
- TTL index configuration
- Hard delete protection (block deleteOne, deleteMany, findOneAndDelete, remove)

**Step 1.0.10: App Configuration**

- `app.js` - Express app setup with security middleware order (helmet, cors, cookieParser, express.json, mongoSanitize, compression, rateLimiter)
- Error handling middleware
- Static file serving (production)
- **Timezone configuration: Set process.env.TZ = 'UTC'**

**Step 1.0.11: Server Startup**

- `server.js` - HTTP server creation, Socket.IO initialization, graceful shutdown
- Database connection
- **Timezone enforcement: Verify UTC timezone**

**Phase 1.1: Models (In Dependency Order)**

**CRITICAL:** ALL models MUST include:

- `import mongoosePaginate from 'mongoose-paginate-v2';`
- `import softDeletePlugin from './plugins/softDelete.js';`
- Schema options with timestamps, versionKey: false, toJSON/toObject transforms
- Session support in all hooks and methods
- Plugin application: `schema.plugin(mongoosePaginate)` and `schema.plugin(softDeletePlugin)`
- TTL index: `Model.ensureTTLIndex(expireAfterSeconds)` after model creation
- **Date field handling: Automatic UTC conversion with dayjs**

**Model Creation Order:**

1. **Organization** (no dependencies) - Platform vs Customer organization
2. **Department** (depends on: Organization)
3. **User** (depends on: Organization, Department) - Role, HOD flag, platform flag
4. **Vendor** (depends on: Organization) - External clients for ProjectTasks
5. **Material** (depends on: Department, Organization, User) - Just to get what is being used to complete the task
6. **BaseTask** (depends on: Organization, Department, User) - Abstract base with discriminator
7. **ProjectTask** (extends BaseTask, depends on: Vendor) - Outsourced to vendors
8. **RoutineTask** (extends BaseTask) - From outlets, materials added directly
9. **AssignedTask** (extends BaseTask, depends on: User) - Assigned to users
10. **TaskActivity** (depends on: ProjectTask/AssignedTask, User, Material, Organization, department) - NOT for RoutineTask
11. **TaskComment** (depends on: Task/TaskActivity/TaskComment, User, Organization, department) - Threaded comments
12. **Attachment** (depends on: Task/TaskActivity/TaskComment, User, Organization, department) - File references
13. **Notification** (depends on: User, Organization, department) - User alerts

**Phase 1.2: Routes → Validators → Controllers (By Resource, In Dependency Order)**

**CRITICAL PATTERN:** For each resource, implement in this EXACT order:

1. **Routes** - Define endpoints with authentication and authorization
2. **Validators** - Implement validation rules with existence/uniqueness checks using withDeleted()
3. **Controllers** - Implement business logic with transactions for write operations

**Implementation Order by Resource:**

**1.2.1: Authentication (No Model Dependency)**

- Routes: `routes/authRoutes.js` (register, login, logout, refresh, forgot-password, reset-password)
- Validators: `middlewares/validators/authValidators.js` (registration, login, password reset)
- Controllers: `controllers/authControllers.js` (with transactions for register)

**1.2.2: Organization (Platform SuperAdmin Only)**

- Routes: `routes/organizationRoutes.js` (CRUD, restore)
- Validators: `middlewares/validators/organizationValidators.js` (uniqueness checks with withDeleted)
- Controllers: `controllers/organizationControllers.js` (with transactions, cascade delete protection for platform org)

**1.2.3: Department (Depends on: Organization)**

- Routes: `routes/departmentRoutes.js` (CRUD, restore)
- Validators: `middlewares/validators/departmentValidators.js` (organization existence, uniqueness within org)
- Controllers: `controllers/departmentControllers.js` (with transactions, cascade delete to users/tasks)

**1.2.4: User (Depends on: Organization, Department)**

- Routes: `routes/userRoutes.js` (CRUD, profile, account, restore)
- Validators: `middlewares/validators/userValidators.js` (email uniqueness within org, department existence, HOD constraints)
- Controllers: `controllers/userControllers.js` (with transactions, HOD auto-set, cascade delete, last HOD protection)

**1.2.5: Vendor (Depends on: Organization)**

- Routes: `routes/vendorRoutes.js` (CRUD, restore)
- Validators: `middlewares/validators/vendorValidators.js` (department existence, email/phone validation)
- Controllers: `controllers/vendorControllers.js` (with transactions, material reassignment on delete)

**1.2.6: Material (Depends on: Department, Organization)**

- Routes: `routes/materialRoutes.js` (CRUD, restore)
- Validators: `middlewares/validators/materialValidators.js` (vendor existence, category/unitType validation)
- Controllers: `controllers/materialControllers.js` (with transactions)

**1.2.7: Task (Depends on: Organization, Department, User, Vendor, Material)**

- Routes: `routes/taskRoutes.js` (CRUD for all task types, restore)
- Validators: `middlewares/validators/taskValidators.js` (task type-specific validation, vendor for ProjectTask, assignees for AssignedTask, status/priority restrictions for RoutineTask)
- Controllers: `controllers/taskControllers.js` (with transactions, discriminator pattern, cascade delete to activities/comments/attachments)

**1.2.8: TaskActivity (Depends on: ProjectTask/AssignedTask, User, Material, Organization, department)**

- Routes: `routes/taskActivityRoutes.js` (CRUD, restore) - NOT for RoutineTask
- Validators: `middlewares/validators/taskActivityValidators.js` (parent task type validation, material existence)
- Controllers: `controllers/taskActivityControllers.js` (with transactions, cascade delete to comments/attachments)

**1.2.9: TaskComment (Depends on: Task/TaskActivity/TaskComment, User, Organization, department)**

- Routes: `routes/taskCommentRoutes.js` (CRUD, restore)
- Validators: `middlewares/validators/taskCommentValidators.js` (parent existence, max depth 3, mentions validation)
- Controllers: `controllers/taskCommentControllers.js` (with transactions, cascade delete to child comments)

**1.2.10: Attachment (Depends on: Task/TaskActivity/TaskComment, User, Organization, department)**

- Routes: `routes/attachmentRoutes.js` (CRUD with Cloudinary upload)
- Validators: `middlewares/validators/attachmentValidators.js` (parent existence, file type/size validation)
- Controllers: `controllers/attachmentControllers.js` (with transactions, Cloudinary integration)

**1.2.11: Notification (Depends on: User, Organization, department)**

- Routes: `routes/notificationRoutes.js` (CRUD, mark as read, mark all as read)
- Validators: `middlewares/validators/notificationValidators.js` (recipient existence, entity reference validation)
- Controllers: `controllers/notificationControllers.js` (with transactions, TTL expiry)

**Phase 1.3: Route Aggregation**

- `routes/index.js` - Aggregate all routes with proper prefixes
- Apply global authentication middleware where needed
- Test all endpoints with proper authorization

### Phase 2: Frontend Foundation (Core → Redux → Components → Pages)

**Phase 2.0: Frontend Core Foundation (NO Redux/Components/Pages Yet)**

**CRITICAL:** Build ALL foundational infrastructure BEFORE creating Redux, components, or pages.

**Step 2.0.1: Project Setup**

- Initialize client with Vite
- Install all dependencies from package.json
- Create complete folder structure exactly as specified
- Setup environment variables (.env file)

**Step 2.0.2: Constants (MUST MIRROR BACKEND EXACTLY)**

- File: `client/src/utils/constants.js`
- Copy ALL constants from `backend/utils/constants.js`
- Verify exact match (case-sensitive)
- **CRITICAL:** This MUST be created FIRST before any other utilities

**Step 2.0.3: Utility Functions**

- `utils/errorHandler.js` - Custom error class for frontend
- `utils/dateUtils.js` - **Timezone management utilities:**
  - `getUserTimezone()` - Detect user's timezone
  - `convertUTCToLocal(utcDate)` - Convert UTC to user's local time for display
  - `convertLocalToUTC(localDate)` - Convert local time to UTC for API calls
  - `formatDateForDisplay(date, format)` - Format dates for UI components
  - `formatDateForAPI(date)` - Format dates for API (ISO string)
  - **Use dayjs with UTC and timezone plugins**

**Step 2.0.4: Services**

- `services/socketService.js` - Socket.IO client service (connection management, event handling)
- `services/socketEvents.js` - Socket.IO event handlers with RTK Query cache invalidation
- `services/cloudinaryService.js` - Cloudinary direct upload service (if using Cloudinary)

**Step 2.0.5: Hooks**

- `hooks/useSocket.js` - Socket.IO React hook
- `hooks/useAuth.js` - Authentication hook (access user state and auth methods)

**Step 2.0.6: Theme Infrastructure**

- `theme/themePrimitives.js` - Theme primitives (colors, spacing, typography)
- `theme/AppTheme.jsx` - Theme provider with light/dark mode support
- `theme/customizations/index.js` - Component customizations aggregator
- `theme/customizations/inputs.js` - Input component overrides
- `theme/customizations/dataDisplay.js` - Data display component overrides
- `theme/customizations/feedback.js` - Feedback component overrides
- `theme/customizations/surfaces.js` - Surface component overrides
- `theme/customizations/navigation.js` - Navigation component overrides
- `theme/customizations/dataGrid.js` - DataGrid component overrides
- `theme/customizations/datePickers.js` - Date picker component overrides
- `theme/customizations/charts.js` - Chart component overrides

**Phase 2.1: Redux Store Setup**

**Step 2.1.1: Base API Configuration**

- `redux/features/api.js` - RTK Query base API with:
  - Base URL from environment variable
  - Credentials: 'include' for HTTP-only cookies
  - Tag types for all resources
  - **Date transformation: Convert UTC dates from API to local for state**

**Step 2.1.2: Auth Slice**

- `redux/features/auth/authSlice.js` - Local auth state (user, isAuthenticated, isLoading)
- Selectors: selectUser, selectIsAuthenticated, selectIsLoading

**Step 2.1.3: Store Configuration**

- `redux/app/store.js` - Configure store with:
  - RTK Query API reducer
  - Auth slice with redux-persist (persist auth slice only)
  - Middleware configuration
  - Setup listeners for RTK Query

**Phase 2.2: Redux API Endpoints (In Dependency Order)**

**CRITICAL:** Each API endpoint MUST:

- Handle date conversion (local → UTC for requests, UTC → local for responses)
- Provide proper cache tags for invalidation
- Handle errors consistently

**API Creation Order:**

1. **authApi.js** - Login, register, logout, refresh, forgot-password, reset-password
2. **organizationApi.js** - CRUD operations (Platform SuperAdmin only)
3. **departmentApi.js** - CRUD operations
4. **userApi.js** - CRUD, profile, account operations
5. **vendorApi.js** - CRUD operations
6. **materialApi.js** - CRUD operations
7. **taskApi.js** - CRUD for all task types (ProjectTask, RoutineTask, AssignedTask)
8. **taskActivityApi.js** - CRUD operations (NOT for RoutineTask)
9. **taskCommentApi.js** - CRUD operations (threaded comments)
10. **attachmentApi.js** - CRUD operations with Cloudinary
11. **notificationApi.js** - CRUD, mark as read, mark all as read

**Phase 2.3: Common Components (Reusable UI)**

**Step 2.3.1: Form Components**

- `MuiTextField.jsx` - Text input with validation
- `MuiTextArea.jsx` - Multi-line text with character counter
- `MuiNumberField.jsx` - Number input with prefix/suffix
- `MuiSelectAutocomplete.jsx` - Single-select autocomplete
- `MuiMultiSelect.jsx` - Multi-select with chips
- `MuiResourceSelect.jsx` - Fetch and select resources (users, departments, materials, vendors)
- `MuiDatePicker.jsx` - **Date picker with automatic UTC ↔ local conversion**
- `MuiDateRangePicker.jsx` - **Date range picker with automatic UTC ↔ local conversion**
- `MuiCheckbox.jsx` - Checkbox with label
- `MuiRadioGroup.jsx` - Radio button group
- `MuiFileUpload.jsx` - File upload with preview

**Step 2.3.2: DataGrid Components**

- `MuiDataGrid.jsx` - DataGrid wrapper with automatic pagination conversion (0-based ↔ 1-based)
- `MuiActionColumn.jsx` - Action column (View/Edit/Delete/Restore) with auto soft-delete detection
- `CustomDataGridToolbar.jsx` - Optional toolbar with export, filters, columns

**Step 2.3.3: Filter Components**

- `FilterTextField.jsx` - Text filter with debouncing
- `FilterSelect.jsx` - Select filter (single/multiple)
- `FilterDateRange.jsx` - **Date range filter with UTC ↔ local conversion**
- `FilterChipGroup.jsx` - Active filters display with chips

**Step 2.3.4: Dialog Components**

- `MuiDialog.jsx` - Base dialog with accessibility props (disableEnforceFocus, disableRestoreFocus)
- `MuiDialogConfirm.jsx` - Confirmation dialog for destructive actions

**Step 2.3.5: Loading Components**

- `MuiLoading.jsx` - Loading spinner with message
- `BackdropFallback.jsx` - Full-screen loading overlay
- `NavigationLoader.jsx` - Top progress bar for navigation
- `ContentLoader.jsx` - Loading overlay for content area

**Step 2.3.6: Utility Components**

- `NotificationMenu.jsx` - Notification dropdown with unread count
- `GlobalSearch.jsx` - Global search (Ctrl+K)
- `ErrorBoundary.jsx` - Error boundary for React errors
- `RouteError.jsx` - Route error display (404, etc.)
- `CustomIcons.jsx` - Custom icon components

**Phase 2.4: Resource-Specific Components (By Resource)**

**For Each Resource, Create:**

1. **Columns** - `*Columns.jsx` (DataGrid column definitions)
2. **Cards** - `*Card.jsx` (Three-Layer pattern cards with React.memo, useCallback, useMemo)
3. **Lists** - `*List.jsx` (Three-Layer pattern lists with empty state handling)
4. **Filters** - `*Filter.jsx` (Filter UI components)
5. **Forms** - `CreateUpdate*.jsx` (Create/Edit forms with React Hook Form, Controller, validation)

**Resource Order:**

1. Organization (Platform SuperAdmin only)
2. Department
3. User
4. Vendor
5. Material
6. Task (all types)
7. TaskActivity
8. TaskComment
9. Attachment
10. Notification

**Phase 2.5: Layouts**

**Step 2.5.1: Layout Components**

- `RootLayout.jsx` - Top-level layout with Outlet
- `PublicLayout.jsx` - Public pages layout
- `DashboardLayout.jsx` - Protected pages with Header, Sidebar, Footer

**Step 2.5.2: Auth Components**

- `ProtectedRoute.jsx` - Restrict access to authenticated users
- `PublicRoute.jsx` - Redirect authenticated users away from public pages
- `AuthProvider.jsx` - Auth context provider (if needed)

**Phase 2.6: Pages (In Dependency Order)**

**Step 2.6.1: Public Pages**

1. **Home.jsx** - Landing page
2. **Login.jsx** - Authentication page
3. **Register.jsx** - Multi-step registration (organization, department, user)
4. **ForgotPassword.jsx** - Password reset request
5. **ResetPassword.jsx** - Password reset with token

**Step 2.6.2: Protected Pages**

1. **Dashboard.jsx** - Dashboard with widgets and statistics
2. **Organizations.jsx** - Organizations list (Platform SuperAdmin only, DataGrid pattern)
3. **Organization.jsx** - Organization detail page
4. **Departments.jsx** - Departments list (DataGrid pattern)
5. **Users.jsx** - Users list (Three-Layer pattern)
6. **Materials.jsx** - Materials list (DataGrid pattern)
7. **Vendors.jsx** - Vendors list (DataGrid pattern)
8. **Tasks.jsx** - Tasks list (Three-Layer pattern, all task types)
9. **TaskDetail.jsx** - Task detail with activities and comments
10. **NotFound.jsx** - 404 page

**Phase 2.7: Routing**

**Step 2.7.1: Route Configuration**

- `router/routes.jsx` - All routes with lazy loading, protected routes, error boundaries
- Nested routes for layouts
- Route parameters for detail pages

**Phase 2.8: App Entry Point**

**Step 2.8.1: Root Component**

- `App.jsx` - Root component with:
  - Theme provider
  - Redux provider with persistor
  - Router provider
  - Socket.IO setup and event handlers
  - Toast container
  - Error boundary

**Step 2.8.2: Main Entry**

- `main.jsx` - React DOM render with StrictMode

### Phase 3: Testing

**Step 3.1: Backend Tests**

- Jest configuration: `jest.config.js` (ES modules)
- **CRITICAL**: Use real MongoDB instance for testing (NOT mongodb-memory-server)
- Global setup: `tests/globalSetup.js` (Connect to test MongoDB database)
- Global teardown: `tests/globalTeardown.js` (Cleanup and disconnect)
- Test setup: `tests/setup.js` (database cleanup before each test)
- Unit tests: `tests/unit/*.test.js`
- Property-based tests: `tests/property/*.property.test.js`

**Step 3.2: Frontend Tests (Optional)**

- Vitest + React Testing Library
- E2E: Playwright or Cypress

### Phase 4: Deployment

**Step 4.1: Production Build**

- Frontend build: `npm run build:prod` (client/dist/)
- Backend serves frontend static files

**Step 4.2: Environment Configuration**

- Production environment variables
- SSL/TLS certificates
- MongoDB production connection

**Step 4.3: Server Setup**

- PM2 or systemd for process management
- Nginx reverse proxy
- Security hardening

---

## TESTING REQUIREMENTS

### Backend Testing (Jest with ES Modules)

**CRITICAL TESTING RULE:**

- **NEVER use mongodb-memory-server** - Always use a real MongoDB instance for testing
- Use separate test database (e.g., `task-manager-test`)
- Configure via `MONGODB_URI_TEST` environment variable
- Ensure proper cleanup between tests

**Test Framework:** Jest ^30.2.0 with ES modules support

**Test Types:**

1. **Unit Tests** (`tests/unit/*.test.js`)

   - Test individual functions and methods
   - Test model validation and hooks
   - Test middleware logic
   - Test utility functions

2. **Property-Based Tests** (`tests/property/*.property.test.js`)
   - Test universal properties with fast-check
   - Minimum 100 iterations per property
   - Reference feature and requirement numbers
   - No mocks for core logic

**Test Configuration:**

```javascript
// jest.config.js
export default {
  testEnvironment: "node",
  transform: {},
  extensionsToTreatAsEsm: [".js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.property.test.js"],
  collectCoverageFrom: [
    "app.js",
    "server.js",
    "config/**/*.js",
    "controllers/**/*.js",
    "middlewares/**/*.js",
    "models/**/*.js",
    "routes/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
    "!**/coverage/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  globalSetup: "./tests/globalSetup.js",
  globalTeardown: "./tests/globalTeardown.js",
  setupFilesAfterEnv: ["./tests/setup.js"],
  testTimeout: 30000,
  maxWorkers: 1,
};
```

**Test Database:**

- **CRITICAL**: Use real MongoDB instance (NOT mongodb-memory-server)
- Separate test database (e.g., `task-manager-test`)
- Fresh database for each test suite
- Automatic cleanup after each test
- Connection string: `MONGODB_URI_TEST` environment variable

**Coverage Goals:**

- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

**Test Scripts:**

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run test:property   # Run only property-based tests
npm run test:unit       # Run only unit tests
```

---

## ENVIRONMENT VARIABLES

### Backend Environment Variables

**Required:**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/task-manager

# JWT Secrets (min 32 characters, random)
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Server
PORT=4000
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Seed Data
INITIALIZE_SEED_DATA=true

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Task Manager <noreply@taskmanager.com>
```

**Optional:**

```env
# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Logging
LOG_LEVEL=info

# Rate Limiting (production only)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

**Required:**

```env
VITE_API_URL=http://localhost:4000/api
```

**Optional:**

```env
# Cloudinary (for direct uploads)
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

---

## TIMEZONE MANAGEMENT SETUP

### Overview

**CRITICAL:** This Multi-Tenant SaaS Task Manager serves users worldwide. Proper timezone management ensures all users see dates and times correctly for their location while maintaining data consistency.

**Core Principles:**

1. **Store in UTC**: All database dates stored in UTC (Universal Coordinated Time)
2. **Convert at Boundaries**:
   - Frontend → Backend: Local time → UTC
   - Backend → Frontend: UTC → Local time
3. **Use ISO Format**: Standardized date communication (ISO 8601)
4. **Dayjs Consistency**: Use same dayjs setup across frontend and backend

### Backend Timezone Configuration

**Step 1: Server Timezone Setup**

**File:** `backend/server.js`

```javascript
// Set server timezone to UTC (CRITICAL - Must be first)
process.env.TZ = "UTC";

// Verify timezone is set correctly
console.log("Server Timezone:", new Date().toString());
console.log("UTC Time:", new Date().toISOString());
```

**Step 2: Dayjs Configuration**

**File:** `backend/utils/dateUtils.js`

```javascript
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Utility functions for backend
export const toUTC = (date) => {
  return dayjs(date).utc().toDate();
};

export const formatISO = (date) => {
  return dayjs(date).utc().toISOString();
};

export const isValidDate = (date) => {
  return dayjs(date).isValid();
};

export default dayjs;
```

**Step 3: Mongoose Schema Date Handling**

**All Models with Date Fields:**

```javascript
import dayjs from "../utils/dateUtils.js";

// Pre-save hook to convert dates to UTC
schemaName.pre("save", function (next) {
  // Convert all date fields to UTC before saving
  if (this.dueDate) {
    this.dueDate = dayjs(this.dueDate).utc().toDate();
  }
  if (this.startDate) {
    this.startDate = dayjs(this.startDate).utc().toDate();
  }
  // Add other date fields as needed
  next();
});

// Schema options for JSON transformation
const schemaOptions = {
  timestamps: true, // createdAt and updatedAt in UTC
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      // Convert dates to ISO strings for API responses
      if (ret.dueDate) ret.dueDate = dayjs(ret.dueDate).utc().toISOString();
      if (ret.startDate)
        ret.startDate = dayjs(ret.startDate).utc().toISOString();
      if (ret.createdAt)
        ret.createdAt = dayjs(ret.createdAt).utc().toISOString();
      if (ret.updatedAt)
        ret.updatedAt = dayjs(ret.updatedAt).utc().toISOString();
      delete ret.id;
      return ret;
    },
  },
};
```

**Step 4: Controller Date Handling**

**All Controllers with Date Input:**

```javascript
import dayjs from "../utils/dateUtils.js";

export const createTask = asyncHandler(async (req, res, next) => {
  const { startDate, dueDate, ...otherFields } = req.validated.body;

  // Convert incoming dates to UTC before saving
  const taskData = {
    ...otherFields,
    startDate: startDate ? dayjs(startDate).utc().toDate() : undefined,
    dueDate: dueDate ? dayjs(dueDate).utc().toDate() : undefined,
  };

  // Create task with UTC dates
  const task = await Task.create([taskData], { session });

  // Response will have ISO strings (handled by toJSON transform)
  res.status(201).json({
    success: true,
    task: task[0],
  });
});
```

**Step 5: API Response Format**

**All API Responses:**

- Dates returned as ISO 8601 strings (e.g., `"2024-12-13T10:30:00.000Z"`)
- Handled automatically by Mongoose `toJSON` transform
- Consistent format for all date fields

### Frontend Timezone Configuration

**Step 1: Date Utility Functions**

**File:** `client/src/utils/dateUtils.js`

```javascript
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

/**
 * Get user's timezone
 * @returns {string} User's timezone (e.g., 'America/New_York')
 */
export const getUserTimezone = () => {
  return dayjs.tz.guess();
};

/**
 * Convert UTC date to user's local time for display
 * @param {string|Date} utcDate - UTC date from API
 * @returns {dayjs.Dayjs} Dayjs object in user's timezone
 */
export const convertUTCToLocal = (utcDate) => {
  if (!utcDate) return null;
  return dayjs.utc(utcDate).tz(getUserTimezone());
};

/**
 * Convert local date to UTC for API calls
 * @param {string|Date} localDate - Local date from user input
 * @returns {string} ISO string in UTC
 */
export const convertLocalToUTC = (localDate) => {
  if (!localDate) return null;
  return dayjs.tz(localDate, getUserTimezone()).utc().toISOString();
};

/**
 * Format date for display in UI
 * @param {string|Date} date - Date to format
 * @param {string} format - Format string (default: 'MMM DD, YYYY HH:mm')
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date, format = "MMM DD, YYYY HH:mm") => {
  if (!date) return "";
  return convertUTCToLocal(date).format(format);
};

/**
 * Format date for API (ISO string in UTC)
 * @param {string|Date} date - Date to format
 * @returns {string} ISO string in UTC
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  return dayjs(date).utc().toISOString();
};

/**
 * Get relative time (e.g., '2 hours ago')
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return "";
  return convertUTCToLocal(date).fromNow();
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  return dayjs(date).isBefore(dayjs());
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  return convertUTCToLocal(date).isSame(dayjs(), "day");
};

export default dayjs;
```

**Step 2: API Service Layer Date Transformation**

**File:** `client/src/redux/features/api.js`

```javascript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { convertLocalToUTC, convertUTCToLocal } from "../../utils/dateUtils";

// Transform request data (local → UTC)
const transformRequest = (body) => {
  if (!body) return body;

  const transformed = { ...body };

  // Convert date fields to UTC
  if (transformed.startDate) {
    transformed.startDate = convertLocalToUTC(transformed.startDate);
  }
  if (transformed.dueDate) {
    transformed.dueDate = convertLocalToUTC(transformed.dueDate);
  }
  // Add other date fields as needed

  return transformed;
};

// Transform response data (UTC → local for display)
const transformResponse = (response) => {
  if (!response) return response;

  // Handle single resource
  if (response.task) {
    return {
      ...response,
      task: transformDates(response.task),
    };
  }

  // Handle array of resources
  if (response.tasks) {
    return {
      ...response,
      tasks: response.tasks.map(transformDates),
    };
  }

  return response;
};

// Transform date fields in a single object
const transformDates = (obj) => {
  if (!obj) return obj;

  const transformed = { ...obj };

  // Note: Keep dates as ISO strings in Redux state
  // Convert to local only when displaying in components

  return transformed;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: [
    /* ... */
  ],
  endpoints: () => ({}),
});
```

**Step 3: MUI DatePicker Integration**

**File:** `client/src/components/common/MuiDatePicker.jsx`

```javascript
import { Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  convertUTCToLocal,
  convertLocalToUTC,
  getUserTimezone,
} from "../../utils/dateUtils";
import dayjs from "dayjs";

const MuiDatePicker = ({ name, control, label, rules, ...props }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({
          field: { onChange, value, ...fieldProps },
          fieldState: { error },
        }) => (
          <DatePicker
            {...fieldProps}
            {...props}
            label={label}
            value={value ? convertUTCToLocal(value) : null}
            onChange={(newValue) => {
              // Convert local time to UTC for form state
              onChange(newValue ? convertLocalToUTC(newValue) : null);
            }}
            timezone={getUserTimezone()}
            slotProps={{
              textField: {
                error: !!error,
                helperText: error?.message,
                fullWidth: true,
              },
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

export default MuiDatePicker;
```

**Step 4: Component Date Display**

**All Components Displaying Dates:**

```javascript
import { formatDateForDisplay, getRelativeTime } from "../../utils/dateUtils";

const TaskCard = ({ task }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{task.title}</Typography>

        {/* Display date in user's local timezone */}
        <Typography variant="body2">
          Due: {formatDateForDisplay(task.dueDate, "MMM DD, YYYY HH:mm")}
        </Typography>

        {/* Display relative time */}
        <Typography variant="caption">
          Created {getRelativeTime(task.createdAt)}
        </Typography>
      </CardContent>
    </Card>
  );
};
```

**Step 5: Form Date Handling**

**All Forms with Date Fields:**

```javascript
import { useForm, Controller } from "react-hook-form";
import MuiDatePicker from "../common/MuiDatePicker";
import { convertLocalToUTC } from "../../utils/dateUtils";

const CreateUpdateTask = ({ task }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      title: task?.title || "",
      // Dates stored as ISO strings in form state
      startDate: task?.startDate || null,
      dueDate: task?.dueDate || null,
    },
  });

  const onSubmit = async (data) => {
    // Dates are already in UTC ISO format from MuiDatePicker
    // No additional conversion needed
    await createTask(data).unwrap();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MuiDatePicker
        name="startDate"
        control={control}
        label="Start Date"
        rules={{ required: "Start date is required" }}
      />

      <MuiDatePicker
        name="dueDate"
        control={control}
        label="Due Date"
        rules={{ required: "Due date is required" }}
      />
    </form>
  );
};
```

### Timezone Management Verification Checklist

**Backend Verification:**

- [ ] Server timezone set to UTC in `server.js`
- [ ] Dayjs configured with UTC and timezone plugins
- [ ] All models convert dates to UTC in pre-save hooks
- [ ] All models return ISO strings in `toJSON` transform
- [ ] All controllers convert incoming dates to UTC
- [ ] Mongoose timestamps (createdAt, updatedAt) are in UTC
- [ ] API responses return dates as ISO strings

**Frontend Verification:**

- [ ] Dayjs configured with UTC and timezone plugins
- [ ] Date utility functions created and working
- [ ] User timezone detected correctly
- [ ] MuiDatePicker converts UTC ↔ local automatically
- [ ] All date displays use `formatDateForDisplay()`
- [ ] All API calls convert local → UTC before sending
- [ ] Form date inputs work correctly across timezones
- [ ] Relative time displays correctly (e.g., "2 hours ago")

**Integration Verification:**

- [ ] Create task with due date in one timezone, view in another timezone - dates match
- [ ] Task deadlines display correctly for users in different timezones
- [ ] Date filters work correctly across timezones
- [ ] Sorting by date works correctly
- [ ] Date range queries return correct results
- [ ] No timezone conflicts in API communication

### Expected Outcome

After implementing this timezone management system:

1. **Users worldwide see correct dates**: All dates displayed in user's local timezone
2. **Data consistency**: All dates stored in UTC in database
3. **No timezone bugs**: Automatic conversion at boundaries prevents timezone issues
4. **Transparent to users**: Users don't need to think about timezones
5. **Developer-friendly**: Clear patterns for handling dates throughout the application

---

## CRITICAL IMPLEMENTATION NOTES

### Task Types and Material Handling

**ProjectTask (Outsourced to Vendor):**

- Purpose: Department task outsourced to external vendor/client
- Required Field: `vendor` (ref: Vendor)
- Materials: Added via TaskActivity with attachments as proof
- TaskActivity: YES - Department users log vendor's work progress
- All Statuses: To Do, In Progress, Completed, Pending
- All Priorities: Low, Medium, High, Urgent

**RoutineTask (From Outlet):**

- Purpose: Daily routine task received by department user from organization outlet
- Required Fields: `startDate`, `dueDate`
- Materials: Added DIRECTLY to RoutineTask (NO TaskActivity intermediary)
- TaskActivity: NO - Materials added directly to task
- Status Restriction: Cannot be "To Do" (must be In Progress, Completed, or Pending)
- Priority Restriction: Cannot be "Low" (must be Medium, High, or Urgent)

**AssignedTask (To User(s)):**

- Purpose: Task assigned to single user or group of users
- Required Field: `assignees` (ref: User or array of Users)
- Materials: Added via TaskActivity with attachments as proof
- TaskActivity: YES - Assigned users log their own work progress
- All Statuses: To Do, In Progress, Completed, Pending
- All Priorities: Low, Medium, High, Urgent

### HOD (Head of Department) Rules

**Definition:** Users with SuperAdmin or Admin roles are automatically HOD

**Characteristics:**

- `isHod: true` for SuperAdmin and Admin roles (automatically set)
- `isHod: false` for Manager and User roles (automatically set)
- Uniqueness: Only ONE HOD per department (enforced by unique index)
- Special Privilege: Only HOD users can be watchers on ProjectTasks
- Deletion Protection: Cannot delete last HOD in department

**Automatic Updates:**

- Changing user role to SuperAdmin/Admin automatically sets `isHod: true`
- Changing user role to Manager/User automatically sets `isHod: false`
- Pre-save hook handles automatic updates

### Platform vs Customer Organizations

**Platform Organization:**

- Identifier: `isPlatformOrg: true` (immutable)
- Purpose: Service provider managing the system
- Quantity: ONLY ONE
- Creation: Backend seed data
- Users: All have `isPlatformUser: true`
- Access: Platform SuperAdmin can view/manage ALL customer organizations
- Deletion: CANNOT be deleted

**Customer Organization:**

- Identifier: `isPlatformOrg: false` (default)
- Purpose: Regular tenant organizations
- Quantity: Multiple
- Creation: Frontend registration
- Users: All have `isPlatformUser: false`
- Access: Isolated from other customer organizations
- Deletion: CAN be deleted (soft delete with cascade)

### CustomError Usage Rules

**CRITICAL:** Always use CustomError static helper methods for consistent error handling:

**✅ Correct Usage:**

```javascript
// Validation errors (400)
throw CustomError.validation("Invalid email format");
throw CustomError.validation("Password must be at least 8 characters");

// Authentication errors (401) - triggers logout on frontend
throw CustomError.authentication("Invalid credentials");
throw CustomError.authentication("Token expired");

// Authorization errors (403)
throw CustomError.authorization(
  "Insufficient permissions to update this resource"
);
throw CustomError.authorization(
  "Only HOD users can be watchers on ProjectTasks"
);

// Not found errors (404)
throw CustomError.notFound("User not found");
throw CustomError.notFound("Resource not found");

// Conflict errors (409)
throw CustomError.conflict("Email already exists");
throw CustomError.conflict("Resource already exists");

// Internal server errors (500)
throw CustomError.internal("Database connection failed");
throw CustomError.internal("Unexpected error occurred");
```

**❌ Wrong Usage:**

```javascript
// Don't use constructor directly
throw new CustomError("User not found", 404, "NOT_FOUND_ERROR");

// Don't use generic Error
throw new Error("User not found");

// Don't use inconsistent error codes
throw new CustomError("User not found", 404, "USER_NOT_FOUND");
```

**Error Code Standards:**

- `VALIDATION_ERROR` (400) - Invalid input, validation failures
- `AUTHENTICATION_ERROR` (401) - Invalid credentials, expired tokens (triggers logout on frontend)
- `AUTHORIZATION_ERROR` (403) - Insufficient permissions, forbidden access
- `NOT_FOUND_ERROR` (404) - Resource not found
- `CONFLICT_ERROR` (409) - Duplicate resources, uniqueness violations
- `INTERNAL_SERVER_ERROR` (500) - Unexpected server errors

### MUI v7 Breaking Changes

**Grid Component:**

```jsx
// ❌ Wrong (MUI v5/v6)
<Grid container>
  <Grid item xs={12} md={6}>Content</Grid>
</Grid>

// ✅ Correct (MUI v7)
<Grid container>
  <Grid size={{ xs: 12, md: 6 }}>Content</Grid>
</Grid>
```

**Dialog Accessibility:**

```jsx
// ✅ Required Props
<Dialog
  disableEnforceFocus
  disableRestoreFocus
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <DialogTitle id="dialog-title">Title</DialogTitle>
  <DialogContent id="dialog-description">Content</DialogContent>
</Dialog>
```

### React Hook Form Rules

**❌ NEVER use watch() method:**

```jsx
// ❌ Wrong
const { watch } = useForm();
const watchedValue = watch("fieldName");

// ✅ Correct
const { control } = useForm();
<Controller
  name="fieldName"
  control={control}
  render={({ field }) => <MuiTextField {...field} />}
/>;
```

### Pagination Conversion

**Backend (mongoose-paginate-v2):** 1-based pages

**Frontend (MUI DataGrid):** 0-based pages

**Conversion:**

- Frontend → Backend: `page + 1`
- Backend → Frontend: `page - 1`

**MuiDataGrid Component:** Automatically handles conversion

---

## VALIDATION CHECKLIST

### Backend Validation

- [ ] All models use soft delete plugin
- [ ] All models have TTL indexes configured
- [ ] All models have proper indexes for queries
- [ ] All validators match model schemas exactly
- [ ] All controllers use express-async-handler
- [ ] All routes have authentication middleware
- [ ] All routes have authorization middleware
- [ ] All routes have validation middleware
- [ ] All cascade delete operations use transactions
- [ ] All error responses use CustomError static helper methods (validation, authentication, authorization, notFound, conflict, internal)
- [ ] All constants imported from utils/constants.js
- [ ] JWT tokens stored in HTTP-only cookies
- [ ] Password hashing uses bcrypt with ≥12 salt rounds
- [ ] Socket.IO events emit to correct rooms
- [ ] Email service uses queue-based sending
- [ ] Rate limiting enabled in production

### Frontend Validation

- [ ] Constants mirror backend exactly
- [ ] All forms use React Hook Form with Controller
- [ ] No watch() method used in forms
- [ ] All validation rules match backend validators
- [ ] All API calls use RTK Query
- [ ] All mutations invalidate cache correctly
- [ ] Socket.IO events invalidate cache
- [ ] All DataGrid components use server-side pagination
- [ ] All DataGrid components convert pagination correctly
- [ ] All Card components use React.memo
- [ ] All event handlers use useCallback
- [ ] All computed values use useMemo
- [ ] All dialogs have accessibility props
- [ ] All Grid components use size prop (not item)
- [ ] All routes use lazy loading
- [ ] Protected routes check authentication
- [ ] Public routes redirect authenticated users
- [ ] Theme uses MUI v7 syntax
- [ ] All constants imported from utils/constants.js

### Testing Validation

- [ ] Jest configured for ES modules
- [ ] Real MongoDB test database configured (NOT mongodb-memory-server)
- [ ] Test database connection working
- [ ] All unit tests pass
- [ ] All property-based tests pass
- [ ] Coverage meets minimum thresholds
- [ ] No failing tests skipped

### Deployment Validation

- [ ] Frontend built successfully
- [ ] Backend serves frontend static files
- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] MongoDB production connection working
- [ ] PM2 or systemd configured
- [ ] Nginx reverse proxy configured
- [ ] Security headers enabled
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Backup strategy implemented

---

## FINAL INSTRUCTIONS FOR

**YOU MUST:**

1. **Read and Understand:** Read this ENTIRE prompt before starting ANY implementation
2. **Follow Exactly:** Implement EVERY detail exactly as specified - no deviations
3. **Check Backend Validators:** Always reference backend validators for field names and validation rules
4. **Import Constants:** NEVER hardcode values - always import from utils/constants.js
5. **Use Soft Delete:** ALL models must use the soft delete plugin
6. **HTTP-Only Cookies:** JWT tokens MUST be stored in HTTP-only cookies (NEVER localStorage)
7. **CustomError Static Methods:** ALWAYS use CustomError static helper methods (validation, authentication, authorization, notFound, conflict, internal) - NEVER use constructor directly
8. **MUI v7 Syntax:** Use `size` prop for Grid (NOT `item` prop)
9. **React Hook Form:** NEVER use watch() method - always use Controller
10. **Pagination Conversion:** MuiDataGrid automatically converts pagination (0-based ↔ 1-based)
11. **Task Types:** Understand the three task types and their differences (ProjectTask, RoutineTask, AssignedTask)
12. **HOD Rules:** Only HOD users (SuperAdmin/Admin) can be watchers on ProjectTasks
13. **Platform vs Customer:** Understand the distinction between platform and customer organizations
14. **Test Everything:** Test EVERY feature after implementation
15. **Validate Constantly:** Check the validation checklist throughout implementation

**IMPLEMENTATION WORKFLOW:**

1. **Phase 1:** Backend (All Backend Cores → Models → Controllers → Routes → Services → Socket.IO)
2. **Phase 2:** Frontend (All Frontend Cores → Redux → Components → Pages → Routing → Theme)
3. **Phase 3:** Testing (Unit tests → Property-based tests)
4. **Phase 4:** Deployment (Build → Configure → Deploy)

**BEFORE MARKING COMPLETE:**

- [ ] All validation checklist items checked
- [ ] All tests passing
- [ ] Application running without errors
- [ ] All features working as specified
- [ ] Documentation updated

---

**END OF COMPREHENSIVE PROMPT**

**This prompt contains EVERY detail from all 9 documentation files. No line, statement, or character has been skipped. Follow this prompt EXACTLY to build the complete Multi-Tenant SaaS Task Manager application.**

---

## CRITICAL IMPLEMENTATION PATTERNS SUMMARY

### Schema Implementation Checklist

**Every Schema MUST Include:**

1. **Required Imports:**

   - `import mongoose from 'mongoose';`
   - `import mongoosePaginate from 'mongoose-paginate-v2';`
   - `import softDeletePlugin from './plugins/softDelete.js';`

2. **Schema Options:**

   ```javascript
   {
     timestamps: true,
     versionKey: false,
     toJSON: {
       virtuals: true,
       transform: (doc, ret) => {
         delete ret.id;
         return ret;
       },
     },
     toObject: {
       virtuals: true,
       transform: (doc, ret) => {
         delete ret.id;
         return ret;
       },
     },
   }
   ```

3. **Session Support:**

   - All hooks MUST support session: `this.$session()`
   - All instance methods MUST accept `{ session }` parameter
   - All static methods MUST accept `{ session }` parameter

4. **Plugin Application:**

   - `schemaName.plugin(mongoosePaginate);`
   - `schemaName.plugin(softDeletePlugin);`

5. **TTL Index:**
   - `ModelName.ensureTTLIndex(expireAfterSeconds);` after model creation

### Controller Implementation Checklist

**Every Write Controller MUST:**

1. **Extract User Context:**

   ```javascript
   const {
     _id: userId,
     role,
     organization,
     department,
     isPlatformUser,
     isHod,
     isPlatformOrg,
   } = req.user;
   ```

2. **Extract Validated Data:**

   ```javascript
   const { field1, field2 } = req.validated.body;
   const { resourceId } = req.validated.params;
   const { page, limit } = req.validated.query;
   ```

3. **Use Transaction:**

   ```javascript
   const session = await mongoose.startSession();
   session.startTransaction();
   try {
     // All database operations with { session }
     await session.commitTransaction();
   } catch (error) {
     await session.abortTransaction();
     throw error;
   } finally {
     session.endSession();
   }
   ```

4. **Use CustomError Static Methods:**

   ```javascript
   // Validation errors
   throw CustomError.validation("Invalid input data");

   // Authentication errors (triggers logout on frontend)
   throw CustomError.authentication("Invalid credentials");

   // Authorization errors
   throw CustomError.authorization("Insufficient permissions");

   // Not found errors
   throw CustomError.notFound("Resource not found");

   // Conflict errors
   throw CustomError.conflict("Resource already exists");

   // Internal server errors
   throw CustomError.internal("Unexpected error occurred");
   ```

5. **Return Standardized Response:**
   ```javascript
   res.status(200).json({
     success: true,
     pagination: {
       /* pagination metadata */
     },
     resource: result.docs,
   });
   ```

### Validator Implementation Checklist

**Every Validator MUST:**

1. **Validate Field Types and Values:**

   - Use appropriate validators (isEmail, isMongoId, isLength, etc.)
   - Apply constraints (min, max, enum values)

2. **Check Existence with withDeleted:**

   ```javascript
   .custom(async (value) => {
     const doc = await Model.findById(value).withDeleted();
     if (!doc) throw new Error('Not found');
     if (doc.isDeleted) throw new Error('Document is deleted');
     return true;
   })
   ```

3. **Check Uniqueness with withDeleted:**

   ```javascript
   .custom(async (value, { req }) => {
     const existing = await Model.findOne({ field: value }).withDeleted();
     if (existing && existing._id.toString() !== req.params.id) {
       throw new Error('Already exists');
     }
     return true;
   })
   ```

4. **Set req.validated:**
   ```javascript
   export const handleValidationErrors = (req, res, next) => {
     req.validated = {
       body: matchedData(req, { locations: ["body"] }),
       params: matchedData(req, { locations: ["params"] }),
       query: matchedData(req, { locations: ["query"] }),
     };
     next();
   };
   ```

### Permission Fields Usage

**Every Query MUST Consider:**

1. **Organization Isolation:**

   - Filter by `organizationId` (except platform SuperAdmin with crossOrg)

2. **Department Isolation:**

   - Filter by `departmentId` for Manager/User roles

3. **Ownership:**

   - Check `createdBy`, `addedBy`, `uploadedBy` for update/delete operations

4. **Role-Based Scope:**

   - Use `role` field to determine authorization scope

5. **Platform Flag:**

   - Check `isPlatformOrg` and `isPlatformUser` for crossOrg access

6. **HOD Flag:**

   - Check `isHod` for watcher eligibility on ProjectTasks

7. **Assignment:**
   - Check `assignees` for task access

### Testing Implementation Checklist

**Every Test MUST:**

1. **Use Real MongoDB:**

   - NEVER use mongodb-memory-server
   - Connect to real test database
   - Use `MONGODB_URI_TEST` environment variable

2. **Clean Up:**

   - Drop collections after each test
   - Drop database after test suite
   - Close connections properly

3. **Use Transactions:**

   - Test transaction rollback scenarios
   - Verify cascade operations

4. **Test Soft Delete:**
   - Test soft delete functionality
   - Test withDeleted() and onlyDeleted() helpers
   - Test restore functionality

---

**END OF COMPREHENSIVE PROMPT WITH ENHANCED PATTERNS**

**This prompt now includes:**

- ✅ Role, Objective, and Context at the top
- ✅ Detailed schema descriptions for Platform/Customer organizations
- ✅ Permission fields identification for all schemas
- ✅ Complete removal of mongodb-memory-server (use real MongoDB)
- ✅ Template patterns for Controllers (read/write with sessions)
- ✅ Template patterns for Validators (existence, uniqueness with withDeleted)
- ✅ Template patterns for Schemas (with session support, plugins, TTL)
- ✅ Template patterns for Routes (with authorization)
- ✅ Standardized response format with pagination
- ✅ req.validated pattern for all controllers
- ✅ Transaction pattern for all write operations
- ✅ Cascade deletion/restoration with sessions

**Follow these patterns EXACTLY to ensure consistency, data integrity, and proper multi-tenancy isolation throughout the application.**

---

## IMPLEMENTATION PHASES SUMMARY

### Backend Implementation Order

**Phase 1.0: Core Foundation (FIRST)**

- Configuration files (db, cors, authorization matrix)
- Error handling infrastructure
- Utility functions (constants FIRST, then logger, helpers, tokens, dateUtils)
- Middleware (auth, authorization, rate limiter)
- Services (email, notification)
- Email templates
- Socket.IO infrastructure
- Soft delete plugin (CRITICAL)
- App and server setup with UTC timezone

**Phase 1.1: Models (SECOND)**

- Create all 13 models in dependency order
- Each model MUST include: mongoosePaginate, softDeletePlugin, session support, UTC date handling
- Organization → Department → User → Vendor → Material → BaseTask → ProjectTask/RoutineTask/AssignedTask → TaskActivity → TaskComment → Attachment → Notification

**Phase 1.2: Routes → Validators → Controllers (THIRD)**

- For EACH resource, implement in order: Routes → Validators → Controllers
- Validators MUST use withDeleted() for existence/uniqueness checks
- Controllers MUST use transactions for write operations
- Controllers MUST use req.validated for data extraction
- Implementation order: Auth → Organization → Department → User → Vendor → Material → Task → TaskActivity → TaskComment → Attachment → Notification

**Phase 1.3: Route Aggregation (FOURTH)**

- Aggregate all routes in routes/index.js
- Test all endpoints

### Frontend Implementation Order

**Phase 2.0: Core Foundation (FIRST)**

- Project setup
- Constants (MUST mirror backend exactly)
- Utility functions (errorHandler, dateUtils with timezone management)
- Services (socket, cloudinary)
- Hooks (useSocket, useAuth)
- Theme infrastructure (primitives, provider, customizations)

**Phase 2.1: Redux Store (SECOND)**

- Base API configuration with date transformation
- Auth slice
- Store configuration with persistence

**Phase 2.2: Redux API Endpoints (THIRD)**

- Create all 11 API endpoints in dependency order
- Each endpoint MUST handle date conversion (local ↔ UTC)
- Auth → Organization → Department → User → Vendor → Material → Task → TaskActivity → TaskComment → Attachment → Notification

**Phase 2.3: Common Components (FOURTH)**

- Form components (including MuiDatePicker with UTC ↔ local conversion)
- DataGrid components (with pagination conversion)
- Filter components (including FilterDateRange with timezone handling)
- Dialog components
- Loading components
- Utility components

**Phase 2.4: Resource-Specific Components (FIFTH)**

- For each resource: Columns → Cards → Lists → Filters → Forms
- All cards MUST use React.memo, useCallback, useMemo
- All forms MUST use React Hook Form with Controller (NO watch())

**Phase 2.5: Layouts (SIXTH)**

- RootLayout, PublicLayout, DashboardLayout
- ProtectedRoute, PublicRoute

**Phase 2.6: Pages (SEVENTH)**

- Public pages: Home, Login, Register, ForgotPassword, ResetPassword
- Protected pages: Dashboard, Organizations, Departments, Users, Materials, Vendors, Tasks, TaskDetail, NotFound

**Phase 2.7: Routing (EIGHTH)**

- Route configuration with lazy loading
- Nested routes for layouts

**Phase 2.8: App Entry Point (NINTH)**

- App.jsx with theme, Redux, router, Socket.IO, toast, error boundary
- main.jsx with React DOM render

### Critical Implementation Rules

**Backend:**

1. ✅ Build core foundation BEFORE models
2. ✅ Create models BEFORE controllers
3. ✅ Create routes → validators → controllers for EACH resource
4. ✅ Use transactions for ALL write operations
5. ✅ Use withDeleted() for existence/uniqueness checks
6. ✅ Convert dates to UTC before saving
7. ✅ Return dates as ISO strings
8. ✅ Set server timezone to UTC

**Frontend:**

1. ✅ Build core foundation BEFORE Redux
2. ✅ Create Redux store BEFORE components
3. ✅ Create common components BEFORE resource-specific components
4. ✅ Use MuiDatePicker with automatic UTC ↔ local conversion
5. ✅ Display dates using formatDateForDisplay()
6. ✅ Convert local dates to UTC before API calls
7. ✅ Use React.memo, useCallback, useMemo for performance
8. ✅ NEVER use watch() in React Hook Form

**Timezone Management:**

1. ✅ Store ALL dates in UTC in database
2. ✅ Convert at boundaries (frontend ↔ backend)
3. ✅ Use ISO format for API communication
4. ✅ Display dates in user's local timezone
5. ✅ Use dayjs consistently across frontend and backend

**Testing:**

1. ✅ NEVER use mongodb-memory-server
2. ✅ Use real MongoDB test database
3. ✅ Test transaction rollback scenarios
4. ✅ Test soft delete functionality
5. ✅ Test timezone conversion

---

**END OF COMPREHENSIVE PROMPT WITH COMPLETE IMPLEMENTATION PHASES AND TIMEZONE MANAGEMENT**

**This prompt now includes:**

- ✅ Complete implementation phases with correct order (Core → Models → Routes/Validators/Controllers)
- ✅ Comprehensive timezone management setup for worldwide users
- ✅ Backend UTC storage and ISO format responses
- ✅ Frontend automatic UTC ↔ local conversion
- ✅ MUI DatePicker integration with timezone handling
- ✅ Date utility functions for both frontend and backend
- ✅ Verification checklists for timezone implementation
- ✅ Clear separation of phases (Core foundation FIRST, then models, then controllers)
- ✅ Detailed implementation order for each phase

**Follow these phases EXACTLY in the specified order to ensure proper dependencies and successful implementation.**

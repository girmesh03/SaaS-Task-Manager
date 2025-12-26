# Design Document

## Overview

The Multi-Tenant SaaS Task Manager is an enterprise-grade task management system built with the MERN stack (MongoDB, Express.js, React, Node.js). The system implements strict multi-tenancy isolation with role-based access control (RBAC), supporting three distinct task types (ProjectTask, RoutineTask, AssignedTask) with comprehensive soft delete functionality, real-time updates via Socket.IO, and worldwide timezone support.

### Key Design Principles

1. **Multi-Tenancy First**: Complete data isolation between customer organizations with platform organization oversight
2. **Security by Default**: HTTP-only cookies, bcrypt password hashing (≥12 rounds), JWT tokens, CORS validation, rate limiting, NoSQL injection prevention
3. **Transaction-Based Integrity**: All write operations use MongoDB transactions to ensure atomicity
4. **Soft Delete Everywhere**: Universal soft delete plugin with TTL-based auto-cleanup and cascade operations
5. **Zero Timezone Offset**: All dates stored in UTC, converted at application boundaries
6. **Real-Time Synchronization**: Socket.IO for instant updates with automatic RTK Query cache invalidation
7. **Property-Based Testing**: Comprehensive testing with fast-check library (minimum 100 iterations)
8. **ES Modules Throughout**: Modern JavaScript with import/export syntax

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React 19   │  │  Redux TK    │  │  Socket.IO   │          │
│  │   + Vite     │  │  + RTK Query │  │   Client     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS + WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Express.js  │  │  Socket.IO   │  │   Nodemailer │          │
│  │  + Middleware│  │   Server     │  │  (Gmail SMTP)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controllers → Services → Models                          │  │
│  │  (Transaction-based, CustomError, Authorization)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MongoDB v7.0 with Mongoose ODM                           │  │
│  │  - Soft Delete Plugin (Universal)                         │  │
│  │  - Discriminator Pattern (BaseTask → Task Types)          │  │
│  │  - TTL Indexes (Auto-cleanup)                             │  │
│  │  - Transaction Support (Session-based)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Architecture

```
Platform Organization (isPlatformOrg: true)
├── Platform SuperAdmin (crossOrg for Organization, crossDept for others)
├── Platform Admin (crossDept within platform org)
├── Platform Manager (ownDept within platform org)
└── Platform User (own within platform org)

Customer Organization 1 (isPlatformOrg: false)
├── Customer SuperAdmin (crossDept within own org)
├── Customer Admin (crossDept within own org)
├── Customer Manager (ownDept within own org)
└── Customer User (own within own org)

Customer Organization 2 (isPlatformOrg: false)
├── [Complete isolation from Organization 1]
└── [Same role hierarchy as Organization 1]
```

### Request Flow

```
1. Client Request
   ↓
2. Security Middleware (helmet, cors, cookieParser, mongoSanitize)
   ↓
3. Rate Limiter (production only)
   ↓
4. Authentication Middleware (verifyJWT)
   ↓
5. Validation Middleware (express-validator)
   ↓
6. Authorization Middleware (authorize)
   ↓
7. Controller (with transaction)
   ↓
8. Service Layer (business logic)
   ↓
9. Model Layer (Mongoose with soft delete)
   ↓
10. Database (MongoDB with session)
   ↓
11. Response + Socket.IO Event
```

## Components and Interfaces

### Backend Components

#### 1. Configuration Layer

**Purpose**: Centralized configuration management

**Files**:

- `config/db.js`: MongoDB connection with retry logic, connection pooling (min: 2, max: 10)
- `config/allowedOrigins.js`: CORS allowed origins list
- `config/corsOptions.js`: CORS configuration with validation
- `config/authorizationMatrix.json`: Role-based permissions (ONLY source of truth)

**Key Interfaces**:

```javascript
// db.js
export const connectDB = async () => Promise<void>

// corsOptions.js
export default {
  origin: validateOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // ...
}
```

#### 2. Error Handling Layer

**Purpose**: Consistent error handling across the application

**Files**:

- `errorHandler/CustomError.js`: Custom error class with status codes
- `errorHandler/ErrorController.js`: Global error handler middleware

**Key Interfaces**:

```javascript
class CustomError extends Error {
  static validation(message, context = {})
  static authentication(message, context = {})
  static authorization(message, context = {})
  static notFound(message, context = {})
  static conflict(message, context = {})
  static internal(message, context = {})
}
```

**Error Codes**:

- `VALIDATION_ERROR` (400): Invalid input data
- `AUTHENTICATION_ERROR` (401): Invalid credentials, triggers logout on frontend
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `NOT_FOUND_ERROR` (404): Resource not found
- `CONFLICT_ERROR` (409): Duplicate resources
- `INTERNAL_SERVER_ERROR` (500): Unexpected errors

#### 3. Middleware Layer

**Purpose**: Request processing pipeline

**Files**:

- `middlewares/authMiddleware.js`: JWT verification (verifyJWT, verifyRefreshToken)
- `middlewares/authorization.js`: Role-based authorization
- `middlewares/rateLimiter.js`: Rate limiting (production only)
- `middlewares/validators/*.js`: Request validation with express-validator

**Key Interfaces**:

```javascript
// authMiddleware.js
export const verifyJWT = async (req, res, next) => void
export const verifyRefreshToken = async (req, res, next) => void

// authorization.js
export const authorize = (resource, operation) => async (req, res, next) => void

// validators/validation.js
export const handleValidationErrors = (req, res, next) => {
  req.validated = {
    body: matchedData(req, {locations: ['body']}),
    params: matchedData(req, {locations: ['params']}),
    query: matchedData(req, {locations: ['query']})
  }
  next()
}
```

#### 4. Model Layer

**Purpose**: Data models with Mongoose ODM

**Discriminator Pattern for Tasks**:

```
BaseTask (Abstract)
├── ProjectTask (vendor required, materials via activities)
├── RoutineTask (materials direct, status/priority restricted)
└── AssignedTask (assignees required, materials via activities)
```

**Soft Delete Plugin**:

- Applied to ALL models
- Fields: isDeleted, deletedAt, deletedBy, restoredAt, restoredBy
- Query helpers: withDeleted(), onlyDeleted()
- Instance methods: softDelete(deletedBy, {session}), restore(restoredBy, {session})
- Static methods: softDeleteById, softDeleteMany, restoreById, restoreMany
- TTL indexes for auto-cleanup

**Key Interfaces**:

```javascript
// All models
schema.plugin(mongoosePaginate);
schema.plugin(softDeletePlugin);
Model.ensureTTLIndex(expireAfterSeconds);

// Session support in all hooks and methods
schema.pre("save", async function (next) {
  const session = this.$session();
  // ...
});

schema.methods.methodName = async function (params, { session } = {}) {
  // ...
};

schema.statics.methodName = async function (params, { session } = {}) {
  // ...
};
```

#### 5. Controller Layer

**Purpose**: Request handling with business logic

**Pattern**:

```javascript
export const createResource = asyncHandler(async (req, res, next) => {
  // 1. Extract user context
  const { _id: userId, role, organization, department } = req.user;

  // 2. Extract validated data
  const { field1, field2 } = req.validated.body;

  // 3. Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 4. Validate business rules
    // 5. Create resource with session
    // 6. Perform related operations with session
    // 7. Commit transaction
    await session.commitTransaction();

    // 8. Emit Socket.IO event
    emitResourceEvent("resource:created", resource);

    // 9. Return response
    return res.status(201).json({ success: true, resource });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});
```

#### 6. Service Layer

**Purpose**: Business logic and external integrations

**Files**:

- `services/emailService.js`: Nodemailer with Gmail SMTP, queue-based
- `services/notificationService.js`: Notification creation and management

**Key Interfaces**:

```javascript
// emailService.js
export const sendEmail = async (to, subject, html) => Promise<void>
export const sendWelcomeEmail = async (user) => Promise<void>
export const sendPasswordResetEmail = async (user, token) => Promise<void>

// notificationService.js
export const createNotification = async (data, {session} = {}) => Promise<Notification>
export const notifyTaskCreated = async (task, {session} = {}) => Promise<void>
export const notifyMention = async (comment, mentionedUsers, {session} = {}) => Promise<void>
```

#### 7. Socket.IO Layer

**Purpose**: Real-time communication

**Files**:

- `utils/socketInstance.js`: Socket.IO singleton
- `utils/socket.js`: Event handlers (connection, disconnection, rooms)
- `utils/socketEmitter.js`: Event emitters

**Rooms**:

- `user:${userId}`: User-specific events
- `department:${departmentId}`: Department-wide events
- `organization:${organizationId}`: Organization-wide events

**Events**:

- `task:created`, `task:updated`, `task:deleted`, `task:restored`
- `activity:created`, `activity:updated`
- `comment:created`, `comment:updated`, `comment:deleted`
- `notification:created`
- `user:online`, `user:offline`, `user:away`

**Key Interfaces**:

```javascript
// socketInstance.js
export const initializeSocket = (httpServer) => Server
export const getIO = () => Server

// socketEmitter.js
export const emitToRooms = (event, data, rooms) => void
export const emitTaskEvent = (event, task) => void
export const emitNotificationEvent = (event, notification) => void
```

### Frontend Components

#### 1. Redux Store

**Purpose**: Centralized state management

**Structure**:

```javascript
store = {
  api: RTK Query reducer,
  auth: {
    user: User | null,
    isAuthenticated: boolean,
    isLoading: boolean
  }
}
```

**RTK Query Configuration**:

```javascript
// Base API
baseQuery: fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include", // HTTP-only cookies
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Tag types for cache management
tagTypes: [
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
```

#### 2. Common Components

**MUI Wrappers**:

- `MuiTextField`, `MuiTextArea`, `MuiNumberField`: Form inputs
- `MuiSelectAutocomplete`, `MuiMultiSelect`: Select components
- `MuiDatePicker`, `MuiDateRangePicker`: Date inputs with UTC ↔ local conversion
- `MuiDataGrid`: DataGrid with automatic pagination conversion (0-based ↔ 1-based)
- `MuiActionColumn`: Action buttons (View/Edit/Delete/Restore) with auto soft-delete detection
- `MuiDialog`, `MuiDialogConfirm`: Dialog components with accessibility props
- `MuiLoading`: Loading spinner with backdrop

**Filter Components**:

- `FilterTextField`: Text filter with debouncing
- `FilterSelect`: Select filter (single/multiple)
- `FilterDateRange`: Date range filter with UTC ↔ local conversion
- `FilterChipGroup`: Active filters display

#### 3. UI Patterns

**DataGrid Pattern** (Admin Views):

```
Page → MuiDataGrid → Columns → MuiActionColumn
     ↓
   Filters → CreateUpdateForm
```

**Three-Layer Pattern** (User Views):

```
Page → List → Card (React.memo)
     ↓         ↓
   Filters   useCallback, useMemo
```

**Form Pattern**:

```
CreateUpdateForm
├── useForm (react-hook-form)
├── Controller (for MUI components)
├── Validation rules (match backend)
└── Submit handler (with loading state)
```

## Data Models

### Organization

**Purpose**: Tenant root entity (Platform or Customer)

**Fields**:

- `name`: String, unique, lowercase, max 100, required
- `description`: String, max 2000
- `email`: String, unique, valid, max 50, required
- `phone`: String, unique, pattern /^(\+251\d{9}|0\d{9})$/, required
- `address`: String, max 500
- `industry`: Enum (24 industries), max 100
- `logoUrl`: String (URL)
- `publicId`: String (Cloudinary)
- `createdBy`: ObjectId → User
- `isPlatformOrg`: Boolean, immutable, indexed, default false
- `isDeleted`, `deletedAt`, `deletedBy`, `restoredAt`, `restoredBy`
- `createdAt`, `updatedAt` (timestamps)

**Indexes**:

- `{name: 1}` unique, partial (isDeleted: false)
- `{email: 1}` unique, partial (isDeleted: false)
- `{phone: 1}` unique, partial (isDeleted: false)
- `{isPlatformOrg: 1}`
- `{isDeleted: 1}`
- `{deletedAt: 1}` TTL: never (null)

**Cascade Delete**: Departments, Users, Tasks (all types), TaskActivities, TaskComments, Materials, Vendors, Attachments, Notifications

**Protection**: Platform organization CANNOT be deleted

### Department

**Purpose**: Organizational unit within organization

**Fields**:

- `name`: String, max 100, required
- `description`: String, max 2000
- `hod`: ObjectId → User (HOD)
- `organization`: ObjectId → Organization, required
- `createdBy`: ObjectId → User
- `isDeleted`, `deletedAt`, `deletedBy`, `restoredAt`, `restoredBy`
- `createdAt`, `updatedAt`

**Indexes**:

- `{organization: 1, name: 1}` unique, partial (isDeleted: false)
- `{organization: 1}`
- `{isDeleted: 1}`
- `{deletedAt: 1}` TTL: 365 days

**Cascade Delete**: Users, Tasks (all types), Materials

**Validation**: Must have at least one HOD

### User

**Purpose**: System actor with authentication and RBAC

**Fields**:

- `firstName`: String, max 20, required
- `lastName`: String, max 20, required
- `position`: String, max 100
- `role`: Enum (SuperAdmin/Admin/Manager/User), default User
- `email`: String, unique per org, lowercase, max 50, required
- `password`: String, min 8, bcrypt ≥12 rounds, select: false, required
- `organization`: ObjectId → Organization, required
- `department`: ObjectId → Department, required
- `profilePicture`: {url: String, publicId: String}
- `skills`: Array max 10 of {skill: String max 50, percentage: Number 0-100}
- `employeeId`: String, 4-digit (1000-9999), unique per org, required
- `dateOfBirth`: Date, not future
- `joinedAt`: Date, required, not future
- `emailPreferences`: {enabled, taskNotifications, taskReminders, mentions, announcements, welcomeEmails, passwordReset}
- `passwordResetToken`: String, select: false, bcrypt hashed
- `passwordResetExpires`: Date, select: false
- `isPlatformUser`: Boolean, immutable, indexed, auto-set from org
- `isHod`: Boolean, indexed, auto-set from role
- `lastLogin`: Date
- `isDeleted`, `deletedAt`, `deletedBy`, `restoredAt`, `restoredBy`
- `createdAt`, `updatedAt`

**Virtuals**:

- `fullName`: firstName + lastName

**Indexes**:

- `{organization: 1, email: 1}` unique, partial (isDeleted: false)
- `{department: 1}` unique for HOD, partial (isDeleted: false, isHod: true)
- `{organization: 1, employeeId: 1}` unique, partial (isDeleted: false)
- `{isPlatformUser: 1}`
- `{isHod: 1}`
- `{isDeleted: 1}`
- `{deletedAt: 1}` TTL: 365 days

**Instance Methods**:

- `comparePassword(enteredPassword)`: Compare password with hash
- `generatePasswordResetToken()`: Generate and hash reset token
- `verifyPasswordResetToken(token)`: Verify reset token
- `clearPasswordResetToken()`: Clear reset token and expiry

**Cascade Delete**: Tasks (createdBy), Activities (createdBy), Comments (createdBy), Attachments (uploadedBy), Materials (addedBy), Notifications (createdBy), remove from task watchers/assignees/mentions

**Protection**: Cannot delete last SuperAdmin in organization, cannot delete last HOD in department

### BaseTask (Abstract - Discriminator Base)

**Purpose**: Base model for all task types

**Fields**:

- `description`: String, max 2000, required
- `status`: Enum (To Do/In Progress/Completed/Pending), default To Do
- `priority`: Enum (Low/Medium/High/Urgent), default Medium
- `organization`: ObjectId → Organization, required
- `department`: ObjectId → Department, required
- `createdBy`: ObjectId → User, required
- `attachments`: Array max 10 of ObjectId → Attachment, unique
- `watchers`: Array max 20 of ObjectId → User, unique, HOD only
- `tags`: Array max 5 of String max 50, unique case-insensitive
- `taskType`: String (discriminator key: ProjectTask/RoutineTask/AssignedTask)
- `isDeleted`, `deletedAt`, `deletedBy`, `restoredAt`, `restoredBy`
- `createdAt`, `updatedAt`

**Indexes**:

- `{organization: 1, department: 1, createdAt: -1}`
- `{organization: 1, createdBy: 1, createdAt: -1}`
- `{organization: 1, department: 1, startDate: 1, dueDate: 1}`
- `{organization: 1, department: 1, status: 1, priority: 1, dueDate: 1}`
- `{tags: 'text'}`
- `{isDeleted: 1}`
- `{deletedAt: 1}` TTL: 180 days

**Cascade Delete**: TaskActivities, TaskComments, Attachments, Notifications

### ProjectTask (extends BaseTask)

**Purpose**: Task outsourced to external vendor

**Additional Fields**:

- `title`: String, max 50, required
- `vendor`: ObjectId → Vendor, required
- `estimatedCost`: Number, min 0
- `actualCost`: Number, min 0
- `currency`: String, default ETB
- `costHistory`: Array max 200 of {amount, type: estimated/actual, updatedBy: ObjectId → User, updatedAt}
- `startDate`: Date
- `dueDate`: Date (must be after startDate)

**Business Logic**:

- Vendor communicates orally with department users
- Department users log activities tracking vendor's work
- Materials added via TaskActivity with attachments as proof
- All statuses allowed: To Do, In Progress, Completed, Pending
- All priorities allowed: Low, Medium, High, Urgent

### RoutineTask (extends BaseTask)

**Purpose**: Daily routine task from outlet

**Additional Fields**:

- `materials`: Array max 20 of {material: ObjectId → Material, quantity: Number min 0}
- `startDate`: Date, required, not future
- `dueDate`: Date, required, must be after startDate, not future

**Business Logic**:

- Materials added DIRECTLY to task (NO TaskActivity)
- Status restriction: Cannot be "To Do" (must be In Progress, Completed, or Pending)
- Priority restriction: Cannot be "Low" (must be Medium, High, or Urgent)
- NO TaskActivity support
- Comments via TaskComment for changes/updates

### AssignedTask (extends BaseTask)

**Purpose**: Task assigned to user(s)

**Additional Fields**:

- `title`: String, max 50, required
- `assignees`: ObjectId → User or Array of ObjectId → User, required, max 20, unique
- `startDate`: Date
- `dueDate`: Date (must be after startDate if both provided)

**Business Logic**:

- Assigned users log their own work progress
- Materials added via TaskActivity with attachments as proof
- All statuses allowed: To Do, In Progress, Completed, Pending
- All priorities allowed: Low, Medium, High, Urgent

### TaskActivity

**Purpose**: Progress log for ProjectTask and AssignedTask ONLY

**Fields**:

- `activity`: String, max 2000, required
- `parent`: ObjectId → ProjectTask or AssignedTask, required
- `parentModel`: Enum (ProjectTask/AssignedTask), required
- `materials`: Array max 20 of {material: ObjectId → Material, quantity: Number min 0}
- `createdBy`: ObjectId → User, required
- `department`: ObjectId → Department, required
- `organization`: ObjectId → Organization, required
- `isDeleted`, `deletedAt`, `deletedBy`, `restoredAt`, `restoredBy`
- `createdAt`, `updatedAt`

**Indexes**:

- `{parent: 1, createdAt: -1}`
- `{organization: 1, department: 1, createdAt: -1}`
- `{isDeleted: 1}`
- `{deletedAt: 1}` TTL: 90 days

**Cascade Delete**: TaskComments, Attachments

**Validation**: Parent must be ProjectTask or AssignedTask (NOT RoutineTask)

### TaskComment

**Purpose**: Threaded comments on tasks, activities, or other comments

**Fields**:

- `comment`: String, max 2000, required
- `parent`: ObjectId → Task/TaskActivity/TaskComment, required
- `parentModel`: Enum (Task/TaskActivity/TaskComment), required
- `mentions`: Array max 5 of ObjectId → User
- `createdBy`: ObjectId → User, required
- `department`: ObjectId → Department, required
- `organization`: ObjectId → Organization, required
- `isDeleted`, `deletedAt`, `deletedBy`, `restoredAt`, `restoredBy`
- `createdAt`, `updatedAt`

**Indexes**:

- `{parent: 1, createdAt: -1}`
- `{organization: 1, department: 1, createdAt: -1}`
- `{isDeleted: 1}`
- `{deletedAt: 1}` TTL: 90 days

**Cascade Delete**: Child TaskComments (recursive), Attachments

**Validation**: Max depth 3 levels (comment → reply → reply to reply)

### Material

**Purpose**: Inventory item used in tasks

**Fields**:

- `name`: String, max 100, required
- `description`: String, max 2000
- `category`: Enum (Electrical/Mechanical/Plumbing/Hardware/Cleaning/Textiles/Consumables/Construction/Other), required
- `unitType`: Enum (30+ types: pcs/kg/g/l/ml/m/cm/mm/m2/m3/box/pack/roll/sheet/bag/bottle/can/carton/dozen/gallon/inch/foot/yard/mile/ounce/pound/ton/liter/milliliter/cubic meter/square meter), required
- `price`: Number, min 0, required
- `department`: ObjectId → Department, required
- `organization`: ObjectId → Organization, required
- `addedBy`: ObjectId → User
- `isDeleted`, `deletedAt`, `deletedBy`, `restoredAt`, `restoredBy`
- `createdAt`, `updatedAt`

**Indexes**:

- `{organization: 1, department: 1, name: 1}`
- `{category: 1}`
- `{isDeleted: 1}`
- `{deletedAt: 1}` TTL: 180 days

**Usage**: Via TaskActivity (ProjectTask/AssignedTask) or directly (RoutineTask)

### Vendor

**Purpose**: External client for ProjectTasks

**Fields**:

- `name`: String, max 100, required
- `description`: String, max 2000
- `contactPerson`: String, max 100
- `email`: String, valid, max 50
- `phone`: String, pattern /^(\+251\d{9}|0\d{9})$/
- `address`: String, max 500
- `organization`: ObjectId → Organization, required (NOT department-specific)
- `createdBy`: ObjectId → User
- `isDeleted`, `deletedAt`, `deletedBy`, `restoredAt`, `restoredBy`
- `createdAt`, `updatedAt`

**Indexes**:

- `{organization: 1, name: 1}`
- `{isDeleted: 1}`
- `{deletedAt: 1}` TTL: 180 days

**Business Logic**: Deletion requires ProjectTask reassignment

### Attachment

**Purpose**: File reference (Cloudinary)

**Fields**:

- `filename`: String, required
- `fileUrl`: String (Cloudinary URL), required
- `fileType`: Enum (Image/Video/Document/Audio/Other), required
- `fileSize`: Number (bytes), required
- `parent`: ObjectId → Task/TaskActivity/TaskComment, required
- `parentModel`: Enum (Task/TaskActivity/TaskComment), required
- `uploadedBy`: ObjectId → User, required
- `department`: ObjectId → Department, required
- `organization`: ObjectId → Organization, required
- `isDeleted`, `deletedAt`, `deletedBy`, `restoredAt`, `restoredBy`
- `createdAt`, `updatedAt`

**Indexes**:

- `{parent: 1, createdAt: -1}`
- `{organization: 1, department: 1, createdAt: -1}`
- `{isDeleted: 1}`
- `{deletedAt: 1}` TTL: 90 days

**File Size Limits**:

- Image: 10MB (.jpg/.jpeg/.png/.gif/.webp/.svg)
- Video: 100MB (.mp4/.avi/.mov/.wmv)
- Document: 25MB (.pdf/.doc/.docx/.xls/.xlsx/.ppt/.pptx)
- Audio: 20MB (.mp3/.wav/.ogg)
- Other: 50MB

**Max Attachments**: 10 per entity

### Notification

**Purpose**: User alert for events

**Fields**:

- `title`: String, required
- `message`: String, required
- `type`: Enum (Created/Updated/Deleted/Restored/Mention/Welcome/Announcement), required
- `isRead`: Boolean, default false
- `recipient`: ObjectId → User, required
- `entity`: ObjectId (any resource)
- `entityModel`: String (any resource type)
- `organization`: ObjectId → Organization, required
- `expiresAt`: Date, default 30 days from creation
- `createdAt`, `updatedAt`

**Indexes**:

- `{recipient: 1, isRead: 1, createdAt: -1}`
- `{organization: 1, createdAt: -1}`
- `{expiresAt: 1}` TTL: 30 days (or custom expiresAt)

**Types**:

- Created: Resource created
- Updated: Resource updated
- Deleted: Resource deleted
- Restored: Resource restored
- Mention: User mentioned in comment
- Welcome: New user welcome
- Announcement: System announcement

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties and eliminated redundancies:

**Core Properties (Non-Redundant)**:

1. Multi-tenancy isolation and organization scoping
2. Soft delete behavior and cascade operations
3. Authorization scope enforcement by role
4. Task type-specific validation and constraints
5. Timezone conversion (UTC storage and local display)
6. Transaction-based write operations
7. Reference validation and existence checks
8. Uniqueness constraints with soft-deleted records
9. Error code consistency
10. Notification and event emission

**Redundant Properties Eliminated**:

- Individual field validation properties (covered by schema validation property)
- Specific CRUD operation properties (covered by transaction property)
- Individual error type properties (covered by error code consistency property)

### Correctness Properties

Property 1: Organization Isolation
_For any_ Customer SuperAdmin user and any resource query, all returned results should belong only to the user's organization (organization.\_id matches)
**Validates: Requirements 1.4**

Property 2: Platform SuperAdmin Cross-Organization Access
_For any_ Platform SuperAdmin user querying Organization resources, all organizations (platform and customer) should be returned without filtering
**Validates: Requirements 1.3, 22.2**

Property 3: Soft Delete Exclusion
_For any_ resource query without withDeleted() helper, all returned results should have isDeleted: false
**Validates: Requirements 7.3**

Property 4: Soft Delete Cascade
_For any_ parent resource with child resources, soft-deleting the parent should result in all children having isDeleted: true
**Validates: Requirements 1.6, 7.2**

Property 5: Soft Delete Field Setting
_For any_ resource soft-deletion, the resource should have isDeleted: true, deletedAt set to current timestamp, and deletedBy set to the deleting user's ID
**Validates: Requirements 7.1**

Property 6: Restore Field Setting
_For any_ resource restoration, the resource should have isDeleted: false, restoredAt set to current timestamp, and restoredBy set to the restoring user's ID
**Validates: Requirements 7.5**

Property 7: HOD Auto-Assignment for SuperAdmin/Admin
_For any_ user with role SuperAdmin or Admin, the user should have isHod: true automatically set
**Validates: Requirements 2.2**

Property 8: HOD Auto-Assignment for Manager/User
_For any_ user with role Manager or User, the user should have isHod: false automatically set
**Validates: Requirements 2.3**

Property 9: ProjectTask Watcher HOD Validation
_For any_ ProjectTask, all users in the watchers array should have isHod: true
**Validates: Requirements 4.2**

Property 10: RoutineTask Status Restriction
_For any_ RoutineTask, the status field should not be "To Do" (must be In Progress, Completed, or Pending)
**Validates: Requirements 5.2**

Property 11: RoutineTask Priority Restriction
_For any_ RoutineTask, the priority field should not be "Low" (must be Medium, High, or Urgent)
**Validates: Requirements 5.3**

Property 12: RoutineTask No Activities
_For any_ RoutineTask, querying TaskActivity with parent reference to the RoutineTask should return empty results
**Validates: Requirements 5.5**

Property 13: AssignedTask Requires Assignees
_For any_ AssignedTask creation attempt without assignees, the operation should fail with VALIDATION_ERROR
**Validates: Requirements 6.1**

Property 14: ProjectTask Requires Vendor
_For any_ ProjectTask creation attempt without vendor reference, the operation should fail with VALIDATION_ERROR
**Validates: Requirements 4.1**

Property 15: RoutineTask Requires Dates
_For any_ RoutineTask creation attempt without startDate or dueDate, the operation should fail with VALIDATION_ERROR
**Validates: Requirements 5.1**

Property 16: UTC Date Storage
_For any_ date field saved to the database, the stored value should be in UTC timezone (offset +00:00)
**Validates: Requirements 10.2**

Property 17: ISO 8601 API Response
_For any_ date field returned from the API, the value should be formatted as ISO 8601 string in UTC
**Validates: Requirements 10.3**

Property 18: Transaction Commit on Success
_For any_ write operation that completes without errors, the MongoDB transaction should be committed
**Validates: Requirements 12.2**

Property 19: Transaction Rollback on Failure
_For any_ write operation that encounters an error, the MongoDB transaction should be rolled back and no changes should persist
**Validates: Requirements 12.3**

Property 20: Password Hashing
_For any_ user password, the stored value should be a bcrypt hash different from the original password
**Validates: Requirements 3.1**

Property 21: JWT Token Generation on Login
_For any_ successful login with valid credentials, JWT access token and refresh token should be generated and stored in HTTP-only cookies
**Validates: Requirements 3.2**

Property 22: Cookie Clearing on Logout
_For any_ logout request, both access_token and refresh_token cookies should be cleared
**Validates: Requirements 3.4**

Property 23: Authorization Scope Enforcement
_For any_ protected resource request, the user's role and scope should be verified against the authorization matrix before allowing access
**Validates: Requirements 3.5, 22.3, 22.4**

Property 24: Department Name Uniqueness Per Organization
_For any_ organization, all department names should be unique (case-insensitive)
**Validates: Requirements 2.5**

Property 25: Last HOD Deletion Prevention
_For any_ department with only one HOD user, attempting to delete that user should fail with AUTHORIZATION_ERROR
**Validates: Requirements 2.4**

Property 26: Platform Organization Deletion Prevention
_For any_ deletion attempt on the organization with isPlatformOrg: true, the operation should fail with AUTHORIZATION_ERROR
**Validates: Requirements 1.5**

Property 27: Socket.IO Event Emission on Task Creation
_For any_ task creation, a task:created event should be emitted to the department and organization Socket.IO rooms
**Validates: Requirements 8.2**

Property 28: Socket.IO Event Emission on Notification Creation
_For any_ notification creation, a notification:created event should be emitted to the recipient's user Socket.IO room
**Validates: Requirements 8.3**

Property 29: Material Scoping to Department and Organization
_For any_ material creation, the material should have both department and organization references set
**Validates: Requirements 9.1**

Property 30: Vendor Scoping to Organization Only
_For any_ vendor creation, the vendor should have organization reference but NOT department reference
**Validates: Requirements 9.3**

Property 31: Vendor Deletion Requires ProjectTask Reassignment
_For any_ vendor with linked ProjectTasks, attempting to delete the vendor should fail unless all ProjectTasks are reassigned to another vendor
**Validates: Requirements 9.4**

Property 32: NoSQL Injection Prevention
_For any_ request body, params, or query containing $ or . operators, these characters should be removed before processing
**Validates: Requirements 11.2**

Property 33: CORS Origin Validation
_For any_ request from an origin not in the allowed origins list, the request should be rejected
**Validates: Requirements 11.4**

Property 34: Welcome Email on User Creation
_For any_ user creation, a welcome email should be sent to the user's email address
**Validates: Requirements 14.1**

Property 35: Password Reset Email on Request
_For any_ password reset request, a reset email with token should be sent to the user's email address
**Validates: Requirements 14.2**

Property 36: Mention Email on Comment with Mention
_For any_ comment creation with mentions where mentioned users have emailPreferences.mentions: true, email notifications should be sent
**Validates: Requirements 14.3**

Property 37: RTK Query Cache Invalidation on Socket.IO Event
_For any_ Socket.IO event received on frontend, the appropriate RTK Query cache tags should be invalidated
**Validates: Requirements 15.2**

Property 38: RTK Query Cache Invalidation on Mutation Success
_For any_ successful mutation, the related RTK Query cache tags should be automatically invalidated
**Validates: Requirements 15.3**

Property 39: Validation Error Code Consistency
_For any_ validation error, the response should have status 400 and errorCode "VALIDATION_ERROR"
**Validates: Requirements 17.1**

Property 40: Authentication Error Code Consistency
_For any_ authentication error, the response should have status 401 and errorCode "AUTHENTICATION_ERROR"
**Validates: Requirements 17.2**

Property 41: Authorization Error Code Consistency
_For any_ authorization error, the response should have status 403 and errorCode "AUTHORIZATION_ERROR"
**Validates: Requirements 17.3**

Property 42: Not Found Error Code Consistency
_For any_ not found error, the response should have status 404 and errorCode "NOT_FOUND_ERROR"
**Validates: Requirements 17.4**

Property 43: Uniqueness Check with Soft-Deleted Records
_For any_ uniqueness validation, the check should use withDeleted() to include soft-deleted records
**Validates: Requirements 18.2**

Property 44: Reference Validation with Deletion Status
_For any_ reference validation, the check should verify the referenced document exists and is not soft-deleted
**Validates: Requirements 18.3**

Property 45: TaskActivity Parent Type Validation
_For any_ TaskActivity creation, the parent must be either ProjectTask or AssignedTask (NOT RoutineTask)
**Validates: Requirements 19.1**

Property 46: TaskActivity for RoutineTask Rejection
_For any_ attempt to create TaskActivity with parent as RoutineTask, the operation should fail with VALIDATION_ERROR
**Validates: Requirements 19.2**

Property 47: TaskComment Max Depth Enforcement
_For any_ TaskComment with parent as TaskComment, the depth should not exceed 3 levels
**Validates: Requirements 19.3**

Property 48: Image File Size Validation
_For any_ image file upload, the file size should not exceed 10MB and extension should be in allowed list
**Validates: Requirements 20.1**

Property 49: Max Attachments Per Entity
_For any_ entity (Task/TaskActivity/TaskComment), the total number of attachments should not exceed 10
**Validates: Requirements 20.2**

Property 50: Notification Creation on Task Creation
_For any_ task creation, notifications should be created for all watchers and assignees
**Validates: Requirements 21.1**

Property 51: Notification Creation on Mention
_For any_ comment creation with mentions, notifications should be created for all mentioned users
**Validates: Requirements 21.2**

Property 52: Ownership Verification for Update/Delete
_For any_ update or delete operation, the user should be verified as owner (createdBy) OR in assignees/watchers/mentions/recipient arrays
**Validates: Requirements 22.4**

## Error Handling

### Error Hierarchy

```
CustomError (Base)
├── validation(message, context)    → 400 VALIDATION_ERROR
├── authentication(message, context) → 401 AUTHENTICATION_ERROR (triggers logout)
├── authorization(message, context)  → 403 AUTHORIZATION_ERROR
├── notFound(message, context)       → 404 NOT_FOUND_ERROR
├── conflict(message, context)       → 409 CONFLICT_ERROR
└── internal(message, context)       → 500 INTERNAL_SERVER_ERROR
```

### Error Response Format

```javascript
{
  success: false,
  statusCode: 400,
  errorCode: "VALIDATION_ERROR",
  message: "Descriptive error message",
  context: {
    field: "email",
    value: "invalid-email",
    constraint: "must be valid email"
  },
  stack: "..." // Only in development
}
```

### Error Handling Patterns

**Controller Level**:

```javascript
// Validation error
if (!isValid) {
  throw CustomError.validation("Invalid email format", {field: "email"})
}

// Authentication error (triggers logout on frontend)
if (!user || !await user.comparePassword(password)) {
  throw CustomError.authentication("Invalid credentials")
}

// Authorization error
if (!hasPermission) {
  throw CustomError.authorization("Insufficient permissions to update this resource")
}

// Not found error
if (!resource) {
  throw CustomError.notFound("Resource not found", {resourceId})
}

// Conflict error
if (existing) {
  throw CustomError.conflict("Email already exists", {email})
}

// Internal error
catch (error) {
  throw CustomError.internal("Database operation failed", {originalError: error.message})
}
```

**Frontend Error Handling**:

```javascript
// RTK Query error handler
transformErrorResponse: (response) => {
  const { errorCode, message } = response.data;

  // Trigger logout on authentication error
  if (errorCode === "AUTHENTICATION_ERROR") {
    dispatch(logout());
    navigate("/login");
  }

  // Show toast notification
  toast.error(message);

  return { errorCode, message };
};
```

### Validation Error Aggregation

```javascript
// Multiple validation errors
const errors = validationResult(req);
if (!errors.isEmpty()) {
  const errorMessages = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
    value: err.value,
  }));
  throw CustomError.validation("Validation failed", { errors: errorMessages });
}
```

## Testing Strategy

### Testing Approach

**Dual Testing Strategy**:

1. **Unit Tests**: Specific examples, edge cases, error conditions
2. **Property-Based Tests**: Universal properties across all valid inputs

**Test Framework**:

- Backend: Jest ^30.2.0 with ES modules
- Property Testing: fast-check ^4.3.0
- Database: Real MongoDB instance (NOT mongodb-memory-server)
- Minimum Iterations: 100 per property test

### Unit Testing

**Coverage Goals**:

- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

**Unit Test Categories**:

1. **Model Tests**: Schema validation, hooks, instance methods, static methods
2. **Controller Tests**: Request handling, error cases, response format
3. **Middleware Tests**: Authentication, authorization, validation
4. **Service Tests**: Email sending, notification creation
5. **Utility Tests**: Helper functions, date conversion, token generation

**Example Unit Tests**:

```javascript
// Model validation
describe('User Model', () => {
  it('should hash password on save', async () => {
    const user = new User({password: 'password123', ...})
    await user.save()
    expect(user.password).not.toBe('password123')
    expect(await bcrypt.compare('password123', user.password)).toBe(true)
  })

  it('should auto-set isHod for SuperAdmin role', async () => {
    const user = new User({role: 'SuperAdmin', ...})
    await user.save()
    expect(user.isHod).toBe(true)
  })
})

// Controller error handling
describe('Task Controller', () => {
  it('should return VALIDATION_ERROR for missing vendor on ProjectTask', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({taskType: 'ProjectTask', description: 'Test'})
      .expect(400)

    expect(res.body.errorCode).toBe('VALIDATION_ERROR')
    expect(res.body.message).toContain('vendor')
  })
})
```

### Property-Based Testing

**Property Test Configuration**:

```javascript
import fc from 'fast-check'

fc.assert(
  fc.property(
    fc.record({...}), // Generators
    async (data) => {
      // Property assertion
    }
  ),
  {numRuns: 100} // Minimum 100 iterations
)
```

**Property Test Categories**:

1. **Soft Delete Properties**: Exclusion, cascade, field setting
2. **Authorization Properties**: Scope enforcement, ownership validation
3. **Timezone Properties**: UTC storage, ISO format, round-trip conversion
4. **Transaction Properties**: Commit on success, rollback on failure
5. **Validation Properties**: Uniqueness with soft-deleted, reference validation
6. **Task Type Properties**: Type-specific constraints, material patterns

**Example Property Tests**:

```javascript
/**
 * Feature: saas-task-manager-mvp, Property 3: Soft Delete Exclusion
 * Validates: Requirements 7.3
 */
describe('Soft Delete Exclusion Property', () => {
  it('should exclude soft-deleted records from normal queries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({name: fc.string(), ...}), {minLength: 1}),
        async (resources) => {
          // Create resources
          const created = await Model.create(resources)

          // Soft delete some resources
          const toDelete = created.slice(0, Math.floor(created.length / 2))
          await Promise.all(toDelete.map(r => r.softDelete(userId)))

          // Query without withDeleted()
          const results = await Model.find({})

          // Assert: No soft-deleted records in results
          const deletedIds = toDelete.map(r => r._id.toString())
          const resultIds = results.map(r => r._id.toString())
          const intersection = deletedIds.filter(id => resultIds.includes(id))

          expect(intersection).toHaveLength(0)
        }
      ),
      {numRuns: 100}
    )
  })
})

/**
 * Feature: saas-task-manager-mvp, Property 4: Soft Delete Cascade
 * Validates: Requirements 1.6, 7.2
 */
describe('Soft Delete Cascade Property', () => {
  it('should cascade soft delete to all children', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          organization: fc.record({...}),
          departments: fc.array(fc.record({...}), {minLength: 1}),
          users: fc.array(fc.record({...}), {minLength: 1})
        }),
        async (data) => {
          // Create organization with children
          const org = await Organization.create([data.organization], {session})
          const depts = await Department.create(
            data.departments.map(d => ({...d, organization: org[0]._id})),
            {session}
          )
          const users = await User.create(
            data.users.map(u => ({...u, organization: org[0]._id, department: depts[0]._id})),
            {session}
          )

          // Soft delete organization
          await Organization.softDeleteByIdWithCascade(org[0]._id, {session, deletedBy: userId})

          // Assert: All children are soft-deleted
          const deletedDepts = await Department.find({organization: org[0]._id}).withDeleted()
          const deletedUsers = await User.find({organization: org[0]._id}).withDeleted()

          expect(deletedDepts.every(d => d.isDeleted)).toBe(true)
          expect(deletedUsers.every(u => u.isDeleted)).toBe(true)
        }
      ),
      {numRuns: 100}
    )
  })
})

/**
 * Feature: saas-task-manager-mvp, Property 16: UTC Date Storage
 * Validates: Requirements 10.2
 */
describe('UTC Date Storage Property', () => {
  it('should store all dates in UTC timezone', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string(),
          startDate: fc.date(),
          dueDate: fc.date()
        }),
        async (taskData) => {
          // Create task with dates
          const task = await Task.create([taskData], {session})

          // Retrieve from database
          const retrieved = await Task.findById(task[0]._id)

          // Assert: Dates are in UTC (offset +00:00)
          const startDateUTC = new Date(retrieved.startDate).toISOString()
          const dueDateUTC = new Date(retrieved.dueDate).toISOString()

          expect(startDateUTC).toMatch(/Z$/) // Ends with Z (UTC indicator)
          expect(dueDateUTC).toMatch(/Z$/)
        }
      ),
      {numRuns: 100}
    )
  })
})
```

### Test Database Configuration

**CRITICAL**: Use real MongoDB instance, NOT mongodb-memory-server

```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
  maxWorkers: 1
}

// tests/globalSetup.js
export default async () => {
  const MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/task-manager-test'
  await mongoose.connect(MONGODB_URI_TEST)
}

// tests/globalTeardown.js
export default async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
}

// tests/setup.js
beforeEach(async () => {
  const collections = await mongoose.connection.db.collections()
  for (let collection of collections) {
    await collection.deleteMany({})
  }
})
```

### Testing Phases

**Phase 1: Backend Testing** (After backend completion):

1. Run all unit tests: `npm test`
2. Run property-based tests: `npm run test:property`
3. Generate coverage report: `npm run test:coverage`
4. Verify coverage thresholds met
5. Fix any failing tests before proceeding

**Phase 2: Frontend Testing** (After frontend completion):

1. Run all component tests: `npm test`
2. Run integration tests
3. Verify all tests pass
4. Fix any failing tests before deployment

**Test Execution Rules**:

- NO tests between phases or individual tasks
- Tests executed ONLY at phase completion
- All tests must pass before proceeding to next phase
- Coverage thresholds must be met

### Test Documentation

**Property Test Tagging**:

```javascript
/**
 * Feature: saas-task-manager-mvp, Property {number}: {property_text}
 * Validates: Requirements {requirement_number}
 */
```

**Test Result Logging**:

- Total tests executed
- Passed tests count
- Failed tests count
- Coverage percentages (statements, branches, functions, lines)
- Execution time
- Logged to docs/dev-phase-tracker.md

## Implementation Notes

### Critical Patterns

**1. CustomError Usage**:

- ALWAYS use static helper methods (validation, authentication, authorization, notFound, conflict, internal)
- NEVER use constructor directly
- Authentication errors trigger logout on frontend

**2. Transaction Pattern**:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // All operations with {session}
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**3. Soft Delete Pattern**:

```javascript
// Query without soft-deleted
const results = await Model.find({});

// Query with soft-deleted
const results = await Model.find({}).withDeleted();

// Query only soft-deleted
const results = await Model.find({}).onlyDeleted();

// Soft delete with cascade
await Model.softDeleteByIdWithCascade(id, { session, deletedBy: userId });

// Restore
await model.restore(userId, { session });
```

**4. Timezone Pattern**:

```javascript
// Backend: Convert to UTC before save
schema.pre("save", function (next) {
  if (this.dueDate) {
    this.dueDate = dayjs(this.dueDate).utc().toDate();
  }
  next();
});

// Backend: Return as ISO string
toJSON: {
  transform: (doc, ret) => {
    if (ret.dueDate) ret.dueDate = dayjs(ret.dueDate).utc().toISOString();
    return ret;
  };
}

// Frontend: Convert UTC to local for display
const displayDate = formatDateForDisplay(utcDate, "MMM DD, YYYY HH:mm");

// Frontend: Convert local to UTC for API
const utcDate = convertLocalToUTC(localDate);
```

**5. Authorization Pattern**:

```javascript
// Middleware
router.post("/", authorize("Resource", "create"), controller);

// Controller
const hasPermission = checkPermission(req.user, resource, "update");
if (!hasPermission) {
  throw CustomError.authorization("Insufficient permissions");
}
```

**6. Validation Pattern**:

```javascript
// Validator
export const createResourceValidator = [
  body("field").notEmpty().withMessage("Required"),
  body("reference")
    .isMongoId()
    .custom(async (value) => {
      const doc = await Model.findById(value).withDeleted();
      if (!doc) throw new Error("Not found");
      if (doc.isDeleted) throw new Error("Document is deleted");
      return true;
    }),
  handleValidationErrors,
];

// Controller
const { field, reference } = req.validated.body;
```

### Dependencies and Order

**Backend Implementation Order**:

1. Core Foundation (config, error handling, utils, middleware, services, Socket.IO, soft delete plugin)
2. Models (Organization → Department → User → Vendor → Material → BaseTask → Task Types → TaskActivity → TaskComment → Attachment → Notification)
3. Routes → Validators → Controllers (for each resource in dependency order)

**Frontend Implementation Order**:

1. Core Foundation (constants, utils, services, hooks, theme)
2. Redux Store (base API, auth slice, store config)
3. Redux API Endpoints (in dependency order)
4. Common Components (form inputs, DataGrid, filters, dialogs, loading)
5. Resource-Specific Components (columns, cards, lists, filters, forms)
6. Layouts (root, public, dashboard, auth)
7. Pages (public → protected)
8. Routing (route config, lazy loading)
9. App Entry Point (App.jsx, main.jsx)

### Performance Considerations

**Backend**:

- MongoDB connection pooling (min: 2, max: 10)
- Indexes on frequently queried fields
- Pagination for all list endpoints
- Compression middleware for responses >1KB
- Rate limiting in production

**Frontend**:

- React.memo for Card components
- useCallback for event handlers
- useMemo for computed values
- Lazy loading for routes
- Code splitting with Vite
- RTK Query automatic caching

### Security Considerations

**Backend**:

- HTTP-only cookies for JWT tokens
- bcrypt password hashing (≥12 rounds)
- CORS validation with no wildcards
- NoSQL injection prevention
- Rate limiting (5/15min auth, 100/15min general)
- Helmet security headers
- Input sanitization

**Frontend**:

- No sensitive data in localStorage
- CSRF protection via sameSite: 'strict'
- XSS prevention via React escaping
- Automatic logout on AUTHENTICATION_ERROR
- Secure cookie transmission (HTTPS in production)

## Conclusion

This design document provides a comprehensive blueprint for implementing the Multi-Tenant SaaS Task Manager. The architecture emphasizes security, data integrity, and user experience through:

1. **Strict Multi-Tenancy**: Complete isolation between customer organizations
2. **Universal Soft Delete**: Recoverable deletions with TTL-based cleanup
3. **Transaction-Based Integrity**: Atomic operations with rollback capability
4. **Worldwide Timezone Support**: UTC storage with local display
5. **Real-Time Synchronization**: Socket.IO with automatic cache invalidation
6. **Comprehensive Testing**: Property-based tests with 100+ iterations
7. **Consistent Error Handling**: Standardized error codes and responses
8. **Role-Based Authorization**: Fine-grained permissions with scope enforcement

The implementation should follow the specified patterns exactly, with particular attention to CustomError usage, transaction handling, soft delete operations, and timezone management. All tests must pass before proceeding to the next phase, ensuring code quality and correctness throughout the development process.

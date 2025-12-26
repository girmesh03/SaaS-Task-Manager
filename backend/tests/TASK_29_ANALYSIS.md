# Task 29: Test Configuration Files - Documentation Analysis

**Date:** December 26, 2024
**Task:** 29 - Test Configuration Files (config/\*)
**Phase:** Phase 4.2 - Test Phase 1 Foundation

---

## Documentation Analysis Summary

### Relevant Requirements

**Requirement 11: Security and Rate Limiting**

- 11.1: Security middleware order (helmet, cors, cookieParser, express.json, mongoSanitize, compression)
- 11.5: CORS validation with allowed origins (development: localhost:3000, localhost:5173; production: CLIENT_URL + ALLOWED_ORIGINS)

**Requirement 23: Git Workflow and Branch Management**

- 23.1-23.10: Git workflow management, branch naming, commit conventions

**Requirement 25: Comprehensive Testing Strategy**

- 25.1: Execute all backend tests with real MongoDB
- 25.2: Run npm test and verify exit code 0
- 25.3: Halt on test failures
- 25.4: Coverage thresholds (statements 80%+, branches 75%+, functions 80%+, lines 80%+)

**Requirement 22: Authorization Matrix and Scope Enforcement**

- 22.1: Load permissions from config/authorizationMatrix.json
- 22.2: Platform SuperAdmin crossOrg scope for Organization
- 22.3-22.10: Role-based scope enforcement

### Design Decisions

**Configuration Layer (from design.md):**

- `config/db.js`: MongoDB connection with retry logic (5 attempts), connection pooling (min: 2, max: 10)
- `config/allowedOrigins.js`: CORS origins list (development + production)
- `config/corsOptions.js`: CORS configuration with validation
- `config/authorizationMatrix.json`: RBAC permissions (ONLY source of truth)

**Key Interfaces:**

```javascript
// db.js
export const connectDB = async () => Promise<void>
export const disconnectDB = async () => Promise<void>
export const isConnected = () => boolean
export const getConnectionState = () => string

// corsOptions.js
export default {
  origin: validateOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
}
```

### Critical Implementation Patterns

- [x] Real MongoDB for testing (NOT mongodb-memory-server)
- [x] Test timeout: 960 seconds (16 minutes)
- [x] Coverage thresholds: statements 80%+, branches 75%+, functions 80%+, lines 80%+
- [x] Property-based tests: minimum 100 iterations using fast-check
- [x] All tests tagged with: `**Feature: saas-task-manager-mvp, Property X: [text]**` and `**Validates: Requirements X.Y**`
- [x] Git workflow: test/phase-4.2-config-tests branch
- [x] All commands suitable for GitBash WSL VSCode integrated terminal

### Configuration Files Analysis

**1. backend/config/db.js**

- Purpose: MongoDB connection with retry logic and connection pooling
- Retry Logic: 5 attempts with 5-second delay between attempts
- Connection Pooling: minPoolSize: 2, maxPoolSize: 10
- Timeout Settings: serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000
- Event Handlers: error, disconnected, reconnected, close
- Graceful Shutdown: SIGINT and SIGTERM handlers
- Functions: connectDB(), disconnectDB(), isConnected(), getConnectionState()

**2. backend/config/allowedOrigins.js**

- Purpose: CORS allowed origins list
- Development Origins: http://localhost:3000, http://localhost:5173
- Production Origins: process.env.CLIENT_URL + process.env.ALLOWED_ORIGINS (comma-separated)
- Export: Default export array of allowed origins

**3. backend/config/corsOptions.js**

- Purpose: CORS configuration with origin validation
- Origin Validation: Callback function checking against allowedOrigins
- Credentials: true (enables HTTP-only cookies)
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Allowed Headers: Content-Type, Authorization, X-Requested-With
- Exposed Headers: X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- Max Age: 86400 seconds (24 hours)
- Options Success Status: 200 (for legacy browsers)

**4. backend/config/authorizationMatrix.json**

- Purpose: RBAC permissions (ONLY source of truth)
- Structure: {Resource: {Role: {operation: [scopes]}}}
- Resources: Organization, Department, User, Vendor, Material, Task, TaskActivity, TaskComment, Attachment, Notification
- Roles: SuperAdmin, Admin, Manager, User
- Operations: create, read, update, delete, restore
- Scopes: own, ownDept, crossDept, crossOrg
- Platform SuperAdmin: crossOrg for Organization (read/update/delete/restore), crossDept for others
- Customer SuperAdmin: crossDept within own org
- Admin: crossDept within own org
- Manager: ownDept
- User: own (write), ownDept (read)

### Dependencies

**Test Dependencies:**

- Jest ^30.2.0 (installed: 30.2.0)
- fast-check ^4.3.0 (installed: 4.4.0)
- supertest ^7.1.4 (installed: 7.1.4)
- Real MongoDB test database (MONGODB_URI_TEST)

**Configuration Dependencies:**

- mongoose ^8.19.1
- winston ^3.18.3 (logger)
- cors ^2.8.5
- dotenv (environment variables)

### Validation Checklist

**Unit Tests to Write:**

- [ ] db.js: MongoDB connection success/failure
- [ ] db.js: Retry logic (5 attempts with 5-second delay)
- [ ] db.js: Connection pooling (min: 2, max: 10)
- [ ] db.js: Graceful shutdown
- [ ] db.js: Connection timeout handling
- [ ] corsOptions.js: Allowed origins validation (localhost:3000, localhost:5173)
- [ ] corsOptions.js: Production origins (CLIENT_URL + ALLOWED_ORIGINS)
- [ ] corsOptions.js: Blocked origins rejection
- [ ] corsOptions.js: Credentials: true configuration
- [ ] corsOptions.js: Allowed methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- [ ] corsOptions.js: Allowed headers (Content-Type, Authorization, X-Requested-With)
- [ ] corsOptions.js: Exposed headers (X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining)
- [ ] corsOptions.js: MaxAge: 86400 (24 hours)
- [ ] authorizationMatrix.json: Platform SuperAdmin permissions (crossOrg for Organization, crossDept for others)
- [ ] authorizationMatrix.json: Customer SuperAdmin permissions (crossDept within own org)
- [ ] authorizationMatrix.json: Platform Admin permissions (crossDept within platform org)
- [ ] authorizationMatrix.json: Customer Admin permissions (crossDept within own org)
- [ ] authorizationMatrix.json: Manager permissions (ownDept)
- [ ] authorizationMatrix.json: User permissions (own for write, ownDept for read)
- [ ] authorizationMatrix.json: All resource types
- [ ] authorizationMatrix.json: All operations (create, read, update, delete, restore)

**Property-Based Tests to Write:**

- [ ] Property 1: MongoDB URI Validation - For any valid MongoDB URI format, connection attempt should either succeed or fail gracefully
- [ ] Property 2: CORS Origin Validation - For any origin string, CORS validation should return true for allowed origins and false for others
- [ ] Property 3: Authorization Matrix Consistency - For any role/resource/operation combination, authorization check should return consistent boolean result

### Potential Issues

1. **MongoDB Connection Retry Logic**: Need to test that exactly 5 attempts are made with 5-second delays
2. **CORS Origin Validation**: Need to handle null origin (mobile apps, Postman)
3. **Authorization Matrix Completeness**: Need to verify all resources, roles, and operations are covered
4. **Environment Variables**: Tests need to handle missing or invalid environment variables

### Test Strategy

**Unit Tests:**

1. Mock MongoDB connection to test retry logic without actual database
2. Test CORS origin validation with various origin strings
3. Test authorization matrix structure and completeness
4. Test all configuration exports and functions

**Property-Based Tests:**

1. Generate random MongoDB URIs and test connection handling
2. Generate random origin URLs and test CORS validation
3. Generate random role/resource/operation combinations and test authorization consistency

**Coverage Goals:**

- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

---

## Requirements Validated

- ✅ Requirement 26.1: Read and analyze docs/build-prompt.md
- ✅ Requirement 26.2: Read and analyze docs/softDelete-doc.md
- ✅ Requirement 26.3: Read and analyze docs/TIMEZONE-MANAGEMENT.md
- ✅ Requirement 26.4: Read and analyze docs/dev-phase-tracker.md
- ✅ Requirement 26.5: Read and analyze requirements.md
- ✅ Requirement 26.6: Read and analyze design.md
- ✅ Requirement 26.7: Create comprehensive analysis summary
- ✅ Requirement 26.9: Note critical patterns (CustomError, transactions, soft delete, timezone, authorization)

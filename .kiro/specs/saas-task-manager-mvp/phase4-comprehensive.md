## Phase 4: Backend Testing

**CRITICAL TESTING PROTOCOL:**

- All tests MUST use real MongoDB instance (NOT mongodb-memory-server)
- Test timeout: 960 seconds (16 minutes) per test suite
- If tests take longer, increase timeout and re-run
- NEVER skip failing tests - fix them (maximum 2 fix attempts, then ask user)
- Follow 5-point protocol for EVERY task:
  1. Pre-Implementation Documentation Analysis (Requirement 26)
  2. Search, Validation, Action, Verification (line-by-line analysis)
  3. Pre-Test Phase Tracking + Pre-Git Workflow
  4. Complete Testing (unit, property, coverage)
  5. Post-Test Phase Tracking + Post-Git Workflow
- Coverage thresholds: statements 80%+, branches 75%+, functions 80%+, lines 80%+
- Property-based tests: minimum 100 iterations using fast-check
- All tests tagged with: `**Feature: saas-task-manager-mvp, Property X: [text]**` and `**Validates: Requirements X.Y**`

### Phase 4.1: Test Setup and Infrastructure

- [x] 28. Complete Test Environment Setup

  - [x] 28.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - All testing requirements (25.1-25.10, 13.1-13.9)
    - Read `.kiro/specs/saas-task-manager-mvp/design.md` - Testing strategy, property-based testing approach, correctness properties
    - Read `docs/build-prompt.md` - Technology stack, testing framework (Jest ^30.2.0, fast-check ^4.3.0, supertest ^7.1.4)
    - Read `docs/softDelete-doc.md` - Soft delete testing requirements, cascade operations, TTL testing
    - Read `docs/TIMEZONE-MANAGEMENT.md` - Timezone testing requirements, UTC storage validation
    - Verify existing test structure in `backend/tests/unit/` and `backend/tests/property/`
    - Document findings: testing patterns, coverage requirements, property-based test configuration
    - Identify dependencies: Jest, fast-check, supertest, real MongoDB test database
    - _Requirements: 26.1-26.10, 25.1-25.10, 13.1-13.9_

  - [x] 28.2 Search, Validation, Action, Verification

    - Pick file: `backend/package.json`
    - Analyze each line: dependencies, scripts, ES modules configuration
    - Search codebase: verify all test dependencies installed
    - Validate: Jest version ^30.2.0, fast-check ^4.3.0, supertest ^7.1.4, "type": "module"
    - Action: Install missing dependencies if any
    - Verification: Run `npm list jest fast-check supertest` to confirm versions
    - _Requirements: 26.1-26.10, 25.1, 25.9_

  - [x] 28.3 Pre-Test Phase Tracking and Git Workflow

    - Create `docs/test-phase-tracker.md` if not exists with structure:

      ```markdown
      # Test Phase Tracker

      **Project:** Multi-Tenant SaaS Task Manager MVP - Backend Testing
      **Start Date:** [Current Date]

      ---

      ## Test Phase History

      [Entries in reverse chronological order]

      ## Current Test Phase Status

      ## Test Coverage Metrics

      ## Failed Tests Log

      ## Property-Based Test Results
      ```

    - Execute Git workflow: `git status`, handle uncommitted changes, sync with remote
    - Create feature branch: `git checkout -b test/phase-4-backend-testing` if not exists
    - Add test start entry to `docs/test-phase-tracker.md`:
      - Phase: Phase 4.1 - Test Setup and Infrastructure
      - Task: 28 - Complete Test Environment Setup
      - Status: IN PROGRESS
      - Branch: test/phase-4-backend-testing
      - Expected Outcome: Jest configured, test database setup, test utilities created
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [x] 28.4 Configure Jest for ES Modules and MongoDB

    - Create `backend/jest.config.js` with ES modules support:
      - `transform: {}` (no transformation for ES modules)
      - `testEnvironment: 'node'`
      - `testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js']`
      - `collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/tests/**', '!**/coverage/**']`
      - `coverageThresholds: { global: { statements: 80, branches: 75, functions: 80, lines: 80 } }`
      - `testTimeout: 960000` (960 seconds = 16 minutes)
      - `setupFilesAfterEnv: ['<rootDir>/tests/setup.js']`
      - `globalTeardown: '<rootDir>/tests/teardown.js'`
    - Create `backend/tests/setup.js` with:
      - MongoDB connection setup using real MongoDB (MONGODB_URI_TEST from .env)
      - Test database configuration and connection
      - Global test utilities import
      - Database cleanup before all tests
      - Set process.env.TZ = 'UTC' for timezone consistency
    - Create `backend/tests/teardown.js` with:
      - Close MongoDB connections
      - Clean up test data
      - Disconnect from test database
    - Update `backend/package.json` scripts:
      - `"test": "NODE_OPTIONS='--experimental-vm-modules' jest --runInBand --detectOpenHandles"`
      - `"test:watch": "NODE_OPTIONS='--experimental-vm-modules' jest --watch --runInBand"`
      - `"test:coverage": "NODE_OPTIONS='--experimental-vm-modules' jest --coverage --runInBand"`
      - `"test:property": "NODE_OPTIONS='--experimental-vm-modules' jest --testPathPattern=property --runInBand"`
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout in jest.config.js and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 25.9, 13.9_

  - [x] 28.5 Create Test Database Setup and Utilities

    - Create `backend/tests/utils/testDb.js` with:
      - `connectTestDB()`: Connect to test MongoDB instance (MONGODB_URI_TEST)
      - `disconnectTestDB()`: Disconnect from test database
      - `clearTestDB()`: Clear all collections in test database
      - `seedTestData(modelName, data)`: Seed test data for specific model
      - `createTestOrganization(overrides)`: Create test organization (platform or customer)
      - `createTestDepartment(organization, overrides)`: Create test department
      - `createTestUser(organization, department, overrides)`: Create test user with role
      - `createTestVendor(organization, overrides)`: Create test vendor
      - `createTestMaterial(organization, department, overrides)`: Create test material
    - Create `backend/tests/utils/testHelpers.js` with:
      - `generateMockData(modelName, count)`: Generate mock data using fast-check
      - `assertSoftDelete(doc)`: Assert document is soft-deleted correctly (isDeleted: true, deletedAt, deletedBy)
      - `assertRestore(doc)`: Assert document is restored correctly (isDeleted: false, restoredAt, restoredBy)
      - `assertCascadeDelete(parent, children)`: Assert cascade delete worked for all children
      - `assertTransactionRollback(operation)`: Assert transaction rolled back on error
      - `assertTimezoneUTC(date)`: Assert date is stored in UTC
      - `assertAuthorizationScope(user, resource, operation)`: Assert authorization scope correct
    - Create `backend/tests/utils/mockData.js` with:
      - Mock data generators for all models using fast-check arbitraries
      - `fc.organization()`: Generate random organization data
      - `fc.department()`: Generate random department data
      - `fc.user()`: Generate random user data
      - `fc.vendor()`: Generate random vendor data
      - `fc.material()`: Generate random material data
      - `fc.projectTask()`, `fc.routineTask()`, `fc.assignedTask()`: Generate random task data
      - `fc.taskActivity()`, `fc.taskComment()`, `fc.attachment()`, `fc.notification()`: Generate random data
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.9, 13.1, 13.9_

  - [x] 28.6 Run Test Setup Verification

    - Run `npm test` to verify Jest configuration works
    - Verify test database connection successful (real MongoDB, not mongodb-memory-server)
    - Verify test utilities can be imported
    - Verify coverage report generation works
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout in jest.config.js and re-run
    - Fix any configuration issues (maximum 2 attempts)
    - If still failing, document issue and ask user for guidance
    - _Requirements: 25.1, 25.2, 25.3_

  - [x] 28.7 Post-Test Phase Tracking and Git Workflow

    - Verify all test setup files committed
    - Stage and commit changes: `git add . && git commit -m "feat(test): Complete test environment setup with Jest, test DB, and utilities"`
    - Push to remote: `git push origin test/phase-4-backend-testing`
    - Verify sync: `git status` shows "Your branch is up to date with 'origin/test/phase-4-backend-testing'"
    - Update `docs/test-phase-tracker.md` with completion entry:
      - Phase: Phase 4.1 - Test Setup and Infrastructure
      - Task: 28 - Complete Test Environment Setup
      - Status: COMPLETE
      - Duration: [Time taken]
      - Commit: [Latest commit hash]
      - Changes Made:
        - Jest configured for ES modules with 960s timeout
        - Test database setup with real MongoDB
        - Test utilities created (testDb, testHelpers, mockData)
        - Test scripts added to package.json
      - Validation:
        - [x] Jest runs successfully
        - [x] Test database connects (real MongoDB)
        - [x] Test utilities work
        - [x] Coverage report generates
        - [x] All files committed and pushed
        - [x] Local in sync with remote
    - _Requirements: 23.1-23.10, 24.1-24.10_

### Phase 4.2: Test Phase 1 - Backend Foundation and Core Infrastructure

- [x] 29. Test Configuration Files (config/\*)

  - [x] 29.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/config/db.js` - MongoDB connection, retry logic, connection pooling (min: 2, max: 10)
    - Read `backend/config/allowedOrigins.js` - CORS origins list (development + production)
    - Read `backend/config/corsOptions.js` - CORS configuration with validation
    - Read `backend/config/authorizationMatrix.json` - RBAC permissions (ONLY source of truth)
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 23.1-23.10, 11.1, 11.5, 22.1
    - Read `.kiro/specs/saas-task-manager-mvp/design.md` - Configuration layer design
    - Document findings: config patterns, validation requirements, error handling
    - _Requirements: 26.1-26.10, 23.1-23.10, 11.1, 11.5, 22.1_

  - [x] 29.2 Search, Validation, Action, Verification

    - Pick files: `backend/config/db.js`, `allowedOrigins.js`, `corsOptions.js`, `authorizationMatrix.json`
    - For each line: analyze why it's written, logic behind it
    - Search codebase: find all occurrences of config usage (import statements, function calls)
    - Validate logic: verify against requirements, check retry logic (3 attempts), connection pooling (min: 2, max: 10)
    - Validate CORS: development origins (localhost:3000, localhost:5173), production (CLIENT_URL + ALLOWED_ORIGINS)
    - Validate authorization matrix: Platform SuperAdmin (crossOrg for Organization, crossDept for others), Customer SuperAdmin (crossDept), Admin (crossDept), Manager (ownDept), User (own)
    - Action: correct/update if needed (document changes)
    - Verification: run `npm run dev` to verify config loads correctly
    - List all tests to be done:
      - Unit: MongoDB connection success/failure, retry logic (3 attempts), connection pooling
      - Unit: CORS origin validation (allowed/blocked origins)
      - Unit: Authorization matrix role/resource/operation checks for all combinations
      - Property: Any MongoDB URI connects or fails gracefully
      - Property: Any origin is correctly validated against allowed list
      - Property: Any role/resource/operation combination returns correct permission
    - _Requirements: 26.1-26.10, 23.1-23.10, 11.1, 11.5, 22.1_

  - [x] 29.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`:
      - Phase: Phase 4.2 - Test Phase 1 Foundation
      - Task: 29 - Test Configuration Files
      - Status: IN PROGRESS
      - Files to test: config/db.js, allowedOrigins.js, corsOptions.js, authorizationMatrix.json
    - Verify Git status: `git status`
    - Create branch if needed: `git checkout -b test/phase-4.2-config-tests`
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [x] 29.4 Write Unit Tests for Configuration Files

    - Create `backend/tests/unit/config/db.test.js`:
      - Test successful MongoDB connection
      - Test connection failure handling with retry logic (3 attempts)
      - Test connection pooling configuration (min: 2, max: 10)
      - Test graceful shutdown
      - Test connection timeout handling
    - Create `backend/tests/unit/config/corsOptions.test.js`:
      - Test allowed origins validation (development: localhost:3000, localhost:5173)
      - Test production origins (CLIENT_URL + ALLOWED_ORIGINS from env)
      - Test blocked origins rejection
      - Test credentials: true configuration
      - Test allowed methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
      - Test allowed headers (Content-Type, Authorization, X-Requested-With)
      - Test exposed headers (X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining)
      - Test maxAge: 86400 (24 hours)
    - Create `backend/tests/unit/config/authorizationMatrix.test.js`:
      - Test Platform SuperAdmin permissions (crossOrg for Organization, crossDept for all others)
      - Test Customer SuperAdmin permissions (crossDept within own org)
      - Test Platform Admin permissions (crossDept within platform org)
      - Test Customer Admin permissions (crossDept within own org)
      - Test Manager permissions (ownDept)
      - Test User permissions (own for write, ownDept for read)
      - Test all resource types (Organization, Department, User, Vendor, Material, Task, TaskActivity, TaskComment, Attachment, Notification)
      - Test all operations (create, read, update, delete, restore)
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 23.1-23.10, 11.1, 11.5, 22.1_

  - [x] 29.5 Write Property-Based Tests for Configuration

    - Create `backend/tests/property/config.property.test.js`:
      - **Property 1: MongoDB URI Validation**
        - _For any_ valid MongoDB URI format, connection attempt should either succeed or fail gracefully with error
        - **Feature: saas-task-manager-mvp, Property 1: MongoDB URI Validation**
        - **Validates: Requirements 23.1**
        - Iterations: 100
        - Use fc.string() to generate various URI formats
      - **Property 2: CORS Origin Validation**
        - _For any_ origin string, CORS validation should return true for allowed origins and false for others
        - **Feature: saas-task-manager-mvp, Property 2: CORS Origin Validation**
        - **Validates: Requirements 11.5**
        - Iterations: 100
        - Use fc.webUrl() to generate various origins
      - **Property 3: Authorization Matrix Consistency**
        - _For any_ role/resource/operation combination, authorization check should return consistent boolean result
        - **Feature: saas-task-manager-mvp, Property 3: Authorization Matrix Consistency**
        - **Validates: Requirements 22.1**
        - Iterations: 100
        - Use fc.constantFrom() for roles, resources, operations
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.6, 25.7, 25.9, 13.1, 13.6, 13.9_

  - [x] 29.6 Run Configuration Tests and Verify Coverage

    - Run unit tests: `npm test -- config`
    - Run property tests: `npm run test:property -- config`
    - Generate coverage: `npm run test:coverage -- config`
    - Verify coverage thresholds met: statements 80%+, branches 75%+, functions 80%+, lines 80%+
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests (maximum 2 attempts)
    - If tests still fail after 2 attempts, document issue and ask user for guidance
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [x] 29.7 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(config): Add comprehensive unit and property tests for configuration files"`
    - Push to remote: `git push origin test/phase-4.2-config-tests`
    - Verify sync: `git status` shows up to date with remote
    - Update `docs/test-phase-tracker.md` with completion entry
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 30. Test Error Handling Infrastructure (errorHandler/\*)

  - [ ] 30.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/errorHandler/CustomError.js` - Custom error class with static helper methods
    - Read `backend/errorHandler/ErrorController.js` - Global error handler middleware
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 17.1-17.5
    - Read `.kiro/specs/saas-task-manager-mvp/design.md` - Error handling layer design
    - Document findings: error codes (VALIDATION_ERROR, AUTHENTICATION_ERROR, AUTHORIZATION_ERROR, NOT_FOUND_ERROR, CONFLICT_ERROR, INTERNAL_SERVER_ERROR), status codes, context handling
    - _Requirements: 26.1-26.10, 17.1-17.5_

  - [ ] 30.2 Search, Validation, Action, Verification

    - Pick files: `backend/errorHandler/CustomError.js`, `ErrorController.js`
    - For each line: analyze why it's written, logic behind it
    - Search codebase: find all CustomError usage (static methods: validation, authentication, authorization, notFound, conflict, internal)
    - Validate error handling: app.js -> routes/_ + middlewares/_ + middlewares/validators* -> authorization -> controllers/* including thrown and next(error) + utils/_ + models/_ + models/plugins/_ + services/_ + templates/\* + server.js -> app.js (app.use(errorHandler))
    - Validate logic: verify ONLY static methods used (NEVER constructor directly)
    - Validate error codes: VALIDATION_ERROR (400), AUTHENTICATION_ERROR (401), AUTHORIZATION_ERROR (403), NOT_FOUND_ERROR (404), CONFLICT_ERROR (409), INTERNAL_SERVER_ERROR (500)
    - Validate context: ensure context object included in all errors
    - Validate isOperational: ensure all CustomErrors have isOperational: true
    - Action: correct/update if needed (document changes)
    - Verification: grep for `new CustomError` (should be ZERO occurrences, only static methods)
    - List all tests to be done:
      - Unit: CustomError.validation() creates correct error
      - Unit: CustomError.authentication() creates correct error
      - Unit: CustomError.authorization() creates correct error
      - Unit: CustomError.notFound() creates correct error
      - Unit: CustomError.conflict() creates correct error
      - Unit: CustomError.internal() creates correct error
      - Unit: ErrorController handles all error types correctly
      - Unit: ErrorController returns correct status codes
      - Property: Any error message and context creates valid CustomError
      - Property: Any CustomError is handled correctly by ErrorController
    - _Requirements: 26.1-26.10, 17.1-17.5_

  - [ ] 30.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - Verify Git status, create branch if needed
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 30.4 Write Unit Tests for Error Handling

    - Create `backend/tests/unit/errorHandler/CustomError.test.js`:
      - Test CustomError.validation() creates error with statusCode 400, errorCode VALIDATION_ERROR
      - Test CustomError.authentication() creates error with statusCode 401, errorCode AUTHENTICATION_ERROR
      - Test CustomError.authorization() creates error with statusCode 403, errorCode AUTHORIZATION_ERROR
      - Test CustomError.notFound() creates error with statusCode 404, errorCode NOT_FOUND_ERROR
      - Test CustomError.conflict() creates error with statusCode 409, errorCode CONFLICT_ERROR
      - Test CustomError.internal() creates error with statusCode 500, errorCode INTERNAL_SERVER_ERROR
      - Test all errors have isOperational: true
      - Test context object is included in all errors
      - Test error message is set correctly
    - Create `backend/tests/unit/errorHandler/ErrorController.test.js`:
      - Test ErrorController handles CustomError correctly
      - Test ErrorController returns correct status code for each error type
      - Test ErrorController returns correct error response format
      - Test ErrorController handles non-CustomError (unexpected errors)
      - Test ErrorController logs errors using Winston
      - Test ErrorController in development vs production mode
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 17.1-17.5_

  - [ ] 30.5 Write Property-Based Tests for Error Handling

    - Create `backend/tests/property/errorHandler.property.test.js`:
      - **Property 4: CustomError Creation**
        - _For any_ error message and context object, CustomError static methods should create valid error with correct properties
        - **Feature: saas-task-manager-mvp, Property 4: CustomError Creation**
        - **Validates: Requirements 17.1, 17.2**
        - Iterations: 100
      - **Property 5: Error Controller Handling**
        - _For any_ CustomError, ErrorController should return response with correct status code and error format
        - **Feature: saas-task-manager-mvp, Property 5: Error Controller Handling**
        - **Validates: Requirements 17.3, 17.4**
        - Iterations: 100
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.6, 25.7, 25.9, 13.1, 13.9_

  - [ ] 30.6 Run Error Handling Tests and Verify Coverage

    - Run unit tests: `npm test -- errorHandler`
    - Run property tests: `npm run test:property -- errorHandler`
    - Generate coverage: `npm run test:coverage -- errorHandler`
    - Verify coverage thresholds met
    - Use timeout: 960 seconds
    - Fix any failing tests (maximum 2 attempts)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ] 30.7 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(errorHandler): Add comprehensive tests for CustomError and ErrorController"`
    - Push to remote and verify sync
    - Update `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 31. Test Utility Functions (utils/\*)

  - [ ] 31.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/utils/logger.js` - Winston configuration
    - Read `backend/utils/helpers.js` - Utility helper functions, dateTransform, convertDatesToUTC
    - Read `backend/utils/generateTokens.js` - JWT token generation
    - Read `backend/utils/validateEnv.js` - Environment variable validation
    - Read `backend/utils/authorizationMatrix.js` - Authorization helper functions
    - Read `backend/utils/responseTransform.js` - Response formatting utilities
    - Read `backend/utils/materialTransform.js` - Material data transformation
    - Read `backend/utils/userStatus.js` - User status tracking utilities
    - Read `backend/utils/dateUtils.js` - Timezone management utilities (toUTC, formatISO, isValidDate, isAfter, etc.)
    - Read `docs/TIMEZONE-MANAGEMENT.md` - Timezone requirements
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 10.1-10.10
    - Document findings: utility patterns, timezone handling (UTC storage), JWT configuration
    - _Requirements: 26.1-26.10, 10.1-10.10_

  - [ ] 31.2 Search, Validation, Action, Verification

    - Pick files: all files in `backend/utils/`
    - For each line: analyze why it's written, logic behind it
    - Search codebase: find all utility function usage
    - Validate dateUtils: verify all dates converted to UTC, toUTC(), toISOString(), isAfter() for date comparison
    - Validate helpers: verify dateTransform converts dates to ISO strings, convertDatesToUTC converts to UTC in pre-save hooks
    - Validate generateTokens: verify JWT_ACCESS_SECRET (15min expiry), JWT_REFRESH_SECRET (7 days expiry)
    - Validate logger: verify Winston configuration (file and console transports)
    - Validate authorizationMatrix: verify scope checks (own, ownDept, crossDept, crossOrg)
    - Action: correct/update if needed (document changes)
    - Verification: run `npm run dev` and check logs, verify timezone is UTC
    - List all tests to be done:
      - Unit: logger writes to file and console
      - Unit: dateUtils toUTC() converts dates to UTC
      - Unit: dateUtils isAfter() compares dates correctly
      - Unit: helpers dateTransform converts dates to ISO strings
      - Unit: helpers convertDatesToUTC converts dates to UTC
      - Unit: generateTokens creates valid JWT tokens
      - Unit: validateEnv validates required environment variables
      - Unit: authorizationMatrix checks permissions correctly
      - Property: Any date converted to UTC and back maintains same instant
      - Property: Any JWT token can be verified
      - Property: Any user/resource/operation returns correct authorization
    - _Requirements: 26.1-26.10, 10.1-10.10_

  - [ ] 31.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - Verify Git status, create branch if needed
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 31.4 Write Unit Tests for Utility Functions

    - Create `backend/tests/unit/utils/logger.test.js`:
      - Test logger writes to file transport
      - Test logger writes to console transport
      - Test logger formats messages correctly
      - Test logger handles different log levels (error, warn, info, debug)
    - Create `backend/tests/unit/utils/dateUtils.test.js`:
      - Test toUTC() converts dates to UTC
      - Test toISOString() returns ISO 8601 string in UTC
      - Test isValidDate() validates dates correctly
      - Test isFutureDate() checks future dates
      - Test isPastDate() checks past dates
      - Test isAfter() compares two dates in UTC
      - Test getCurrentUTC() returns current date in UTC
      - Test addTime() adds time to date
      - Test subtractTime() subtracts time from date
    - Create `backend/tests/unit/utils/helpers.test.js`:
      - Test dateTransform converts dates to ISO strings
      - Test convertDatesToUTC converts dates to UTC in pre-save hooks
      - Test other helper functions
    - Create `backend/tests/unit/utils/generateTokens.test.js`:
      - Test generateAccessToken creates valid JWT with 15min expiry
      - Test generateRefreshToken creates valid JWT with 7 days expiry
      - Test tokens can be verified with correct secret
      - Test tokens include correct payload (userId, role, organization, department)
    - Create `backend/tests/unit/utils/validateEnv.test.js`:
      - Test validates required environment variables
      - Test throws error for missing required variables
    - Create `backend/tests/unit/utils/authorizationMatrix.test.js`:
      - Test checkPermission returns correct boolean for role/resource/operation
      - Test all scope levels (own, ownDept, crossDept, crossOrg)
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 10.1-10.10_

  - [ ] 31.5 Write Property-Based Tests for Utilities

    - Create `backend/tests/property/utils.property.test.js`:
      - **Property 6: Timezone Round Trip**
        - _For any_ date, converting to UTC and back should maintain same instant in time
        - **Feature: saas-task-manager-mvp, Property 6: Timezone Round Trip**
        - **Validates: Requirements 10.2, 10.3**
        - Iterations: 100
      - **Property 7: JWT Token Verification**
        - _For any_ valid payload, generated JWT token should be verifiable with correct secret
        - **Feature: saas-task-manager-mvp, Property 7: JWT Token Verification**
        - **Validates: Requirements 3.2, 3.3**
        - Iterations: 100
      - **Property 8: Authorization Consistency**
        - _For any_ user/resource/operation combination, authorization check should return consistent result
        - **Feature: saas-task-manager-mvp, Property 8: Authorization Consistency**
        - **Validates: Requirements 22.1**
        - Iterations: 100
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.6, 25.7, 25.9, 13.1, 13.4, 13.5, 13.9_

  - [ ] 31.6 Run Utility Tests and Verify Coverage

    - Run unit tests: `npm test -- utils`
    - Run property tests: `npm run test:property -- utils`
    - Generate coverage: `npm run test:coverage -- utils`
    - Verify coverage thresholds met
    - Use timeout: 960 seconds
    - Fix any failing tests (maximum 2 attempts)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ] 31.7 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(utils): Add comprehensive tests for utility functions"`
    - Push to remote and verify sync
    - Update `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 32. Test Middleware (middlewares/\*)

  - [ ] 32.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/middlewares/authMiddleware.js` - JWT verification (verifyJWT, verifyRefreshToken)
    - Read `backend/middlewares/authorization.js` - Role-based authorization
    - Read `backend/middlewares/rateLimiter.js` - Rate limiting (production only)
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 3.5, 11.3, 11.4, 22.1
    - Document findings: JWT verification, authorization scope, rate limiting configuration
    - _Requirements: 26.1-26.10, 3.5, 11.3, 11.4, 22.1_

  - [ ] 32.2 Search, Validation, Action, Verification

    - Pick files: `backend/middlewares/authMiddleware.js`, `authorization.js`, `rateLimiter.js`
    - For each line: analyze why it's written, logic behind it
    - Search codebase: find all middleware usage in routes
    - Validate authMiddleware: verify JWT verification, HTTP-only cookie extraction, user attachment to req.user
    - Validate authorization: verify scope checks (own, ownDept, crossDept, crossOrg), role checks
    - Validate rateLimiter: verify production only, 5/15min for auth endpoints, 100/15min for general endpoints
    - Action: correct/update if needed
    - Verification: test middleware chain in routes
    - List all tests to be done:
      - Unit: verifyJWT extracts and verifies JWT from HTTP-only cookie
      - Unit: verifyJWT attaches user to req.user
      - Unit: verifyJWT rejects invalid tokens
      - Unit: verifyRefreshToken verifies refresh token
      - Unit: authorize checks role/resource/operation permissions
      - Unit: authorize checks ownership (own scope)
      - Unit: authorize checks department scope (ownDept)
      - Unit: authorize checks cross-department scope (crossDept)
      - Unit: authorize checks cross-organization scope (crossOrg)
      - Unit: rateLimiter limits auth endpoints (5/15min)
      - Unit: rateLimiter limits general endpoints (100/15min)
      - Property: Any valid JWT is verified correctly
      - Property: Any user/resource/operation returns correct authorization
    - _Requirements: 26.1-26.10, 3.5, 11.3, 11.4, 22.1_

  - [ ] 32.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - Verify Git status, create branch if needed
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 32.4 Write Unit Tests for Middleware

    - Create `backend/tests/unit/middlewares/authMiddleware.test.js`:
      - Test verifyJWT extracts JWT from HTTP-only cookie (access_token)
      - Test verifyJWT verifies JWT with JWT_ACCESS_SECRET
      - Test verifyJWT attaches user to req.user
      - Test verifyJWT rejects missing token
      - Test verifyJWT rejects invalid token
      - Test verifyJWT rejects expired token
      - Test verifyRefreshToken extracts JWT from HTTP-only cookie (refresh_token)
      - Test verifyRefreshToken verifies JWT with JWT_REFRESH_SECRET
    - Create `backend/tests/unit/middlewares/authorization.test.js`:
      - Test authorize checks Platform SuperAdmin permissions (crossOrg for Organization)
      - Test authorize checks Customer SuperAdmin permissions (crossDept within own org)
      - Test authorize checks Admin permissions (crossDept within own org)
      - Test authorize checks Manager permissions (ownDept)
      - Test authorize checks User permissions (own for write, ownDept for read)
      - Test authorize checks ownership (createdBy, assignees, watchers, mentions, uploadedBy, addedBy)
      - Test authorize rejects unauthorized access
      - Test authorize allows authorized access
    - Create `backend/tests/unit/middlewares/rateLimiter.test.js`:
      - Test rate limiter limits auth endpoints (5 requests per 15 minutes)
      - Test rate limiter limits general endpoints (100 requests per 15 minutes)
      - Test rate limiter only applies in production
      - Test rate limiter returns correct headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
      - Test rate limiter returns 429 when limit exceeded
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 3.5, 11.3, 11.4, 22.1_

  - [ ] 32.5 Write Property-Based Tests for Middleware

    - Create `backend/tests/property/middlewares.property.test.js`:
      - **Property 9: JWT Verification**
        - _For any_ valid JWT token, verifyJWT should successfully verify and attach user to req.user
        - **Feature: saas-task-manager-mvp, Property 9: JWT Verification**
        - **Validates: Requirements 3.5**
        - Iterations: 100
      - **Property 10: Authorization Scope**
        - _For any_ user/resource/operation combination, authorize should return correct permission based on scope
        - **Feature: saas-task-manager-mvp, Property 10: Authorization Scope**
        - **Validates: Requirements 22.1**
        - Iterations: 100
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.6, 25.7, 25.9, 13.1, 13.5, 13.9_

  - [ ] 32.6 Run Middleware Tests and Verify Coverage

    - Run unit tests: `npm test -- middlewares`
    - Run property tests: `npm run test:property -- middlewares`
    - Generate coverage: `npm run test:coverage -- middlewares`
    - Verify coverage thresholds met
    - Use timeout: 960 seconds
    - Fix any failing tests (maximum 2 attempts)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ] 32.7 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(middlewares): Add comprehensive tests for auth, authorization, and rate limiter"`
    - Push to remote and verify sync
    - Update `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 33. Test Validators (middlewares/validators/\*)

  - [ ] 33.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read all validator files in `backend/middlewares/validators/`
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 18.1-18.9
    - Document findings: validation rules, uniqueness checks with withDeleted(), field constraints
    - _Requirements: 26.1-26.10, 18.1-18.9_

  - [ ] 33.2 Search, Validation, Action, Verification

    - Pick files: all validator files
    - For each line: analyze validation rules
    - Search codebase: find all validator usage in routes
    - Validate: verify all validators use express-validator, check uniqueness with withDeleted(), validate field constraints (max length, min/max values, patterns)
    - Action: correct/update if needed
    - Verification: test validators with valid and invalid data
    - List all tests to be done:
      - Unit: Each validator accepts valid data
      - Unit: Each validator rejects invalid data
      - Unit: Uniqueness checks use withDeleted()
      - Unit: Field constraints enforced (max length, min/max values, patterns)
      - Property: Any valid data passes validation
      - Property: Any invalid data fails validation
    - _Requirements: 26.1-26.10, 18.1-18.9_

  - [ ] 33.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - Verify Git status, create branch if needed
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 33.4 Write Unit Tests for Validators

    - Create unit tests for each validator file:
      - `backend/tests/unit/middlewares/validators/authValidators.test.js`
      - `backend/tests/unit/middlewares/validators/organizationValidators.test.js`
      - `backend/tests/unit/middlewares/validators/departmentValidators.test.js`
      - `backend/tests/unit/middlewares/validators/userValidators.test.js`
      - `backend/tests/unit/middlewares/validators/vendorValidators.test.js`
      - `backend/tests/unit/middlewares/validators/materialValidators.test.js`
      - `backend/tests/unit/middlewares/validators/taskValidators.test.js`
      - `backend/tests/unit/middlewares/validators/taskActivityValidators.test.js`
      - `backend/tests/unit/middlewares/validators/taskCommentValidators.test.js`
      - `backend/tests/unit/middlewares/validators/attachmentValidators.test.js`
      - `backend/tests/unit/middlewares/validators/notificationValidators.test.js`
    - For each validator, test:
      - Valid data passes validation
      - Invalid data fails validation
      - Uniqueness checks use withDeleted()
      - Field constraints enforced (max length, min/max values, patterns, enums)
      - Required fields validated
      - Optional fields validated when present
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 18.1-18.9_

  - [ ] 33.5 Write Property-Based Tests for Validators

    - Create `backend/tests/property/validators.property.test.js`:
      - **Property 11: Validation Consistency**
        - _For any_ valid data matching schema, validators should pass
        - **Feature: saas-task-manager-mvp, Property 11: Validation Consistency**
        - **Validates: Requirements 18.1, 18.2**
        - Iterations: 100
      - **Property 12: Uniqueness Check with Soft Delete**
        - _For any_ resource, uniqueness checks should include soft-deleted records using withDeleted()
        - **Feature: saas-task-manager-mvp, Property 12: Uniqueness Check with Soft Delete**
        - **Validates: Requirements 18.3, 7.3**
        - Iterations: 100
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.6, 25.7, 25.9, 13.1, 13.8, 13.9_

  - [ ] 33.6 Run Validator Tests and Verify Coverage

    - Run unit tests: `npm test -- validators`
    - Run property tests: `npm run test:property -- validators`
    - Generate coverage: `npm run test:coverage -- validators`
    - Verify coverage thresholds met
    - Use timeout: 960 seconds
    - Fix any failing tests (maximum 2 attempts)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ] 33.7 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(validators): Add comprehensive tests for all validators"`
    - Push to remote and verify sync
    - Update `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 34. Test Services (services/_, templates/_)

  - [ ] 34.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/services/emailService.js` - Nodemailer, Gmail SMTP, queue-based email sending
    - Read `backend/services/notificationService.js` - Notification creation and management
    - Read `backend/templates/emailTemplates.js` - HTML email templates
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 14.1-14.6
    - Document findings: email configuration, queue-based sending, notification types
    - _Requirements: 26.1-26.10, 14.1-14.6_

  - [ ] 34.2 Search, Validation, Action, Verification

    - Pick files: `backend/services/emailService.js`, `notificationService.js`, `templates/emailTemplates.js`
    - For each line: analyze email sending logic, notification creation
    - Search codebase: find all service usage
    - Validate emailService: verify Nodemailer configuration, Gmail SMTP, queue-based sending, error handling (log but don't throw)
    - Validate notificationService: verify notification creation with session support, notification types
    - Validate emailTemplates: verify HTML templates (welcome, password reset, notifications)
    - Action: correct/update if needed
    - Verification: test email sending (mock SMTP), notification creation
    - List all tests to be done:
      - Unit: emailService sends welcome email
      - Unit: emailService sends password reset email
      - Unit: emailService sends notification email
      - Unit: emailService handles errors gracefully (logs but doesn't throw)
      - Unit: notificationService creates notification with correct type
      - Unit: notificationService supports session for transactions
      - Unit: emailTemplates generate correct HTML
      - Property: Any email data generates valid email
      - Property: Any notification data creates valid notification
    - _Requirements: 26.1-26.10, 14.1-14.6_

  - [ ] 34.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - Verify Git status, create branch if needed
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 34.4 Write Unit Tests for Services

    - Create `backend/tests/unit/services/emailService.test.js`:
      - Test sendEmail sends email via Nodemailer
      - Test sendWelcomeEmail sends welcome email with correct template
      - Test sendPasswordResetEmail sends reset email with token
      - Test sendNotificationEmail sends notification email
      - Test email service handles errors gracefully (logs but doesn't throw)
      - Test email service uses queue-based sending (async)
      - Mock Nodemailer transport for testing
    - Create `backend/tests/unit/services/notificationService.test.js`:
      - Test createNotification creates notification with correct type
      - Test createNotification supports session for transactions
      - Test notifyTaskCreated creates notification for task creation
      - Test notifyMention creates notification for mention
      - Test notification expiry (30 days default)
    - Create `backend/tests/unit/templates/emailTemplates.test.js`:
      - Test welcome email template generates correct HTML
      - Test password reset email template generates correct HTML
      - Test notification email template generates correct HTML
      - Test templates include correct variables (user name, links, etc.)
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 14.1-14.6_

  - [ ] 34.5 Write Property-Based Tests for Services

    - Create `backend/tests/property/services.property.test.js`:
      - **Property 13: Email Generation**
        - _For any_ valid email data, email service should generate valid email
        - **Feature: saas-task-manager-mvp, Property 13: Email Generation**
        - **Validates: Requirements 14.1, 14.2**
        - Iterations: 100
      - **Property 14: Notification Creation**
        - _For any_ valid notification data, notification service should create valid notification
        - **Feature: saas-task-manager-mvp, Property 14: Notification Creation**
        - **Validates: Requirements 21.1, 21.2**
        - Iterations: 100
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.6, 25.7, 25.9, 13.1, 13.9_

  - [ ] 34.6 Run Service Tests and Verify Coverage

    - Run unit tests: `npm test -- services`
    - Run property tests: `npm run test:property -- services`
    - Generate coverage: `npm run test:coverage -- services`
    - Verify coverage thresholds met
    - Use timeout: 960 seconds
    - Fix any failing tests (maximum 2 attempts)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ] 34.7 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(services): Add comprehensive tests for email and notification services"`
    - Push to remote and verify sync
    - Update `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 35. Test Socket.IO Infrastructure (utils/socket\*, utils/socketInstance.js, utils/socketEmitter.js)

  - [ ] 35.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/utils/socketInstance.js` - Socket.IO singleton pattern
    - Read `backend/utils/socket.js` - Socket.IO event handlers (connection, disconnection, rooms)
    - Read `backend/utils/socketEmitter.js` - Socket.IO event emitters
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 8.1-8.9
    - Document findings: Socket.IO configuration, room management, event emission
    - _Requirements: 26.1-26.10, 8.1-8.9_

  - [ ] 35.2 Search, Validation, Action, Verification

    - Pick files: `backend/utils/socketInstance.js`, `socket.js`, `socketEmitter.js`
    - For each line: analyze Socket.IO setup, room management, event emission
    - Search codebase: find all Socket.IO usage in controllers
    - Validate socketInstance: verify singleton pattern, initialization with HTTP server
    - Validate socket: verify connection handling, room joining (user:${userId}, department:${departmentId}, organization:${organizationId}), disconnection handling
    - Validate socketEmitter: verify event emission to rooms (emitToRooms, emitTaskEvent, emitNotificationEvent)
    - Action: correct/update if needed
    - Verification: test Socket.IO connection, room joining, event emission
    - List all tests to be done:
      - Unit: socketInstance initializes Socket.IO server
      - Unit: socketInstance returns same instance (singleton)
      - Unit: socket handles connection
      - Unit: socket joins rooms (user, department, organization)
      - Unit: socket handles disconnection
      - Unit: socket updates user status (online/offline)
      - Unit: socketEmitter emits events to rooms
      - Unit: socketEmitter emits task events
      - Unit: socketEmitter emits notification events
      - Property: Any event is emitted to correct rooms
      - Property: Any user connection joins correct rooms
    - _Requirements: 26.1-26.10, 8.1-8.9_

  - [ ] 35.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - Verify Git status, create branch if needed
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 35.4 Write Unit Tests for Socket.IO

    - Create `backend/tests/unit/utils/socketInstance.test.js`:
      - Test initializeSocket creates Socket.IO server
      - Test getIO returns same instance (singleton)
      - Test Socket.IO server configured with CORS
    - Create `backend/tests/unit/utils/socket.test.js`:
      - Test connection handler joins user to rooms (user:${userId}, department:${departmentId}, organization:${organizationId})
      - Test connection handler updates user status to Online
      - Test disconnection handler updates user status to Offline
      - Test disconnection handler leaves all rooms
      - Test disconnection handler emits user:offline event
    - Create `backend/tests/unit/utils/socketEmitter.test.js`:
      - Test emitToRooms emits event to specified rooms
      - Test emitTaskEvent emits task:created event to department and organization rooms
      - Test emitTaskEvent emits task:updated event to department and organization rooms
      - Test emitNotificationEvent emits notification:created event to user room
    - Use Socket.IO client for testing
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 8.1-8.9_

  - [ ] 35.5 Write Property-Based Tests for Socket.IO

    - Create `backend/tests/property/socket.property.test.js`:
      - **Property 15: Room Joining**
        - _For any_ user connection, user should join correct rooms (user, department, organization)
        - **Feature: saas-task-manager-mvp, Property 15: Room Joining**
        - **Validates: Requirements 8.1**
        - Iterations: 100
      - **Property 16: Event Emission**
        - _For any_ event and rooms, event should be emitted to all specified rooms
        - **Feature: saas-task-manager-mvp, Property 16: Event Emission**
        - **Validates: Requirements 8.2, 8.3, 8.4, 8.7**
        - Iterations: 100
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.6, 25.7, 25.9, 13.1, 13.9_

  - [ ] 35.6 Run Socket.IO Tests and Verify Coverage

    - Run unit tests: `npm test -- socket`
    - Run property tests: `npm run test:property -- socket`
    - Generate coverage: `npm run test:coverage -- socket`
    - Verify coverage thresholds met
    - Use timeout: 960 seconds
    - Fix any failing tests (maximum 2 attempts)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ] 35.7 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(socket): Add comprehensive tests for Socket.IO infrastructure"`
    - Push to remote and verify sync
    - Update `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 36. Test Soft Delete Plugin (models/plugins/softDelete.js) - CRITICAL

  - [ ] 36.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/models/plugins/softDelete.js` - Universal soft delete functionality
    - Read `docs/softDelete-doc.md` - Complete soft delete policy, cascade operations, TTL
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 7.1-7.9
    - Document findings: soft delete fields, query helpers, instance/static methods, TTL configuration, cascade operations
    - _Requirements: 26.1-26.10, 7.1-7.9_

  - [ ] 36.2 Search, Validation, Action, Verification

    - Pick file: `backend/models/plugins/softDelete.js`
    - For each line: analyze soft delete logic, cascade operations, TTL configuration
    - Search codebase: find all models using softDeletePlugin
    - Validate: verify all models apply plugin, verify query helpers (withDeleted, onlyDeleted), verify instance methods (softDelete, restore), verify static methods (softDeleteById, softDeleteMany, restoreById, restoreMany, findDeletedByIds, countDeleted, ensureTTLIndex, getRestoreAudit)
    - Validate: verify automatic filtering (isDeleted: false), verify hard delete protection (deleteOne, deleteMany, findOneAndDelete, remove blocked)
    - Validate: verify TTL configuration (Users 365d, Tasks 180d, Activities 90d, Comments 90d, Departments 365d, Materials 180d, Vendors 180d, Attachments 90d, Notifications 30d, Organizations never)
    - Action: correct/update if needed
    - Verification: test soft delete, restore, cascade operations, TTL
    - List all tests to be done:
      - Unit: softDelete sets isDeleted: true, deletedAt, deletedBy
      - Unit: restore sets isDeleted: false, restoredAt, restoredBy
      - Unit: withDeleted() includes soft-deleted documents
      - Unit: onlyDeleted() returns only soft-deleted documents
      - Unit: find() excludes soft-deleted documents by default
      - Unit: softDeleteById soft deletes by ID
      - Unit: softDeleteMany soft deletes multiple documents
      - Unit: restoreById restores by ID
      - Unit: restoreMany restores multiple documents
      - Unit: Hard delete operations blocked (deleteOne, deleteMany, findOneAndDelete, remove)
      - Unit: TTL index configured correctly for each model
      - Property: Any document soft-deleted is excluded from normal queries
      - Property: Any document soft-deleted can be restored
      - Property: Any parent soft-deleted cascades to all children
    - _Requirements: 26.1-26.10, 7.1-7.9_

  - [ ] 36.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - Verify Git status, create branch if needed
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 36.4 Write Unit Tests for Soft Delete Plugin

    - Create `backend/tests/unit/models/plugins/softDelete.test.js`:
      - Test softDelete() sets isDeleted: true, deletedAt, deletedBy
      - Test softDelete() increments \_\_v version field
      - Test restore() sets isDeleted: false, restoredAt, restoredBy
      - Test restore() clears deletedAt and deletedBy
      - Test restore() increments \_\_v version field
      - Test withDeleted() includes soft-deleted documents
      - Test onlyDeleted() returns only soft-deleted documents
      - Test find() excludes soft-deleted documents by default
      - Test softDeleteById() soft deletes document by ID
      - Test softDeleteMany() soft deletes multiple documents
      - Test restoreById() restores document by ID
      - Test restoreMany() restores multiple documents
      - Test findDeletedByIds() finds soft-deleted documents
      - Test countDeleted() counts soft-deleted documents
      - Test ensureTTLIndex() creates TTL index
      - Test getRestoreAudit() returns restore audit trail
      - Test hard delete operations blocked (deleteOne throws error)
      - Test hard delete operations blocked (deleteMany throws error)
      - Test hard delete operations blocked (findOneAndDelete throws error)
      - Test hard delete operations blocked (remove throws error)
      - Test idempotent soft delete (doesn't overwrite deletedBy/deletedAt if already deleted)
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 7.1-7.9_

  - [ ] 36.5 Write Property-Based Tests for Soft Delete Plugin

    - Create `backend/tests/property/softDelete.property.test.js`:
      - **Property 17: Soft Delete Exclusion**
        - _For any_ resource query without withDeleted(), all returned results should have isDeleted: false
        - **Feature: saas-task-manager-mvp, Property 17: Soft Delete Exclusion**
        - **Validates: Requirements 7.3**
        - Iterations: 100
      - **Property 18: Soft Delete Cascade**
        - _For any_ parent resource with child resources, soft-deleting parent should result in all children having isDeleted: true
        - **Feature: saas-task-manager-mvp, Property 18: Soft Delete Cascade**
        - **Validates: Requirements 7.2**
        - Iterations: 100
      - **Property 19: Soft Delete Field Setting**
        - _For any_ resource soft-deletion, resource should have isDeleted: true, deletedAt set, deletedBy set
        - **Feature: saas-task-manager-mvp, Property 19: Soft Delete Field Setting**
        - **Validates: Requirements 7.1**
        - Iterations: 100
      - **Property 20: Restore Field Setting**
        - _For any_ resource restoration, resource should have isDeleted: false, restoredAt set, restoredBy set
        - **Feature: saas-task-manager-mvp, Property 20: Restore Field Setting**
        - **Validates: Requirements 7.5**
        - Iterations: 100
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.6, 25.7, 25.9, 13.1, 13.2, 13.3, 13.9_

  - [ ] 36.6 Run Soft Delete Plugin Tests and Verify Coverage

    - Run unit tests: `npm test -- softDelete`
    - Run property tests: `npm run test:property -- softDelete`
    - Generate coverage: `npm run test:coverage -- softDelete`
    - Verify coverage thresholds met
    - Use timeout: 960 seconds
    - Fix any failing tests (maximum 2 attempts)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ] 36.7 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(softDelete): Add comprehensive tests for soft delete plugin"`
    - Push to remote and verify sync
    - Update `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 37. Test App and Server Configuration (app.js, server.js)

  - [ ] 37.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/app.js` - Express app setup, security middleware order
    - Read `backend/server.js` - HTTP server creation, Socket.IO initialization, graceful shutdown
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 10.1, 11.1, 11.2
    - Document findings: middleware order, security configuration, server startup, graceful shutdown
    - _Requirements: 26.1-26.10, 10.1, 11.1, 11.2_

  - [ ] 37.2 Search, Validation, Action, Verification

    - Pick files: `backend/app.js`, `server.js`
    - For each line: analyze middleware order, server configuration
    - Search codebase: verify middleware order (helmet, cors, cookieParser, express.json, mongoSanitize, compression, rateLimiter)
    - Validate app.js: verify security middleware order, verify error handling middleware, verify static file serving for production, verify process.env.TZ = 'UTC'
    - Validate server.js: verify HTTP server creation, verify Socket.IO initialization, verify database connection with retry logic, verify graceful shutdown, verify UTC timezone console.log
    - Action: correct/update if needed
    - Verification: run `npm run dev` and verify server starts correctly
    - List all tests to be done:
      - Unit: app.js applies security middleware in correct order
      - Unit: app.js applies error handling middleware
      - Unit: app.js serves static files in production
      - Unit: server.js creates HTTP server
      - Unit: server.js initializes Socket.IO
      - Unit: server.js connects to database with retry logic
      - Unit: server.js handles graceful shutdown
      - Unit: server.js sets timezone to UTC
      - Property: Any request goes through middleware in correct order
    - _Requirements: 26.1-26.10, 10.1, 11.1, 11.2_

  - [ ] 37.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - Verify Git status, create branch if needed
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 37.4 Write Unit Tests for App and Server

    - Create `backend/tests/unit/app.test.js`:
      - Test app applies helmet middleware
      - Test app applies cors middleware
      - Test app applies cookieParser middleware
      - Test app applies express.json middleware (10mb limit)
      - Test app applies mongoSanitize middleware
      - Test app applies compression middleware
      - Test app applies rateLimiter middleware (production only)
      - Test app applies error handling middleware
      - Test app serves static files in production
      - Test middleware order is correct
    - Create `backend/tests/unit/server.test.js`:
      - Test server creates HTTP server
      - Test server initializes Socket.IO
      - Test server connects to database
      - Test server retries database connection on failure (3 attempts)
      - Test server handles graceful shutdown (SIGTERM, SIGINT)
      - Test server sets timezone to UTC (process.env.TZ = 'UTC')
      - Test server logs UTC timezone verification
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.3, 10.1, 11.1, 11.2_

  - [ ] 37.5 Write Property-Based Tests for App and Server

    - Create `backend/tests/property/app.property.test.js`:
      - **Property 21: Middleware Order**
        - _For any_ request, middleware should be applied in correct order (helmet → cors → cookieParser → express.json → mongoSanitize → compression → rateLimiter)
        - **Feature: saas-task-manager-mvp, Property 21: Middleware Order**
        - **Validates: Requirements 11.1**
        - Iterations: 100
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1, 25.2, 25.6, 25.7, 25.9, 13.1, 13.9_

  - [ ] 37.6 Run App and Server Tests and Verify Coverage

    - Run unit tests: `npm test -- app server`
    - Run property tests: `npm run test:property -- app`
    - Generate coverage: `npm run test:coverage -- app server`
    - Verify coverage thresholds met
    - Use timeout: 960 seconds
    - Fix any failing tests (maximum 2 attempts)
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ] 37.7 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(app/server): Add comprehensive tests for app and server configuration"`
    - Push to remote and verify sync
    - Update `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

### Phase 4.3: Test Phase 2 - Backend Models (In Dependency Order)

- [ ] 38. Test Organization, Department, User Models (Core Models)

  - [ ] 38.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/models/Organization.js`, `Department.js`, `User.js`
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 1.1-1.8, 2.1-2.9, 3.1-3.10
    - Read `docs/softDelete-doc.md` - Cascade operations for Organization → Department → User
    - Document findings: schema fields, indexes, virtuals, instance methods, cascade delete, TTL configuration
    - _Requirements: 26.1-26.10, 1.1-1.8, 2.1-2.9, 3.1-3.10_

  - [ ] 38.2 Search, Validation, Action, Verification

    - Pick files: Organization.js, Department.js, User.js
    - For each line: analyze schema definition, validation rules, hooks, methods
    - Search codebase: find all model usage in controllers
    - Validate Organization: isPlatformOrg (immutable), unique name/email/phone (partial index), cascade delete to all children, TTL: never
    - Validate Department: unique {organization, name}, hod reference, cascade delete to Users/Tasks/Materials, TTL: 365 days
    - Validate User: unique {organization, email}, unique {organization, employeeId}, unique {department} for HOD, isHod auto-set, isPlatformUser auto-set, password hashing (≥12 rounds), instance methods (comparePassword, generatePasswordResetToken, verifyPasswordResetToken, clearPasswordResetToken), cascade delete, TTL: 365 days
    - Action: correct/update if needed
    - Verification: test model creation, validation, hooks, methods
    - List all tests to be done:
      - Unit: Organization schema validation, unique constraints, isPlatformOrg immutable, cascade delete
      - Unit: Department schema validation, unique constraints, hod validation, cascade delete
      - Unit: User schema validation, unique constraints, password hashing, isHod auto-set, isPlatformUser auto-set, instance methods, cascade delete
      - Property: Any organization data creates valid organization
      - Property: Any department data creates valid department
      - Property: Any user data creates valid user with correct password hash
      - Property: HOD auto-assignment (SuperAdmin/Admin → isHod: true, Manager/User → isHod: false)
      - Property: Platform organization cannot be deleted
      - Property: Cascade delete works for Organization → Department → User
    - _Requirements: 26.1-26.10, 1.1-1.8, 2.1-2.9, 3.1-3.10_

  - [ ] 38.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - Verify Git status, create branch if needed
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 38.4 Write Unit and Property Tests for Core Models

    - Create comprehensive unit tests for Organization, Department, User models
    - Create property-based tests for core models
    - Test all schema validations, hooks, methods, cascade operations
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1-25.10, 13.1-13.9, 1.1-1.8, 2.1-2.9, 3.1-3.10_

  - [ ] 38.5 Run Core Model Tests and Verify Coverage

    - Run unit tests: `npm test -- models/Organization models/Department models/User`
    - Run property tests: `npm run test:property -- models`
    - Generate coverage: `npm run test:coverage -- models`
    - Verify coverage thresholds met
    - Use timeout: 960 seconds
    - Fix any failing tests (maximum 2 attempts)
    - _Requirements: 25.1-25.5_

  - [ ] 38.6 Post-Test Phase Tracking and Git Workflow
    - Commit changes: `git add . && git commit -m "test(models): Add comprehensive tests for Organization, Department, User models"`
    - Push to remote and verify sync
    - Update `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 39. Test Vendor and Material Models

  - [ ] 39.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/models/Vendor.js`, `Material.js`
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 9.1-9.9
    - Document findings: schema fields, indexes, validation, TTL configuration
    - _Requirements: 26.1-26.10, 9.1-9.9_

  - [ ] 39.2 Search, Validation, Action, Verification

    - Pick files: Vendor.js, Material.js
    - Analyze schema, validation, usage in controllers
    - Validate Vendor: organization reference (NOT department-specific), deletion requires ProjectTask reassignment, TTL: 180 days
    - Validate Material: department reference, category enum, unitType enum, price validation, TTL: 180 days
    - Action: correct/update if needed
    - List all tests to be done:
      - Unit: Vendor schema validation, organization reference, deletion protection
      - Unit: Material schema validation, category/unitType enums, price validation
      - Property: Any vendor data creates valid vendor
      - Property: Any material data creates valid material
    - _Requirements: 26.1-26.10, 9.1-9.9_

  - [ ] 39.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 39.4 Write Unit and Property Tests for Vendor and Material Models

    - Create comprehensive tests
    - Use timeout: 960 seconds
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1-25.10, 13.1-13.9, 9.1-9.9_

  - [ ] 39.5 Run Tests and Verify Coverage

    - Run tests and verify coverage
    - Use timeout: 960 seconds
    - _Requirements: 25.1-25.5_

  - [ ] 39.6 Post-Test Phase Tracking and Git Workflow
    - Commit, push, update tracker
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 40. Test Task Models (BaseTask, ProjectTask, RoutineTask, AssignedTask)

  - [ ] 40.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/models/BaseTask.js`, `ProjectTask.js`, `RoutineTask.js`, `AssignedTask.js`
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 4.1-4.9, 5.1-5.9, 6.1-6.9
    - Document findings: discriminator pattern, task type-specific fields, validation, cascade delete, TTL: 180 days
    - _Requirements: 26.1-26.10, 4.1-4.9, 5.1-5.9, 6.1-6.9_

  - [ ] 40.2 Search, Validation, Action, Verification

    - Pick files: BaseTask.js, ProjectTask.js, RoutineTask.js, AssignedTask.js
    - Analyze discriminator pattern, task type-specific validation
    - Validate BaseTask: common fields (description, status, priority, organization, department, createdBy, attachments, watchers, tags)
    - Validate ProjectTask: vendor required, watchers HOD only, materials via TaskActivity, all statuses/priorities allowed
    - Validate RoutineTask: materials direct, startDate/dueDate required (not future), status NOT "To Do", priority NOT "Low", NO TaskActivity
    - Validate AssignedTask: assignees required, materials via TaskActivity, all statuses/priorities allowed
    - Action: correct/update if needed
    - List all tests to be done:
      - Unit: BaseTask schema validation, common fields
      - Unit: ProjectTask discriminator, vendor required, watchers HOD validation
      - Unit: RoutineTask discriminator, materials direct, status/priority restrictions, dates not future
      - Unit: AssignedTask discriminator, assignees required
      - Property: ProjectTask watchers are all HOD users
      - Property: RoutineTask status is NOT "To Do"
      - Property: RoutineTask priority is NOT "Low"
      - Property: AssignedTask has at least one assignee
    - _Requirements: 26.1-26.10, 4.1-4.9, 5.1-5.9, 6.1-6.9_

  - [ ] 40.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 40.4 Write Unit and Property Tests for Task Models

    - Create comprehensive tests for all task types
    - Use timeout: 960 seconds
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1-25.10, 13.1-13.9, 4.1-4.9, 5.1-5.9, 6.1-6.9_

  - [ ] 40.5 Run Tests and Verify Coverage

    - Run tests and verify coverage
    - Use timeout: 960 seconds
    - _Requirements: 25.1-25.5_

  - [ ] 40.6 Post-Test Phase Tracking and Git Workflow
    - Commit, push, update tracker
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 41. Test TaskActivity, TaskComment, Attachment, Notification Models

  - [ ] 41.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/models/TaskActivity.js`, `TaskComment.js`, `Attachment.js`, `Notification.js`
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 19.1-19.10, 20.1-20.10, 21.1-21.10
    - Document findings: parent references, cascade delete, TTL configuration
    - _Requirements: 26.1-26.10, 19.1-19.10, 20.1-20.10, 21.1-21.10_

  - [ ] 41.2 Search, Validation, Action, Verification

    - Pick files: TaskActivity.js, TaskComment.js, Attachment.js, Notification.js
    - Analyze parent references, validation, cascade operations
    - Validate TaskActivity: parent ProjectTask or AssignedTask ONLY (NOT RoutineTask), materials array, TTL: 90 days
    - Validate TaskComment: parent Task/TaskActivity/TaskComment, max depth 3 levels, mentions array, recursive cascade delete, TTL: 90 days
    - Validate Attachment: parent Task/TaskActivity/TaskComment, file type/size validation, TTL: 90 days
    - Validate Notification: recipient, type enum, expiresAt (30 days default), TTL: 30 days
    - Action: correct/update if needed
    - List all tests to be done:
      - Unit: TaskActivity parent validation (NOT RoutineTask)
      - Unit: TaskComment max depth 3 levels, recursive cascade delete
      - Unit: Attachment file type/size validation
      - Unit: Notification type enum, expiry
      - Property: TaskActivity parent is ProjectTask or AssignedTask
      - Property: TaskComment depth never exceeds 3 levels
      - Property: Attachment file size within limits
    - _Requirements: 26.1-26.10, 19.1-19.10, 20.1-20.10, 21.1-21.10_

  - [ ] 41.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 41.4 Write Unit and Property Tests

    - Create comprehensive tests
    - Use timeout: 960 seconds
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1-25.10, 13.1-13.9, 19.1-19.10, 20.1-20.10, 21.1-21.10_

  - [ ] 41.5 Run Tests and Verify Coverage

    - Run tests and verify coverage
    - Use timeout: 960 seconds
    - _Requirements: 25.1-25.5_

  - [ ] 41.6 Post-Test Phase Tracking and Git Workflow
    - Commit, push, update tracker
    - _Requirements: 23.1-23.10, 24.1-24.10_

### Phase 4.4: Test Phase 3 - Backend Routes, Validators, and Controllers (By Resource)

- [ ] 42. Test Authentication (Routes, Validators, Controllers)

  - [ ] 42.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read `backend/routes/authRoutes.js`, `middlewares/validators/authValidators.js`, `controllers/authControllers.js`
    - Read `.kiro/specs/saas-task-manager-mvp/requirements.md` - Requirements 3.1-3.4, 3.9-3.10
    - Document findings: routes, validation rules, controller logic, JWT tokens, HTTP-only cookies
    - _Requirements: 26.1-26.10, 3.1-3.4, 3.9-3.10_

  - [ ] 42.2 Search, Validation, Action, Verification

    - Pick files: authRoutes.js, authValidators.js, authControllers.js
    - Analyze routes, validators, controllers
    - Validate routes: POST /register, POST /login, DELETE /logout, GET /refresh-token, POST /forgot-password, POST /reset-password
    - Validate validators: registerValidator (organization, department, user with uniqueness checks using withDeleted()), loginValidator, forgotPasswordValidator, resetPasswordValidator
    - Validate controllers: register (transaction, welcome email, Socket.IO events), login (JWT tokens, HTTP-only cookies, lastLogin update, user:online event), logout (clear cookies, user:offline event), refreshToken (token rotation), forgotPassword (generate token, send email), resetPassword (verify token, update password, send confirmation)
    - Action: correct/update if needed
    - List all tests to be done:
      - Unit: All auth routes defined correctly
      - Unit: All validators validate correctly
      - Unit: register creates organization, department, user in transaction
      - Unit: login generates JWT tokens, sets HTTP-only cookies
      - Unit: logout clears cookies, updates status to Offline
      - Unit: refreshToken rotates tokens
      - Unit: forgotPassword generates reset token, sends email
      - Unit: resetPassword verifies token, updates password
      - Integration: Full auth flow (register → login → refresh → logout)
      - Property: Any valid registration data creates organization, department, user
      - Property: Any valid login credentials generate valid JWT tokens
    - _Requirements: 26.1-26.10, 3.1-3.4, 3.9-3.10_

  - [ ] 42.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry to `docs/test-phase-tracker.md`
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 42.4 Write Unit, Integration, and Property Tests for Authentication

    - Create comprehensive tests for routes, validators, controllers
    - Use supertest for integration tests
    - Use timeout: 960 seconds
    - Fix any failing tests, never skip failed test
    - _Requirements: 25.1-25.10, 13.1-13.9, 3.1-3.4, 3.9-3.10_

  - [ ] 42.5 Run Tests and Verify Coverage

    - Run tests and verify coverage
    - Use timeout: 960 seconds
    - _Requirements: 25.1-25.5_

  - [ ] 42.6 Post-Test Phase Tracking and Git Workflow
    - Commit, push, update tracker
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 43. Test Organization (Routes, Validators, Controllers)

  - [ ] 43.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read routes/organizationRoutes.js, validators/organizationValidators.js, controllers/organizationControllers.js
    - Read requirements 1.1-1.8
    - Document findings
    - _Requirements: 26.1-26.10, 1.1-1.8_

  - [ ] 43.2 Search, Validation, Action, Verification

    - Analyze routes, validators, controllers
    - Validate CRUD operations, authorization, cascade delete, Platform organization protection
    - List all tests to be done
    - _Requirements: 26.1-26.10, 1.1-1.8_

  - [ ] 43.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 43.4 Write Unit, Integration, and Property Tests

    - Create comprehensive tests
    - Use timeout: 960 seconds
    - Fix any failing tests
    - _Requirements: 25.1-25.10, 13.1-13.9, 1.1-1.8_

  - [ ] 43.5 Run Tests and Verify Coverage

    - Run tests, verify coverage
    - Use timeout: 960 seconds
    - _Requirements: 25.1-25.5_

  - [ ] 43.6 Post-Test Phase Tracking and Git Workflow
    - Commit, push, update tracker
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 44. Test Department, User, Vendor, Material (Routes, Validators, Controllers)

  - [ ] 44.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read routes, validators, controllers for Department, User, Vendor, Material
    - Read requirements 2.1-2.9, 3.5-3.8, 9.1-9.9
    - Document findings
    - _Requirements: 26.1-26.10, 2.1-2.9, 3.5-3.8, 9.1-9.9_

  - [ ] 44.2 Search, Validation, Action, Verification

    - Analyze all routes, validators, controllers
    - Validate CRUD operations, authorization, cascade delete, HOD constraints, deletion protection
    - List all tests to be done
    - _Requirements: 26.1-26.10, 2.1-2.9, 3.5-3.8, 9.1-9.9_

  - [ ] 44.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 44.4 Write Unit, Integration, and Property Tests

    - Create comprehensive tests for all resources
    - Use timeout: 960 seconds
    - Fix any failing tests
    - _Requirements: 25.1-25.10, 13.1-13.9, 2.1-2.9, 3.5-3.8, 9.1-9.9_

  - [ ] 44.5 Run Tests and Verify Coverage

    - Run tests, verify coverage
    - Use timeout: 960 seconds
    - _Requirements: 25.1-25.5_

  - [ ] 44.6 Post-Test Phase Tracking and Git Workflow
    - Commit, push, update tracker
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 45. Test Task (All Types), TaskActivity, TaskComment (Routes, Validators, Controllers)

  - [ ] 45.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read routes, validators, controllers for Task, TaskActivity, TaskComment
    - Read requirements 4.1-4.9, 5.1-5.9, 6.1-6.9, 19.1-19.10
    - Document findings
    - _Requirements: 26.1-26.10, 4.1-4.9, 5.1-5.9, 6.1-6.9, 19.1-19.10_

  - [ ] 45.2 Search, Validation, Action, Verification

    - Analyze all routes, validators, controllers
    - Validate task type-specific logic, cascade delete, notifications, Socket.IO events
    - List all tests to be done
    - _Requirements: 26.1-26.10, 4.1-4.9, 5.1-5.9, 6.1-6.9, 19.1-19.10_

  - [ ] 45.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 45.4 Write Unit, Integration, and Property Tests

    - Create comprehensive tests for all task types and related resources
    - Use timeout: 960 seconds
    - Fix any failing tests
    - _Requirements: 25.1-25.10, 13.1-13.9, 4.1-4.9, 5.1-5.9, 6.1-6.9, 19.1-19.10_

  - [ ] 45.5 Run Tests and Verify Coverage

    - Run tests, verify coverage
    - Use timeout: 960 seconds
    - _Requirements: 25.1-25.5_

  - [ ] 45.6 Post-Test Phase Tracking and Git Workflow
    - Commit, push, update tracker
    - _Requirements: 23.1-23.10, 24.1-24.10_

- [ ] 46. Test Attachment, Notification (Routes, Validators, Controllers)

  - [ ] 46.1 Pre-Implementation Documentation Analysis (Requirement 26)

    - Read routes, validators, controllers for Attachment, Notification
    - Read requirements 20.1-20.10, 21.1-21.10
    - Document findings
    - _Requirements: 26.1-26.10, 20.1-20.10, 21.1-21.10_

  - [ ] 46.2 Search, Validation, Action, Verification

    - Analyze routes, validators, controllers
    - Validate file upload, file type/size limits, notification types
    - List all tests to be done
    - _Requirements: 26.1-26.10, 20.1-20.10, 21.1-21.10_

  - [ ] 46.3 Pre-Test Phase Tracking and Git Workflow

    - Add test start entry
    - _Requirements: 23.1-23.10, 24.1-24.10_

  - [ ] 46.4 Write Unit, Integration, and Property Tests

    - Create comprehensive tests
    - Use timeout: 960 seconds
    - Fix any failing tests
    - _Requirements: 25.1-25.10, 13.1-13.9, 20.1-20.10, 21.1-21.10_

  - [ ] 46.5 Run Tests and Verify Coverage

    - Run tests, verify coverage
    - Use timeout: 960 seconds
    - _Requirements: 25.1-25.5_

  - [ ] 46.6 Post-Test Phase Tracking and Git Workflow
    - Commit, push, update tracker
    - _Requirements: 23.1-23.10, 24.1-24.10_

### Phase 4.5: Final Testing Checkpoint and Phase Completion

- [ ] 47. Complete Backend Testing Verification and Phase Completion

  - [ ] 47.1 Run All Backend Tests

    - Run all unit tests: `npm test`
    - Run all property-based tests: `npm run test:property`
    - Generate complete coverage report: `npm run test:coverage`
    - Use timeout: 960 seconds
    - If tests take longer, increase timeout and re-run
    - Fix any failing tests (maximum 2 attempts per test)
    - If tests still fail after 2 attempts, document issue and ask user for guidance
    - _Requirements: 25.1-25.10, 13.1-13.9_

  - [ ] 47.2 Verify Coverage Thresholds

    - Verify statements coverage ≥ 80%
    - Verify branches coverage ≥ 75%
    - Verify functions coverage ≥ 80%
    - Verify lines coverage ≥ 80%
    - If coverage below thresholds, identify gaps and write additional tests
    - _Requirements: 25.3, 25.4, 25.5_

  - [ ] 47.3 Verify Property-Based Test Results

    - Verify all property-based tests ran 100+ iterations
    - Verify all properties passed
    - Verify all properties tagged correctly with Feature and Validates comments
    - _Requirements: 25.6, 25.7, 13.1, 13.6, 13.9_

  - [ ] 47.4 Final Git Workflow and Phase Completion

    - Verify all test files committed
    - Stage and commit any remaining changes: `git add . && git commit -m "test(phase-4): Complete comprehensive backend testing with full coverage"`
    - Push to remote: `git push origin test/phase-4-backend-testing`
    - Verify sync: `git status` shows "Your branch is up to date with 'origin/test/phase-4-backend-testing'"
    - Merge to main branch if appropriate: `git checkout main && git merge test/phase-4-backend-testing && git push origin main`
    - Update `docs/test-phase-tracker.md` with final completion entry:
      - Phase: Phase 4 - Backend Testing
      - Status: COMPLETE
      - Total Duration: [Time taken for entire phase]
      - Final Commit: [Latest commit hash]
      - Test Summary:
        - Total Tests: [count]
        - Passing Tests: [count]
        - Failed Tests: [count - should be 0]
        - Coverage: statements X%, branches Y%, functions Z%, lines W%
        - Property Tests: [count] properties, [total iterations] iterations
      - Validation:
        - [ ] All tests passing
        - [ ] Coverage thresholds met
        - [ ] Property-based tests complete
        - [ ] All files committed and pushed
        - [ ] Local in sync with remote
        - [ ] Phase 4 complete
    - _Requirements: 23.1-23.10, 24.1-24.10, 25.1-25.10_

  - [ ] 47.5 Ask User for Confirmation
    - Ensure all tests pass, ask the user if questions arise
    - Document any issues or concerns
    - Confirm Phase 4 completion with user
    - _Requirements: 25.1-25.10_

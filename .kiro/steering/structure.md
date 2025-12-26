# Project Structure

## Repository Layout

```
/
├── backend/              # Node.js/Express API
├── client/               # React/Vite frontend (if exists)
├── docs/                 # Project documentation
│   ├── build-prompt.md
│   ├── requirements.md
│   ├── design.md
│   └── dev-phase-tracker.md
└── powers/               # Kiro powers
```

## Backend Structure

```
backend/
├── config/
│   ├── allowedOrigins.js          # CORS origins
│   ├── authorizationMatrix.json   # RBAC permissions
│   ├── corsOptions.js             # CORS configuration
│   └── db.js                      # MongoDB connection
├── controllers/
│   ├── authControllers.js         # Auth operations
│   ├── userControllers.js
│   ├── organizationControllers.js
│   ├── departmentControllers.js
│   ├── taskControllers.js         # All task types
│   ├── taskActivityControllers.js
│   ├── taskCommentControllers.js
│   ├── materialControllers.js
│   └── vendorControllers.js
├── errorHandler/
│   ├── CustomError.js             # Custom error class
│   └── ErrorController.js         # Global error handler
├── middlewares/
│   ├── authMiddleware.js          # JWT verification
│   ├── authorization.js           # RBAC enforcement
│   ├── rateLimiter.js             # Rate limiting
│   └── validators/                # express-validator schemas
│       ├── validation.js          # Validation middleware
│       ├── authValidators.js
│       ├── userValidators.js
│       ├── organizationValidators.js
│       ├── departmentValidators.js
│       ├── taskValidators.js
│       ├── taskActivityValidators.js
│       ├── taskCommentValidators.js
│       ├── materialValidators.js
│       └── vendorValidators.js
├── models/
│   ├── plugins/
│   │   └── softDelete.js          # Universal soft delete
│   ├── Organization.js
│   ├── Department.js
│   ├── User.js
│   ├── BaseTask.js                # Discriminator base
│   ├── ProjectTask.js             # Extends BaseTask
│   ├── RoutineTask.js             # Extends BaseTask
│   ├── AssignedTask.js            # Extends BaseTask
│   ├── TaskActivity.js
│   ├── TaskComment.js
│   ├── Material.js
│   ├── Vendor.js
│   ├── Attachment.js
│   ├── Notification.js
│   └── index.js                   # Model exports
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── organizationRoutes.js
│   ├── departmentRoutes.js
│   ├── taskRoutes.js
│   ├── taskActivityRoutes.js
│   ├── taskCommentRoutes.js
│   ├── materialRoutes.js
│   ├── vendorRoutes.js
│   └── index.js                   # Route aggregation
├── services/
│   ├── emailService.js            # Nodemailer
│   └── notificationService.js     # Notification creation
├── utils/
│   ├── constants.js               # ALL constants (SINGLE SOURCE OF TRUTH)
│   ├── logger.js                  # Winston logger
│   ├── helpers.js                 # Utility functions
│   ├── generateTokens.js          # JWT generation
│   ├── authorizationMatrix.js     # Permission checks
│   ├── validateEnv.js             # Environment validation
│   ├── socket.js                  # Socket.IO setup
│   ├── socketEmitter.js           # Event emission
│   ├── socketInstance.js          # Singleton instance
│   ├── userStatus.js              # User status tracking
│   ├── responseTransform.js       # Response formatting
│   └── materialTransform.js       # Material data transform
├── tests/
│   ├── unit/                      # Unit tests
│   └── property/                  # Property-based tests
├── .env                           # Environment variables
├── app.js                         # Express app setup
├── server.js                      # Server entry point
└── package.json
```

## Frontend Structure (if exists)

```
client/
├── src/
│   ├── redux/
│   │   ├── app/
│   │   │   └── store.js           # Redux store
│   │   └── features/
│   │       ├── api.js             # RTK Query base
│   │       ├── authSlice.js
│   │       ├── authApi.js
│   │       ├── userApi.js
│   │       ├── userSlice.js
│   │       └── ...                # Other feature APIs/slices
│   ├── services/
│   │   ├── socketService.js       # Socket.IO client
│   │   └── socketEvents.js        # Event handlers
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useSocket.js
│   ├── utils/
│   │   ├── constants.js           # MUST match backend exactly
│   │   ├── errorHandler.js
│   │   ├── dateUtils.js           # dayjs with UTC
│   │   └── authorizationHelper.js
│   ├── theme/
│   │   ├── AppTheme.jsx
│   │   ├── themePrimitives.js
│   │   └── customizations/
│   ├── components/                # Reusable components
│   ├── pages/                     # Page components
│   ├── layouts/                   # Layout components
│   ├── router/                    # Routing config
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

## Key Conventions

**File Naming**:

- Controllers: `*Controllers.js` (plural)
- Models: PascalCase (e.g., `BaseTask.js`)
- Routes: `*Routes.js` (plural)
- Validators: `*Validators.js` (plural)

**Import Patterns**:

- Always use ES modules (import/export)
- Import constants from `utils/constants.js`
- Never hardcode values that exist in constants

**Model Organization**:

- All models use soft delete plugin
- BaseTask is abstract, extended by ProjectTask/RoutineTask/AssignedTask
- Models exported via `models/index.js`

**Middleware Chain Order**:

- validators → auth → authorization → controller

**Testing**:

- Use real MongoDB (NOT mongodb-memory-server)
- Property-based tests in `tests/property/`
- Unit tests in `tests/unit/`

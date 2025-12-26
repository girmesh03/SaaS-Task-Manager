# Technology Stack

## Backend

**Runtime & Framework**:

- Node.js v20.x LTS with ES modules (`"type": "module"`)
- Express.js ^4.21.2

**Database**:

- MongoDB v7.0 with Mongoose ^8.19.1
- mongoose-paginate-v2 ^1.9.1 for pagination
- Real MongoDB instance for testing (NOT mongodb-memory-server)

**Authentication & Security**:

- JWT with HTTP-only cookies (jsonwebtoken ^9.0.2)
- bcrypt ^6.0.0 (≥12 salt rounds)
- helmet ^8.1.0 for security headers
- express-mongo-sanitize ^2.2.0 for NoSQL injection prevention
- express-rate-limit ^8.1.0 (production only)

**Validation & Utilities**:

- express-validator ^7.2.1
- dayjs ^1.11.18 with UTC plugin
- winston ^3.18.3 for logging

**Real-time & Email**:

- Socket.IO ^4.8.1
- Nodemailer ^7.0.9 (Gmail SMTP)

**Testing**:

- Jest ^30.2.0 with ES modules
- fast-check ^4.3.0 for property-based testing
- supertest ^7.1.4

## Frontend

**Core**:

- React ^19.1.1 with React DOM ^19.1.1
- Vite ^7.1.7 build tool

**UI & State**:

- Material-UI (MUI) v7.3.4 (use `size` prop, NOT `item` prop for Grid)
- Redux Toolkit ^2.9.0 with RTK Query
- React Router ^7.9.4

**Forms & Utilities**:

- react-hook-form ^7.65.0 (NEVER use `watch()` method)
- Socket.IO Client ^4.8.1
- react-toastify ^11.0.5
- dayjs ^1.11.18

## Architecture Patterns

**Backend**:

- ES modules throughout (import/export, NOT require/module.exports)
- Discriminator pattern for task types (BaseTask → ProjectTask/RoutineTask/AssignedTask)
- Soft delete plugin applied to ALL models
- Transaction-based write operations
- Constants imported from `backend/utils/constants.js` (NEVER hardcode)

**Frontend**:

- RTK Query for ALL API calls
- Redux Toolkit with persistence for auth state
- React.memo for Card components
- useCallback for event handlers
- useMemo for computed values
- Constants EXACTLY match backend

## Common Commands

**Backend**:

```bash
cd backend
npm install
npm run dev          # Development with nodemon
npm start            # Production
npm test             # Run tests (use real MongoDB)
```

**Frontend**:

```bash
cd client
npm install
npm run dev          # Development server
npm run build        # Production build
```

## Development Environment

- Separate dev servers: backend (port 4000), frontend (port 3000)
- Backend serves frontend static files in production
- GitBash WSL VSCode integrated terminal (use forward slashes)

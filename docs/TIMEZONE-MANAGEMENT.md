# Timezone Management - Implementation Guide

## 🎯 Objective

Implementation of a robust timezone management system for the Multi-Tenant SaaS Task Manager to ensure **NO timezone offset issues** between application users across the globe. All dates are stored in UTC and converted appropriately at application boundaries.

## 📋 Critical Principle

**ZERO TIMEZONE OFFSET**: Users in New York, London, Tokyo, and Sydney all see the correct dates and times for their location, with the backend handling all timezone complexity transparently.

## 🔧 Implementation Location

**Phase 0** - Testing Infrastructure and Timezone Management Setup (MANDATORY FIRST STEP)

This ensures timezone handling is established BEFORE any models, controllers, or business logic are implemented.

## 📁 Files to Implement

### 1. Backend Timezone Utilities

**File:** `backend/utils/dateUtils.js`

**Functions:**

- `toUTC(date)` - Convert any date to UTC Date object
- `toISOString(date)` - Convert date to ISO 8601 string in UTC
- `formatDate(date)` - Format date for API responses (ISO string)
- `isValidDate(date)` - Validate date
- `isFutureDate(date)` - Check if date is in future
- `isPastDate(date)` - Check if date is in past
- `isAfter(date1, date2)` - Compare two dates in UTC
- `getCurrentUTC()` - Get current date in UTC
- `addTime(date, amount, unit)` - Add time to date
- `subtractTime(date, amount, unit)` - Subtract time from date

### 2. Mongoose Schema Helpers

**File:** `backend/utils/helpers.js` (or in dateUtils.js)

**Functions:**

- `dateTransform(doc, ret)` - Transform function for toJSON/toObject options
- `convertDatesToUTC(doc, dateFields)` - Pre-save hook helper

### 3. Server Configuration

**File:** `backend/server.js`

**CRITICAL:** First line MUST be:

```javascript
// Force UTC timezone for entire backend - MUST BE FIRST LINE
process.env.TZ = "UTC";
```

Then import and configure dayjs:

```javascript
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);
```

## 🧪 Testing Requirements

### Unit Tests

**File:** `backend/tests/unit/utils/dateUtils.test.js`

Test all date utility functions:

- UTC conversion from various timezones
- ISO string formatting
- Date comparison across timezones
- Current UTC date retrieval
- Date arithmetic (add/subtract time)

### Property-Based Tests

**File:** `backend/tests/property/timezone.property.test.js`

Verify universal properties:

- Any date converted to UTC and back maintains same instant in time
- Date comparisons are consistent regardless of input timezone
- All dates stored in database are UTC
- All API responses return ISO 8601 strings in UTC

## 📝 Usage in Models

### Example: User Model with Timezone Handling

```javascript
import mongoose from "mongoose";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    dateOfBirth: Date,
    joinedAt: Date,
    lastLogin: Date,
    // ... other fields
  },
  {
    timestamps: true, // createdAt, updatedAt in UTC
    toJSON: {
      transform: dateTransform, // Convert dates to ISO strings
    },
    toObject: {
      transform: dateTransform,
    },
  }
);

// Pre-save hook to convert dates to UTC
userSchema.pre("save", function (next) {
  convertDatesToUTC(this, ["dateOfBirth", "joinedAt", "lastLogin"]);
  next();
});

export default mongoose.model("User", userSchema);
```

### Example: Task Model with Date Validation

```javascript
import mongoose from "mongoose";
import { dateTransform, convertDatesToUTC } from "../utils/helpers.js";
import { isAfter } from "../utils/dateUtils.js";

const baseTaskSchema = new mongoose.Schema(
  {
    description: String,
    startDate: Date,
    dueDate: Date,
    // ... other fields
  },
  {
    timestamps: true,
    toJSON: { transform: dateTransform },
    toObject: { transform: dateTransform },
  }
);

// Validate dueDate is after startDate (UTC comparison)
baseTaskSchema.pre("save", function (next) {
  convertDatesToUTC(this, ["startDate", "dueDate"]);

  if (
    this.startDate &&
    this.dueDate &&
    !isAfter(this.dueDate, this.startDate)
  ) {
    return next(new Error("Due date must be after start date"));
  }

  next();
});

export default mongoose.model("BaseTask", baseTaskSchema);
```

## 📝 Usage in Controllers

### Example: Task Controller with Timezone Handling

#### Remeber all write operation must use session, see **Use Transaction:** on `docs/build.prompt.md`

```javascript
import { toUTC, toISOString } from "../utils/dateUtils.js";

export const createTask = async (req, res, next) => {
  const { startDate, dueDate, ...otherFields } = req.validated.body;

  // Dates from frontend are already in ISO format
  // Mongoose will handle conversion, but we can explicitly convert if needed
  const task = await Task.create({
    ...otherFields,
    startDate: toUTC(startDate), // Explicit UTC conversion
    dueDate: toUTC(dueDate),
    organization: req.user.organization._id,
    department: req.user.department._id,
    createdBy: req.user._id,
  });

  // Response will have dates as ISO strings due to dateTransform
  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: task,
  });
};
```

## 🔄 Data Flow

### Frontend → Backend (Date Input)

1. User selects date in their local timezone (e.g., "2024-01-15 10:30 AM EST")
2. Frontend converts to ISO string: "2024-01-15T15:30:00.000Z"
3. Backend receives ISO string
4. `toUTC()` or Mongoose converts to UTC Date object
5. Stored in MongoDB as UTC Date

### Backend → Frontend (Date Output)

1. MongoDB returns UTC Date object
2. Mongoose `dateTransform` converts to ISO string: "2024-01-15T15:30:00.000Z"
3. API response includes ISO string
4. Frontend receives ISO string
5. Frontend converts to user's local timezone for display: "2024-01-15 10:30 AM EST"

## ✅ Verification Checklist

- [ ] `process.env.TZ = "UTC"` is FIRST line in server.js
- [ ] dayjs extended with UTC and timezone plugins
- [ ] All date utility functions implemented in dateUtils.js
- [ ] Mongoose schema helpers (dateTransform, convertDatesToUTC) implemented
- [ ] All models use dateTransform in toJSON/toObject options
- [ ] All models with date fields use convertDatesToUTC in pre-save hooks
- [ ] All API responses return dates as ISO 8601 strings in UTC
- [ ] Date comparisons use UTC (isAfter, isBefore utilities)
- [ ] Unit tests cover all date utility functions with 100% coverage
- [ ] Property-based tests verify timezone consistency
- [ ] No timezone offset issues between global users
- [ ] Mongoose timestamps (createdAt, updatedAt) are UTC
- [ ] Task deadlines, user joinedAt, and all date fields stored in UTC

## 🚀 Expected Outcome

After implementation:

✅ **Backend stores ALL dates in UTC** - No exceptions, no timezone-specific dates
✅ **API returns ISO 8601 strings** - Standardized format for all date communication
✅ **Users see correct local times** - Frontend handles timezone conversion for display
✅ **No timezone conflicts** - Date comparisons work correctly across all timezones
✅ **Global consistency** - Users in any timezone see accurate dates and times
✅ **Audit trail accuracy** - createdAt, updatedAt, lastLogin all in UTC
✅ **Task deadlines work globally** - Due dates are correct for all users regardless of location

## 🎓 Key Principles

1. **Store in UTC**: ALL database dates stored in UTC with no exceptions
2. **Convert at Boundaries**:
   - Frontend → Backend: Local time → UTC (frontend responsibility)
   - Backend → Frontend: UTC → ISO string (backend returns ISO, frontend converts to local)
3. **Use ISO Format**: Standardized ISO 8601 date communication in API responses
4. **Dayjs Consistency**: Use same dayjs setup with UTC plugin across all date operations
5. **No Timezone Assumptions**: Never assume user timezone in backend, always work in UTC
6. **Test Thoroughly**: Unit tests and property-based tests ensure timezone consistency

This comprehensive timezone management ensures the Multi-Tenant SaaS Task Manager works flawlessly for users across the globe with zero timezone offset issues.

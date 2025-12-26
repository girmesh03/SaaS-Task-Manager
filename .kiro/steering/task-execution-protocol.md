---
inclusion: always
---

# Task Execution Protocol - MANDATORY PRE-FLIGHT CHECKLIST

**CRITICAL**: 1.**This protocol MUST be executed BEFORE starting ANY task in the saas-task-manager-mvp spec. No exceptions**. 2. **Never track, add or commit `.kiro/specs/saas-task-manager-mvp/*` or `docs/*`** 3. **Up on completing each phase, without writting/running a test (if the phase is not phase 4 and phase 11) verify all the backend `config/*`, `errorHandler/*`, `middlewares/, validators/*`, `middlewares/*`, `models/plugin/*`, `models/*`, `routes/*`, `services/*`, `templates/*`, `utils/*`, app.js and server.js**: 1.**Are they implemented according to `.kiro/specs/saas-task-manager-mvp/*` and `docs/*`**. 2. **All what is developed on N - 1 Phases, are they implemented correctly on current phase**. 3. **Run cd backend && npm run dev to verify all is working correctly**.

## Phase 1: Pre-Implementation Documentation Analysis (Requirement 26)

Before writing ANY code, you MUST complete this comprehensive analysis:

### Step 1: Read Core Documentation Files

Execute in this exact order:

1. **Read `docs/build-prompt.md`** - Overall architecture, tech stack, patterns
2. **Read `docs/softDelete-doc.md`** - Soft delete plugin, cascade operations, TTL
3. **Read `docs/TIMEZONE-MANAGEMENT.md`** - UTC storage, date conversion, dayjs config
4. **Read `docs/dev-phase-tracker.md`** - Current status, completed phases, issues
5. **Read `.kiro/specs/saas-task-manager-mvp/requirements.md`** - All requirements and acceptance criteria
6. **Read `.kiro/specs/saas-task-manager-mvp/design.md`** - Architecture, interfaces, data models

### Step 2: Verify Existing Implementation

**CRITICAL**: Check what already exists in `backend/*` directory:

- List all existing models, controllers, routes, validators, middleware, services, utils
- Identify patterns already implemented (CustomError usage, transaction patterns, etc.)
- Note any deviations from specifications
- Verify consistency across existing files

### Step 3: Create Analysis Summary

Document your findings:

```markdown
## Documentation Analysis Summary

### Relevant Requirements

- List all requirements that apply to this task
- Note acceptance criteria that must be validated

### Design Decisions

- Architecture patterns to follow
- Component interfaces to implement
- Data models to use

### Critical Implementation Patterns

- [ ] CustomError static methods ONLY (validation, authentication, authorization, notFound, conflict, internal)
- [ ] All write operations use MongoDB transactions
- [ ] All models use soft delete plugin
- [ ] All dates stored in UTC, converted at boundaries
- [ ] Real MongoDB for testing (NOT mongodb-memory-server)
- [ ] All commands are suitable for GitBash WSL VSCode integrated terminal using forward slashes for paths

### Dependencies

- List files/modules this task depends on
- Note any missing dependencies

### Validation Checklist

- [ ] Requirement X.Y validated
- [ ] Design pattern Z implemented
- [ ] Tests written and passing
```

### Step 4: Conflict Resolution

If conflicting information found, prioritize:

1. `docs/build-prompt.md` (HIGHEST)
2. `.kiro/specs/saas-task-manager-mvp/design.md`
3. `.kiro/specs/saas-task-manager-mvp/requirements.md`
4. `docs/softDelete-doc.md`
5. `docs/TIMEZONE-MANAGEMENT.md`
6. Other documentation

Document conflicts and seek user clarification if needed.

## Phase 2: Git Workflow Management (Requirement 23)

Execute these Git operations BEFORE starting implementation:

### Step 1: Check Current Status

```bash
git status
git branch -vv
git fetch origin
```

WHEN starting a phase THEN the System SHALL create feature branch with naming convention: `validate/phase-N-description` or `implement/phase-N-description` if not created yes.

**Analyze output for:**

- Current branch name
- Uncommitted changes (staged/unstaged/untracked)
- Local vs remote sync status
- Tracking branch information

### Step 2: Handle Uncommitted Changes

**IF uncommitted changes exist:**

- Prompt user: "Uncommitted changes detected. Options: (1) Commit, (2) Stash, (3) Discard"
- Wait for user decision
- Execute appropriate command

### Step 3: Sync with Remote

**IF local branch is behind remote:**

```bash
git pull origin <branch>
```

**IF merge conflicts detected:**

- HALT execution
- Prompt user: "Merge conflicts detected. Please resolve manually."
- Wait for user confirmation

### Step 4: Create Feature Branch (for new phases)

**IF starting a new phase:**

```bash
git checkout -b validate/phase-N-description
# OR
git checkout -b implement/phase-N-description
```

**Branch naming convention:**

- Validation tasks: `validate/phase-N-description`
- Implementation tasks: `implement/phase-N-description`
- Use forward slashes (GitBash WSL compatible)

### Step 5: Verify Clean State

Before proceeding:

- Confirm no uncommitted changes
- Confirm local is synced with remote
- Confirm on correct branch

## Phase 3: Phase Tracking Documentation (Requirement 24)

Update `docs/dev-phase-tracker.md` at task start:

### Step 1: Check if File Exists

**IF file does not exist:**

- Create with initial structure:

```markdown
# Development Phase Tracker

**Project:** Multi-Tenant SaaS Task Manager MVP
**Start Date:** [Current Date]

---

## Phase History

[Entries will be added here in reverse chronological order]
```

### Step 2: Add Task Start Entry

Prepend to file (most recent at top):

```markdown
## [Current Date & Time] - Task Started

**Phase:** Phase N - [Phase Name]
**Task:** [Task Number] - [Task Description]
**Status:** IN PROGRESS
**Branch:** [Current Git Branch]

### Task Details

- Requirements: [List relevant requirement numbers]
- Dependencies: [List dependencies]
- Expected Outcome: [Brief description]

---
```

### Step 3: Preserve Existing Content

- NEVER overwrite existing entries
- Always prepend new entries
- Maintain chronological order (newest first)

## Phase 4: Implementation Execution

Now you may proceed with the actual task implementation, ensuring:

### Critical Implementation Rules

1. **CustomError Usage**

   - ONLY use static methods: `CustomError.validation()`, `CustomError.authentication()`, `CustomError.authorization()`, `CustomError.notFound()`, `CustomError.conflict()`, `CustomError.internal()`
   - NEVER use constructor directly

2. **Transaction Pattern**

   ```javascript
   const session = await mongoose.startSession();
   session.startTransaction();
   try {
     // All database operations with {session}
     await Model.create([data], { session });
     await model.save({ session });

     await session.commitTransaction();
     // Emit Socket.IO events AFTER commit
   } catch (error) {
     await session.abortTransaction();
     throw CustomError.internal("Operation failed", { error: error.message });
   } finally {
     session.endSession();
   }
   ```

3. **Soft Delete Plugin**

   - All models MUST apply: `schema.plugin(softDeletePlugin);`
   - Use `withDeleted()` for uniqueness checks
   - Pass `{session}` to all soft delete operations

4. **Timezone Management**

   - Store dates in UTC: `dayjs(date).utc().toDate()`
   - Convert on output: `dayjs(date).utc().toISOString()`
   - Frontend conversion: `convertUTCToLocal()` / `convertLocalToUTC()`

5. **Testing**
   - Use real MongoDB (NOT mongodb-memory-server)
   - Property-based tests: minimum 100 iterations
   - Tests executed ONLY at phase completion

## Phase 5: Post-Implementation Git Workflow

After completing the task:

### Step 1: Verify All Changes Committed

```bash
git status
```

**IF uncommitted changes:**

- Review changes
- Stage and commit with descriptive message
- Follow conventional commit format

### Step 2: Push to Remote

```bash
git push origin <branch>
```

**IF push fails (remote has changes):**

```bash
git pull --rebase origin <branch>
# Resolve any conflicts
git push origin <branch>
```

### Step 3: Verify Sync

```bash
git status
git branch -vv
```

Confirm: "Your branch is up to date with 'origin/<branch>'"

## Phase 6: Phase Tracking Update

Update `docs/dev-phase-tracker.md` at task completion:

### Add Task Completion Entry

Prepend to file:

```markdown
## [Current Date & Time] - Task Completed

**Phase:** Phase N - [Phase Name]
**Task:** [Task Number] - [Task Description]
**Status:** COMPLETE
**Duration:** [Time taken]
**Branch:** [Current Git Branch]
**Commit:** [Latest commit hash]

### Changes Made

- [List key changes]
- [Files created/modified]
- [Tests added]

### Validation

- [x] All requirements met
- [x] Tests passing
- [x] Code committed and pushed
- [x] Documentation updated

---
```

## Phase 7: Testing (Phase Completion Only)

**ONLY execute tests at phase completion:**

### Backend Phase Completion (After Phase 4)

```bash
cd backend
npm test
npm run test:property
npm run test:coverage
```

**Verify:**

- All tests pass (exit code 0)
- Coverage thresholds met: statements 80%+, branches 75%+, functions 80%+, lines 80%+
- Property-based tests: 100+ iterations per property

**IF tests fail:**

- HALT progression
- Log detailed failure output
- Update phase tracker with failure details
- Prompt user to fix issues

### Frontend Phase Completion (After Phase 11)

```bash
cd client
npm test
```

**Verify:**

- All tests pass (exit code 0)

**IF tests fail:**

- HALT deployment
- Log detailed failure output
- Update phase tracker with failure details
- Prompt user to fix issues

## Execution Checklist

Before starting ANY task, verify:

- [ ] Phase 1: Documentation analysis complete
- [ ] Phase 2: Git workflow executed (status checked, synced, clean state)
- [ ] Phase 3: Phase tracker updated (task start entry added)
- [ ] Phase 4: Ready to implement (all prerequisites met)

After completing ANY task, verify:

- [ ] Phase 5: Git workflow executed (changes committed, pushed, synced)
- [ ] Phase 6: Phase tracker updated (task completion entry added)
- [ ] Phase 7: Tests executed (if phase completion)

## Failure Handling

**IF any phase fails:**

1. HALT execution immediately
2. Log detailed error information
3. Update phase tracker with failure details
4. Prompt user for guidance
5. DO NOT proceed to next phase

**IF user intervention required:**

1. Clearly state the issue
2. Provide specific options
3. Wait for user decision
4. Document user's choice
5. Resume execution

---

**REMEMBER**: This protocol is MANDATORY for EVERY task. No shortcuts. No exceptions.

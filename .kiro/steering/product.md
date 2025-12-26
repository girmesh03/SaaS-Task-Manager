# Product Overview

Multi-Tenant SaaS Task Manager - an enterprise task management system with strict data isolation and role-based access control.

## Core Purpose

Enables organizations to manage three distinct task types:

- **ProjectTask**: Outsourced tasks to external vendors with cost tracking
- **RoutineTask**: Daily tasks from outlets with direct material assignment
- **AssignedTask**: Internal tasks assigned to users with progress tracking

## Multi-Tenancy Model

**Platform Organization** (`isPlatformOrg: true`):

- Single service provider organization managing the entire system
- Platform SuperAdmin has cross-organization access
- Cannot be deleted

**Customer Organizations** (`isPlatformOrg: false`):

- Multiple isolated tenant organizations
- Complete data isolation between customers
- Customer SuperAdmin limited to own organization

## Key Features

- Role-based access (SuperAdmin, Admin, Manager, User)
- Head of Department (HOD) designation for SuperAdmin/Admin roles
- Soft delete with cascade operations and TTL-based cleanup
- Real-time updates via Socket.IO
- Material tracking through tasks and activities
- Vendor management for outsourced work
- Threaded comments with mentions
- File attachments via Cloudinary

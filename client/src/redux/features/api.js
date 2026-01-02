/**
 * RTK Query Base API Configuration
 *
 * Base API setup with:
 * - HTTP-only cookie authentication
 * - Automatic 401 error handling with re-authentication
 * - Cache tag types for all resources
 * - Automatic cache invalidation
 *
 * Requirements: 1.10, 2.10, 18.1
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Base query configuration with credentials for HTTP-only cookies
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  credentials: "include", // Include HTTP-only cookies in requests
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

/**
 * Base query with automatic re-authentication on 401 errors
 *
 * Handles authentication errors by:
 * 1. Detecting 401 status codes
 * 2. Clearing auth state
 * 3. Redirecting to login page
 */
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 authentication errors
  if (result.error && result.error.status === 401) {
    // Clear auth state
    api.dispatch({ type: "auth/logout" });

    // Redirect to login page
    window.location.href = "/login";
  }

  return result;
};

/**
 * RTK Query API slice
 *
 * Defines all cache tag types for automatic cache invalidation:
 * - Organization: Organization management
 * - Department: Department management
 * - User: User management
 * - Task: Task management (all types: ProjectTask, RoutineTask, AssignedTask)
 * - TaskActivity: Task activity logs
 * - TaskComment: Task and activity comments
 * - Material: Material inventory
 * - Vendor: Vendor management
 * - Attachment: File attachments
 * - Notification: User notifications
 */
const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Organization",
    "Department",
    "User",
    "Task",
    "TaskActivity",
    "TaskComment",
    "Material",
    "Vendor",
    "Attachment",
    "Notification",
  ],
  endpoints: () => ({}), // Endpoints will be injected by individual API slices
});

export default api;

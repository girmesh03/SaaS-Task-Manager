/**
 * User API - User Management Endpoints
 *
 * RTK Query endpoints for user operations:
 * - Get Users: GET /api/users
 * - Get User: GET /api/users/:id
 * - Get Own Profile: GET /api/users/me (handled by authApi typically, but added here for completeness if needed)
 * - Create User: POST /api/users
 * - Update User: PATCH /api/users/:id
 * - Update Own Profile: PATCH /api/users/me
 * - Delete User: DELETE /api/users/:id
 * - Restore User: PATCH /api/users/:id/restore
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10
 */

import api from "./api";

/**
 * User API slice
 *
 * Extends base API with user management endpoints.
 * Uses 'User' tag for cache invalidation.
 */
export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get users query
     *
     * GET /api/users
     *
     * Retrieves a list of users with pagination, filtering, and sorting.
     * Scoped to user's organization scope.
     *
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page (default 10)
     * @param {string} params.search - Search term (name, email)
     * @param {string} params.sort - Sort field (default 'createdAt')
     * @param {string} params.order - Sort order ('asc' or 'desc')
     * @param {boolean} params.isDeleted - Filter by deleted status
     * @param {string} params.role - Filter by user role
     * @param {string} params.department - Filter by department ID
     * @param {string} params.organizationId - Filter by organization (for Platform Admins)
     *
     * @returns {Object} Response with users array and pagination meta
     */
    getUsers: builder.query({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.users.map(({ _id }) => ({
                type: "User",
                id: _id,
              })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    /**
     * Get user query
     *
     * GET /api/users/:id
     *
     * Retrieves a single user by ID.
     *
     * @param {string} id - User ID
     *
     * @returns {Object} Response with user object
     */
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    /**
     * Get user profile query (ME)
     *
     * GET /api/users/me
     *
     * Retrieves the currently authenticated user's profile.
     *
     * @returns {Object} Response with user object
     */
    getUserProfile: builder.query({
      query: () => "/users/me",
      providesTags: [{ type: "User", id: "ME" }],
    }),

    /**
     * Create user mutation
     *
     * POST /api/users
     *
     * Creates a new user.
     *
     * @param {Object} data - User data
     *
     * @returns {Object} Response with created user
     */
    createUser: builder.mutation({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    /**
     * Update user mutation
     *
     * PATCH /api/users/:id
     *
     * Updates an existing user by ID (Admin/Manager action).
     *
     * @param {Object} args - Arguments
     * @param {string} args.id - User ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated user
     */
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
        // If updating self via this route (unlikely but possible), invalidate ME
        // But ME is usually separate cache. We'll leave it simple.
      ],
    }),

    /**
     * Update own profile mutation
     *
     * PATCH /api/users/me
     *
     * Updates the currently authenticated user's profile.
     *
     * @param {Object} data - Data to update
     *
     * @returns {Object} Response with updated user
     */
    updateOwnProfile: builder.mutation({
      query: (data) => ({
        url: "/users/me",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [
        { type: "User", id: "ME" },
        // Also invalidate specific ID if we knew it, but "ME" handles the profile view.
        // List view might be stale if user appears there.
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Delete user mutation
     *
     * DELETE /api/users/:id
     *
     * Soft deletes a user.
     *
     * @param {string} id - User ID
     *
     * @returns {Object} Response with success message
     */
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Restore user mutation
     *
     * PATCH /api/users/:id/restore
     *
     * Restores a soft-deleted user.
     *
     * @param {string} id - User ID
     *
     * @returns {Object} Response with restored user
     */
    restoreUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useGetUserProfileQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateOwnProfileMutation,
  useDeleteUserMutation,
  useRestoreUserMutation,
} = userApi;

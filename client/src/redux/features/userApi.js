/**
 * User API - User Management Endpoints
 *
 * RTK Query endpoints for user operations:
 * - Get Users: GET /api/users
 * - Get User: GET /api/users/:userId
 * - Create User: POST /api/users
 * - Update User: PATCH /api/users/:userId
 * - Delete User: DELETE /api/users/:userId
 * - Restore User: PATCH /api/users/:userId/restore
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
     * @param {boolean} params.deleted - Filter by deleted status
     * @param {string} params.role - Filter by user role
     * @param {string} params.departmentId - Filter by department ID
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
     * GET /api/users/:userId
     *
     * Retrieves a single user by ID.
     *
     * @param {string} userId - User ID
     *
     * @returns {Object} Response with user object
     */
    getUser: builder.query({
      query: (userId) => `/users/${userId}`,
      providesTags: (result, error, userId) => [{ type: "User", id: userId }],
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
     * PATCH /api/users/:userId
     *
     * @param {Object} args - Arguments
     * @param {string} args.userId - User ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated user
     */
    updateUser: builder.mutation({
      query: ({ userId, data }) => ({
        url: `/users/${userId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Delete user mutation
     *
     * DELETE /api/users/:userId
     *
     * Soft deletes a user.
     *
     * @param {string} userId - User ID
     *
     * @returns {Object} Response with success message
     */
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, userId) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),

    /**
     * Restore user mutation
     *
     * PATCH /api/users/:userId/restore
     *
     * Restores a soft-deleted user.
     *
     * @param {string} userId - User ID
     *
     * @returns {Object} Response with restored user
     */
    restoreUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, userId) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useRestoreUserMutation,
} = userApi;

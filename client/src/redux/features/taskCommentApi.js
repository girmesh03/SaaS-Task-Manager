/**
 * Task Comment API - Task Comment Management Endpoints
 *
 * RTK Query endpoints for task comment operations:
 * - Get Comments: GET /api/comments
 * - Get Comment: GET /api/comments/:id
 * - Create Comment: POST /api/comments
 * - Update Comment: PATCH /api/comments/:id
 * - Delete Comment: DELETE /api/comments/:id
 * - Restore Comment: PATCH /api/comments/:id/restore
 *
 * Requirements: 9.1 - 9.10
 */

import api from "./api";

/**
 * Task Comment API slice
 *
 * Extends base API with task comment management endpoints.
 * Uses 'TaskComment' tag for cache invalidation.
 */
export const taskCommentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get task comments query
     *
     * GET /api/comments
     *
     * Retrieves a list of comments filtered by parent (Task or TaskActivity).
     *
     * @param {Object} params - Query parameters
     * @param {string} params.task - Parent Task ID (optional)
     * @param {string} params.activity - Parent Activity ID (optional)
     * @param {number} params.page - Page number (1-based)
     * @param {number} params.limit - Items per page
     * @param {string} params.sort - Sort field
     * @param {string} params.order - Sort order
     * @param {boolean} params.isDeleted - Filter by deleted status
     *
     * @returns {Object} Response with comments array and pagination meta
     */
    getTaskComments: builder.query({
      query: (params) => ({
        url: "/comments",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.comments.map(({ _id }) => ({
                type: "TaskComment",
                id: _id,
              })),
              { type: "TaskComment", id: "LIST" },
            ]
          : [{ type: "TaskComment", id: "LIST" }],
    }),

    /**
     * Get task comment query
     *
     * GET /api/comments/:id
     *
     * Retrieves a single task comment by ID.
     *
     * @param {string} id - Comment ID
     *
     * @returns {Object} Response with comment object
     */
    getTaskComment: builder.query({
      query: (id) => `/comments/${id}`,
      providesTags: (result, error, id) => [{ type: "TaskComment", id }],
    }),

    /**
     * Create task comment mutation
     *
     * POST /api/comments
     *
     * Creates a new task comment.
     *
     * @param {Object} data - Comment data
     *
     * @returns {Object} Response with created comment
     */
    createTaskComment: builder.mutation({
      query: (data) => ({
        url: "/comments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        { type: "TaskComment", id: "LIST" },
        { type: "Task", id: "LIST" }, // Passively update task
        { type: "TaskActivity", id: "LIST" }, // Passively update activity
      ],
    }),

    /**
     * Update task comment mutation
     *
     * PATCH /api/comments/:id
     *
     * Updates an existing task comment (own comments only).
     *
     * @param {Object} args - Arguments
     * @param {string} args.id - Comment ID
     * @param {Object} args.data - Data to update
     *
     * @returns {Object} Response with updated comment
     */
    updateTaskComment: builder.mutation({
      query: ({ id, data }) => ({
        url: `/comments/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TaskComment", id },
        { type: "TaskComment", id: "LIST" },
      ],
    }),

    /**
     * Delete task comment mutation
     *
     * DELETE /api/comments/:id
     *
     * Soft deletes a task comment.
     *
     * @param {string} id - Comment ID
     *
     * @returns {Object} Response with success message
     */
    deleteTaskComment: builder.mutation({
      query: (id) => ({
        url: `/comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "TaskComment", id },
        { type: "TaskComment", id: "LIST" },
      ],
    }),

    /**
     * Restore task comment mutation
     *
     * PATCH /api/comments/:id/restore
     *
     * Restores a soft-deleted task comment.
     *
     * @param {string} id - Comment ID
     *
     * @returns {Object} Response with restored comment
     */
    restoreTaskComment: builder.mutation({
      query: (id) => ({
        url: `/comments/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "TaskComment", id },
        { type: "TaskComment", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetTaskCommentsQuery,
  useGetTaskCommentQuery,
  useCreateTaskCommentMutation,
  useUpdateTaskCommentMutation,
  useDeleteTaskCommentMutation,
  useRestoreTaskCommentMutation,
} = taskCommentApi;
